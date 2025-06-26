-- Activities table creation
-- Migration: 002_activities_table.sql

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

-- Enable Row Level Security
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
CREATE INDEX IF NOT EXISTS idx_activities_strava_id ON activities(strava_activity_id);

-- Create trigger for activities table
CREATE TRIGGER update_activities_updated_at 
    BEFORE UPDATE ON activities 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 