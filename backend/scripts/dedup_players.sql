-- ============================================================
-- DEDUP: Merge duplicate player accounts
-- For each duplicate pair, keep the lower ID (original),
-- reassign all player_scores from the dupe to the original,
-- then delete the dupe and its scores.
-- ============================================================

BEGIN;

-- Step 1: For each duplicate, reassign player_scores from dupe -> original
-- But only if the original doesn't already have a score for that match
-- (unique constraint on match_id + player_id)

-- Duplicate pairs: original -> dupe
-- 52->90, 53->91, 54->92, 55->93, 56->94, 57->95, 76->96, 77->97,
-- 78->98, 79->99, 80->100, 81->101, 82->102, 83->103, 86->104, 87->105,
-- 84->106, 85->107, 64->108, 66->109, 67->110, 69->111, 68->114,
-- 65->113

DO $$
DECLARE
  pair RECORD;
  pairs_data INT[][] := ARRAY[
    ARRAY[52,90], ARRAY[53,91], ARRAY[54,92], ARRAY[55,93],
    ARRAY[56,94], ARRAY[57,95], ARRAY[76,96], ARRAY[77,97],
    ARRAY[78,98], ARRAY[79,99], ARRAY[80,100], ARRAY[81,101],
    ARRAY[82,102], ARRAY[83,103], ARRAY[86,104], ARRAY[87,105],
    ARRAY[84,106], ARRAY[85,107], ARRAY[64,108], ARRAY[66,109],
    ARRAY[67,110], ARRAY[69,111], ARRAY[68,114], ARRAY[65,113]
  ];
  orig_id INT;
  dupe_id INT;
  i INT;
BEGIN
  FOR i IN 1..array_length(pairs_data, 1) LOOP
    orig_id := pairs_data[i][1];
    dupe_id := pairs_data[i][2];

    -- Delete dupe's scores that conflict with orig's existing scores
    DELETE FROM player_scores ps
    WHERE ps.player_id = dupe_id
      AND EXISTS (
        SELECT 1 FROM player_scores ps2
        WHERE ps2.player_id = orig_id AND ps2.match_id = ps.match_id
      );

    -- Reassign remaining dupe scores to orig
    UPDATE player_scores
    SET player_id = orig_id
    WHERE player_id = dupe_id;

    -- Also reassign match_players
    DELETE FROM match_players mp
    WHERE mp.player_id = dupe_id
      AND EXISTS (
        SELECT 1 FROM match_players mp2
        WHERE mp2.player_id = orig_id AND mp2.match_id = mp.match_id
      );
    UPDATE match_players SET player_id = orig_id WHERE player_id = dupe_id;

    -- Also reassign balls (bowler/batsman)
    UPDATE balls SET batsman_id = orig_id WHERE batsman_id = dupe_id;
    UPDATE balls SET bowler_id  = orig_id WHERE bowler_id  = dupe_id;

    -- Delete dupe user
    DELETE FROM users WHERE id = dupe_id;

    RAISE NOTICE 'Merged % -> %, deleted dupe %', dupe_id, orig_id, dupe_id;
  END LOOP;
END $$;

COMMIT;

-- Verify: no more duplicates
SELECT name, COUNT(*) as cnt
FROM users
WHERE role = 'player'
GROUP BY name
HAVING COUNT(*) > 1;

-- Final clean player list
SELECT id, name, email
FROM users
WHERE role = 'player'
ORDER BY name;
