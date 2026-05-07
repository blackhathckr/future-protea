-- ============================================================
-- TOP-UP SEED: Give every player at least 25 matches
-- Only adds MORE matches for players with < 25 existing
-- ============================================================

DO $$
DECLARE
  v_player_id   INT;
  v_match_id    INT;
  v_match_date  TIMESTAMP;
  v_team1       VARCHAR(255);
  v_team2       VARCHAR(255);
  v_player_team INT;
  v_runs        INT;
  v_balls       INT;
  v_fours       INT;
  v_sixes       INT;
  v_is_out      BOOLEAN;
  v_out_type    VARCHAR(50);
  v_overs_bowl  FLOAT;
  v_runs_conc   INT;
  v_wkts        INT;
  v_maidens     INT;
  v_catches     INT;
  v_t1score     INT;
  v_t2score     INT;
  v_winner      VARCHAR(255);
  v_total_overs INT;
  v_match_type  VARCHAR(20);
  v_have        INT;
  v_need        INT;
  v_year        INT;
  v_month       INT;
  v_day         INT;
  v_seed_pct    INT;
  m_idx         INT;

  player_ids  INT[] := ARRAY[
    52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,
    76,77,78,79,80,81,82,83,84,85,86,87,90,91,92,93,94,95,96,97,98,99,
    100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115
  ];

  teams       VARCHAR[] := ARRAY['Warriors','Red Lions','Blue Sharks','Golden Eagles','Green Mambas','Dolphins','RCB'];
  out_types   VARCHAR[] := ARRAY['bowled','caught','lbw','run out','stumped','caught'];
  venues      VARCHAR[] := ARRAY[
    'Wanderers Stadium, Johannesburg','Newlands, Cape Town',
    'SuperSport Park, Centurion','Kingsmead, Durban',
    'St George''s Park, Port Elizabeth','Diamond Oval, Kimberley',
    'Boland Park, Paarl','Buffalo Park, East London'
  ];

  TARGET_MATCHES CONSTANT INT := 25;

