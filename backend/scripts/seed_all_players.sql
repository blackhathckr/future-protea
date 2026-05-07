-- ============================================================
-- SEED MATCH DATA FOR ALL EXISTING PLAYERS (IDs 52-115)
-- Varun (116) already has data - skip him
-- Each player gets 15-40 matches with realistic batting/bowling
-- Uses existing completed matches where possible, else creates new ones
-- ============================================================

DO $$
DECLARE
  v_player_id  INT;
  v_match_id   INT;
  v_match_date TIMESTAMP;
  v_team1      VARCHAR(255);
  v_team2      VARCHAR(255);
  v_varun_team INT;
  v_runs       INT;
  v_balls      INT;
  v_fours      INT;
  v_sixes      INT;
  v_is_out     BOOLEAN;
  v_out_type   VARCHAR(50);
  v_overs_bowl FLOAT;
  v_runs_conc  INT;
  v_wkts       INT;
  v_maidens    INT;
  v_catches    INT;
  v_t1score    INT;
  v_t2score    INT;
  v_t1wkts     INT;
  v_t2wkts     INT;
  v_t1overs    FLOAT;
  v_t2overs    FLOAT;
  v_winner     VARCHAR(255);
  v_total_overs INT;
  v_match_type VARCHAR(20);
  v_num_matches INT;
  v_year       INT;
  v_month      INT;
  v_day        INT;
  v_seed       INT;
  v_seed_pct   INT;

  player_ids   INT[] := ARRAY[
    52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,
    76,77,78,79,80,81,82,83,84,85,86,87,90,91,92,93,94,95,96,97,98,99,
    100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115
  ];

  teams        VARCHAR[] := ARRAY['Warriors','Red Lions','Blue Sharks','Golden Eagles','Green Mambas','Dolphins','RCB'];
  out_types    VARCHAR[] := ARRAY['bowled','caught','lbw','run out','stumped','caught'];
  venues       VARCHAR[] := ARRAY[
    'Wanderers Stadium, Johannesburg','Newlands, Cape Town',
    'SuperSport Park, Centurion','Kingsmead, Durban',
    'St George''s Park, Port Elizabeth','Diamond Oval, Kimberley',
    'Boland Park, Paarl','Buffalo Park, East London'
  ];

  p_idx INT;
  m_idx INT;

