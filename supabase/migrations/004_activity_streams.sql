-- Migration: 004_activity_streams.sql
-- Adds table to store raw streams and time-in-zone aggregates

-- Create activity_streams table if it doesn't exist
CREATE TABLE IF NOT EXISTS activity_streams (
  activity_id UUID PRIMARY KEY REFERENCES activities(id) ON DELETE CASCADE,
  time_stream JSONB,
  watts_stream JSONB,
  heartrate_stream JSONB,
  distance_stream JSONB,
  altitude_stream JSONB,
  time_in_power_zones JSONB,
  time_in_hr_zones JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS but allow service role full access
ALTER TABLE activity_streams ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own activity streams
DROP POLICY IF EXISTS "Users can read own streams" ON activity_streams;
CREATE POLICY "Users can read own streams" ON activity_streams
  FOR SELECT USING (
    auth.uid()::text = (
      SELECT user_id FROM activities WHERE activities.id = activity_streams.activity_id
    )::text
  );

-- Trigger to update updated_at
CREATE TRIGGER update_activity_streams_updated_at
  BEFORE UPDATE ON activity_streams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 