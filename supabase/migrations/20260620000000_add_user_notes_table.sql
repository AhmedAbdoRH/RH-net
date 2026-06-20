CREATE TABLE IF NOT EXISTS user_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable real-time for the user_notes table
alter publication supabase_realtime add table user_notes;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_created_at ON user_notes(created_at);

-- Migrate existing notes from catalogs table to user_notes table
INSERT INTO user_notes (user_id, note, created_at, updated_at)
SELECT 
  user_id, 
  notes, 
  COALESCE(updated_at, created_at, NOW()),
  COALESCE(updated_at, created_at, NOW())
FROM catalogs 
WHERE notes IS NOT NULL AND notes != '';

-- Add a comment to indicate this is a migration
COMMENT ON TABLE user_notes IS 'Table to store multiple notes per user. Migrated from catalogs.notes';