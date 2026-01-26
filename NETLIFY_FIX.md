# Netlify Deployment Fix - Backend Required

## Problem
You got: `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

**Cause:** Netlify only hosts the **frontend**. Your Node.js backend isn't running, so API calls fail.

## Solution

### Step 1: Deploy Backend to Render (Free)

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Name**: `habit-tracker-backend`
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

5. Add **Environment Variables** (from `backend/.env`):
   ```
   FRONTEND_URL=https://your-app.netlify.app
   JWT_SECRET=bjhfrjhvsdjsd
   SUPABASE_URL=https://whtdshxotnancegefqrc.supabase.co
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SENDGRID_API_KEY=SG.N9SXwj4-QISCvc3mAs7rJw...
   SENDGRID_FROM_EMAIL=demongaming2312@gmail.com
   ```

6. Click "Create Web Service"
7. Copy your backend URL: `https://habit-tracker-backend.onrender.com`

### Step 2: Update Frontend Environment Variable

Update `.env` in your project root:
```
VITE_API_URL=https://habit-tracker-backend.onrender.com
```

### Step 3: Redeploy Frontend to Netlify

1. Commit changes:
   ```bash
   git add .
   git commit -m "Configure API URL for production"
   git push origin main
   ```

2. Netlify will auto-deploy (if connected to GitHub)
3. Or manually: `npm run build` then drag `dist` folder to Netlify

### Step 4: Run SQL in Supabase

Go to Supabase Dashboard → SQL Editor → Run the SQL from MIGRATION_COMPLETE.md

---

## What Changed

✅ Created `src/config/api.ts` - Centralized API URL configuration
✅ Updated all API calls to use `${API_URL}/api/...`
✅ Added `.env` with `VITE_API_URL` for production
✅ Updated backend CORS to accept your Netlify domain

## Test

After deploying backend:
1. Update `.env` with your Render URL
2. Rebuild and redeploy to Netlify
3. Try signing up from any device!
