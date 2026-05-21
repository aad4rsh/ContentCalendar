# 🔄 FAKRA Calendar — Cross-Browser Event Sync Setup

Your calendar now syncs events across all browsers and devices! Here's how to set it up:

## Step 1: Create a Supabase Project (Free)

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Choose a name (e.g., "FAKRA Calendar")
5. Set a strong database password
6. Select your region
7. Click **"Create new project"** (wait 2-3 minutes for initialization)

## Step 2: Create the Events Table

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

## Step 3: Get Your API Credentials

1. In Supabase, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://abcdefgh.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

## Step 4: Update Your App

Open `app.js` and find these lines (near the top):

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

Replace them with your credentials:

```javascript
const SUPABASE_URL = 'https://abcdefgh.supabase.co';  // Your Project URL
const SUPABASE_ANON_KEY = 'eyJ0eXAi...';  // Your anon public key
```

## Step 5: Deploy to Vercel

1. Commit and push your changes:
   ```bash
   git add .
   git commit -m "Add cross-browser event sync"
   git push origin main
   ```

2. Vercel will auto-deploy your changes

## ✅ Done!

Now when you add an event:
- It saves to Supabase
- All other browsers/tabs sync within 10 seconds
- Events persist across refreshes
- Share the calendar link with others to see all events

## 🔧 Troubleshooting

**"Events not syncing?"**
- Check your SUPABASE_URL and SUPABASE_ANON_KEY are correct
- Open browser DevTools (F12) → Console to see any errors
- Make sure RLS policies are set correctly in Supabase

**"Getting CORS errors?"**
- This shouldn't happen with Supabase's CORS setup, but if it does, Supabase likely just needs a minute to propagate

**"Want to make it invite-only?"**
- Change the RLS policy in Supabase to require authentication instead of allowing all access
