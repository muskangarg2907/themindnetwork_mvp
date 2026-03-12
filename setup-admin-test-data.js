#!/usr/bin/env node

/**
 * Setup Admin Dashboard Test Data
 * 
 * This script creates sample test data for the admin dashboard.
 * Run this before accessing the admin dashboard locally.
 * 
 * Usage: node setup-admin-test-data.js
 */

import fs from 'fs';
import path from 'path';

// Test client profiles
const testClients = [
  {
    _id: 'client_001',
    role: 'client',
    status: 'approved',
    basicInfo: {
      fullName: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '9876543210',
      location: 'Mumbai, India'
    },
    clinical: {
      presentingProblem: 'Anxiety and stress management',
      medications: 'None'
    },
    preferences: {
      mode: 'online',
      budget: '500-1000'
    },
    payments: [
      {
        planId: 'premium_001',
        planName: 'Premium - ₹2999',
        amount: 2999,
        status: 'success',
        paidAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: 'card'
      }
    ],
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'client_002',
    role: 'client',
    status: 'approved',
    basicInfo: {
      fullName: 'Rajesh Kumar',
      email: 'rajesh@example.com',
      phone: '9876543211',
      location: 'Bangalore, India'
    },
    clinical: {
      presentingProblem: 'Depression and burnout',
      medications: 'Sertraline 50mg'
    },
    preferences: {
      mode: 'hybrid',
      budget: '800-1500'
    },
    payments: [],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Test provider profiles
const testProviders = [
  {
    _id: 'provider_001',
    role: 'provider',
    status: 'approved',
    basicInfo: {
      fullName: 'Dr. Anil Patel',
      email: 'anil.patel@example.com',
      phone: '9123456789',
      location: 'Mumbai, India'
    },
    providerDetails: {
      qualification: 'M.Psy (Clinical Psychology)',
      yearsExperience: '8',
      mode: 'both',
      budgetRange: '800-2000',
      specializations: ['Anxiety Disorders', 'Cognitive Behavioral Therapy', 'Stress Management'],
      languages: ['English', 'Hindi', 'Marathi'],
      therapeuticFocus: 'Anxiety and mood disorders',
      licenses: 'RCI Registration: MH2020/1234',
      website: 'www.dranilpatel.com',
      therapyStyle: 'Integrative approach combining CBT and mindfulness',
      offlineLocation: 'Bandra, Mumbai'
    },
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'provider_002',
    role: 'provider',
    status: 'pending_verification',
    basicInfo: {
      fullName: 'Meera Iyer',
      email: 'meera.iyer@example.com',
      phone: '9123456790',
      location: 'Bangalore, India'
    },
    providerDetails: {
      qualification: 'M.Tech Psychology, B.Sc Counseling',
      yearsExperience: '5',
      mode: 'online',
      budgetRange: '600-1500',
      specializations: ['Depression', 'Life Coaching', 'Relationship Counseling'],
      languages: ['English', 'Kannada', 'Tamil'],
      therapeuticFocus: 'Life transitions and relationships',
      licenses: 'RCI Registration: KA2021/5678',
      website: '',
      therapyStyle: 'Person-centered and empathetic approach',
      offlineLocation: ''
    },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'provider_003',
    role: 'provider',
    status: 'approved',
    basicInfo: {
      fullName: 'Vikram Singh',
      email: 'vikram@example.com',
      phone: '9123456791',
      location: 'Delhi, India'
    },
    providerDetails: {
      qualification: 'M.Psy, B.A Psychology',
      yearsExperience: '12',
      mode: 'both',
      budgetRange: '1000-2500',
      specializations: ['Trauma Therapy', 'EMDR', 'Family Therapy'],
      languages: ['English', 'Hindi', 'Punjabi'],
      therapeuticFocus: 'Trauma and anxiety disorders',
      licenses: 'RCI Registration: DL2018/9012',
      website: 'www.vikramtherapy.in',
      therapyStyle: 'Evidence-based trauma-focused therapy',
      offlineLocation: 'Connaught Place, Delhi'
    },
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Test referrals
const testReferrals = [
  {
    requestId: 'ref_001',
    creatorPhone: '9876543210',
    clientInitials: 'PS',
    clientType: 'adult',
    clientAge: '32',
    concerns: 'Anxiety, panic attacks, and difficulty focusing at work',
    genderPreference: ['female'],
    mode: ['online'],
    location: 'Mumbai',
    languages: 'Hindi, English',
    budgetRange: '500-1000',
    urgency: 'High',
    notes: 'Client prefers evening sessions after work',
    status: 'active',
    applicants: [
      {
        phoneNumber: '9123456789',
        name: 'Dr. Anil Patel',
        exp: '8',
        degrees: 'M.Psy (Clinical Psychology)',
        modalities: ['both'],
        fee: '800-2000',
        languages: 'English, Hindi, Marathi',
        location: 'Mumbai',
        appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        phoneNumber: '9123456791',
        name: 'Vikram Singh',
        exp: '12',
        degrees: 'M.Psy, B.A Psychology',
        modalities: ['both'],
        fee: '1000-2500',
        languages: 'English, Hindi, Punjabi',
        location: 'Delhi',
        appliedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    selectedProviderId: 'provider_001',
    selectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    requestId: 'ref_002',
    creatorPhone: '9876543211',
    clientInitials: 'RK',
    clientType: 'adult',
    clientAge: '45',
    concerns: 'Depression, work-related stress, and burnout',
    genderPreference: ['male', 'female'],
    mode: ['hybrid'],
    location: 'Bangalore',
    languages: 'English, Kannada',
    budgetRange: '800-1500',
    urgency: 'Medium',
    notes: 'Can do sessions on weekends. Experienced professional needed.',
    status: 'active',
    applicants: [
      {
        phoneNumber: '9123456790',
        name: 'Meera Iyer',
        exp: '5',
        degrees: 'M.Tech Psychology, B.Sc Counseling',
        modalities: ['online'],
        fee: '600-1500',
        languages: 'English, Kannada, Tamil',
        location: 'Bangalore',
        appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    selectedProviderId: null,
    selectedAt: null,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    requestId: 'ref_003',
    creatorPhone: '9876543210',
    clientInitials: 'AK',
    clientType: 'adolescent',
    clientAge: '17',
    concerns: 'Social anxiety, academic pressure, peer relationship issues',
    genderPreference: ['female'],
    mode: ['online'],
    location: 'Mumbai',
    languages: 'English, Hindi',
    budgetRange: '400-800',
    urgency: 'Medium',
    notes: 'Parent wants therapist familiar with adolescent psychology',
    status: 'closed',
    applicants: [
      {
        phoneNumber: '9123456789',
        name: 'Dr. Anil Patel',
        exp: '8',
        degrees: 'M.Psy (Clinical Psychology)',
        modalities: ['both'],
        fee: '800-2000',
        languages: 'English, Hindi, Marathi',
        location: 'Mumbai',
        appliedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    selectedProviderId: 'provider_001',
    selectedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Write test data to temporary files (same location as backend storage)
function writeTestData() {
  try {
    // Combine clients and providers
    const allProfiles = [...testClients, ...testProviders];
    
    // Write profiles
    const profilesPath = '/tmp/themindnetwork_profiles.json';
    fs.writeFileSync(profilesPath, JSON.stringify(allProfiles, null, 2));
    console.log(`✅ Created ${allProfiles.length} test profiles at ${profilesPath}`);

    // Write referrals
    const referralsPath = '/tmp/themindnetwork_referrals.json';
    fs.writeFileSync(referralsPath, JSON.stringify(testReferrals, null, 2));
    console.log(`✅ Created ${testReferrals.length} test referrals at ${referralsPath}`);

    console.log('\n📝 Test Data Summary:');
    console.log(`  Clients: ${testClients.length}`);
    console.log(`  Providers: ${testProviders.length}`);
    console.log(`  Referrals: ${testReferrals.length}`);
    
    console.log('\n🔐 Admin Login Details:');
    console.log('  Password: admin123');
    
    console.log('\n📊 Sample Data Breakdown:');
    console.log('  - 2 test clients (1 with payment history)');
    console.log('  - 3 test providers (1 pending, 2 approved)');
    console.log('  - 3 test referrals (2 active, 1 closed)');
    console.log('  - Applicants and selections already populated');
    
    console.log('\n✨ Ready to test! Navigate to: http://localhost:5174/#/admin-login');
  } catch (err) {
    console.error('❌ Error creating test data:', err.message);
    process.exit(1);
  }
}

// Run the setup
writeTestData();
