import { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId } from 'mongodb';
import { getProfilesCollection } from '../lib/db.js';

// Get MongoDB connection
async function getReferralsCollection() {
  // We'll use the profiles collection's database
  const profiles = await getProfilesCollection();
  return profiles.db.collection('referrals');
}

async function getApplicationsCollection() {
  const profiles = await getProfilesCollection();
  return profiles.db.collection('referral_applications');
}

async function getShortlistsCollection() {
  const profiles = await getProfilesCollection();
  return profiles.db.collection('referral_shortlists');
}

// Normalize phone: extract last 10 digits (for Indian numbers)
function normalizePhone(s: string) {
  if (!s) return '';
  const digits = String(s).replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

// Generate 8-character random ID
function generateRequestId() {
  return Math.random().toString(36).substring(2, 10);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-Phone');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const rawAction = req.query.action;
  const action = String(Array.isArray(rawAction) ? rawAction[0] : (rawAction || '')).trim();
  const userPhone = req.headers['x-user-phone'] as string;
  const normalizedPhone = normalizePhone(userPhone || '');

  try {
    // Get Collections
    const referrals = await getReferralsCollection();
    const applications = await getApplicationsCollection();
    const shortlists = await getShortlistsCollection();
    const profilesCollection = await getProfilesCollection();

    // CREATE new referral request
    if (action === 'create' && req.method === 'POST') {
      if (!normalizedPhone) {
        return res.status(401).json({ error: 'User phone required' });
      }

      const {
        clientInitials,
        clientType,
        clientAge,
        concerns,
        genderPreference,
        languages,
        mode,
        location,
        budgetRange,
        urgency,
        notes
      } = req.body;

      if (!clientType || !concerns || !mode || !budgetRange || !urgency) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const requestId = generateRequestId();
      const newRequest = {
        requestId,
        userId: normalizedPhone,
        clientInitials: clientInitials ? String(clientInitials).trim().toUpperCase().substring(0, 12) : '',
        clientType,
        clientAge: clientAge ? parseInt(clientAge) : undefined,
        concerns,
        genderPreference: Array.isArray(genderPreference) ? genderPreference : [],
        languages: languages || '',
        mode: Array.isArray(mode) ? mode : [],
        location: location || '',
        budgetRange,
        urgency,
        notes: notes ? notes.substring(0, 200) : '',
        status: 'active',
        createdAt: new Date().toISOString()
      };

      const result = await referrals.insertOne(newRequest);
      return res.status(201).json({ ...newRequest, _id: result.insertedId });
    }

    // UPDATE referral request details (owner only)
    if (action === 'update' && req.method === 'PUT') {
      if (!normalizedPhone) {
        return res.status(401).json({ error: 'User phone required' });
      }

      const {
        requestId,
        referralId,
        id,
        clientInitials,
        clientType,
        clientAge,
        concerns,
        genderPreference,
        languages,
        mode,
        location,
        budgetRange,
        urgency,
        notes
      } = req.body;

      const resolvedId = requestId || referralId || id;
      if (!resolvedId || !clientType || !String(concerns || '').trim() || !Array.isArray(mode) || mode.length === 0 || !String(budgetRange || '').trim() || !String(urgency || '').trim()) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['requestId/referralId', 'clientType', 'concerns', 'mode[]', 'budgetRange', 'urgency']
        });
      }

      const ownerQueries: any[] = [];
      if (requestId) {
        ownerQueries.push({ requestId, userId: normalizedPhone });
      }

      const fallbackId = referralId || id;
      if (fallbackId) {
        ownerQueries.push({ _id: fallbackId, userId: normalizedPhone });
        try {
          ownerQueries.push({ _id: new ObjectId(fallbackId), userId: normalizedPhone });
        } catch {
          // Ignore invalid ObjectId format and keep string fallback.
        }
      }

      if (!ownerQueries.length) {
        return res.status(400).json({ error: 'requestId/referralId required' });
      }

      const referral = await referrals.findOne({ $or: ownerQueries });
      if (!referral) return res.status(404).json({ error: 'Request not found' });

      const updateData = {
        clientInitials: clientInitials ? String(clientInitials).trim().toUpperCase().substring(0, 12) : '',
        clientType,
        clientAge: clientAge ? parseInt(clientAge) : undefined,
        concerns,
        genderPreference: Array.isArray(genderPreference) ? genderPreference : [],
        languages: languages || '',
        mode: Array.isArray(mode) ? mode : [],
        location: location || '',
        budgetRange,
        urgency,
        notes: notes ? String(notes).substring(0, 200) : '',
        updatedAt: new Date().toISOString()
      };

      const result = await referrals.updateOne({ _id: referral._id, userId: normalizedPhone }, { $set: updateData });

      if (!result.modifiedCount) {
        return res.status(500).json({ error: 'Failed to update request' });
      }

      const updated = await referrals.findOne({ _id: referral._id });
      return res.status(200).json(updated);
    }

    // GET user's referral requests
    if (action === 'my-requests' && req.method === 'GET') {
      if (!normalizedPhone) {
        return res.status(401).json({ error: 'User phone required' });
      }

      const userRequests = await referrals
        .find({ userId: normalizedPhone })
        .sort({ createdAt: -1 })
        .toArray();

      // Add applicant count to each
      const withCounts = await Promise.all(
        userRequests.map(async (req) => {
          const count = await applications.countDocuments({ requestId: req.requestId });
          return { ...req, applicantCount: count };
        })
      );

      return res.status(200).json(withCounts);
    }

    // GET discoverable open referrals for providers (excluding own requests)
    if (action === 'discover' && req.method === 'GET') {
      if (!normalizedPhone) {
        return res.status(401).json({ error: 'User phone required' });
      }

      const requester = await profilesCollection.findOne({ 'basicInfo.phone': normalizedPhone });
      if (requester?.role !== 'provider') {
        return res.status(403).json({ error: 'Only providers can discover referrals' });
      }

      const openRequests = await referrals
        .find({ status: 'active', userId: { $ne: normalizedPhone } })
        .sort({ createdAt: -1 })
        .toArray();

      const requestIds = openRequests.map((r: any) => r.requestId).filter(Boolean);
      const myApplications = requestIds.length
        ? await applications.find({ applicantId: normalizedPhone, requestId: { $in: requestIds } }).toArray()
        : [];
      const appliedSet = new Set(myApplications.map((a: any) => a.requestId));

      const countsAgg = requestIds.length
        ? await applications
            .aggregate([
              { $match: { requestId: { $in: requestIds } } },
              { $group: { _id: '$requestId', count: { $sum: 1 } } }
            ])
            .toArray()
        : [];
      const countByRequest = new Map(countsAgg.map((c: any) => [c._id, c.count]));

      const discoverable = openRequests.map((r: any) => ({
        ...r,
        hasApplied: appliedSet.has(r.requestId),
        applicantCount: countByRequest.get(r.requestId) || 0,
      }));

      return res.status(200).json(discoverable);
    }

    // GET public referral request (no auth needed)
    if (action === 'view' && req.method === 'GET') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Request ID required' });

      const referral = await referrals.findOne({ requestId: id as string });
      if (!referral) return res.status(404).json({ error: 'Not found' });

      return res.status(200).json(referral);
    }

    // APPLY to a referral (provider submitting application)
    if (action === 'apply' && req.method === 'POST') {
      if (!normalizedPhone) {
        return res.status(401).json({ error: 'User phone required' });
      }

      // Only registered providers can apply to referral requests.
      const requester = await profilesCollection.findOne({ 'basicInfo.phone': normalizedPhone });
      if (requester?.role !== 'provider') {
        return res.status(403).json({ error: 'Only registered providers can apply to referral requests' });
      }

      const { requestId } = req.body;
      if (!requestId) {
        return res.status(400).json({ error: 'requestId required' });
      }

      // Check if request exists and is active
      const referral = await referrals.findOne({ requestId });
      if (!referral) return res.status(404).json({ error: 'Request not found' });
      if (referral.status !== 'active') {
        return res.status(400).json({ error: 'Request is no longer accepting applications' });
      }
      if (referral.userId === normalizedPhone) {
        return res.status(400).json({ error: 'You cannot apply to your own referral request' });
      }

      // Check if already applied
      const existing = await applications.findOne({
        requestId,
        applicantId: normalizedPhone
      });
      if (existing) {
        return res.status(400).json({ error: 'Already applied to this request' });
      }

      const { name, exp, degrees, modalities, fee, languages, location } = req.body;

      const application = {
        requestId,
        applicantId: normalizedPhone,
        applicantName: name || '',
        applicantExp: exp || '',
        applicantDegrees: degrees || '',
        applicantModalities: Array.isArray(modalities) ? modalities : [],
        applicantFee: fee || '',
        applicantLanguages: languages || '',
        applicantLocation: location || '',
        appliedAt: new Date().toISOString()
      };

      const result = await applications.insertOne(application);
      return res.status(201).json({ ...application, _id: result.insertedId });
    }

    // GET applicants for a referral request
    if (action === 'applicants' && req.method === 'GET') {
      const { requestId } = req.query;
      if (!requestId) {
        return res.status(400).json({ error: 'requestId required' });
      }

      // Verify ownership
      const referral = await referrals.findOne({ requestId: requestId as string });
      if (!referral) return res.status(404).json({ error: 'Request not found' });
      if (referral.userId !== normalizedPhone) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const applicantsList = await applications
        .find({ requestId: requestId as string })
        .sort({ appliedAt: -1 })
        .toArray();

      return res.status(200).json(applicantsList);
    }

    // UPDATE referral status (close/reopen)
    if (action === 'update-status' && req.method === 'PUT') {
      if (!normalizedPhone) {
        return res.status(401).json({ error: 'User phone required' });
      }

      const { requestId, status } = req.body;
      if (!requestId || !status) {
        return res.status(400).json({ error: 'requestId and status required' });
      }

      // Verify ownership
      const referral = await referrals.findOne({ requestId });
      if (!referral) return res.status(404).json({ error: 'Request not found' });
      if (referral.userId !== normalizedPhone) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const updateData: any = { status };
      if (status === 'closed') {
        updateData.closedAt = new Date().toISOString();
      }

      const result = await referrals.updateOne(
        { requestId },
        { $set: updateData }
      );

      return res.status(200).json({ success: result.modifiedCount > 0 });
    }

    // DELETE referral request
    if (action === 'delete' && req.method === 'DELETE') {
      if (!normalizedPhone) {
        return res.status(401).json({ error: 'User phone required' });
      }

      const { requestId } = req.query;
      if (!requestId) {
        return res.status(400).json({ error: 'requestId required' });
      }

      // Verify ownership
      const referral = await referrals.findOne({ requestId: requestId as string });
      if (!referral) return res.status(404).json({ error: 'Request not found' });
      if (referral.userId !== normalizedPhone) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Delete request and all related data
      await referrals.deleteOne({ requestId: requestId as string });
      await applications.deleteMany({ requestId: requestId as string });
      await shortlists.deleteMany({ requestId: requestId as string });

      return res.status(200).json({ success: true });
    }

    // ADD/UPDATE shortlist entry
    if (action === 'shortlist' && req.method === 'POST') {
      if (!normalizedPhone) {
        return res.status(401).json({ error: 'User phone required' });
      }

      const { requestId, applicantId, rank } = req.body;
      if (!requestId || !applicantId || rank === undefined) {
        return res.status(400).json({ error: 'requestId, applicantId, rank required' });
      }

      if (rank < 1 || rank > 4) {
        return res.status(400).json({ error: 'Rank must be between 1-4' });
      }

      // Verify ownership
      const referral = await referrals.findOne({ requestId });
      if (!referral) return res.status(404).json({ error: 'Request not found' });
      if (referral.userId !== normalizedPhone) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Check if applicant exists
      const app = await applications.findOne({ requestId, applicantId });
      if (!app) {
        return res.status(404).json({ error: 'Applicant not found' });
      }

      // Check if already shortlisted at different rank
      const existing = await shortlists.findOne({ requestId, applicantId, userId: normalizedPhone });

      if (existing) {
        // Update rank
        await shortlists.updateOne(
          { requestId, applicantId, userId: normalizedPhone },
          { $set: { rank } }
        );
      } else {
        // Check if we already have 4 shortlisted
        const count = await shortlists.countDocuments({ requestId, userId: normalizedPhone });
        if (count >= 4) {
          return res.status(400).json({ error: 'Maximum 4 shortlists allowed' });
        }

        // Create new shortlist entry
        await shortlists.insertOne({
          requestId,
          userId: normalizedPhone,
          applicantId,
          rank,
          addedAt: new Date().toISOString()
        });
      }

      return res.status(200).json({ success: true });
    }

    // GET shortlist for a request
    if (action === 'shortlist' && req.method === 'GET') {
      const { requestId } = req.query;
      if (!requestId) {
        return res.status(400).json({ error: 'requestId required' });
      }

      // Verify ownership or allow public short list view
      const referral = await referrals.findOne({ requestId: requestId as string });
      if (!referral) return res.status(404).json({ error: 'Request not found' });

      if (normalizedPhone && referral.userId === normalizedPhone) {
        // User's own shortlist
        const shortlistData = await shortlists
          .find({ requestId: requestId as string, userId: normalizedPhone })
          .sort({ rank: 1 })
          .toArray();
        return res.status(200).json(shortlistData);
      }

      return res.status(403).json({ error: 'Not authorized' });
    }

    // REMOVE from shortlist
    if (action === 'shortlist-remove' && req.method === 'DELETE') {
      if (!normalizedPhone) {
        return res.status(401).json({ error: 'User phone required' });
      }

      const { requestId, applicantId } = req.query;
      if (!requestId || !applicantId) {
        return res.status(400).json({ error: 'requestId and applicantId required' });
      }

      // Verify ownership
      const referral = await referrals.findOne({ requestId: requestId as string });
      if (!referral) return res.status(404).json({ error: 'Request not found' });
      if (referral.userId !== normalizedPhone) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const result = await shortlists.deleteOne({
        requestId: requestId as string,
        userId: normalizedPhone,
        applicantId: applicantId as string
      });

      return res.status(200).json({ success: result.deletedCount > 0 });
    }

    // SELECT a provider for a referral request
    if (action === 'select-provider' && req.method === 'POST') {
      if (!normalizedPhone) {
        return res.status(401).json({ error: 'User phone required' });
      }

      const { requestId, applicantId } = req.body;
      if (!requestId || !applicantId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const referral = await referrals.findOne({ requestId: requestId as string });
      if (!referral || referral.userId !== normalizedPhone) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await referrals.updateOne(
        { requestId: requestId as string },
        { $set: { selectedProviderId: applicantId, selectedAt: new Date().toISOString() } }
      );

      return res.status(200).json({ success: true });
    }

    // GET provider profile (public view)
    if (action === 'provider-profile' && req.method === 'GET') {
      const { phone } = req.query;
      if (!phone) {
        return res.status(400).json({ error: 'Provider phone required' });
      }

      const providerPhone = normalizePhone(phone as string);
      const profiles = await getProfilesCollection();
      const profile = await profiles.findOne({
        'basicInfo.phone': providerPhone,
        role: 'provider'
      });

      if (!profile) {
        return res.status(404).json({ error: 'Provider not found' });
      }

      return res.status(200).json({
        fullName: profile.basicInfo?.fullName || '',
        email: profile.basicInfo?.email || '',
        qualification: profile.providerDetails?.qualification || '',
        yearsExperience: profile.providerDetails?.yearsExperience || '',
        specializations: profile.providerDetails?.specializations || [],
        languages: profile.providerDetails?.languages || [],
        mode: profile.providerDetails?.mode || '',
        budgetRange: profile.providerDetails?.budgetRange || '',
        therapeuticFocus: profile.providerDetails?.therapeuticFocus || '',
        therapyStyle: profile.providerDetails?.therapyStyle || '',
        licenses: profile.providerDetails?.licenses || '',
        website: profile.providerDetails?.website || '',
        clientType: profile.providerDetails?.clientType || [],
        offlineLocation: profile.providerDetails?.offlineLocation || '',
        resumeFileName: profile.providerDetails?.resumeFileName || '',
      });
    }

    res.status(400).json({
      error: 'Invalid action',
      method: req.method,
      action: action || null
    });
  } catch (err: any) {
    console.error('[REFERRALS]', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
}
