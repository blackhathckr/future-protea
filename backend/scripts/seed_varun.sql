-- ============================================================
-- SEED 10 YEARS OF CRICKET DATA FOR VARUN (user_id = 116)
-- Covers 2015-2024, ~120 matches, realistic batting & bowling
-- ============================================================

-- Approve varun's account first
UPDATE users SET approved = true WHERE id = 116;

-- ============================================================
-- HELPER: We create 120 completed matches and player_scores
-- Teams rotate from the existing 7 teams (ids 14-20)
-- Varun plays for team1 or team2 alternately
-- ============================================================

DO $$
DECLARE
  v_match_id   INT;
  v_score_id   INT;
  v_year       INT;
  v_month      INT;
  v_day        INT;
  v_match_date TIMESTAMP;
  v_team1      VARCHAR(255);
  v_team2      VARCHAR(255);
  v_varun_team INT;   -- 1 or 2
  v_opp_team   VARCHAR(255);
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

  -- team name arrays
  teams        VARCHAR[] := ARRAY['Warriors','Red Lions','Blue Sharks','Golden Eagles','Green Mambas','Dolphins','RCB'];
  out_types    VARCHAR[] := ARRAY['bowled','caught','lbw','run out','stumped','caught'];
  match_types  VARCHAR[] := ARRAY['T20','T20','T20','ODI','T20','T20','ODI','T20'];

  i INT := 0;
  seed_rand FLOAT;

