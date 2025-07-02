-- Create coach_feedback table for caching AI-generated feedback
CREATE TABLE IF NOT EXISTS coach_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  feedback_text TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('gemini', 'fallback', 'error')),
  training_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_coach_feedback_user_id ON coach_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_feedback_created_at ON coach_feedback(created_at);

-- Enable RLS
ALTER TABLE coach_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own feedback
CREATE POLICY "Users can read own feedback" ON coach_feedback
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert own feedback" ON coach_feedback
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Policy: Users can update their own feedback
CREATE POLICY "Users can update own feedback" ON coach_feedback
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Policy: Users can delete their own feedback
CREATE POLICY "Users can delete own feedback" ON coach_feedback
  FOR DELETE USING (auth.uid()::text = user_id::text); 