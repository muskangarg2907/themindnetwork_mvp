# Admin Dashboard Local Setup Guide

This guide walks you through setting up and testing the admin dashboard locally.

## Quick Start

### 1. Set Up Environment Variables

The `.env` file already has the admin secret configured:

```env
ADMIN_SECRET=admin123
```

This is set in `.env` for local development. **Change this to a proper secret in production!**

### 2. Create Test Data

Run the test data setup script to populate sample profiles and referrals:

```bash
node setup-admin-test-data.js
```

This creates:
- **5 test profiles**: 2 clients + 3 providers
- **3 test referrals**: With applicants and selections already populated
- Sample data in `/tmp/` for local storage

### 3. Start the Dev Servers

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend (if using local API):**
```bash
cd backend
npm start
```

### 4. Access Admin Dashboard

Navigate to: **http://localhost:5174/#/admin-login**

**Login Password:** `admin123`

---

## Test Data Details

### Test Clients

| Name | Email | Phone | Status | Payments |
|------|-------|-------|--------|----------|
| Priya Sharma | priya@example.com | 9876543210 | Approved | 1 (₹2999) |
| Rajesh Kumar | rajesh@example.com | 9876543211 | Approved | 0 |

### Test Providers

| Name | Email | Specialization | Status | Mode |
|------|-------|-----------------|--------|------|
| Dr. Anil Patel | anil.patel@example.com | Anxiety Disorders | Approved | Both |
| Meera Iyer | meera.iyer@example.com | Depression | Pending | Online |
| Vikram Singh | vikram@example.com | Trauma Therapy | Approved | Both |

### Test Referrals

| ID | Client | Status | Applicants | Selected |
|----|--------|--------|-----------|----------|
| ref_001 | PS (Anxiety) | Active | 2 | Dr. Anil Patel |
| ref_002 | RK (Depression) | Active | 1 | Not Selected |
| ref_003 | AK (Adolescent) | Closed | 1 | Dr. Anil Patel |

---

## Admin Dashboard Features

### Tabs & Views

#### 1. **Clients Tab**
- List of all client profiles
- Shows count of referrals created
- Shows count of top choices selected
- Payment badges for paid clients

#### 2. **Providers Tab**
- List of all provider profiles
- Shows count of referrals applied to
- Approval/rejection status
- Quick resume viewing

#### 3. **Referrals Tab**
- Comprehensive referral management table
- View all referral details:
  - Client info (initials, type, age, mode, budget, urgency)
  - Creator details (name, phone, email)
  - Applicant count and link
  - Selected provider details (if chosen)
- **Inline notes**: Click any cell in the Notes column to add/edit operational notes
- Notes auto-save to browser localStorage

### Profile Management

Click any profile to view:
- **Basic Info**: Name, email, phone, location, registration date
- **Provider Details** (if provider):
  - Qualifications, experience, specializations
  - Languages, licenses, therapy style
  - Resume download
  - Contact methods
- **Payment History** (if client): All payments with status and amounts
- **Action Buttons**:
  - **Approve**: Mark as verified
  - **Reject**: Reject with warning for paid accounts
  - **Delete**: Permanently remove profile

---

## Data Storage

Test data is stored in `/tmp/`:

- **Profiles**: `/tmp/themindnetwork_profiles.json`
- **Referrals**: `/tmp/themindnetwork_referrals.json`

**Note**: These files are lost on system restart (tmp is ephemeral).

To persist data between sessions, copy these files to your project:
```bash
cp /tmp/themindnetwork_*.json ~/.themindnetwork_test_data/
```

Then restore before testing:
```bash
cp ~/.themindnetwork_test_data/*.json /tmp/
```

---

## Testing Workflows

### Test 1: Profile Management
1. Go to **Clients** tab
2. Click on "Priya Sharma"
3. View her payment history
4. Try clicking **Approve** or **Reject**
5. Go to **Providers** tab
6. Click on "Meera Iyer" (pending)
7. View her qualifications and approve

### Test 2: Referral Management
1. Go to **Referrals** tab
2. Click notes column for "ref_001" (Active)
3. Add internal notes: "Called Priya - will arrange first session"
4. Save and verify persistence
5. View "ref_003" (Closed) - shows applicants and selected provider

### Test 3: Provider Application Tracking
1. Go to **Providers** tab
2. Click "Dr. Anil Patel"
3. See count "Applied To: 2" (appears in the list view)
4. Go to **Referrals** tab
5. Verify he appears in "ref_001" and "ref_003" applicant lists

---

## Regenerating Test Data

If you need to reset the test data:

```bash
# Delete old data
rm /tmp/themindnetwork_*.json

# Regenerate
node setup-admin-test-data.js
```

Or to modify test data, edit `setup-admin-test-data.js` directly and rerun.

---

## Troubleshooting

### "Unauthorized" error on admin page
- Verify `ADMIN_SECRET=admin123` in `.env`
- Clear sessionStorage: `sessionStorage.clear()` in browser console
- Login again with password: `admin123`

### Test data not appearing
- Run: `node setup-admin-test-data.js` again
- Check `/tmp/themindnetwork_profiles.json` exists
- Check `/tmp/themindnetwork_referrals.json` exists
- Clear browser cache and refresh

### Notes not saving
- Check browser console for errors
- Verify localStorage is enabled
- Try a different tab/field

### Backend errors
- Verify backend is running on port 4000
- Check backend logs for CORS issues
- Ensure admin token header is being sent correctly

---

## Next Steps for Production

Before deploying to production:

1. **Change ADMIN_SECRET**: Use a strong, random password
2. **Use MongoDB**: Connect to proper MongoDB database instead of JSON files
3. **Add 2FA**: Implement two-factor authentication
4. **Audit Logging**: Log all admin actions
5. **Rate Limiting**: Apply rate limiting to login endpoint

---

## Support

For issues or feature requests related to the admin dashboard, check:
- `components/AdminDashboard.tsx` - Frontend
- `api/admin.ts` - Backend endpoint
- `backend/server.js` - Local backend (if using)

