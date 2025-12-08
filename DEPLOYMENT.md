# Deployment Guide

## Step 1: Deploy Backend to Railway

1. **Create a GitHub repo and push your code**
   ```powershell
   cd 'C:\Users\muska\Desktop\TheMindNetwork'
   git init
   git add .
   git commit -m "TheMindNetwork - ready for production"
   git remote add origin https://github.com/YOUR_USERNAME/themindnetwork.git
   git push -u origin main
   ```

2. **Deploy Backend on Railway.app**
   - Go to https://railway.app
   - Sign up with GitHub
   - Create a new project → Deploy from GitHub repo
   - Select your repo
   - Railway will auto-detect Docker and deploy the backend
   - Set environment variables in Railway dashboard:
     - `DATABASE_URL`: Leave empty (file-based) OR provide Postgres URL
     - `GEMINI_API_KEY`: Your Google Generative AI key (optional)
     - `PORT`: 4000 (default)
   - Railway assigns a domain like: `https://themindnetwork-backend-prod.railway.app`
   - **Copy this URL for Step 2**

## Step 2: Deploy Frontend to Vercel

1. **Connect Vercel to GitHub**
   - Go to https://vercel.com
   - Sign up / Log in with GitHub
   - Click "New Project" → Import Git Repository
   - Select your `themindnetwork` repo
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`

2. **Add Environment Variables in Vercel Dashboard**
   - Go to Project Settings → Environment Variables
   - Add:
     - Key: `VITE_API_URL`
     - Value: `https://your-backend-url-from-railway.railway.app` (from Step 1)
   - Save and redeploy

3. **Deploy**
   - Vercel automatically builds and deploys
   - You get a URL like: `https://themindnetwork.vercel.app`

## Step 3: Test on Live

1. Open your Vercel domain in browser
2. Test login with phone: `+91 8972949649` (existing in backend database)
3. Should redirect to `/profile` page

## Step 4: Custom Domain (Optional)

If you own a domain:
1. In Vercel, go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as Vercel instructs
4. SSL is automatic

---

## Troubleshooting

- **"Failed to fetch profiles" error**: Check that `VITE_API_URL` is set correctly in Vercel and points to your Railway backend
- **CORS errors**: Backend has CORS enabled; if you still get errors, check backend logs on Railway
- **Backend not responding**: Ensure Railway deployment completed successfully and the domain is accessible

