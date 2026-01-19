# 🔐 Security Setup Guide

## ⚠️ IMMEDIATE ACTIONS REQUIRED

Your API keys have been exposed. Follow these steps **immediately**:

## 1. Regenerate All Compromised API Keys

### Google Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Find your existing key (starts with `AIzaSy...`)
3. Click "Delete" to revoke it
4. Click "Create API Key" to generate a new one
5. **Add API restrictions**:
   - Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)
   - Select your API key
   - Under "API restrictions", select "Restrict key"
   - Enable only: **Generative Language API**
   - Under "Application restrictions", add:
     - HTTP referrers for web apps
     - IP addresses for server apps

### Razorpay Keys
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys)
2. Regenerate both Test and Live keys (your live key ID starts with `rzp_live_...`)
3. Update webhook secrets

### Anthropic API Key
1. Go to [Anthropic Console](https://console.anthropic.com/settings/keys)
2. Revoke your exposed key (starts with `sk-ant-api03-...`)
3. Generate new key

### Groq API Key
1. Go to [Groq Console](https://console.groq.com/keys)
2. Revoke your exposed key (starts with `gsk_...`)
3. Generate new key

### MongoDB Atlas
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Database Access > Edit User > Reset Password
3. Update connection string in `.env`

## 2. Update Environment Files

After regenerating keys, update:

### Backend `.env` file:
```bash
cd backend
# Edit .env with your new keys
notepad .env
```

### Frontend `.env` file (if needed):
```bash
# Create .env in root directory (not committed to git)
notepad .env
```

## 3. Secure Your Codebase

✅ Already completed:
- Updated `.gitignore` to exclude all `.env` files
- Removed API keys from documentation
- Removed `.env.production` from git tracking

## 4. Clean Git History

⚠️ **Critical**: Your old keys are still in git history!

Run these commands to remove them:

```bash
# Install git-filter-repo (if not already installed)
pip install git-filter-repo

# Backup your repository first!
cd ..
cp -r themindnetwork_mvp themindnetwork_mvp_backup

# Remove sensitive data from history
cd themindnetwork_mvp
git filter-repo --invert-paths --path .env.production --force
git filter-repo --replace-text <(echo "AIzaSyAkbr_jD-DYPig8Gh35TBzSIq1pnJCfQiQ==>REDACTED")
git filter-repo --replace-text <(echo "AIzaSyA2_zF3FLMe9MvwiRFu9EcYc_DWW-Equn4==>REDACTED")
git filter-repo --replace-text <(echo "rzp_live_Rr6tZ54MH1e02o==>REDACTED")
git filter-repo --replace-text <(echo "cEoWVjBl0B714tIdFy6u0hAX==>REDACTED")

# Force push (⚠️ coordinate with team first!)
git push origin --force --all
```

**Alternative (simpler but less thorough)**:
```bash
# Just commit the fixes and move forward
git add .
git commit -m "security: Remove exposed API keys and improve .gitignore"
git push
```

## 5. Configure Vercel/Deployment Platform

For production deployments, set environment variables in your hosting platform:

### Vercel:
1. Go to Project Settings > Environment Variables
2. Add all keys there (never in code)
3. Redeploy your app

### Environment Variables to Set:
- `GEMINI_API_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `MONGODB_URI`
- `ANTHROPIC_API_KEY`
- `GROQ_API_KEY`

## 6. Add Additional Security Measures

### API Key Restrictions (Google Cloud)
1. **Application restrictions**:
   - For web apps: Add your domain(s)
   - For server: Add server IP addresses

2. **API restrictions**:
   - Only enable Generative Language API
   - Disable unused APIs

3. **Quota limits**:
   - Set daily quotas to prevent abuse
   - Enable billing alerts

### MongoDB Security
1. Network Access: Add only your server IP
2. Enable IP Whitelist
3. Use read-only users where appropriate
4. Enable MongoDB Atlas monitoring

### Razorpay Security
1. Add webhook signature verification
2. Set IP whitelist for webhooks
3. Enable 2FA on your Razorpay account

## 7. Monitoring

Set up monitoring for:
- Unusual API usage patterns
- Failed authentication attempts
- Billing anomalies

## 8. Best Practices Going Forward

✅ **DO**:
- Use `.env` files for all secrets (already in `.gitignore`)
- Use environment variables in CI/CD
- Rotate keys every 90 days
- Use different keys for dev/staging/production
- Enable 2FA on all service accounts

❌ **DON'T**:
- Never commit `.env` files
- Never share API keys in chat/email
- Never hardcode secrets in source code
- Never put secrets in documentation

## Verification Checklist

- [ ] All API keys regenerated
- [ ] New keys added to `.env` files (not committed)
- [ ] API restrictions configured in Google Cloud
- [ ] `.env.production` removed from git
- [ ] Git history cleaned (optional but recommended)
- [ ] Vercel environment variables configured
- [ ] All services tested with new keys
- [ ] Monitoring/alerts enabled

## Need Help?

- Google Cloud Security: https://cloud.google.com/security/best-practices
- OWASP API Security: https://owasp.org/www-project-api-security/
- Vercel Environment Variables: https://vercel.com/docs/environment-variables
