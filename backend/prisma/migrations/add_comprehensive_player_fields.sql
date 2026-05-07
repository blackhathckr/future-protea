-- Add comprehensive player fields to registered_players table

-- Contact Information
ALTER TABLE registered_players ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE registered_players ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE registered_players ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(20);
ALTER TABLE registered_players ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255);

-- Address
ALTER TABLE registered_players ADD COLUMN IF NOT EXISTS address VARCHAR(500);
ALTER TABLE registered_players ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE registered_players ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE registered_players ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE registered_players ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

-- Physical Stats
ALTER TABLE registered_players ADD COLUMN IF NOT EXISTS height DOUBLE PRECISION;
ALTER TABLE registered_players ADD COLUMN IF NOT EXISTS weight DOUBLE PRECISION;
ALTER TABLE registered_players ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10);

-- Cricket Details
ALTER TABLE registered_players ADD COLUMN IF NOT EXISTS playing_role VARCHAR(50);
ALTER TABLE registered_players ADD COLUMN IF NOT EXISTS jersey_number INTEGER;

-- Additional Info
ALTER TABLE registered_players ADD COLUMN IF NOT EXISTS father_name VARCHAR(255);
ALTER TABLE registered_players ADD COLUMN IF NOT EXISTS mother_name VARCHAR(255);
ALTER TABLE registered_players ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(255);
ALTER TABLE registered_players ADD COLUMN IF NOT EXISTS nationality VARCHAR(100);

-- Add comments for documentation
COMMENT ON COLUMN registered_players.height IS 'Height in centimeters';
COMMENT ON COLUMN registered_players.weight IS 'Weight in kilograms';
COMMENT ON COLUMN registered_players.playing_role IS 'Batsman, Bowler, All-rounder, or Wicket-keeper';
