-- Create user_notes table
CREATE TABLE IF NOT EXISTS user_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON user_notes(user_id);

-- Enable RLS
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own notes" ON user_notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON user_notes;
DROP POLICY IF EXISTS "Service role can do everything" ON user_notes;

-- Policy to allow users to read their own notes
CREATE POLICY "Users can read own notes"
  ON user_notes FOR SELECT
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own notes
CREATE POLICY "Users can insert own notes"
  ON user_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow service role to do everything (for admin operations)
CREATE POLICY "Service role can do everything"
  ON user_notes FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
