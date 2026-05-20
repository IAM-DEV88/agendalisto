-- Add items_per_page column to agendaya_profiles table
ALTER TABLE agendaya_profiles ADD COLUMN items_per_page INTEGER DEFAULT 4;

-- Update existing agendaya_profiles to use the default value
UPDATE agendaya_profiles SET items_per_page = 4 WHERE items_per_page IS NULL; 