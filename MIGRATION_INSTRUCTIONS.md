# 🚨 URGENT: Database Migration Required

The app is currently failing because the database is missing the `activities` table and has UUID type mismatches. 

## Why This Happened

The user ID was being treated as a string (Strava athlete ID) instead of the proper UUID from the database. This has been fixed in the code, but you need to run a database migration.

## How to Fix

### Step 1: Run Database Migration

1. **Go to your Supabase Dashboard**
2. **Navigate to**: SQL Editor
3. **Choose ONE of the following options**:

#### Option A: Safe Migration (Recommended)
**Copy and paste this SQL** (handles existing policies gracefully):

```sql
-- Migration: Add activities table and update users table
-- Run this in your Supabase SQL Editor

-- First, add the last_sync column to users table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'last_sync') THEN
        ALTER TABLE users ADD COLUMN last_sync TIMESTAMPTZ;
    END IF;
END $$;

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

-- Create RLS policies for activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own activities
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'activities' 
        AND policyname = 'Users can read own activities'
    ) THEN
        CREATE POLICY "Users can read own activities" ON activities
          FOR SELECT USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- Policy: Users can insert their own activities
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'activities' 
        AND policyname = 'Users can insert own activities'
    ) THEN
        CREATE POLICY "Users can insert own activities" ON activities
          FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- Policy: Users can update their own activities
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'activities' 
        AND policyname = 'Users can update own activities'
    ) THEN
        CREATE POLICY "Users can update own activities" ON activities
          FOR UPDATE USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_start_date ON activities(start_date);
CREATE INDEX IF NOT EXISTS idx_activities_user_start_date ON activities(user_id, start_date);
CREATE INDEX IF NOT EXISTS idx_activities_strava_id ON activities(strava_activity_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for activities table
CREATE TRIGGER update_activities_updated_at 
    BEFORE UPDATE ON activities 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Also add the trigger to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at 
            BEFORE UPDATE ON users 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
```

#### Option B: Clean Reset (If Option A fails)
**Use this if you get policy errors** (drops existing policies first):

```sql
-- Clean reset: Drop existing policies and recreate everything
-- Use this if Option A fails with policy errors

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own activities" ON activities;
DROP POLICY IF EXISTS "Users can insert own activities" ON activities;
DROP POLICY IF EXISTS "Users can update own activities" ON activities;

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_activities_user_id;
DROP INDEX IF EXISTS idx_activities_start_date;
DROP INDEX IF EXISTS idx_activities_user_start_date;
DROP INDEX IF EXISTS idx_activities_strava_id;

-- Drop table if it exists (THIS WILL DELETE ALL ACTIVITY DATA!)
DROP TABLE IF EXISTS activities;

-- Add the last_sync column to users table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'last_sync') THEN
        ALTER TABLE users ADD COLUMN last_sync TIMESTAMPTZ;
    END IF;
END $$;

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

-- Enable RLS and create policies
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

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

-- Create update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_activities_updated_at 
    BEFORE UPDATE ON activities 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at 
            BEFORE UPDATE ON users 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
```

4. **Click "Run"** to execute the migration

### Step 2: Clear Browser Data

1. **Open your browser's developer tools**
2. **Go to Application/Storage tab**
3. **Clear localStorage** (or just delete the `strava_user` entry)
4. **Refresh the page**

### Step 3: Test the App

1. **Stop your dev server** (Ctrl+C)
2. **Restart**: `npm run dev`
3. **Login again** with Strava
4. **Check that activities load** without errors

## What's Fixed

✅ **UUID Type Mismatch**: App now properly uses database UUIDs instead of Strava athlete IDs  
✅ **Missing Activities Table**: Database now has the activities table with proper structure  
✅ **Infinite Loops**: Smart sync logic prevents rate limit spam  
✅ **Rate Limiting**: 15-minute cooldown when hitting Strava API limits  
✅ **Database Sync**: Activities are now properly stored and retrieved from database  

## Expected Result

After running the migration, you should see:
- ✅ No more UUID errors in console
- ✅ Activities load from database quickly
- ✅ Sync with Strava works properly
- ✅ No more infinite API calls

## Troubleshooting

If you still see errors:
1. **Check browser console** for any remaining errors
2. **Verify migration ran successfully** in Supabase
3. **Make sure to clear localStorage** and login again
4. **Contact support** if issues persist

---

**⚠️ Important**: The app will not work properly until this migration is completed! 