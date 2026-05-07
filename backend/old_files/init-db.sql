-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('viewer', 'feeder', 'player')),
  phone VARCHAR(20),
  batting_style VARCHAR(50),
  bowling_style VARCHAR(50),
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  team1_name VARCHAR(255) NOT NULL,
  team2_name VARCHAR(255) NOT NULL,
  venue VARCHAR(255),
  total_overs INTEGER DEFAULT 20,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
  toss_winner VARCHAR(255),
  toss_decision VARCHAR(20),
  winner VARCHAR(255),
  team1_score INTEGER DEFAULT 0,
  team1_wickets INTEGER DEFAULT 0,
  team1_overs REAL DEFAULT 0,
  team2_score INTEGER DEFAULT 0,
  team2_wickets INTEGER DEFAULT 0,
  team2_overs REAL DEFAULT 0,
  current_innings INTEGER DEFAULT 1,
  match_date TIMESTAMP NOT NULL,
  created_by INTEGER REFERENCES users(id),
  tournament_id INTEGER,
  match_type VARCHAR(20) DEFAULT 'T20',
  balls_per_over INTEGER DEFAULT 6,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Match players (join requests + team assignment)
CREATE TABLE IF NOT EXISTS match_players (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  team INTEGER CHECK (team IN (1, 2)),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(match_id, player_id)
);

-- Player scores per match
CREATE TABLE IF NOT EXISTS player_scores (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  team INTEGER CHECK (team IN (1, 2)),
  runs_scored INTEGER DEFAULT 0,
  balls_faced INTEGER DEFAULT 0,
  fours INTEGER DEFAULT 0,
  sixes INTEGER DEFAULT 0,
  is_out BOOLEAN DEFAULT FALSE,
  out_type VARCHAR(50),
  overs_bowled REAL DEFAULT 0,
  runs_conceded INTEGER DEFAULT 0,
  wickets_taken INTEGER DEFAULT 0,
  maidens INTEGER DEFAULT 0,
  catches INTEGER DEFAULT 0,
  run_outs INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(match_id, player_id)
);

-- Ball by ball log
CREATE TABLE IF NOT EXISTS balls (
  id SERIAL PRIMARY KEY,
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  innings INTEGER CHECK (innings IN (1, 2)),
  over_number INTEGER NOT NULL,
  ball_number INTEGER NOT NULL,
  batsman_id INTEGER REFERENCES users(id),
  bowler_id INTEGER REFERENCES users(id),
  runs INTEGER DEFAULT 0,
  is_wide BOOLEAN DEFAULT FALSE,
  is_noball BOOLEAN DEFAULT FALSE,
  is_bye BOOLEAN DEFAULT FALSE,
  is_legbye BOOLEAN DEFAULT FALSE,
  is_wicket BOOLEAN DEFAULT FALSE,
  wicket_type VARCHAR(50),
  extras INTEGER DEFAULT 0,
  commentary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== NEW TABLES ====================

-- Registered players (independent of user accounts)
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

-- Teams
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

-- Team players (link registered players to teams)
CREATE TABLE IF NOT EXISTS team_players (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES registered_players(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, player_id)
);

-- Tournaments
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

-- Tournament teams
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

-- Tournament fixtures
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

-- Add foreign key from matches to tournaments
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
