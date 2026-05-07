require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
});

async function seedBalls() {
  console.log('=== Seeding ball-by-ball data for completed matches ===\n');

  // Get completed matches
  const matches = await pool.query(`SELECT * FROM matches WHERE status IN ('completed', 'live') ORDER BY id`);
  console.log(`Found ${matches.rows.length} matches to seed balls for\n`);

  for (const match of matches.rows) {
    // Check if balls already exist
    const existing = await pool.query('SELECT COUNT(*) FROM balls WHERE match_id = $1', [match.id]);
    if (parseInt(existing.rows[0].count) > 0) {
      console.log(`Match ${match.id} already has balls, skipping`);
      continue;
    }

    // Get player scores for this match
    const scores = await pool.query(
      `SELECT ps.*, u.id as user_id, u.name FROM player_scores ps JOIN users u ON ps.player_id = u.id WHERE ps.match_id = $1 ORDER BY ps.team, ps.runs_scored DESC`,
      [match.id]
    );

    const team1Batters = scores.rows.filter(s => s.team === 1 && s.balls_faced > 0);
    const team2Batters = scores.rows.filter(s => s.team === 2 && s.balls_faced > 0);
    const team1Bowlers = scores.rows.filter(s => s.team === 1 && s.overs_bowled > 0);
    const team2Bowlers = scores.rows.filter(s => s.team === 2 && s.overs_bowled > 0);

    // Generate balls for innings 1 (team1 batting, team2 bowling)
    if (team1Batters.length > 0 && team2Bowlers.length > 0) {
      const balls1 = generateBalls(match.id, 1, team1Batters, team2Bowlers, match.team1_score, match.team1_wickets, match.team1_overs);
      for (const b of balls1) {
        await pool.query(
          `INSERT INTO balls (match_id, innings, over_number, ball_number, batsman_id, bowler_id, runs, is_wide, is_noball, is_bye, is_legbye, is_wicket, wicket_type, extras, commentary)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
          [b.matchId, b.innings, b.over, b.ball, b.batsmanId, b.bowlerId, b.runs, b.isWide, b.isNoBall, false, false, b.isWicket, b.wicketType, b.extras, b.commentary]
        );
      }
      console.log(`  Match ${match.id} innings 1: ${balls1.length} balls`);
    }

    // Generate balls for innings 2 (team2 batting, team1 bowling)
    if (team2Batters.length > 0 && team1Bowlers.length > 0) {
      const balls2 = generateBalls(match.id, 2, team2Batters, team1Bowlers, match.team2_score, match.team2_wickets, match.team2_overs);
      for (const b of balls2) {
        await pool.query(
          `INSERT INTO balls (match_id, innings, over_number, ball_number, batsman_id, bowler_id, runs, is_wide, is_noball, is_bye, is_legbye, is_wicket, wicket_type, extras, commentary)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
          [b.matchId, b.innings, b.over, b.ball, b.batsmanId, b.bowlerId, b.runs, b.isWide, b.isNoBall, false, false, b.isWicket, b.wicketType, b.extras, b.commentary]
        );
      }
      console.log(`  Match ${match.id} innings 2: ${balls2.length} balls`);
    }
  }

  console.log('\nBall seeding complete!');
  await pool.end();
}

function generateBalls(matchId, innings, batters, bowlers, totalScore, totalWickets, totalOvers) {
  const balls = [];
  let runsLeft = totalScore;
  let wicketsLeft = totalWickets;

  // Calculate total legal deliveries from overs (e.g., 19.3 = 19*6+3 = 117)
  const fullOvers = Math.floor(totalOvers);
  const partialBalls = Math.round((totalOvers - fullOvers) * 10);
  const totalBalls = fullOvers * 6 + partialBalls;

  if (totalBalls === 0) return balls;

  let batsmanIdx = 0;
  let bowlerIdx = 0;
  let currentOver = 0;
  let currentBall = 0;

  // Distribute runs across balls
  const runDistribution = distributeRuns(runsLeft, totalBalls, wicketsLeft, batters);

  for (let i = 0; i < runDistribution.length; i++) {
    const { runs, isWicket, wicketType, isWide, isNoBall } = runDistribution[i];
    const batsman = batters[batsmanIdx % batters.length];
    const bowler = bowlers[bowlerIdx % bowlers.length];

    const commentary = generateCommentary(batsman.name, bowler.name, runs, isWicket, wicketType, isWide);

    balls.push({
      matchId,
      innings,
      over: currentOver,
      ball: currentBall + 1,
      batsmanId: batsman.user_id,
      bowlerId: bowler.user_id,
      runs,
      isWide: isWide || false,
      isNoBall: isNoBall || false,
      isWicket: isWicket || false,
      wicketType: wicketType || null,
      extras: (isWide || isNoBall) ? 1 : 0,
      commentary,
    });

    // Legal delivery - advance ball count
    if (!isWide && !isNoBall) {
      currentBall++;
      if (currentBall >= 6) {
        currentOver++;
        currentBall = 0;
        bowlerIdx++; // Change bowler at end of over
        // Swap strike at end of over
        if (batsmanIdx + 1 < batters.length) {
          // Rotate through batters
        }
      }
    }

    // Odd runs swap strike
    if (runs % 2 === 1 && !isWide) {
      // Swap strike (rotate batter index)
    }

    if (isWicket) {
      batsmanIdx++;
      if (batsmanIdx >= batters.length) break;
    }
  }

  return balls;
}

