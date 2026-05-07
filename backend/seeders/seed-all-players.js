require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
});

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// Realistic stat ranges per player style
function generateBatting(tier) {
  // tier: 'star', 'good', 'avg', 'bowler'
  switch (tier) {
    case 'star':
      return { runs: rand(35, 95), balls: 0, fours: 0, sixes: 0, outChance: 0.55 };
    case 'good':
      return { runs: rand(20, 65), balls: 0, fours: 0, sixes: 0, outChance: 0.6 };
    case 'avg':
      return { runs: rand(8, 40), balls: 0, fours: 0, sixes: 0, outChance: 0.7 };
    case 'bowler':
      return { runs: rand(2, 20), balls: 0, fours: 0, sixes: 0, outChance: 0.8 };
  }
}

function fillBatDetails(b) {
  const sr = rand(110, 185);
  b.balls = Math.max(1, Math.round(b.runs * 100 / sr));
  b.fours = Math.min(b.runs / 4, rand(0, Math.floor(b.runs / 6)));
  b.sixes = Math.min(Math.floor((b.runs - b.fours * 4) / 6), rand(0, Math.floor(b.runs / 12)));
  b.isOut = Math.random() < b.outChance;
  b.outType = b.isOut ? ['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped'][rand(0, 4)] : null;
  return b;
}

function generateBowling(tier) {
  switch (tier) {
    case 'main':
      return { overs: rand(3, 4), conc: 0, wkt: rand(0, 4) };
    case 'part':
      return { overs: rand(1, 3), conc: 0, wkt: rand(0, 2) };
    case 'none':
      return { overs: 0, conc: 0, wkt: 0 };
  }
}

function fillBowlDetails(b) {
  if (b.overs === 0) return b;
  const er = rand(6, 12);
  b.conc = Math.round(b.overs * er);
  return b;
}

const playerProfiles = {
  // RCB
  'virat@rcb.com':     { bat: 'star',   bowl: 'none' },
  'faf@rcb.com':       { bat: 'star',   bowl: 'none' },
  'maxwell@rcb.com':   { bat: 'star',   bowl: 'part' },
  'rajat@rcb.com':     { bat: 'good',   bowl: 'none' },
  'dk@rcb.com':        { bat: 'good',   bowl: 'none' },
  'anuj@rcb.com':      { bat: 'avg',    bowl: 'none' },
  'shahbaz@rcb.com':   { bat: 'avg',    bowl: 'main' },
  'hasaranga@rcb.com': { bat: 'avg',    bowl: 'main' },
  'harshal@rcb.com':   { bat: 'bowler', bowl: 'main' },
  'siraj@rcb.com':     { bat: 'bowler', bowl: 'main' },
  'hazlewood@rcb.com': { bat: 'bowler', bowl: 'main' },
  // RR
  'sanju@rr.com':      { bat: 'star',   bowl: 'none' },
  'buttler@rr.com':    { bat: 'star',   bowl: 'none' },
  'jaiswal@rr.com':    { bat: 'star',   bowl: 'none' },
  'hetmyer@rr.com':    { bat: 'good',   bowl: 'none' },
  'padikkal@rr.com':   { bat: 'good',   bowl: 'none' },
  'riyan@rr.com':      { bat: 'good',   bowl: 'part' },
  'ashwin@rr.com':     { bat: 'avg',    bowl: 'main' },
  'boult@rr.com':      { bat: 'bowler', bowl: 'main' },
  'chahal@rr.com':     { bat: 'bowler', bowl: 'main' },
  'prasidh@rr.com':    { bat: 'bowler', bowl: 'main' },
  'sandeep@rr.com':    { bat: 'bowler', bowl: 'main' },
};

const opponents = [
  'Chennai Super Kings', 'Mumbai Indians', 'Kolkata Knight Riders',
  'Delhi Capitals', 'Punjab Kings', 'Sunrisers Hyderabad',
  'Gujarat Titans', 'Lucknow Super Giants'
];

const venues = [
  'M. Chinnaswamy Stadium, Bengaluru', 'Wankhede Stadium, Mumbai',
  'Eden Gardens, Kolkata', 'Arun Jaitley Stadium, Delhi',
  'Narendra Modi Stadium, Ahmedabad', 'Rajiv Gandhi Stadium, Hyderabad',
  'IS Bindra Stadium, Mohali', 'BRSABV Ekana Stadium, Lucknow'
];