BEGIN
  FOREACH v_player_id IN ARRAY player_ids LOOP

    SELECT COUNT(*) INTO v_have
    FROM player_scores WHERE player_id = v_player_id;

    v_need := TARGET_MATCHES - v_have;
    IF v_need <= 0 THEN CONTINUE; END IF;

    FOR m_idx IN 1..v_need LOOP

      v_year  := 2015 + ((v_player_id * 7 + m_idx * 3) % 10);
      v_month := ((v_player_id * 3 + m_idx * 5) % 12) + 1;
      v_day   := ((v_player_id * 5 + m_idx * 11) % 27) + 1;
      v_match_date := make_timestamp(v_year, v_month, v_day,
                        10 + (m_idx % 8), 30, 0);

      v_team1 := teams[((v_player_id * 2 + m_idx) % 7) + 1];
      v_team2 := teams[((v_player_id * 2 + m_idx + 3) % 7) + 1];
      IF v_team1 = v_team2 THEN
        v_team2 := teams[((v_player_id * 2 + m_idx + 5) % 7) + 1];
      END IF;

      v_player_team := CASE WHEN (v_player_id + m_idx) % 2 = 0 THEN 1 ELSE 2 END;
      v_match_type  := CASE WHEN (v_player_id + m_idx) % 6 = 0 THEN 'ODI' ELSE 'T20' END;
      v_total_overs := CASE WHEN v_match_type = 'ODI' THEN 50 ELSE 20 END;

      -- Batting: deterministic realistic distribution
      v_seed_pct := (v_player_id * 13 + m_idx * 37 + 500) % 100;

      IF v_seed_pct < 8 THEN
        v_runs := 0; v_balls := (m_idx % 4) + 1;
        v_fours := 0; v_sixes := 0;
        v_is_out := true; v_out_type := out_types[(m_idx % 6) + 1];
      ELSIF v_seed_pct < 28 THEN
        v_runs  := ((v_player_id * 7 + m_idx * 11) % 24) + 1;
        v_balls := v_runs + ((v_player_id + m_idx) % 12) + 4;
        v_fours := v_runs / 9; v_sixes := 0;
        v_is_out := true; v_out_type := out_types[(m_idx % 6) + 1];
      ELSIF v_seed_pct < 58 THEN
        v_runs  := ((v_player_id * 11 + m_idx * 13) % 23) + 26;
        v_balls := v_runs + ((v_player_id + m_idx) % 15);
        v_fours := v_runs / 7;
        v_sixes := CASE WHEN (v_player_id + m_idx) % 5 = 0 THEN 1 ELSE 0 END;
        v_is_out := CASE WHEN m_idx % 7 != 0 THEN true ELSE false END;
        v_out_type := CASE WHEN v_is_out THEN out_types[(m_idx % 6) + 1] ELSE NULL END;
      ELSIF v_seed_pct < 80 THEN
        v_runs  := ((v_player_id * 17 + m_idx * 19) % 49) + 50;
        v_balls := v_runs + 3 - (m_idx % 9);
        IF v_balls < v_runs THEN v_balls := v_runs + 3; END IF;
        v_fours := v_runs / 6;
        v_sixes := (v_player_id + m_idx) % 4;
        v_is_out := CASE WHEN m_idx % 6 != 0 THEN true ELSE false END;
        v_out_type := CASE WHEN v_is_out THEN out_types[(m_idx % 6) + 1] ELSE NULL END;
      ELSIF v_seed_pct < 94 THEN
        v_runs  := ((v_player_id * 19 + m_idx * 23) % 50) + 100;
        v_balls := v_runs + 5 - (m_idx % 13);
        IF v_balls < v_runs THEN v_balls := v_runs + 5; END IF;
        v_fours := v_runs / 5;
        v_sixes := (v_player_id + m_idx) % 5 + 1;
        v_is_out := true; v_out_type := out_types[(m_idx % 6) + 1];
      ELSE
        v_runs  := ((v_player_id * 23 + m_idx * 29) % 40) + 150;
        v_balls := v_runs + 7;
        v_fours := v_runs / 5;
        v_sixes := (v_player_id + m_idx) % 6 + 2;
        v_is_out := true; v_out_type := out_types[(m_idx % 6) + 1];
      END IF;

      -- Bowling
      IF (v_player_id + m_idx) % 10 < 7 THEN
        v_overs_bowl := CASE WHEN v_match_type = 'ODI'
          THEN (((v_player_id + m_idx) % 8) + 2)::FLOAT
          ELSE (((v_player_id + m_idx) % 4) + 1)::FLOAT END;
        v_wkts := CASE
          WHEN (v_player_id + m_idx) % 13 = 0 THEN 4
          WHEN (v_player_id + m_idx) % 9  = 0 THEN 3
          WHEN (v_player_id + m_idx) % 6  = 0 THEN 2
          WHEN (v_player_id + m_idx) % 3  = 0 THEN 1
          ELSE 0 END;
        v_runs_conc := (v_overs_bowl * 7 + (m_idx % 6))::INT;
        v_maidens   := CASE WHEN v_wkts >= 2 AND m_idx % 5 = 0 THEN 1 ELSE 0 END;
      ELSE
        v_overs_bowl := 0; v_wkts := 0; v_runs_conc := 0; v_maidens := 0;
      END IF;

      v_catches := CASE
        WHEN (v_player_id + m_idx) % 9 = 0 THEN 2
        WHEN (v_player_id + m_idx) % 5 = 0 THEN 1
        ELSE 0 END;

      -- Match totals
      v_t1score := ((v_player_id * 7 + m_idx * 11) % 90) + 120;
      v_t2score := ((v_player_id * 11 + m_idx * 13 + 9) % 100) + 100;
      v_winner  := CASE WHEN v_t1score > v_t2score THEN v_team1 ELSE v_team2 END;

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
        v_t1score, ((v_player_id + m_idx) % 9) + 1, v_total_overs::FLOAT,
        v_t2score, ((v_player_id + m_idx + 3) % 9) + 1, v_total_overs::FLOAT,
        2, v_match_date, v_player_id,
        v_match_type, 6, v_match_date
      ) RETURNING id INTO v_match_id;

      INSERT INTO player_scores (
        match_id, player_id, team,
        runs_scored, balls_faced, fours, sixes,
        is_out, out_type,
        overs_bowled, runs_conceded, wickets_taken, maidens, catches,
        created_at
      ) VALUES (
        v_match_id, v_player_id, v_player_team,
        v_runs, v_balls, v_fours, v_sixes,
        v_is_out, v_out_type,
        v_overs_bowl, v_runs_conc, v_wkts, v_maidens, v_catches,
        v_match_date
      );

    END LOOP;
  END LOOP;

  RAISE NOTICE 'Top-up seeding complete';
END $$;

-- Final summary
SELECT
  u.id, u.name,
  COUNT(ps.id)                                                          AS matches,
  SUM(ps.runs_scored)                                                   AS runs,
  MAX(ps.runs_scored)                                                   AS hs,
  ROUND((SUM(ps.runs_scored)::NUMERIC /
    NULLIF(SUM(CASE WHEN ps.is_out THEN 1 ELSE 0 END),0)), 2)          AS avg,
  SUM(ps.wickets_taken)                                                 AS wickets,
  SUM(CASE WHEN ps.runs_scored >= 50 AND ps.runs_scored < 100 THEN 1 ELSE 0 END) AS fifties,
  SUM(CASE WHEN ps.runs_scored >= 100 THEN 1 ELSE 0 END)               AS hundreds
FROM users u
JOIN player_scores ps ON ps.player_id = u.id
WHERE u.role = 'player'
GROUP BY u.id, u.name
ORDER BY runs DESC;
