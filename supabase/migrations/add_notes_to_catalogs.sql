ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS contacted_by text;