BEGIN

  FOREACH v_player_id IN ARRAY player_ids LOOP

    -- Skip if player already has data
    IF EXISTS (SELECT 1 FROM player_scores WHERE player_id = v_player_id) THEN
      CONTINUE;
    END IF;

    -- Each player gets 20-45 matches depending on their id
    v_num_matches := 20 + (v_player_id % 26);

    FOR m_idx IN 1..v_num_matches LOOP

      -- Spread matches across 2018-2024
      v_year  := 2018 + ((v_player_id + m_idx) % 7);
      v_month := ((v_player_id + m_idx * 3) % 12) + 1;
      v_day   := ((v_player_id + m_idx * 7) % 27) + 1;
      v_match_date := make_timestamp(v_year, v_month, v_day,
                        10 + (m_idx % 8), 0, 0);

      -- Pick teams
      v_team1 := teams[((v_player_id + m_idx) % 7) + 1];
      v_team2 := teams[((v_player_id + m_idx + 3) % 7) + 1];
      IF v_team1 = v_team2 THEN
        v_team2 := teams[((v_player_id + m_idx + 4) % 7) + 1];
      END IF;

      v_varun_team  := CASE WHEN m_idx % 2 = 0 THEN 1 ELSE 2 END;
      v_match_type  := CASE WHEN (v_player_id + m_idx) % 5 = 0 THEN 'ODI' ELSE 'T20' END;
      v_total_overs := CASE WHEN v_match_type = 'ODI' THEN 50 ELSE 20 END;

      -- Batting stats - deterministic seed
      v_seed     := (v_player_id * 31 + m_idx * 17) % 100;
      v_seed_pct := v_seed;

      IF v_seed_pct < 8 THEN
        -- Duck
        v_runs := 0;
        v_balls := (m_idx % 3) + 1;
        v_fours := 0; v_sixes := 0;
        v_is_out := true;
        v_out_type := out_types[(m_idx % 6) + 1];
      ELSIF v_seed_pct < 28 THEN
        -- Low 1-25
        v_runs  := ((v_player_id + m_idx * 13) % 25) + 1;
        v_balls := v_runs + ((v_player_id + m_idx) % 10) + 4;
        v_fours := v_runs / 9; v_sixes := 0;
        v_is_out := true;
        v_out_type := out_types[(m_idx % 6) + 1];
      ELSIF v_seed_pct < 60 THEN
        -- Mid 26-49
        v_runs  := ((v_player_id + m_idx * 17) % 24) + 26;
        v_balls := v_runs + ((v_player_id + m_idx) % 14);
        v_fours := v_runs / 7;
        v_sixes := CASE WHEN m_idx % 5 = 0 THEN 1 ELSE 0 END;
        v_is_out := CASE WHEN m_idx % 6 != 0 THEN true ELSE false END;
        v_out_type := CASE WHEN v_is_out THEN out_types[(m_idx % 6) + 1] ELSE NULL END;
      ELSIF v_seed_pct < 82 THEN
        -- Fifty 50-99
        v_runs  := ((v_player_id + m_idx * 19) % 50) + 50;
        v_balls := v_runs + 4 - (m_idx % 8);
        IF v_balls < v_runs THEN v_balls := v_runs + 2; END IF;
        v_fours := v_runs / 6;
        v_sixes := (m_idx % 4);
        v_is_out := CASE WHEN m_idx % 5 != 0 THEN true ELSE false END;
        v_out_type := CASE WHEN v_is_out THEN out_types[(m_idx % 6) + 1] ELSE NULL END;
      ELSIF v_seed_pct < 95 THEN
        -- Century 100-149
        v_runs  := ((v_player_id + m_idx * 23) % 50) + 100;
        v_balls := v_runs + 8 - (m_idx % 12);
        IF v_balls < v_runs THEN v_balls := v_runs + 5; END IF;
        v_fours := v_runs / 5;
        v_sixes := (m_idx % 5) + 1;
        v_is_out := true;
        v_out_type := out_types[(m_idx % 6) + 1];
      ELSE
        -- Big 150-180
        v_runs  := ((v_player_id + m_idx * 29) % 31) + 150;
        v_balls := v_runs + 5;
        v_fours := v_runs / 5;
        v_sixes := (m_idx % 6) + 2;
        v_is_out := true;
        v_out_type := out_types[(m_idx % 6) + 1];
      END IF;

      -- Bowling stats (bowls in ~65% of matches)
      IF (v_player_id + m_idx) % 10 < 7 THEN
        v_overs_bowl := CASE WHEN v_match_type = 'ODI'
                          THEN (((v_player_id + m_idx) % 8) + 2)::FLOAT
                          ELSE (((v_player_id + m_idx) % 4) + 1)::FLOAT END;
        v_wkts := CASE
          WHEN (v_player_id + m_idx) % 11 = 0 THEN 4
          WHEN (v_player_id + m_idx) % 7  = 0 THEN 3
          WHEN (v_player_id + m_idx) % 5  = 0 THEN 2
          WHEN (v_player_id + m_idx) % 3  = 0 THEN 1
          ELSE 0
        END;
        v_runs_conc := (v_overs_bowl * 7 + (m_idx % 5))::INT;
        v_maidens   := CASE WHEN v_wkts >= 2 AND m_idx % 4 = 0 THEN 1 ELSE 0 END;
      ELSE
        v_overs_bowl := 0; v_wkts := 0; v_runs_conc := 0; v_maidens := 0;
      END IF;

      v_catches := CASE
        WHEN (v_player_id + m_idx) % 8 = 0 THEN 2
        WHEN (v_player_id + m_idx) % 5 = 0 THEN 1
        ELSE 0
      END;

      -- Match scores
      v_t1score := ((v_player_id + m_idx * 11) % 100) + 110;
      v_t1wkts  := (m_idx % 9) + 1;
      v_t1overs := v_total_overs::FLOAT;
      v_t2score := ((v_player_id + m_idx * 13 + 7) % 110) + 95;
      v_t2wkts  := ((m_idx + 3) % 9) + 1;
      v_t2overs := v_total_overs::FLOAT;
      v_winner  := CASE WHEN v_t1score > v_t2score THEN v_team1 ELSE v_team2 END;

      -- Insert match
      INSERT INTO matches (
        team1_name, team2_name, venue, total_overs, status,
        toss_winner, toss_decision, winner,
        team1_score, team1_wickets, team1_overs,
        team2_score, team2_wickets, team2_overs,
        current_innings, match_date, created_by,
        match_type, balls_per_over, created_at
      ) VALUES (
        v_team1, v_team2,
        venues[((v_player_id + m_idx) % 8) + 1],
        v_total_overs, 'completed',
        CASE WHEN m_idx % 2 = 0 THEN v_team1 ELSE v_team2 END,
        CASE WHEN m_idx % 3 = 0 THEN 'bat' ELSE 'field' END,
        v_winner,
        v_t1score, v_t1wkts, v_t1overs,
        v_t2score, v_t2wkts, v_t2overs,
        2, v_match_date, v_player_id,
        v_match_type, 6, v_match_date
      ) RETURNING id INTO v_match_id;

      -- Insert player score
      INSERT INTO player_scores (
        match_id, player_id, team,
        runs_scored, balls_faced, fours, sixes,
        is_out, out_type,
        overs_bowled, runs_conceded, wickets_taken, maidens, catches,
        created_at
      ) VALUES (
        v_match_id, v_player_id, v_varun_team,
        v_runs, v_balls, v_fours, v_sixes,
        v_is_out, v_out_type,
        v_overs_bowl, v_runs_conc, v_wkts, v_maidens, v_catches,
        v_match_date
      );

    END LOOP; -- matches
  END LOOP; -- players

  RAISE NOTICE 'Done seeding all players';
END $$;

-- Summary per player
SELECT
  u.id,
  u.name,
  COUNT(ps.id)           AS matches,
  SUM(ps.runs_scored)    AS runs,
  MAX(ps.runs_scored)    AS hs,
  SUM(ps.wickets_taken)  AS wickets,
  SUM(CASE WHEN ps.runs_scored >= 50 AND ps.runs_scored < 100 THEN 1 ELSE 0 END) AS fifties,
  SUM(CASE WHEN ps.runs_scored >= 100 THEN 1 ELSE 0 END) AS hundreds
FROM users u
JOIN player_scores ps ON ps.player_id = u.id
WHERE u.role = 'player'
GROUP BY u.id, u.name
ORDER BY runs DESC
LIMIT 20;
