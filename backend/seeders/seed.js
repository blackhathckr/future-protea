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

  // Create feeder & viewer accounts
  await pool.query(
    `INSERT INTO users (name, email, password, role, approved)
     VALUES ($1, $2, $3, $4, true) ON CONFLICT (email) DO NOTHING`,
    ['Admin Feeder', 'feeder@cricket.com', hash, 'feeder']
  );
  await pool.query(
    `INSERT INTO users (name, email, password, role, approved)
     VALUES ($1, $2, $3, $4, true) ON CONFLICT (email) DO NOTHING`,
    ['Cricket Fan', 'viewer@cricket.com', hash, 'viewer']
  );

  // RCB Players
  const rcbPlayers = [
    ['Virat Kohli', 'virat@rcb.com', 'Right-hand Bat', 'Right-arm Medium'],
    ['Faf du Plessis', 'faf@rcb.com', 'Right-hand Bat', 'None'],
    ['Glenn Maxwell', 'maxwell@rcb.com', 'Right-hand Bat', 'Right-arm Spin'],
    ['Rajat Patidar', 'rajat@rcb.com', 'Right-hand Bat', 'None'],
    ['Dinesh Karthik', 'dk@rcb.com', 'Right-hand Bat', 'None'],
    ['Anuj Rawat', 'anuj@rcb.com', 'Left-hand Bat', 'None'],
    ['Shahbaz Ahmed', 'shahbaz@rcb.com', 'Left-hand Bat', 'Left-arm Spin'],
    ['Wanindu Hasaranga', 'hasaranga@rcb.com', 'Right-hand Bat', 'Right-arm Spin'],
    ['Harshal Patel', 'harshal@rcb.com', 'Right-hand Bat', 'Right-arm Fast'],
    ['Mohammed Siraj', 'siraj@rcb.com', 'Right-hand Bat', 'Right-arm Fast'],
    ['Josh Hazlewood', 'hazlewood@rcb.com', 'Left-hand Bat', 'Right-arm Fast'],
  ];

  // RR Players
  const rrPlayers = [
    ['Sanju Samson', 'sanju@rr.com', 'Right-hand Bat', 'None'],
    ['Jos Buttler', 'buttler@rr.com', 'Right-hand Bat', 'None'],
    ['Yashasvi Jaiswal', 'jaiswal@rr.com', 'Left-hand Bat', 'Right-arm Spin'],
    ['Shimron Hetmyer', 'hetmyer@rr.com', 'Left-hand Bat', 'None'],
    ['Devdutt Padikkal', 'padikkal@rr.com', 'Left-hand Bat', 'None'],
    ['Riyan Parag', 'riyan@rr.com', 'Right-hand Bat', 'Right-arm Spin'],
    ['Ravichandran Ashwin', 'ashwin@rr.com', 'Right-hand Bat', 'Right-arm Spin'],
    ['Trent Boult', 'boult@rr.com', 'Right-hand Bat', 'Left-arm Fast'],
    ['Yuzvendra Chahal', 'chahal@rr.com', 'Right-hand Bat', 'Right-arm Spin'],
    ['Prasidh Krishna', 'prasidh@rr.com', 'Right-hand Bat', 'Right-arm Fast'],
    ['Sandeep Sharma', 'sandeep@rr.com', 'Right-hand Bat', 'Right-arm Fast'],
  ];

  for (const p of rcbPlayers) {
    await pool.query(
      `INSERT INTO users (name, email, password, role, batting_style, bowling_style, approved)
       VALUES ($1, $2, $3, 'player', $4, $5, true) ON CONFLICT (email) DO NOTHING`,
      [p[0], p[1], hash, p[2], p[3]]
    );
  }

  for (const p of rrPlayers) {
    await pool.query(
      `INSERT INTO users (name, email, password, role, batting_style, bowling_style, approved)
       VALUES ($1, $2, $3, 'player', $4, $5, true) ON CONFLICT (email) DO NOTHING`,
      [p[0], p[1], hash, p[2], p[3]]
    );
  }

  // Create match: RCB vs RR
  const feeder = await pool.query(`SELECT id FROM users WHERE email='feeder@cricket.com'`);
  const matchResult = await pool.query(
    `INSERT INTO matches (team1_name, team2_name, venue, total_overs, match_date, status, created_by)
     VALUES ('Royal Challengers Bangalore', 'Rajasthan Royals', 'M. Chinnaswamy Stadium, Bengaluru', 20, NOW() + interval '1 day', 'upcoming', $1)
     RETURNING id`,
    [feeder.rows[0].id]
  );
  const matchId = matchResult.rows[0].id;

  // Assign RCB players to team 1
  const rcbUsers = await pool.query(`SELECT id FROM users WHERE email LIKE '%@rcb.com' ORDER BY id`);
  for (const u of rcbUsers.rows) {
    await pool.query(
      `INSERT INTO match_players (match_id, player_id, team, status)
       VALUES ($1, $2, 1, 'approved') ON CONFLICT DO NOTHING`,
      [matchId, u.id]
    );
  }

  // Assign RR players to team 2
  const rrUsers = await pool.query(`SELECT id FROM users WHERE email LIKE '%@rr.com' ORDER BY id`);
  for (const u of rrUsers.rows) {
    await pool.query(
      `INSERT INTO match_players (match_id, player_id, team, status)
       VALUES ($1, $2, 2, 'approved') ON CONFLICT DO NOTHING`,
      [matchId, u.id]
    );
  }

  console.log('Seed complete! Match ID:', matchId);
  console.log('RCB players:', rcbUsers.rows.length);
  console.log('RR players:', rrUsers.rows.length);
  console.log('');
  console.log('Login accounts:');
  console.log('  Feeder:  feeder@cricket.com / password123');
  console.log('  Viewer:  viewer@cricket.com / password123');
  console.log('  Player:  virat@rcb.com / password123 (or any player email)');
  await pool.end();
}

seed().catch(e => { console.error(e); process.exit(1); });
