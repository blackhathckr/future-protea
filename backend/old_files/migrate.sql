-- Run this to add new columns/tables to an existing database
-- Safe to run multiple times (uses IF NOT EXISTS / IF NOT EXISTS checks)

-- Add new columns to matches table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='tournament_id') THEN
    ALTER TABLE matches ADD COLUMN tournament_id INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='match_type') THEN
    ALTER TABLE matches ADD COLUMN match_type VARCHAR(20) DEFAULT 'T20';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='matches' AND column_name='balls_per_over') THEN
    ALTER TABLE matches ADD COLUMN balls_per_over INTEGER DEFAULT 6;
  END IF;
END $$;

-- Create new tables
CREATE TABLE IF NOT EXISTS registered_players (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  player_id_code VARCHAR(50) UNIQUE,
  date_of_birth DATE,
  school_name VARCHAR(255),
  club_name VARCHAR(255),
  photo_url VARCHAR(500),
  batting_style VARCHAR(50),
  bowling_style VARCHAR(50),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  team_name VARCHAR(255) NOT NULL,
  team_type VARCHAR(20) NOT NULL CHECK (team_type IN ('school', 'club')),
  school_name VARCHAR(255),
  club_name VARCHAR(255),
  logo_url VARCHAR(500),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_players (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES registered_players(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, player_id)
);

CREATE TABLE IF NOT EXISTS tournaments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) DEFAULT 'T20',
  overs INTEGER DEFAULT 20,
  start_date DATE,
  end_date DATE,
  venue VARCHAR(255),
  organizer VARCHAR(255),
  logo_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tournament_teams (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  group_name VARCHAR(50),
  played INTEGER DEFAULT 0,
  won INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  no_result INTEGER DEFAULT 0,
  points REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tournament_id, team_id)
);

CREATE TABLE IF NOT EXISTS tournament_fixtures (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
  match_id INTEGER REFERENCES matches(id) ON DELETE SET NULL,
  team1_name VARCHAR(255) NOT NULL,
  team2_name VARCHAR(255) NOT NULL,
  match_date TIMESTAMP NOT NULL,
  venue VARCHAR(255),
  status VARCHAR(20) DEFAULT 'upcoming',
  group_name VARCHAR(50),
  winner VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key from matches to tournaments (safe check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'matches_tournament_id_fkey'
  ) THEN
    ALTER TABLE matches ADD CONSTRAINT matches_tournament_id_fkey
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL;
  END IF;
END $$;
