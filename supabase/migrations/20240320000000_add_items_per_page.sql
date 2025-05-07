-- Add items_per_page column to profiles table
ALTER TABLE profiles ADD COLUMN items_per_page INTEGER DEFAULT 4;

-- Update existing profiles to use the default value
UPDATE profiles SET items_per_page = 4 WHERE items_per_page IS NULL; 