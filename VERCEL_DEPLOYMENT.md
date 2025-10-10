# Vercel Deployment Guide

## Prerequisites
- GitHub account connected to Vercel
- Render server deployed and URL ready
- Node.js installed locally (for CLI method)

---

## Method 1: Vercel Dashboard (Recommended)

### Step 1: Sign in to Vercel
1. Go to https://vercel.com
2. Click "Sign Up" or "Log In"
3. Choose "Continue with GitHub" (recommended)
4. Authorize Vercel to access your repositories

### Step 2: Import Project
1. Click **"Add New..."** button (top right)
2. Select **"Project"**
3. Find and select your **MMSpace** repository
4. Click **"Import"**

### Step 3: Configure Build Settings

⚠️ **IMPORTANT:** Set the Root Directory!

| Setting | Value | Notes |
|---------|-------|-------|
| **Framework Preset** | Vite | Auto-detected, don't change |
| **Root Directory** | `client` | ⚠️ Click "Edit" to set this! |
| **Build Command** | `npm run build` | Default is fine |
| **Output Directory** | `dist` | Default is fine |
| **Install Command** | `npm install` | Default is fine |

### Step 4: Add Environment Variables

In the **Environment Variables** section:

```
Key:   VITE_API_URL
Value: https://your-app.onrender.com
```

**Replace** `your-app.onrender.com` with your actual Render server URL!

**Select all environments:**
- ✅ Production
- ✅ Preview
- ✅ Development

### Step 5: Deploy
1. Click **"Deploy"**
2. Wait for the build to complete (2-3 minutes)
3. You'll see a success screen with your URL

### Step 6: Get Your Deployment URL
- Your app will be live at: `https://mmspace-xxx.vercel.app`
- You can customize this in **Settings → Domains**

---

## Method 2: Vercel CLI

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Navigate to Client Directory
```bash
cd client
```

### Step 3: Login to Vercel
```bash
vercel login
```
Follow the prompts to authenticate.

### Step 4: Deploy
```bash
vercel
```

You'll be asked:
```
? Set up and deploy "~/MMSpace/client"? [Y/n] y
? Which scope do you want to deploy to? (Select your account)
? Link to existing project? [y/N] n
? What's your project's name? mmspace-client
? In which directory is your code located? ./
```

### Step 5: Configure Build Settings
```
? Want to override the settings? [y/N] y
? Which settings would you like to override?
  ✓ Build Command
  ✓ Output Directory
  ✓ Development Command

? What's your Build Command? npm run build
? What's your Output Directory? dist
? What's your Development Command? npm run dev
```

### Step 6: Add Environment Variable
```bash
vercel env add VITE_API_URL production
```
When prompted, paste: `https://your-app.onrender.com`

Also add for preview and development:
```bash
vercel env add VITE_API_URL preview
vercel env add VITE_API_URL development
```

### Step 7: Deploy to Production
```bash
vercel --prod
```

---

## Post-Deployment Configuration

### 1. Update Render Server Environment Variables

Go to your Render dashboard and update:

```
CLIENT_URL=https://your-vercel-url.vercel.app
CORS_ORIGIN=https://your-vercel-url.vercel.app
```

This allows your server to accept requests from your Vercel-deployed client.

**Steps:**
1. Go to Render Dashboard → Your Service
2. Click **"Environment"** tab
3. Edit `CLIENT_URL` and `CORS_ORIGIN`
4. Click **"Save Changes"**
5. Render will automatically redeploy

### 2. Test Your Deployment

Visit your Vercel URL and test:
- ✅ Login/Signup works
- ✅ API calls succeed
- ✅ Real-time features (Socket.io) work
- ✅ Check browser console for errors

### 3. Check CORS Issues

If you see CORS errors in the browser console:
1. Verify `CORS_ORIGIN` in Render matches your Vercel URL exactly
2. Make sure Render redeployed after the change
3. Clear browser cache and hard reload (Ctrl+Shift+R)

---

## Updating Environment Variables

### In Vercel Dashboard:
1. Go to your project
2. Click **Settings** → **Environment Variables**
3. Edit `VITE_API_URL`
4. Click **Save**
5. Go to **Deployments** → Click ⋯ → **Redeploy**

### Using CLI:
```bash
vercel env rm VITE_API_URL production
vercel env add VITE_API_URL production
# Enter new value
vercel --prod
```

---

## Troubleshooting

### Build Fails
**Error:** `Module not found` or dependency errors
**Solution:**
- Check `package.json` in client directory
- Run `npm install` locally to verify dependencies
- Check build logs in Vercel dashboard

### API Calls Return 404
**Error:** API endpoints not reachable
**Solution:**
- Verify `VITE_API_URL` is set correctly in Vercel
- Check Render server is running (visit `/health` endpoint)
- Redeploy after changing environment variables

### CORS Errors
**Error:** `Access-Control-Allow-Origin` errors in browser console
**Solution:**
- Update `CORS_ORIGIN` in Render to match Vercel URL
- Make sure it includes `https://` protocol
- No trailing slash in the URL

### Routes Return 404 (e.g., /dashboard)
**Error:** Direct navigation to routes fails
**Solution:**
- Verify `vercel.json` exists in client directory
- Check it has the rewrites configuration:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```

### Environment Variables Not Working
**Error:** `VITE_API_URL` is undefined
**Solution:**
- ⚠️ All Vite env vars MUST start with `VITE_`
- Redeploy after adding/changing env vars
- Check you selected the right environment (Production/Preview/Development)

---

## Custom Domain (Optional)

### Add Your Own Domain:
1. Go to Vercel Dashboard → Your Project
2. Click **Settings** → **Domains**
3. Add your domain (e.g., `mmspace.com`)
4. Follow DNS configuration instructions
5. Update `CORS_ORIGIN` in Render to match new domain

---

## Automatic Deployments

With GitHub integration:
- Every push to `main` branch → Auto-deploys to Production
- Every push to other branches → Creates Preview deployment
- Pull requests → Get unique preview URLs

Configure in: **Settings** → **Git** → **Production Branch**

---

## Environment Variable Reference

### Vercel (Client Side)
Set in Vercel Dashboard → Settings → Environment Variables:
```
VITE_API_URL=https://your-app.onrender.com
```

### Render (Server Side)
Update after Vercel deployment:
```
CLIENT_URL=https://your-vercel-app.vercel.app
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

---

## Quick Checklist

Before deploying:
- [ ] Render server is deployed and running
- [ ] You have the Render server URL
- [ ] `vercel.json` exists in client directory
- [ ] `package.json` has all dependencies

During deployment:
- [ ] Set Root Directory to `client`
- [ ] Add `VITE_API_URL` environment variable
- [ ] Deploy and get Vercel URL

After deployment:
- [ ] Update Render `CLIENT_URL` and `CORS_ORIGIN`
- [ ] Test login/signup
- [ ] Test API calls
- [ ] Test real-time features

---

## Success! 🎉

Your MMSpace application is now live:
- **Client:** https://your-app.vercel.app
- **Server:** https://your-app.onrender.com
- **Database:** MongoDB Atlas

Share your deployment URL and enjoy your app!