async function seed() {
  // Get all player IDs
  const allPlayers = await pool.query(`SELECT id, email FROM users WHERE role = 'player'`);
  const playerMap = {};
  for (const p of allPlayers.rows) {
    playerMap[p.email] = p.id;
  }
  const feederId = (await pool.query(`SELECT id FROM users WHERE email='feeder@cricket.com'`)).rows[0].id;

  // Get existing completed matches that already have Skanda's data
  const existingMatches = await pool.query(
    `SELECT m.id, m.team1_name, m.team2_name FROM matches m WHERE m.status = 'completed'`
  );
  const existingMatchIds = existingMatches.rows.map(m => m.id);

  // For each existing completed match, add scores for the other players
  for (const match of existingMatches.rows) {
    const isRcbTeam1 = match.team1_name.includes('Bangalore');

    for (const [email, profile] of Object.entries(playerProfiles)) {
      const playerId = playerMap[email];
      if (!playerId) continue;
      if (email === 'skanda@rcb.com') continue; // already has data

      const isRcb = email.includes('@rcb.com');
      const team = isRcb ? (isRcbTeam1 ? 1 : 2) : (isRcbTeam1 ? 2 : 1);

      // Only add RCB players if RCB is in the match, skip RR for these matches
      if (isRcb) {
        // Check if already exists
        const exists = await pool.query(
          `SELECT id FROM player_scores WHERE match_id = $1 AND player_id = $2`,
          [match.id, playerId]
        );
        if (exists.rows.length > 0) continue;

        await pool.query(
          `INSERT INTO match_players (match_id, player_id, team, status)
           VALUES ($1, $2, $3, 'approved') ON CONFLICT DO NOTHING`,
          [match.id, playerId, team]
        );

        const bat = fillBatDetails(generateBatting(profile.bat));
        const bowl = fillBowlDetails(generateBowling(profile.bowl));

        await pool.query(
          `INSERT INTO player_scores (match_id, player_id, team, runs_scored, balls_faced, fours, sixes,
            is_out, out_type, overs_bowled, runs_conceded, wickets_taken)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (match_id, player_id) DO NOTHING`,
          [match.id, playerId, team, bat.runs, bat.balls, bat.fours, bat.sixes,
           bat.isOut, bat.outType, bowl.overs, bowl.conc, bowl.wkt]
        );
      }
    }
  }

  // Create 6 additional past matches specifically for RR players' journey
  const rrMatches = [
    { team1: 'Rajasthan Royals', team2: 'Chennai Super Kings', venue: 'Sawai Mansingh Stadium, Jaipur', days_ago: 52, winner: null },
    { team1: 'Mumbai Indians', team2: 'Rajasthan Royals', venue: 'Wankhede Stadium, Mumbai', days_ago: 45, winner: null },
    { team1: 'Rajasthan Royals', team2: 'Punjab Kings', venue: 'Sawai Mansingh Stadium, Jaipur', days_ago: 38, winner: null },
    { team1: 'Delhi Capitals', team2: 'Rajasthan Royals', venue: 'Arun Jaitley Stadium, Delhi', days_ago: 31, winner: null },
    { team1: 'Rajasthan Royals', team2: 'Gujarat Titans', venue: 'Sawai Mansingh Stadium, Jaipur', days_ago: 24, winner: null },
    { team1: 'Kolkata Knight Riders', team2: 'Rajasthan Royals', venue: 'Eden Gardens, Kolkata', days_ago: 10, winner: null },
  ];

  for (const m of rrMatches) {
    const matchDate = new Date();
    matchDate.setDate(matchDate.getDate() - m.days_ago);

    const t1s = rand(155, 215);
    const t2s = rand(150, 220);
    const t1w = rand(3, 10);
    const t2w = rand(3, 10);
    const winner = t1s > t2s ? m.team1 : m.team2;

    const matchRes = await pool.query(
      `INSERT INTO matches (team1_name, team2_name, venue, total_overs, match_date, status, winner,
        team1_score, team1_wickets, team1_overs, team2_score, team2_wickets, team2_overs, created_by)
       VALUES ($1, $2, $3, 20, $4, 'completed', $5, $6, $7, 20, $8, $9, 20, $10)
       RETURNING id`,
      [m.team1, m.team2, m.venue, matchDate, winner, t1s, t1w, t2s, t2w, feederId]
    );
    const matchId = matchRes.rows[0].id;
    const isRrTeam1 = m.team1.includes('Rajasthan');

    // Add all RR players
    for (const [email, profile] of Object.entries(playerProfiles)) {
      if (!email.includes('@rr.com')) continue;
      const playerId = playerMap[email];
      if (!playerId) continue;

      const team = isRrTeam1 ? 1 : 2;

      await pool.query(
        `INSERT INTO match_players (match_id, player_id, team, status)
         VALUES ($1, $2, $3, 'approved') ON CONFLICT DO NOTHING`,
        [matchId, playerId, team]
      );

      const bat = fillBatDetails(generateBatting(profile.bat));
      const bowl = fillBowlDetails(generateBowling(profile.bowl));

      await pool.query(
        `INSERT INTO player_scores (match_id, player_id, team, runs_scored, balls_faced, fours, sixes,
          is_out, out_type, overs_bowled, runs_conceded, wickets_taken)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (match_id, player_id) DO NOTHING`,
        [matchId, playerId, team, bat.runs, bat.balls, bat.fours, bat.sixes,
         bat.isOut, bat.outType, bowl.overs, bowl.conc, bowl.wkt]
      );
    }
  }

  // Print summary
  console.log('All player data seeded!\n');
  for (const [email, profile] of Object.entries(playerProfiles)) {
    const playerId = playerMap[email];
    if (!playerId) continue;
    const stats = await pool.query(
      `SELECT COUNT(*) as m, COALESCE(SUM(runs_scored),0) as r, COALESCE(MAX(runs_scored),0) as hs,
        COALESCE(SUM(wickets_taken),0) as w
       FROM player_scores WHERE player_id = $1`, [playerId]
    );
    const s = stats.rows[0];
    const name = (await pool.query(`SELECT name FROM users WHERE id = $1`, [playerId])).rows[0].name;
    console.log(`  ${name.padEnd(22)} | ${s.m} matches | ${String(s.r).padStart(4)} runs | HS: ${String(s.hs).padStart(3)} | ${String(s.w).padStart(2)} wkts`);
  }

  await pool.end();
}

seed().catch(e => { console.error(e); process.exit(1); });