function distributeRuns(totalRuns, totalBalls, totalWickets, batters) {
  const distribution = [];
  let runsLeft = totalRuns;
  let wicketsLeft = totalWickets;

  // Create wicket positions spread across the innings
  const wicketPositions = new Set();
  if (totalWickets > 0) {
    const interval = Math.floor(totalBalls / (totalWickets + 1));
    for (let w = 0; w < totalWickets; w++) {
      wicketPositions.add(interval * (w + 1) + Math.floor(Math.random() * 3));
    }
  }

  // Determine how many extras (wides/no-balls) to sprinkle in
  const extrasCount = Math.floor(totalBalls * 0.05); // ~5% extras
  const extrasPositions = new Set();
  for (let e = 0; e < extrasCount; e++) {
    extrasPositions.add(Math.floor(Math.random() * totalBalls));
  }

  for (let i = 0; i < totalBalls + extrasCount; i++) {
    if (distribution.length >= totalBalls + extrasCount) break;

    if (extrasPositions.has(i) && runsLeft > 1) {
      distribution.push({ runs: 1, isWicket: false, wicketType: null, isWide: true, isNoBall: false });
      runsLeft -= 1; // Wide adds 1 run
      continue;
    }

    if (wicketPositions.has(i) && wicketsLeft > 0) {
      const batter = batters[totalWickets - wicketsLeft];
      const wType = batter?.out_type?.split(' ')[0] || 'Bowled';
      distribution.push({ runs: 0, isWicket: true, wicketType: wType, isWide: false, isNoBall: false });
      wicketsLeft--;
      continue;
    }

    // Regular ball - distribute runs
    let runs = 0;
    if (runsLeft > 0) {
      const remaining = totalBalls - distribution.filter(d => !d.isWide && !d.isNoBall).length;
      const avgPerBall = remaining > 0 ? runsLeft / remaining : 0;

      if (avgPerBall > 2 && Math.random() < 0.15) {
        runs = 6;
      } else if (avgPerBall > 1.5 && Math.random() < 0.2) {
        runs = 4;
      } else if (Math.random() < 0.3) {
        runs = 0; // dot ball
      } else if (Math.random() < 0.5) {
        runs = 1;
      } else if (Math.random() < 0.7) {
        runs = 2;
      } else {
        runs = Math.random() < 0.5 ? 3 : 1;
      }

      runs = Math.min(runs, runsLeft);
      runsLeft -= runs;
    }

    distribution.push({ runs, isWicket: false, wicketType: null, isWide: false, isNoBall: false });
  }

  return distribution;
}

function generateCommentary(batsman, bowler, runs, isWicket, wicketType, isWide) {
  if (isWicket) return `OUT! ${batsman} ${wicketType} by ${bowler}`;
  if (isWide) return `Wide ball by ${bowler}, 1 run added`;
  if (runs === 0) return `Dot ball. ${bowler} to ${batsman}, no run`;
  if (runs === 4) return `FOUR! ${batsman} drives ${bowler} to the boundary`;
  if (runs === 6) return `SIX! ${batsman} launches ${bowler} over the rope!`;
  if (runs === 1) return `${batsman} pushes to mid-wicket, single taken`;
  if (runs === 2) return `${batsman} works it through the gap, quick two`;
  if (runs === 3) return `${batsman} finds the gap, three runs`;
  return `${runs} runs`;
}

seedBalls().catch(e => { console.error(e); process.exit(1); });
