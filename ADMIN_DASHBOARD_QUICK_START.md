# Admin Dashboard Local Testing - Quick Reference

## ⚡ Quick Start (2 minutes)

### Step 1: Generate Test Data
```bash
node setup-admin-test-data.js
```

### Step 2: Start Frontend
```bash
npm run dev
```

### Step 3: Login to Admin Dashboard
- URL: `http://localhost:5174/#/admin-login`
- Password: `admin123`

---

## 📊 What You'll See

### Clients Tab
- **Priya Sharma** (9876543210) - 1 referral created, 1 top choice, paid ₹2999
- **Rajesh Kumar** (9876543211) - No payments yet

### Providers Tab
- **Dr. Anil Patel** (9123456789) - Approved, Applied to 2 referrals
- **Meera Iyer** (9123456790) - Pending verification
- **Vikram Singh** (9123456791) - Approved, Applied to 1 referral

### Referrals Tab
- **ref_001** (Active) - 2 applicants, Dr. Anil selected
- **ref_002** (Active) - 1 applicant, no selection
- **ref_003** (Closed) - 1 applicant, Dr. Anil selected

---

## 🔧 Features to Test

- ✅ Switch between Clients/Providers/Referrals tabs
- ✅ Click profile card to see full details
- ✅ View profile details on the right panel
- ✅ Click referral note cell to add/edit notes (persists in localStorage)
- ✅ View applicant details in referral table
- ✅ See selected provider info
- ✅ Try Approve/Reject/Delete buttons

---

## 📁 Test Data Files

Created at:
- `/tmp/themindnetwork_profiles.json` - 5 profiles (2 clients + 3 providers)
- `/tmp/themindnetwork_referrals.json` - 3 referrals with applications

Auto-deleted on system restart (they're in `/tmp`).

---

## 🔑 Login Credentials

**Password:** `admin123`

Defined in `.env` file:
```env
ADMIN_SECRET=admin123
```

---

## 📖 Full Documentation

See `ADMIN_DASHBOARD_LOCAL_SETUP.md` for detailed setup, troubleshooting, and production guidance.

---

## ✨ Cool Features to Try

1. **Click profile** → See all their info in the right panel
2. **Referrals tab** → Click any cell in Notes column → Add operational notes → Click Save
3. **Providers tab** → Click pending provider → See qualifications → Click Approve
4. **Clients tab** → See payment badges next to paid clients
5. **Referrals tab** → Hover/click link icon → See referral public link

---

## 🚀 When Ready to Deploy

Remember to:
1. Change `ADMIN_SECRET` in production
2. Switch from JSON files to MongoDB
3. Add authentication/2FA
4. Enable audit logging

