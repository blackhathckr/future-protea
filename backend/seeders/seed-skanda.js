require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
});

async function seed() {
  const hash = await bcrypt.hash('password123', 10);

  // Create Skanda player
  const skandaResult = await pool.query(
    `INSERT INTO users (name, email, password, role, batting_style, bowling_style, phone, approved)
     VALUES ($1, $2, $3, 'player', $4, $5, $6, true)
     ON CONFLICT (email) DO UPDATE SET name = $1
     RETURNING id`,
    ['Skanda B', 'skanda@rcb.com', hash, 'Right-hand Bat', 'Right-arm Spin', '9876543210']
  );
  const skandaId = skandaResult.rows[0].id;
  const feederId = (await pool.query(`SELECT id FROM users WHERE email='feeder@cricket.com'`)).rows[0].id;

  // Add Skanda to the existing RCB vs RR match
  const existingMatch = await pool.query(`SELECT id FROM matches WHERE team1_name = 'Royal Challengers Bangalore' AND team2_name = 'Rajasthan Royals' LIMIT 1`);
  if (existingMatch.rows.length > 0) {
    await pool.query(
      `INSERT INTO match_players (match_id, player_id, team, status)
       VALUES ($1, $2, 1, 'approved') ON CONFLICT DO NOTHING`,
      [existingMatch.rows[0].id, skandaId]
    );
  }

  // Create 8 past matches with realistic scores for Skanda's journey
  const pastMatches = [
    { team1: 'Royal Challengers Bangalore', team2: 'Chennai Super Kings', venue: 'M. Chinnaswamy Stadium, Bengaluru', days_ago: 56, t1s: 185, t1w: 5, t2s: 172, t2w: 8, winner: 'Royal Challengers Bangalore',
      skanda: { runs: 42, balls: 31, fours: 5, sixes: 1, out: true, out_type: 'Caught', overs: 2, conc: 18, wkt: 1 } },
    { team1: 'Mumbai Indians', team2: 'Royal Challengers Bangalore', venue: 'Wankhede Stadium, Mumbai', days_ago: 49, t1s: 198, t1w: 4, t2s: 201, t2w: 6, winner: 'Royal Challengers Bangalore',
      skanda: { runs: 67, balls: 44, fours: 7, sixes: 3, out: false, out_type: null, overs: 3, conc: 28, wkt: 2 } },
    { team1: 'Royal Challengers Bangalore', team2: 'Kolkata Knight Riders', venue: 'M. Chinnaswamy Stadium, Bengaluru', days_ago: 42, t1s: 156, t1w: 9, t2s: 159, t2w: 4, winner: 'Kolkata Knight Riders',
      skanda: { runs: 12, balls: 15, fours: 1, sixes: 0, out: true, out_type: 'Bowled', overs: 2, conc: 22, wkt: 0 } },
    { team1: 'Delhi Capitals', team2: 'Royal Challengers Bangalore', venue: 'Arun Jaitley Stadium, Delhi', days_ago: 35, t1s: 174, t1w: 7, t2s: 178, t2w: 5, winner: 'Royal Challengers Bangalore',
      skanda: { runs: 53, balls: 38, fours: 4, sixes: 3, out: true, out_type: 'Run Out', overs: 4, conc: 31, wkt: 1 } },
    { team1: 'Royal Challengers Bangalore', team2: 'Punjab Kings', venue: 'M. Chinnaswamy Stadium, Bengaluru', days_ago: 28, t1s: 212, t1w: 3, t2s: 195, t2w: 7, winner: 'Royal Challengers Bangalore',
      skanda: { runs: 78, balls: 48, fours: 8, sixes: 4, out: false, out_type: null, overs: 3, conc: 24, wkt: 2 } },
    { team1: 'Sunrisers Hyderabad', team2: 'Royal Challengers Bangalore', venue: 'Rajiv Gandhi Stadium, Hyderabad', days_ago: 21, t1s: 222, t1w: 4, t2s: 210, t2w: 8, winner: 'Sunrisers Hyderabad',
      skanda: { runs: 35, balls: 24, fours: 3, sixes: 2, out: true, out_type: 'LBW', overs: 2, conc: 32, wkt: 0 } },
    { team1: 'Royal Challengers Bangalore', team2: 'Gujarat Titans', venue: 'M. Chinnaswamy Stadium, Bengaluru', days_ago: 14, t1s: 190, t1w: 6, t2s: 165, t2w: 10, winner: 'Royal Challengers Bangalore',
      skanda: { runs: 91, balls: 52, fours: 10, sixes: 5, out: true, out_type: 'Caught', overs: 4, conc: 26, wkt: 3 } },
    { team1: 'Lucknow Super Giants', team2: 'Royal Challengers Bangalore', venue: 'BRSABV Ekana Stadium, Lucknow', days_ago: 7, t1s: 168, t1w: 8, t2s: 171, t2w: 4, winner: 'Royal Challengers Bangalore',
      skanda: { runs: 45, balls: 33, fours: 5, sixes: 1, out: false, out_type: null, overs: 3, conc: 21, wkt: 1 } },
  ];

  for (const m of pastMatches) {
    const matchDate = new Date();
    matchDate.setDate(matchDate.getDate() - m.days_ago);

    const matchRes = await pool.query(
      `INSERT INTO matches (team1_name, team2_name, venue, total_overs, match_date, status, winner,
        team1_score, team1_wickets, team1_overs, team2_score, team2_wickets, team2_overs, created_by)
       VALUES ($1, $2, $3, 20, $4, 'completed', $5, $6, $7, 20, $8, $9, 20, $10)
       RETURNING id`,
      [m.team1, m.team2, m.venue, matchDate, m.winner, m.t1s, m.t1w, m.t2s, m.t2w, feederId]
    );
    const matchId = matchRes.rows[0].id;

    // Add Skanda to the match (team 1 = RCB)
    await pool.query(
      `INSERT INTO match_players (match_id, player_id, team, status)
       VALUES ($1, $2, 1, 'approved')`,
      [matchId, skandaId]
    );

    // Determine which team Skanda is on (RCB is always team1 or team2)
    const skandaTeam = m.team1.includes('Bangalore') ? 1 : 2;
    const s = m.skanda;

    // Insert Skanda's batting & bowling stats
    await pool.query(
      `INSERT INTO player_scores (match_id, player_id, team, runs_scored, balls_faced, fours, sixes,
        is_out, out_type, overs_bowled, runs_conceded, wickets_taken)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [matchId, skandaId, skandaTeam, s.runs, s.balls, s.fours, s.sixes,
       s.out, s.out_type, s.overs, s.conc, s.wkt]
    );
  }

  // Print summary
  const stats = await pool.query(
    `SELECT COUNT(*) as matches, SUM(runs_scored) as runs, MAX(runs_scored) as highest,
      SUM(fours) as fours, SUM(sixes) as sixes, SUM(wickets_taken) as wickets,
      ROUND(SUM(runs_scored)::numeric * 100 / NULLIF(SUM(balls_faced), 0)::numeric, 1) as sr,
      ROUND(SUM(runs_scored)::numeric / COUNT(*)::numeric, 1) as avg
     FROM player_scores WHERE player_id = $1`, [skandaId]
  );
  const st = stats.rows[0];

  console.log('Skanda B added to RCB!');
  console.log('Login: skanda@rcb.com / password123');
  console.log('');
  console.log('Career Stats:');
  console.log('  Matches:', st.matches);
  console.log('  Runs:', st.runs, '| Highest:', st.highest);
  console.log('  Average:', st.avg, '| Strike Rate:', st.sr);
  console.log('  4s:', st.fours, '| 6s:', st.sixes);
  console.log('  Wickets:', st.wickets);

  await pool.end();
}

seed().catch(e => { console.error(e); process.exit(1); });
