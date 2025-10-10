# Deployment Guide

This guide covers deploying the MMSpace application with the server on Render (using Docker) and the client on Vercel.

## Prerequisites

- GitHub account
- Render account (https://render.com)
- Vercel account (https://vercel.com)
- MongoDB Atlas account (https://www.mongodb.com/cloud/atlas)

## Database Setup (MongoDB Atlas)

1. **Create a MongoDB Atlas Cluster**
   - Go to https://www.mongodb.com/cloud/atlas
   - Create a free cluster
   - Set up database access (username/password)
   - Whitelist all IP addresses (0.0.0.0/0) for production
   - Get your connection string

## Server Deployment (Render with Docker)

### Option 1: Using Render Dashboard

1. **Push your code to GitHub**

   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Create a new Web Service on Render**

   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure the service:
     - **Name**: mmspace-server (or your preferred name)
     - **Region**: Singapore (or closest to your users)
     - **Branch**: main
     - **Root Directory**: Leave empty (will use dockerContext from render.yaml)
     - **Environment**: Docker
     - **Dockerfile Path**: ./server/Dockerfile
     - **Docker Context**: ./server
     - **Plan**: Free

3. **Set Environment Variables**

   - Add the following environment variables:
     ```
     NODE_ENV=production
     PORT=5000
     MONGODB_URI=<your-mongodb-connection-string>
     JWT_SECRET=<generate-a-secure-random-string>
     CLIENT_URL=https://your-app.vercel.app
     CORS_ORIGIN=https://your-app.vercel.app
     ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for the build and deployment to complete
   - Note your server URL: `https://your-server.onrender.com`

### Option 2: Using render.yaml (Infrastructure as Code)

1. **Update render.yaml**

   - The `render.yaml` file is already configured
   - Render will auto-detect it from your repository

2. **Create Blueprint**

   - Go to Render Dashboard → "Blueprints"
   - Click "New Blueprint Instance"
   - Connect your repository
   - Render will use the render.yaml configuration

3. **Configure Environment Variables**
   - Set the required environment variables in the Render dashboard

### Health Check Endpoint

Add a health check endpoint to your server (if not already present):

```javascript
// In server/server.js
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({ status: "healthy", timestamp: new Date().toISOString() });
});
```

## Client Deployment (Vercel)

### Step 1: Prepare the Client

1. **Update API URL Configuration**

   Create `.env.production` in the client directory:

   ```properties
   VITE_API_URL=https://your-server.onrender.com
   ```

2. **Update vite.config.js** (if needed)

   ```javascript
   // filepath: /home/jeet/workspace/MMSpace/client/vite.config.js
   import { defineConfig } from "vite";
   import react from "@vitejs/plugin-react";

   export default defineConfig({
     plugins: [react()],
     build: {
       outDir: "dist",
       sourcemap: false,
     },
     server: {
       port: 3000,
     },
   });
   ```

### Step 2: Deploy to Vercel

1. **Install Vercel CLI** (optional)

   ```bash
   npm install -g vercel
   ```

2. **Deploy via Vercel Dashboard** (Recommended)

   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Vite
     - **Root Directory**: client
     - **Build Command**: `npm run build`
     - **Output Directory**: dist
     - **Install Command**: `npm install`

3. **Set Environment Variables**

   - Add environment variable:
     ```
     VITE_API_URL=https://your-server.onrender.com
     ```

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Note your client URL: `https://your-app.vercel.app`

### Step 3: Deploy via CLI (Alternative)

```bash
cd client
vercel --prod
```

Follow the prompts and set environment variables when asked.

## Update CORS Configuration

After deploying, update the server's CORS configuration:

1. **Update Render Environment Variables**

   - Go to your Render service settings
   - Update `CLIENT_URL` and `CORS_ORIGIN`:
     ```
     CLIENT_URL=https://your-app.vercel.app
     CORS_ORIGIN=https://your-app.vercel.app
     ```

2. **If using custom domain on Vercel**
   ```
   CLIENT_URL=https://yourdomain.com
   CORS_ORIGIN=https://yourdomain.com,https://your-app.vercel.app
   ```

## Post-Deployment

### 1. Test the Application

- Visit your Vercel URL
- Test all features:
  - User registration/login
  - Chat functionality
  - Leave requests
  - Attendance tracking
  - File uploads (if applicable)

### 2. Monitor Logs

**Render Logs:**

- Go to your Render service
- Click on "Logs" tab
- Monitor for any errors

**Vercel Logs:**

- Go to your Vercel project
- Click on "Deployments"
- Select a deployment to view logs

### 3. Set Up Custom Domain (Optional)

**For Vercel:**

- Go to Project Settings → Domains
- Add your custom domain
- Configure DNS records as instructed

**For Render:**

- Go to Service Settings → Custom Domains
- Add your custom domain
- Update DNS records

## Environment Variables Summary

### Server (Render)

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=https://your-app.vercel.app
CORS_ORIGIN=https://your-app.vercel.app
```

### Client (Vercel)

```env
VITE_API_URL=https://your-server.onrender.com
```
