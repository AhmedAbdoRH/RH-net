ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS contacted_by text;
ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS is_engaged boolean DEFAULT false;