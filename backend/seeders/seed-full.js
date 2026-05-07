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

  console.log('=== Future Protea - Full Seed ===\n');

  // ==================== CLEAN UP ====================
  console.log('Cleaning existing data...');
  await pool.query('DELETE FROM balls');
  await pool.query('DELETE FROM player_scores');
  await pool.query('DELETE FROM match_players');
  await pool.query('DELETE FROM tournament_fixtures');
  await pool.query('DELETE FROM tournament_teams');
  await pool.query('DELETE FROM team_players');
  await pool.query('UPDATE matches SET tournament_id = NULL');
  await pool.query('DELETE FROM matches');
  await pool.query('DELETE FROM tournaments');
  await pool.query('DELETE FROM teams');
  await pool.query('DELETE FROM registered_players');
  await pool.query('DELETE FROM users');

  // ==================== USER ACCOUNTS ====================
  console.log('Creating user accounts...');

  const feeder = await insertUser('Liam van der Merwe', 'feeder@cricket.com', hash, 'feeder');
  await insertUser('Cricket Fan', 'viewer@cricket.com', hash, 'viewer');

  // ==================== REGISTERED PLAYERS (30 SA youth players) ====================
  console.log('Registering 30 players...');

  const players = [
    // Greenfield High School players
    { name: 'Michael Brown',     dob: '1999-09-09', school: 'Greenfield HS', club: 'Riverton Sharks',    bat: 'Right-hand Bat', bowl: 'Right-arm Fast' },
    { name: 'Daniel Patel',      dob: '2000-03-16', school: null,            club: 'Riverton CC',        bat: 'Right-hand Bat', bowl: 'Right-arm Spin' },
    { name: 'Ryan Phillips',     dob: '1998-12-05', school: 'Greenfield HS', club: 'Riverton Sharks',    bat: 'Left-hand Bat',  bowl: 'Left-arm Fast' },
    { name: 'Justin Naidoo',     dob: '2001-04-22', school: 'Westbridge Lions', club: 'Eastview Tigers', bat: 'Right-hand Bat', bowl: 'Right-arm Fast' },
    { name: 'Liam Andrews',      dob: '2008-03-14', school: 'South High School', club: 'Durbanville CC', bat: 'Right-hand Bat', bowl: 'None' },
    { name: 'Ethan Jacobs',      dob: '2007-07-25', school: 'South High School', club: null,             bat: 'Right-hand Bat', bowl: 'Right-arm Spin' },
    { name: 'Logan Barton',      dob: '2009-02-07', school: 'South High School', club: null,             bat: 'Left-hand Bat',  bowl: 'None' },
    { name: 'Liam Smith',        dob: '2008-11-30', school: 'South High School', club: null,             bat: 'Right-hand Bat', bowl: 'Right-arm Fast' },
    { name: 'Liam Jacobs',       dob: '2007-01-19', school: 'South High School', club: null,             bat: 'Right-hand Bat', bowl: 'Left-arm Spin' },
    { name: 'Daniel Smith',      dob: '2007-03-22', school: 'Greenfield HS', club: null,                 bat: 'Left-hand Bat',  bowl: 'None' },
    { name: 'Aiden Brown',       dob: '2009-02-07', school: 'South High School', club: null,             bat: 'Right-hand Bat', bowl: 'Right-arm Fast' },
    { name: 'Noah Williams',     dob: '2007-01-19', school: 'Greenfield HS', club: 'Riverton CC',       bat: 'Right-hand Bat', bowl: 'Right-arm Spin' },
    // Cape Town area
    { name: 'Shane van Wyk',     dob: '2007-06-10', school: 'Paarl Boys High',  club: 'Cape Cobras CC',   bat: 'Right-hand Bat', bowl: 'Right-arm Fast' },
    { name: 'David Petersen',    dob: '2008-08-15', school: 'Paarl Boys High',  club: 'Cape Cobras CC',   bat: 'Right-hand Bat', bowl: 'Right-arm Spin' },
    { name: 'Ravi Singh',        dob: '2007-11-03', school: 'Rondebosch Boys',  club: 'Cape Cobras CC',   bat: 'Left-hand Bat',  bowl: 'Left-arm Fast' },
    { name: 'Thabo Mokoena',     dob: '2008-04-20', school: 'Rondebosch Boys',  club: null,               bat: 'Right-hand Bat', bowl: 'None' },
    { name: 'Jayden September',  dob: '2009-01-08', school: 'Rondebosch Boys',  club: null,               bat: 'Left-hand Bat',  bowl: 'Left-arm Spin' },
    { name: 'Keegan Adams',      dob: '2007-09-25', school: 'Bishops',          club: 'Titans CC',        bat: 'Right-hand Bat', bowl: 'Right-arm Fast' },
    { name: 'Sipho Ndlovu',      dob: '2008-12-01', school: 'Bishops',          club: 'Titans CC',        bat: 'Right-hand Bat', bowl: 'Right-arm Spin' },
    { name: 'Andile Mthembu',    dob: '2007-07-14', school: 'Bishops',          club: 'Titans CC',        bat: 'Left-hand Bat',  bowl: 'None' },
    { name: 'Brandon Davids',    dob: '2008-05-22', school: 'SACS',             club: null,               bat: 'Right-hand Bat', bowl: 'Right-arm Fast' },
    { name: 'Lungelo Zulu',      dob: '2009-03-17', school: 'SACS',             club: null,               bat: 'Right-hand Bat', bowl: 'Left-arm Spin' },
    // Durban area
    { name: 'Mpho Dlamini',      dob: '2007-10-30', school: 'Hilton College',   club: 'Dolphins CC',      bat: 'Right-hand Bat', bowl: 'Right-arm Fast' },
    { name: 'Kabelo Mashaba',    dob: '2008-02-14', school: 'Hilton College',   club: 'Dolphins CC',      bat: 'Left-hand Bat',  bowl: 'None' },
    { name: 'Tyrone Pillay',     dob: '2007-08-28', school: 'DHS',              club: 'Dolphins CC',      bat: 'Right-hand Bat', bowl: 'Right-arm Spin' },
    { name: 'Nico Erasmus',      dob: '2008-06-05', school: 'DHS',              club: null,               bat: 'Right-hand Bat', bowl: 'Right-arm Fast' },
    // Joburg area
    { name: 'Tshepo Modise',     dob: '2007-04-11', school: 'KES',              club: 'Lions CC',         bat: 'Right-hand Bat', bowl: 'Left-arm Fast' },
    { name: 'Cameron Wright',    dob: '2008-09-19', school: 'KES',              club: 'Lions CC',         bat: 'Left-hand Bat',  bowl: 'None' },
    { name: 'Jacques Fourie',    dob: '2007-12-07', school: 'Grey College',     club: null,               bat: 'Right-hand Bat', bowl: 'Right-arm Fast' },
    { name: 'Wandile Khumalo',   dob: '2008-01-25', school: 'Grey College',     club: null,               bat: 'Right-hand Bat', bowl: 'Right-arm Spin' },
  ];

  const playerIds = [];
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const code = `GUCT-${String(i + 1).padStart(4, '0')}`;
    const result = await pool.query(
      `INSERT INTO registered_players (name, player_id_code, date_of_birth, school_name, club_name, batting_style, bowling_style, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [p.name, code, p.dob, p.school, p.club, p.bat, p.bowl, feeder]
    );
    playerIds.push(result.rows[0].id);

    // Also create user accounts for the first 22 players so they can be used in matches
    if (i < 22) {
      const email = p.name.toLowerCase().replace(/\s+/g, '.') + '@player.com';
      await pool.query(
        `INSERT INTO users (name, email, password, role, batting_style, bowling_style, approved)
         VALUES ($1, $2, $3, 'player', $4, $5, true) ON CONFLICT (email) DO NOTHING`,
        [p.name, email, hash, p.bat, p.bowl]
      );
    }
  }
  console.log(`  ${players.length} players registered`);

  // ==================== TEAMS ====================
  console.log('Creating teams...');

  const teamData = [
    // School teams
    { name: '1st XI',           type: 'school', school: 'Greenfield HS',       club: null },
    { name: '1st XI',           type: 'school', school: 'South High School',   club: null },
    { name: '1st XI',           type: 'school', school: 'Paarl Boys High',     club: null },
    { name: '1st XI',           type: 'school', school: 'Rondebosch Boys',     club: null },
    { name: '1st XI',           type: 'school', school: 'Bishops',             club: null },
    { name: '1st XI',           type: 'school', school: 'Hilton College',      club: null },
    // Club teams
    { name: 'Green Mambas',     type: 'club',   school: null, club: 'Cape Cobras CC' },
    { name: 'Blue Sharks',      type: 'club',   school: null, club: 'Riverton CC' },
    { name: 'Golden Eagles',    type: 'club',   school: null, club: 'Titans CC' },
    { name: 'Red Lions',        type: 'club',   school: null, club: 'Lions CC' },
    { name: 'Riverton Sharks',  type: 'club',   school: null, club: 'Riverton Sharks' },
    { name: 'Dolphins',         type: 'club',   school: null, club: 'Dolphins CC' },
  ];

  const teamIds = [];
  for (const t of teamData) {
    const result = await pool.query(
      `INSERT INTO teams (team_name, team_type, school_name, club_name, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [t.name, t.type, t.school, t.club, feeder]
    );
    teamIds.push(result.rows[0].id);
  }

  // Assign players to teams
  // Greenfield HS 1st XI: players 0,2,9,11
  for (const pi of [0, 2, 9, 11]) await addPlayerToTeam(teamIds[0], playerIds[pi]);
  // South High School 1st XI: players 4,5,6,7,8,10
  for (const pi of [4, 5, 6, 7, 8, 10]) await addPlayerToTeam(teamIds[1], playerIds[pi]);
  // Paarl Boys High 1st XI: players 12,13
  for (const pi of [12, 13]) await addPlayerToTeam(teamIds[2], playerIds[pi]);
  // Rondebosch Boys 1st XI: players 14,15,16
  for (const pi of [14, 15, 16]) await addPlayerToTeam(teamIds[3], playerIds[pi]);
  // Bishops 1st XI: players 17,18,19
  for (const pi of [17, 18, 19]) await addPlayerToTeam(teamIds[4], playerIds[pi]);
  // Hilton College 1st XI: players 22,23
  for (const pi of [22, 23]) await addPlayerToTeam(teamIds[5], playerIds[pi]);
  // Green Mambas (Cape Cobras): players 12,13,14
  for (const pi of [12, 13, 14]) await addPlayerToTeam(teamIds[6], playerIds[pi]);
  // Blue Sharks (Riverton CC): players 1,11
  for (const pi of [1, 11]) await addPlayerToTeam(teamIds[7], playerIds[pi]);
  // Golden Eagles (Titans): players 17,18,19
  for (const pi of [17, 18, 19]) await addPlayerToTeam(teamIds[8], playerIds[pi]);
  // Red Lions (Lions CC): players 26,27
  for (const pi of [26, 27]) await addPlayerToTeam(teamIds[9], playerIds[pi]);
  // Riverton Sharks: players 0,2
  for (const pi of [0, 2]) await addPlayerToTeam(teamIds[10], playerIds[pi]);
  // Dolphins: players 22,23,24
  for (const pi of [22, 23, 24]) await addPlayerToTeam(teamIds[11], playerIds[pi]);

  console.log(`  ${teamData.length} teams created with players assigned`);

  // ==================== TOURNAMENTS ====================
  console.log('Creating tournaments...');

  // Tournament 1: Protea Youth Cup (In Progress)
  const t1 = await pool.query(
    `INSERT INTO tournaments (name, type, overs, start_date, end_date, venue, organizer, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    ['Protea Youth Cup', 'T20', 20, '2026-01-21', '2026-06-07', 'Various', 'Cricket South Africa Youth', 'in_progress', feeder]
  );
  const tournament1Id = t1.rows[0].id;

  // Add 4 teams to Protea Youth Cup in 2 groups
  await pool.query(`INSERT INTO tournament_teams (tournament_id, team_id, group_name, played, won, lost, no_result, points) VALUES ($1, $2, 'Group A', 3, 3, 0, 0, 1.75)`, [tournament1Id, teamIds[6]]);  // Green Mambas
  await pool.query(`INSERT INTO tournament_teams (tournament_id, team_id, group_name, played, won, lost, no_result, points) VALUES ($1, $2, 'Group A', 3, 2, 1, 0, 0.75)`, [tournament1Id, teamIds[8]]);  // Golden Eagles
  await pool.query(`INSERT INTO tournament_teams (tournament_id, team_id, group_name, played, won, lost, no_result, points) VALUES ($1, $2, 'Group A', 3, 1, 2, 0, -0.65)`, [tournament1Id, teamIds[7]]);  // Blue Sharks
  await pool.query(`INSERT INTO tournament_teams (tournament_id, team_id, group_name, played, won, lost, no_result, points) VALUES ($1, $2, 'Group A', 3, 0, 3, 0, -1.85)`, [tournament1Id, teamIds[9]]);  // Red Lions

  // Add 4 teams to Group B
  await pool.query(`INSERT INTO tournament_teams (tournament_id, team_id, group_name, played, won, lost, no_result, points) VALUES ($1, $2, 'Group B', 2, 2, 0, 0, 1.50)`, [tournament1Id, teamIds[0]]);  // Greenfield HS
  await pool.query(`INSERT INTO tournament_teams (tournament_id, team_id, group_name, played, won, lost, no_result, points) VALUES ($1, $2, 'Group B', 2, 1, 1, 0, 0.30)`, [tournament1Id, teamIds[1]]);  // South HS
  await pool.query(`INSERT INTO tournament_teams (tournament_id, team_id, group_name, played, won, lost, no_result, points) VALUES ($1, $2, 'Group B', 2, 1, 1, 0, -0.25)`, [tournament1Id, teamIds[4]]);  // Bishops
  await pool.query(`INSERT INTO tournament_teams (tournament_id, team_id, group_name, played, won, lost, no_result, points) VALUES ($1, $2, 'Group B', 2, 0, 2, 0, -1.55)`, [tournament1Id, teamIds[3]]);  // Rondebosch

  // Tournament fixtures for Protea Youth Cup
  const fixtures1 = [
    { t1: 'Green Mambas', t2: 'Blue Sharks',    date: '2026-01-21 10:00', venue: 'Durban Cricket Ground',    status: 'completed', group: 'Group A', winner: 'Green Mambas' },
    { t1: 'Golden Eagles', t2: 'Red Lions',      date: '2026-01-22 14:00', venue: 'Jonsinaphp Stadium',      status: 'completed', group: 'Group A', winner: 'Golden Eagles' },
    { t1: 'Green Mambas', t2: 'Golden Eagles',  date: '2026-01-24 10:00', venue: 'Durban Cricket Ground',    status: 'completed', group: 'Group A', winner: 'Green Mambas' },
    { t1: 'Blue Sharks', t2: 'Red Lions',        date: '2026-02-01 14:00', venue: 'Cape Town Oval',          status: 'completed', group: 'Group A', winner: 'Blue Sharks' },
    { t1: 'Green Mambas', t2: 'Red Lions',      date: '2026-02-08 10:00', venue: 'Newlands B Ground',       status: 'completed', group: 'Group A', winner: 'Green Mambas' },
    { t1: 'Golden Eagles', t2: 'Blue Sharks',    date: '2026-02-15 14:00', venue: 'SuperSport Park B',       status: 'completed', group: 'Group A', winner: 'Golden Eagles' },
    { t1: 'Greenfield HS 1st XI', t2: 'South High School 1st XI', date: '2026-02-22 10:00', venue: 'Greenfield Oval', status: 'completed', group: 'Group B', winner: 'Greenfield HS 1st XI' },
    { t1: 'Bishops 1st XI', t2: 'Rondebosch Boys 1st XI', date: '2026-02-28 14:00', venue: 'Bishops Ground', status: 'completed', group: 'Group B', winner: 'Bishops 1st XI' },
    { t1: 'Greenfield HS 1st XI', t2: 'Bishops 1st XI', date: '2026-03-07 10:00', venue: 'Greenfield Oval', status: 'upcoming', group: 'Group B', winner: null },
    { t1: 'South High School 1st XI', t2: 'Rondebosch Boys 1st XI', date: '2026-03-14 14:00', venue: 'South HS Ground', status: 'upcoming', group: 'Group B', winner: null },
  ];

  for (const f of fixtures1) {
    await pool.query(
      `INSERT INTO tournament_fixtures (tournament_id, team1_name, team2_name, match_date, venue, status, group_name, winner)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [tournament1Id, f.t1, f.t2, f.date, f.venue, f.status, f.group, f.winner]
    );
  }

  // Tournament 2: High School League (Upcoming)
  const t2 = await pool.query(
    `INSERT INTO tournaments (name, type, overs, start_date, end_date, venue, organizer, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    ['High School League', 'T20', 20, '2026-06-15', '2026-07-12', 'Various Schools', 'WP Schools Cricket', 'upcoming', feeder]
  );
  const tournament2Id = t2.rows[0].id;

  await pool.query(`INSERT INTO tournament_teams (tournament_id, team_id, group_name) VALUES ($1, $2, 'Pool A')`, [tournament2Id, teamIds[0]]);
  await pool.query(`INSERT INTO tournament_teams (tournament_id, team_id, group_name) VALUES ($1, $2, 'Pool A')`, [tournament2Id, teamIds[1]]);
  await pool.query(`INSERT INTO tournament_teams (tournament_id, team_id, group_name) VALUES ($1, $2, 'Pool B')`, [tournament2Id, teamIds[2]]);
  await pool.query(`INSERT INTO tournament_teams (tournament_id, team_id, group_name) VALUES ($1, $2, 'Pool B')`, [tournament2Id, teamIds[4]]);

  // Tournament 3: Junior Cricket Series (Upcoming)
  await pool.query(
    `INSERT INTO tournaments (name, type, overs, start_date, end_date, venue, organizer, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    ['Junior Cricket Series', 'T20', 20, '2026-07-20', '2026-08-08', 'Various', 'CSA Development', 'upcoming', feeder]
  );

  // Tournament 4: Protea T20 Championship (Completed)
  const t4 = await pool.query(
    `INSERT INTO tournaments (name, type, overs, start_date, end_date, venue, organizer, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    ['Protea T20 Championship', 'T20', 20, '2025-02-10', '2025-02-25', 'Newlands', 'Cricket SA', 'completed', feeder]
  );

  console.log('  4 tournaments created');

  // ==================== USER ACCOUNTS FOR MATCH PLAYERS ====================
  // Get user IDs for the players
  const userRows = await pool.query(`SELECT id, name FROM users WHERE role = 'player' ORDER BY id`);
  const userMap = {};
  for (const u of userRows.rows) {
    userMap[u.name] = u.id;
  }

  // ==================== COMPLETED MATCHES WITH FULL SCORING DATA ====================
  console.log('Creating matches with scoring data...');

  // --- Match 1: Cape Cobras vs Titans (Completed) ---
  const m1 = await createMatch('Cape Cobras', 'Titans', 'Newlands Cricket Ground, Cape Town', 20,
    '2026-01-10 14:00', 'completed', 'Cape Cobras', 'bat', 'Cape Cobras', feeder, tournament1Id);
  await seedMatchScoring(m1, userMap, {
    team1: ['Michael Brown', 'Daniel Patel', 'Ryan Phillips', 'Shane van Wyk', 'David Petersen', 'Ravi Singh'],
    team2: ['Keegan Adams', 'Sipho Ndlovu', 'Andile Mthembu', 'Thabo Mokoena', 'Jayden September', 'Brandon Davids'],
    team1Batting: [
      { name: 'Michael Brown', runs: 64, balls: 47, fours: 6, sixes: 3, out: true, outType: 'c Singh b Ndlovu' },
      { name: 'Daniel Patel', runs: 60, balls: 41, fours: 5, sixes: 2, out: false, outType: null },
      { name: 'Ryan Phillips', runs: 15, balls: 16, fours: 1, sixes: 0, out: true, outType: 'b Singh' },
      { name: 'Shane van Wyk', runs: 22, balls: 14, fours: 2, sixes: 1, out: true, outType: 'lbw b Adams' },
      { name: 'David Petersen', runs: 8, balls: 10, fours: 1, sixes: 0, out: false, outType: null },
      { name: 'Ravi Singh', runs: 5, balls: 3, fours: 0, sixes: 1, out: false, outType: null },
    ],
    team2Batting: [
      { name: 'Keegan Adams', runs: 45, balls: 35, fours: 4, sixes: 2, out: true, outType: 'c Patel b Singh' },
      { name: 'Sipho Ndlovu', runs: 38, balls: 30, fours: 3, sixes: 1, out: true, outType: 'b Phillips' },
      { name: 'Andile Mthembu', runs: 32, balls: 28, fours: 3, sixes: 0, out: true, outType: 'run out (Brown)' },
      { name: 'Thabo Mokoena', runs: 20, balls: 18, fours: 2, sixes: 0, out: true, outType: 'c Brown b Patel' },
      { name: 'Jayden September', runs: 12, balls: 9, fours: 1, sixes: 0, out: false, outType: null },
      { name: 'Brandon Davids', runs: 3, balls: 5, fours: 0, sixes: 0, out: true, outType: 'b van Wyk' },
    ],
    team1Bowling: [
      { name: 'Ravi Singh', overs: 3.3, runs: 33, wickets: 1, maidens: 0 },
      { name: 'David Petersen', overs: 4, runs: 28, wickets: 0, maidens: 0 },
      { name: 'Ryan Phillips', overs: 4, runs: 36, wickets: 1, maidens: 0 },
      { name: 'Shane van Wyk', overs: 4, runs: 30, wickets: 1, maidens: 1 },
      { name: 'Daniel Patel', overs: 4, runs: 25, wickets: 1, maidens: 0 },
    ],
    team2Bowling: [
      { name: 'Keegan Adams', overs: 4, runs: 35, wickets: 1, maidens: 0 },
      { name: 'Sipho Ndlovu', overs: 4, runs: 38, wickets: 1, maidens: 0 },
      { name: 'Brandon Davids', overs: 4, runs: 42, wickets: 0, maidens: 0 },
      { name: 'Jayden September', overs: 4, runs: 30, wickets: 0, maidens: 0 },
      { name: 'Andile Mthembu', overs: 4, runs: 29, wickets: 1, maidens: 0 },
    ],
    team1Score: 174, team1Wickets: 2, team1Overs: 19.3,
    team2Score: 150, team2Wickets: 5, team2Overs: 20,
  });

  // --- Match 2: Greenfield HS vs South HS (Completed) ---
  const m2 = await createMatch('Greenfield HS 1st XI', 'South High School 1st XI', 'Greenfield Oval', 20,
    '2026-01-18 10:00', 'completed', 'Greenfield HS 1st XI', 'bat', 'Greenfield HS 1st XI', feeder, null);
  await seedMatchScoring(m2, userMap, {
    team1: ['Michael Brown', 'Daniel Patel', 'Ryan Phillips', 'Noah Williams', 'Daniel Smith', 'Shane van Wyk'],
    team2: ['Liam Andrews', 'Ethan Jacobs', 'Logan Barton', 'Liam Smith', 'Liam Jacobs', 'Aiden Brown'],
    team1Batting: [
      { name: 'Michael Brown', runs: 78, balls: 52, fours: 8, sixes: 3, out: false, outType: null },
      { name: 'Noah Williams', runs: 42, balls: 34, fours: 4, sixes: 1, out: true, outType: 'c Jacobs b Smith' },
      { name: 'Daniel Patel', runs: 28, balls: 22, fours: 3, sixes: 0, out: true, outType: 'b Jacobs' },
      { name: 'Ryan Phillips', runs: 15, balls: 10, fours: 1, sixes: 1, out: false, outType: null },
    ],
    team2Batting: [
      { name: 'Liam Andrews', runs: 55, balls: 40, fours: 5, sixes: 2, out: true, outType: 'c Brown b Phillips' },
      { name: 'Ethan Jacobs', runs: 38, balls: 32, fours: 4, sixes: 0, out: true, outType: 'b Patel' },
      { name: 'Logan Barton', runs: 22, balls: 20, fours: 2, sixes: 0, out: true, outType: 'lbw b Williams' },
      { name: 'Liam Smith', runs: 18, balls: 15, fours: 1, sixes: 1, out: true, outType: 'c Patel b Singh' },
      { name: 'Aiden Brown', runs: 10, balls: 8, fours: 1, sixes: 0, out: false, outType: null },
    ],
    team1Bowling: [
      { name: 'Ryan Phillips', overs: 4, runs: 32, wickets: 1, maidens: 0 },
      { name: 'Shane van Wyk', overs: 4, runs: 28, wickets: 0, maidens: 1 },
      { name: 'Daniel Patel', overs: 4, runs: 35, wickets: 1, maidens: 0 },
      { name: 'Noah Williams', overs: 4, runs: 25, wickets: 1, maidens: 0 },
    ],
    team2Bowling: [
      { name: 'Liam Smith', overs: 4, runs: 38, wickets: 1, maidens: 0 },
      { name: 'Ethan Jacobs', overs: 4, runs: 42, wickets: 1, maidens: 0 },
      { name: 'Liam Jacobs', overs: 4, runs: 35, wickets: 0, maidens: 0 },
      { name: 'Aiden Brown', overs: 4, runs: 48, wickets: 0, maidens: 0 },
    ],
    team1Score: 185, team1Wickets: 2, team1Overs: 20,
    team2Score: 158, team2Wickets: 4, team2Overs: 20,
  });

  // --- Match 3: Dolphins vs Lions (Completed - close game) ---
  const m3 = await createMatch('Dolphins', 'Red Lions', 'Kingsmead, Durban', 20,
    '2026-02-05 14:00', 'completed', 'Dolphins', 'bowl', 'Red Lions', feeder, null);
  await seedMatchScoring(m3, userMap, {
    team1: ['Mpho Dlamini', 'Kabelo Mashaba', 'Tyrone Pillay', 'Nico Erasmus', 'Liam Andrews', 'Ethan Jacobs'],
    team2: ['Tshepo Modise', 'Cameron Wright', 'Jacques Fourie', 'Wandile Khumalo', 'Keegan Adams', 'Brandon Davids'],
    team1Batting: [
      { name: 'Mpho Dlamini', runs: 72, balls: 48, fours: 7, sixes: 3, out: false, outType: null },
      { name: 'Kabelo Mashaba', runs: 45, balls: 38, fours: 4, sixes: 1, out: true, outType: 'c Modise b Fourie' },
      { name: 'Tyrone Pillay', runs: 28, balls: 20, fours: 3, sixes: 0, out: true, outType: 'b Khumalo' },
      { name: 'Liam Andrews', runs: 18, balls: 12, fours: 2, sixes: 0, out: false, outType: null },
    ],
    team2Batting: [
      { name: 'Tshepo Modise', runs: 68, balls: 44, fours: 6, sixes: 3, out: true, outType: 'c Pillay b Dlamini' },
      { name: 'Cameron Wright', runs: 52, balls: 40, fours: 5, sixes: 1, out: true, outType: 'run out (Andrews)' },
      { name: 'Jacques Fourie', runs: 25, balls: 18, fours: 2, sixes: 1, out: true, outType: 'b Pillay' },
      { name: 'Keegan Adams', runs: 15, balls: 12, fours: 1, sixes: 0, out: true, outType: 'c Mashaba b Jacobs' },
      { name: 'Wandile Khumalo', runs: 5, balls: 6, fours: 0, sixes: 0, out: false, outType: null },
    ],
    team1Bowling: [
      { name: 'Mpho Dlamini', overs: 4, runs: 38, wickets: 1, maidens: 0 },
      { name: 'Nico Erasmus', overs: 4, runs: 35, wickets: 0, maidens: 0 },
      { name: 'Tyrone Pillay', overs: 4, runs: 32, wickets: 1, maidens: 0 },
      { name: 'Ethan Jacobs', overs: 4, runs: 30, wickets: 1, maidens: 1 },
      { name: 'Liam Andrews', overs: 4, runs: 30, wickets: 0, maidens: 0 },
    ],
    team2Bowling: [
      { name: 'Tshepo Modise', overs: 4, runs: 34, wickets: 0, maidens: 0 },
      { name: 'Jacques Fourie', overs: 4, runs: 38, wickets: 1, maidens: 0 },
      { name: 'Wandile Khumalo', overs: 4, runs: 30, wickets: 1, maidens: 0 },
      { name: 'Brandon Davids', overs: 4, runs: 42, wickets: 0, maidens: 0 },
      { name: 'Keegan Adams', overs: 4, runs: 19, wickets: 0, maidens: 1 },
    ],
    team1Score: 168, team1Wickets: 2, team1Overs: 20,
    team2Score: 165, team2Wickets: 4, team2Overs: 20,
  });

  // --- Match 4: Cape Cobras vs Titans (LIVE match!) ---
  const m4 = await createMatch('Cape Cobras', 'Titans', 'Newlands Cricket Ground, Cape Town', 20,
    '2026-04-20 14:00', 'live', 'Cape Cobras', 'bat', null, feeder, tournament1Id);
  await seedMatchScoring(m4, userMap, {
    team1: ['Michael Brown', 'Daniel Patel', 'Ryan Phillips', 'Shane van Wyk', 'David Petersen', 'Ravi Singh'],
    team2: ['Keegan Adams', 'Sipho Ndlovu', 'Andile Mthembu', 'Thabo Mokoena', 'Jayden September', 'Brandon Davids'],
    team1Batting: [
      { name: 'Michael Brown', runs: 42, balls: 30, fours: 4, sixes: 2, out: false, outType: null },
      { name: 'Daniel Patel', runs: 35, balls: 25, fours: 3, sixes: 1, out: false, outType: null },
      { name: 'Shane van Wyk', runs: 12, balls: 8, fours: 1, sixes: 0, out: true, outType: 'c Ndlovu b Adams' },
    ],
    team2Batting: [],
    team1Bowling: [],
    team2Bowling: [
      { name: 'Keegan Adams', overs: 3, runs: 24, wickets: 1, maidens: 0 },
      { name: 'Sipho Ndlovu', overs: 3, runs: 28, wickets: 0, maidens: 0 },
      { name: 'Brandon Davids', overs: 3, runs: 22, wickets: 0, maidens: 0 },
      { name: 'Andile Mthembu', overs: 2, runs: 15, wickets: 0, maidens: 0 },
    ],
    team1Score: 95, team1Wickets: 1, team1Overs: 11,
    team2Score: 0, team2Wickets: 0, team2Overs: 0,
  });

  // --- Match 5: Bishops vs Hilton College (Upcoming) ---
  await createMatch('Bishops 1st XI', 'Hilton College 1st XI', 'Bishops Ground, Cape Town', 20,
    '2026-04-25 10:00', 'upcoming', null, null, null, feeder, null);

  // --- Match 6: Green Mambas vs Dolphins (Upcoming) ---
  await createMatch('Green Mambas', 'Dolphins', 'Durban Cricket Ground', 20,
    '2026-04-28 14:00', 'upcoming', null, null, null, feeder, tournament1Id);

  // --- Match 7: South HS vs Rondebosch Boys (Upcoming) ---
  await createMatch('South High School 1st XI', 'Rondebosch Boys 1st XI', 'South HS Cricket Ground', 20,
    '2026-05-02 10:00', 'upcoming', null, null, null, feeder, null);

  console.log('  7 matches created (3 completed, 1 live, 3 upcoming)');

  // ==================== SUMMARY ====================
  console.log('\n=== Seed Complete! ===\n');
  console.log('Data Summary:');
  console.log('  30 registered players');
  console.log('  12 teams (6 school, 6 club)');
  console.log('  4 tournaments (1 in progress, 2 upcoming, 1 completed)');
  console.log('  7 matches (3 completed with full scoring, 1 live, 3 upcoming)');
  console.log('  10 tournament fixtures');
  console.log('\nLogin Accounts:');
  console.log('  Feeder:  feeder@cricket.com / password123');
  console.log('  Viewer:  viewer@cricket.com / password123');
  console.log('  Player:  michael.brown@player.com / password123');

  await pool.end();
}

// ==================== HELPER FUNCTIONS ====================

async function insertUser(name, email, hash, role) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role, approved)
     VALUES ($1, $2, $3, $4, true) ON CONFLICT (email) DO NOTHING RETURNING id`,
    [name, email, hash, role]
  );
  if (result.rows.length > 0) return result.rows[0].id;
  const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
  return existing.rows[0].id;
}