BEGIN
  -- We'll generate 120 matches spread over 2015-2024
  FOR v_year IN 2015..2024 LOOP
    FOR i IN 1..12 LOOP
      -- month spread across year
      v_month := ((i - 1) % 12) + 1;
      v_day   := (i * 2 + 3) % 27 + 1;

      v_match_date := make_timestamp(v_year, v_month, v_day, 10 + (i % 8), 30, 0);

      -- pick teams
      v_team1 := teams[((v_year - 2015) * 12 + i) % 7 + 1];
      v_team2 := teams[((v_year - 2015) * 12 + i + 3) % 7 + 1];
      IF v_team1 = v_team2 THEN
        v_team2 := teams[((v_year - 2015) * 12 + i + 4) % 7 + 1];
      END IF;

      -- varun plays for team1 or team2
      v_varun_team := CASE WHEN i % 2 = 0 THEN 1 ELSE 2 END;
      v_opp_team   := CASE WHEN v_varun_team = 1 THEN v_team2 ELSE v_team1 END;

      -- match type & overs
      v_match_type  := match_types[i % 8 + 1];
      v_total_overs := CASE WHEN v_match_type = 'ODI' THEN 50 ELSE 20 END;

      -- ---- Generate Varun's batting performance ----
      -- Realistic distribution: duck(10%), low(25%), mid(40%), 50+(20%), 100+(5%)
      seed_rand := (((v_year - 2015) * 144 + i * 12 + 7) % 100)::FLOAT / 100.0;

      IF seed_rand < 0.10 THEN
        -- Duck
        v_runs := 0; v_balls := CASE WHEN (i % 3 = 0) THEN 0 ELSE (i % 5) + 1 END;
        v_fours := 0; v_sixes := 0; v_is_out := true;
        v_out_type := out_types[(i % 6) + 1];
      ELSIF seed_rand < 0.25 THEN
        -- Low score 1-20
        v_runs := (((v_year + i) * 13) % 20) + 1;
        v_balls := v_runs + (i % 8) + 3;
        v_fours := v_runs / 8; v_sixes := 0; v_is_out := true;
        v_out_type := out_types[(i % 6) + 1];
      ELSIF seed_rand < 0.65 THEN
        -- Mid score 21-49
        v_runs := (((v_year + i) * 17) % 29) + 21;
        v_balls := v_runs + (i % 12) + 5;
        v_fours := v_runs / 7; v_sixes := CASE WHEN i % 4 = 0 THEN 1 ELSE 0 END;
        v_is_out := CASE WHEN i % 5 != 0 THEN true ELSE false END;
        v_out_type := CASE WHEN v_is_out THEN out_types[(i % 6) + 1] ELSE NULL END;
      ELSIF seed_rand < 0.87 THEN
        -- Fifty 50-99
        v_runs := (((v_year + i) * 19) % 50) + 50;
        v_balls := v_runs - (i % 10) + 5;
        IF v_balls < v_runs THEN v_balls := v_runs + 3; END IF;
        v_fours := v_runs / 6; v_sixes := (i % 4);
        v_is_out := CASE WHEN i % 4 != 0 THEN true ELSE false END;
        v_out_type := CASE WHEN v_is_out THEN out_types[(i % 6) + 1] ELSE NULL END;
      ELSIF seed_rand < 0.97 THEN
        -- Century 100-150
        v_runs := (((v_year + i) * 23) % 51) + 100;
        v_balls := v_runs - (i % 15) + 10;
        IF v_balls < v_runs THEN v_balls := v_runs + 5; END IF;
        v_fours := v_runs / 5; v_sixes := (i % 5) + 2;
        v_is_out := CASE WHEN i % 3 != 0 THEN true ELSE false END;
        v_out_type := CASE WHEN v_is_out THEN out_types[(i % 6) + 1] ELSE NULL END;
      ELSE
        -- Big score 150+
        v_runs := (((v_year + i) * 29) % 50) + 150;
        v_balls := v_runs - 10 + (i % 20);
        IF v_balls < v_runs THEN v_balls := v_runs + 8; END IF;
        v_fours := v_runs / 5; v_sixes := (i % 6) + 3;
        v_is_out := true;
        v_out_type := out_types[(i % 6) + 1];
      END IF;

      -- ---- Generate Varun's bowling (he bowls in ~60% of matches) ----
      IF i % 5 != 0 THEN
        v_overs_bowl := CASE WHEN v_match_type = 'ODI' THEN (i % 8) + 2 ELSE (i % 4) + 1 END;
        v_wkts       := CASE
          WHEN i % 7 = 0 THEN 3
          WHEN i % 5 = 0 THEN 2
          WHEN i % 3 = 0 THEN 1
          ELSE 0
        END;
        v_runs_conc  := (v_overs_bowl * 6 + (i % 4)) ::INT;
        v_maidens    := CASE WHEN v_wkts > 1 AND i % 3 = 0 THEN 1 ELSE 0 END;
      ELSE
        v_overs_bowl := 0; v_wkts := 0; v_runs_conc := 0; v_maidens := 0;
      END IF;

      -- catches
      v_catches := CASE WHEN i % 6 = 0 THEN 2 WHEN i % 4 = 0 THEN 1 ELSE 0 END;

      -- ---- Build match scores ----
      v_t1score := (((v_year + i) * 11) % 100) + 110;
      v_t1wkts  := (i % 9) + 1;
      v_t1overs := v_total_overs::FLOAT - ((i % 5)::FLOAT * 0.3);

      v_t2score := (((v_year + i) * 13 + 7) % 120) + 90;
      v_t2wkts  := ((i + 3) % 9) + 1;
      v_t2overs := v_total_overs::FLOAT - ((( i + 2) % 5)::FLOAT * 0.3);

      v_winner := CASE WHEN v_t1score > v_t2score THEN v_team1 ELSE v_team2 END;

      -- ---- Insert match ----
      INSERT INTO matches (
        team1_name, team2_name, venue, total_overs, status,
        toss_winner, toss_decision, winner,
        team1_score, team1_wickets, team1_overs,
        team2_score, team2_wickets, team2_overs,
        current_innings, match_date, created_by, match_type, balls_per_over, created_at
      ) VALUES (
        v_team1, v_team2,
        CASE (i % 6)
          WHEN 0 THEN 'Wanderers Stadium, Johannesburg'
          WHEN 1 THEN 'Newlands, Cape Town'
          WHEN 2 THEN 'SuperSport Park, Centurion'
          WHEN 3 THEN 'Kingsmead, Durban'
          WHEN 4 THEN 'St George''s Park, Port Elizabeth'
          ELSE 'Diamond Oval, Kimberley'
        END,
        v_total_overs, 'completed',
        CASE WHEN i % 2 = 0 THEN v_team1 ELSE v_team2 END,
        CASE WHEN i % 3 = 0 THEN 'bat' ELSE 'field' END,
        v_winner,
        v_t1score, v_t1wkts, v_t1overs,
        v_t2score, v_t2wkts, v_t2overs,
        2, v_match_date, 116, v_match_type, 6, v_match_date
      ) RETURNING id INTO v_match_id;

      -- ---- Insert Varun's player_score ----
      INSERT INTO player_scores (
        match_id, player_id, team,
        runs_scored, balls_faced, fours, sixes,
        is_out, out_type,
        overs_bowled, runs_conceded, wickets_taken, maidens, catches,
        created_at
      ) VALUES (
        v_match_id, 116, v_varun_team,
        v_runs, v_balls, v_fours, v_sixes,
        v_is_out, v_out_type,
        v_overs_bowl, v_runs_conc, v_wkts, v_maidens, v_catches,
        v_match_date
      );

    END LOOP;
  END LOOP;

  RAISE NOTICE 'Seeded 120 matches for Varun (user_id=116)';
END $$;

-- Verify
SELECT
  COUNT(*) AS total_matches,
  SUM(runs_scored) AS total_runs,
  MAX(runs_scored) AS highest_score,
  ROUND(AVG(runs_scored)::NUMERIC, 2) AS avg_runs,
  SUM(wickets_taken) AS total_wickets,
  SUM(CASE WHEN runs_scored >= 50 AND runs_scored < 100 THEN 1 ELSE 0 END) AS fifties,
  SUM(CASE WHEN runs_scored >= 100 THEN 1 ELSE 0 END) AS hundreds
FROM player_scores
WHERE player_id = 116;
