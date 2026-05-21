# 🔄 FAKRA Calendar — Cross-Browser Event Sync Setup

Your calendar now syncs events across all browsers and devices! Here's how to set it up:

## Local Development Setup

### Step 1: Copy and Configure .env

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials (see steps below)

### Step 2: Create a Supabase Project (Free)

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Choose a name (e.g., "FAKRA Calendar")
5. Set a strong database password
6. Select your region
7. Click **"Create new project"** (wait 2-3 minutes for initialization)

### Step 3: Create the Events Table

Once your project is ready:

1. Go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Paste this SQL and run it:

```sql
CREATE TABLE IF NOT EXISTS fakra_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT,
  notes TEXT,
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE fakra_events ENABLE ROW LEVEL SECURITY;

-- Allow all anonymous access (public calendar)
CREATE POLICY "Allow public access"
  ON fakra_events
  FOR ALL
  USING (true);
```

### Step 4: Get Your API Credentials

1. In Supabase, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://abcdefgh.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

### Step 5: Update .env

Open `.env` and fill in your credentials:

```env
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGc...
```

### Step 6: Generate config.js

Run the setup script to generate `config.js` from your `.env`:

```bash
node setup.js
```

You should see: ✅ `config.js generated from .env`

## Deployment to Vercel

### Step 1: Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables:
   - **Key**: `SUPABASE_URL` → **Value**: Your Supabase URL
   - **Key**: `SUPABASE_ANON_KEY` → **Value**: Your Supabase key

### Step 2: Add Build Script to Vercel

1. Go to **Settings** → **Build & Development Settings**
2. In **Build Command**, add:
   ```bash
   node setup.js
   ```
3. This ensures `config.js` is generated from environment variables during each deploy

### Step 3: Deploy

```bash
git add -A
git commit -m "feat: env-based config"
git push origin main
```

Vercel will automatically:
1. Use your environment variables
2. Run `node setup.js` to generate `config.js`
3. Deploy the app

## ✅ Done!

Now when you add an event:
- It saves to Supabase
- All other browsers/tabs sync within 10 seconds
- Events persist across refreshes
- Secure - credentials aren't exposed in code

## 🔒 Security Notes

- ✅ `.env` is in `.gitignore` - never committed
- ✅ `config.js` is in `.gitignore` - generated per environment
- ✅ On Vercel, credentials come from environment variables, not git
- ✅ Only the public API key is used (safe for frontend)

## 🔧 Troubleshooting

**"config.js not generated?"**
- Make sure `.env` file exists and is filled in
- Run `node setup.js` in the project directory
- Check that both `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set

**"Events not syncing?"**
- Check your `config.js` has correct credentials
- Open browser DevTools (F12) → Console to see errors
- Make sure RLS policies are set correctly in Supabase

**"Vercel build failing?"**
- Ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in Vercel dashboard
- Check **Deployments** → **Build Logs** for `setup.js` errors