async function addPlayerToTeam(teamId, playerId) {
  await pool.query(
    'INSERT INTO team_players (team_id, player_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [teamId, playerId]
  );
}

async function createMatch(team1, team2, venue, overs, date, status, tossWinner, tossDecision, winner, feederId, tournamentId) {
  const result = await pool.query(
    `INSERT INTO matches (team1_name, team2_name, venue, total_overs, match_date, status, toss_winner, toss_decision, winner, created_by, tournament_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
    [team1, team2, venue, overs, date, status, tossWinner, tossDecision, winner, feederId, tournamentId]
  );
  return result.rows[0].id;
}

async function seedMatchScoring(matchId, userMap, data) {
  // Assign players to match
  for (let i = 0; i < data.team1.length; i++) {
    const name = data.team1[i];
    const userId = userMap[name];
    if (userId) {
      await pool.query(
        `INSERT INTO match_players (match_id, player_id, team, status) VALUES ($1, $2, 1, 'approved') ON CONFLICT DO NOTHING`,
        [matchId, userId]
      );
    }
  }
  for (let i = 0; i < data.team2.length; i++) {
    const name = data.team2[i];
    const userId = userMap[name];
    if (userId) {
      await pool.query(
        `INSERT INTO match_players (match_id, player_id, team, status) VALUES ($1, $2, 2, 'approved') ON CONFLICT DO NOTHING`,
        [matchId, userId]
      );
    }
  }

  // Insert batting scores
  for (const b of data.team1Batting) {
    const userId = userMap[b.name];
    if (!userId) continue;
    await pool.query(
      `INSERT INTO player_scores (match_id, player_id, team, runs_scored, balls_faced, fours, sixes, is_out, out_type)
       VALUES ($1, $2, 1, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (match_id, player_id) DO UPDATE SET
         runs_scored = $3, balls_faced = $4, fours = $5, sixes = $6, is_out = $7, out_type = $8`,
      [matchId, userId, b.runs, b.balls, b.fours, b.sixes, b.out, b.outType]
    );
  }
  for (const b of data.team2Batting) {
    const userId = userMap[b.name];
    if (!userId) continue;
    await pool.query(
      `INSERT INTO player_scores (match_id, player_id, team, runs_scored, balls_faced, fours, sixes, is_out, out_type)
       VALUES ($1, $2, 2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (match_id, player_id) DO UPDATE SET
         runs_scored = $3, balls_faced = $4, fours = $5, sixes = $6, is_out = $7, out_type = $8`,
      [matchId, userId, b.runs, b.balls, b.fours, b.sixes, b.out, b.outType]
    );
  }

  // Insert bowling scores
  for (const b of data.team1Bowling) {
    const userId = userMap[b.name];
    if (!userId) continue;
    await pool.query(
      `INSERT INTO player_scores (match_id, player_id, team, overs_bowled, runs_conceded, wickets_taken, maidens)
       VALUES ($1, $2, 1, $3, $4, $5, $6)
       ON CONFLICT (match_id, player_id) DO UPDATE SET
         overs_bowled = $3, runs_conceded = $4, wickets_taken = $5, maidens = $6`,
      [matchId, userId, b.overs, b.runs, b.wickets, b.maidens]
    );
  }
  for (const b of data.team2Bowling) {
    const userId = userMap[b.name];
    if (!userId) continue;
    await pool.query(
      `INSERT INTO player_scores (match_id, player_id, team, overs_bowled, runs_conceded, wickets_taken, maidens)
       VALUES ($1, $2, 2, $3, $4, $5, $6)
       ON CONFLICT (match_id, player_id) DO UPDATE SET
         overs_bowled = $3, runs_conceded = $4, wickets_taken = $5, maidens = $6`,
      [matchId, userId, b.overs, b.runs, b.wickets, b.maidens]
    );
  }

  // Update match scores
  await pool.query(
    `UPDATE matches SET team1_score = $1, team1_wickets = $2, team1_overs = $3,
     team2_score = $4, team2_wickets = $5, team2_overs = $6 WHERE id = $7`,
    [data.team1Score, data.team1Wickets, data.team1Overs,
     data.team2Score, data.team2Wickets, data.team2Overs, matchId]
  );
}

seed().catch(e => { console.error(e); process.exit(1); });
