-- Complete fresh setup (combines all migrations)
-- Migration: 999_complete_fresh_setup.sql
-- Use this for a complete fresh database setup or to fix existing setups

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can read own activities" ON activities;
DROP POLICY IF EXISTS "Users can insert own activities" ON activities;
DROP POLICY IF EXISTS "Users can update own activities" ON activities;

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_activities_user_id;
DROP INDEX IF EXISTS idx_activities_start_date;
DROP INDEX IF EXISTS idx_activities_user_start_date;
DROP INDEX IF EXISTS idx_activities_strava_id;

-- Drop activities table if it exists (THIS WILL DELETE ALL ACTIVITY DATA!)
DROP TABLE IF EXISTS activities;

-- Add the last_sync column to users table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'last_sync') THEN
        ALTER TABLE users ADD COLUMN last_sync TIMESTAMPTZ;
    END IF;
END $$;

-- Create users table if it doesn't exist
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

-- Create activities table fresh
CREATE TABLE activities (
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

-- Enable RLS on both tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can read own data'
    ) THEN
        CREATE POLICY "Users can read own data" ON users
          FOR SELECT USING (auth.uid()::text = id::text);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can update own data'
    ) THEN
        CREATE POLICY "Users can update own data" ON users
          FOR UPDATE USING (auth.uid()::text = id::text);
    END IF;
END $$;

-- Create policies for activities table
CREATE POLICY "Users can read own activities" ON activities
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own activities" ON activities
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own activities" ON activities
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Create indexes
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_start_date ON activities(start_date);
CREATE INDEX idx_activities_user_start_date ON activities(user_id, start_date);
CREATE INDEX idx_activities_strava_id ON activities(strava_activity_id);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at 
            BEFORE UPDATE ON users 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

CREATE TRIGGER update_activities_updated_at 
    BEFORE UPDATE ON activities 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 