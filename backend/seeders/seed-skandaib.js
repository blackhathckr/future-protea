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

async function seed() {
  // Get SKANDA I B user
  const user = await pool.query(`SELECT id FROM users WHERE email = 'skandaib21@gmail.com'`);
  if (user.rows.length === 0) { console.log('User not found'); process.exit(1); }
  const playerId = user.rows[0].id;

  // Approve the player
  await pool.query(`UPDATE users SET approved = true, batting_style = 'Right-hand Bat', bowling_style = 'Right-arm Spin' WHERE id = $1`, [playerId]);

  const feederId = (await pool.query(`SELECT id FROM users WHERE email='feeder@cricket.com'`)).rows[0].id;

  // Get all completed matches that have RCB
  const matches = await pool.query(`SELECT id, team1_name, team2_name FROM matches WHERE status = 'completed' AND (team1_name LIKE '%Bangalore%' OR team2_name LIKE '%Bangalore%')`);

  const performances = [
    { runs: 38, balls: 28, fours: 4, sixes: 1, out: true, outType: 'Caught', overs: 2, conc: 16, wkt: 1 },
    { runs: 72, balls: 46, fours: 8, sixes: 3, out: false, outType: null, overs: 3, conc: 25, wkt: 2 },
    { runs: 15, balls: 12, fours: 2, sixes: 0, out: true, outType: 'Bowled', overs: 2, conc: 20, wkt: 0 },
    { runs: 56, balls: 40, fours: 5, sixes: 3, out: true, outType: 'Run Out', overs: 4, conc: 29, wkt: 1 },
    { runs: 83, balls: 50, fours: 9, sixes: 4, out: false, outType: null, overs: 3, conc: 22, wkt: 2 },
    { runs: 28, balls: 22, fours: 3, sixes: 1, out: true, outType: 'LBW', overs: 2, conc: 30, wkt: 0 },
    { runs: 95, balls: 55, fours: 11, sixes: 5, out: true, outType: 'Caught', overs: 4, conc: 24, wkt: 3 },
    { runs: 47, balls: 35, fours: 5, sixes: 2, out: false, outType: null, overs: 3, conc: 19, wkt: 1 },
  ];

  let added = 0;
  for (let i = 0; i < matches.rows.length && i < performances.length; i++) {
    const m = matches.rows[i];
    const p = performances[i];
    const team = m.team1_name.includes('Bangalore') ? 1 : 2;

    // Add to match_players
    await pool.query(
      `INSERT INTO match_players (match_id, player_id, team, status)
       VALUES ($1, $2, $3, 'approved') ON CONFLICT DO NOTHING`,
      [m.id, playerId, team]
    );

    // Add player score
    await pool.query(
      `INSERT INTO player_scores (match_id, player_id, team, runs_scored, balls_faced, fours, sixes,
        is_out, out_type, overs_bowled, runs_conceded, wickets_taken)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (match_id, player_id) DO NOTHING`,
      [m.id, playerId, team, p.runs, p.balls, p.fours, p.sixes,
       p.out, p.outType, p.overs, p.conc, p.wkt]
    );
    added++;
  }

  // Also add to the upcoming RCB vs RR match
  const upcoming = await pool.query(`SELECT id FROM matches WHERE status IN ('upcoming', 'live') AND (team1_name LIKE '%Bangalore%') LIMIT 1`);
  if (upcoming.rows.length > 0) {
    await pool.query(
      `INSERT INTO match_players (match_id, player_id, team, status)
       VALUES ($1, $2, 1, 'approved') ON CONFLICT DO NOTHING`,
      [upcoming.rows[0].id, playerId]
    );
  }

  // Stats
  const stats = await pool.query(
    `SELECT COUNT(*) as m, COALESCE(SUM(runs_scored),0) as r, COALESCE(MAX(runs_scored),0) as hs,
      COALESCE(SUM(wickets_taken),0) as w,
      ROUND(SUM(runs_scored)::numeric * 100 / NULLIF(SUM(balls_faced),0)::numeric, 1) as sr,
      ROUND(SUM(runs_scored)::numeric / NULLIF(COUNT(*),0)::numeric, 1) as avg
     FROM player_scores WHERE player_id = $1`, [playerId]
  );
  const s = stats.rows[0];

  console.log(`SKANDA I B (ID: ${playerId}) data added!`);
  console.log(`  ${added} matches added`);
  console.log(`  Runs: ${s.r} | Highest: ${s.hs} | Avg: ${s.avg} | SR: ${s.sr}`);
  console.log(`  Wickets: ${s.w}`);

  await pool.end();
}

seed().catch(e => { console.error(e); process.exit(1); });
