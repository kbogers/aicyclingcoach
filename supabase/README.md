# Supabase Setup for AI Cycling Coach

## Prerequisites

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

## Database Setup

You'll need to create a `users` table in your Supabase database. Run this SQL in your Supabase SQL editor:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  strava_user_id TEXT UNIQUE,
  google_user_id TEXT UNIQUE,
  strava_access_token TEXT,
  strava_refresh_token TEXT,
  strava_expires_at TIMESTAMPTZ,
  ftp INTEGER,
  lthr INTEGER,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  strava_activity_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  moving_time INTEGER NOT NULL,
  distance NUMERIC NOT NULL,
  total_elevation_gain NUMERIC DEFAULT 0,
  description TEXT,
  private_note TEXT,
  has_heartrate BOOLEAN DEFAULT FALSE,
  has_power BOOLEAN DEFAULT FALSE,
  average_heartrate INTEGER,
  max_heartrate INTEGER,
  average_power INTEGER,
  max_power INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, strava_activity_id)
);

-- Create RLS policies for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Create RLS policies for activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own activities
CREATE POLICY "Users can read own activities" ON activities
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Policy: Users can insert their own activities
CREATE POLICY "Users can insert own activities" ON activities
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Policy: Users can update their own activities
CREATE POLICY "Users can update own activities" ON activities
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_start_date ON activities(start_date);
CREATE INDEX IF NOT EXISTS idx_activities_user_start_date ON activities(user_id, start_date);
```

## Deploy Edge Functions

1. Link your project to Supabase:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

2. Set environment variables for the Edge Function:
   ```bash
   supabase secrets set STRAVA_CLIENT_ID=your_strava_client_id
   supabase secrets set STRAVA_CLIENT_SECRET=your_strava_client_secret
   ```

3. Deploy the Strava OAuth function:
   ```bash
   supabase functions deploy strava-oauth
   ```

## Environment Variables Needed

### For Supabase Edge Function:
- `STRAVA_CLIENT_ID` - Your Strava app's client ID
- `STRAVA_CLIENT_SECRET` - Your Strava app's client secret
- `SUPABASE_URL` - Automatically provided
- `SUPABASE_SERVICE_ROLE_KEY` - Automatically provided

### For Frontend (.env):
- `VITE_STRAVA_CLIENT_ID` - Your Strava app's client ID
- `VITE_STRAVA_REDIRECT_URI` - OAuth redirect URI (e.g., http://localhost:5173/auth/strava/callback)
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

## Testing

Once deployed, the Edge Function will be available at:
`https://YOUR_PROJECT_REF.supabase.co/functions/v1/strava-oauth`

Test it by sending a POST request with an authorization code:
```json
{
  "code": "authorization_code_from_strava"
}
``` 