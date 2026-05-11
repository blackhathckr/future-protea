require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { createId } = require('@paralleldrive/cuid2');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
});

// ==================== HELPERS ====================
async function insertUser(name, email, hash, role, bat, bowl) {
  const id = createId();
  const r = await pool.query(
    `INSERT INTO users (id, name, email, password, role, batting_style, bowling_style, approved)
     VALUES ($1,$2,$3,$4,$5,$6,$7,true) ON CONFLICT (email) DO NOTHING RETURNING id`, [id, name, email, hash, role, bat, bowl]);
  if (r.rows.length > 0) return r.rows[0].id;
  return (await pool.query(`SELECT id FROM users WHERE email=$1`, [email])).rows[0].id;
}

async function createMatch(t1, t2, venue, overs, date, status, tossW, tossD, winner, feederId, tournId) {
  const id = createId();
  const r = await pool.query(
    `INSERT INTO matches (id,team1_name,team2_name,venue,total_overs,match_date,status,toss_winner,toss_decision,winner,created_by,tournament_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
    [id,t1,t2,venue,overs,date,status,tossW,tossD,winner,feederId,tournId]);
  return r.rows[0].id;
}

async function assignPlayers(matchId, userIds, team) {
  for (const uid of userIds) {
    const id = createId();
    await pool.query(`INSERT INTO match_players (id,match_id,player_id,team,status) VALUES ($1,$2,$3,$4,'approved') ON CONFLICT DO NOTHING`, [id, matchId, uid, team]);
  }
}

async function addBatting(matchId, userId, team, runs, balls, fours, sixes, isOut, outType) {
  const id = createId();
  await pool.query(
    `INSERT INTO player_scores (id,match_id,player_id,team,runs_scored,balls_faced,fours,sixes,is_out,out_type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (match_id,player_id) DO UPDATE SET
     runs_scored=$5,balls_faced=$6,fours=$7,sixes=$8,is_out=$9,out_type=$10`,
    [id,matchId,userId,team,runs,balls,fours,sixes,isOut,outType]);
}

async function addBowling(matchId, userId, team, overs, runs, wickets, maidens) {
  const id = createId();
  await pool.query(
    `INSERT INTO player_scores (id,match_id,player_id,team,overs_bowled,runs_conceded,wickets_taken,maidens)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (match_id,player_id) DO UPDATE SET
     overs_bowled=$5,runs_conceded=$6,wickets_taken=$7,maidens=$8`,
    [id,matchId,userId,team,overs,runs,wickets,maidens]);
}

async function updateMatchScore(matchId, t1s, t1w, t1o, t2s, t2w, t2o) {
  await pool.query(`UPDATE matches SET team1_score=$1,team1_wickets=$2,team1_overs=$3,team2_score=$4,team2_wickets=$5,team2_overs=$6 WHERE id=$7`,
    [t1s,t1w,t1o,t2s,t2w,t2o,matchId]);
}

function genBalls(matchId, innings, batIds, bowlIds, totalScore, totalWickets, totalOvers) {
  const balls = [];
  const fullOv = Math.floor(totalOvers);
  const partB = Math.round((totalOvers - fullOv) * 10);
  const totalB = fullOv * 6 + partB;
  if (totalB === 0) return balls;

  let runsLeft = totalScore, wLeft = totalWickets, bIdx = 0, bowIdx = 0, ov = 0, bl = 0;
  const wPos = new Set();
  if (wLeft > 0) { const iv = Math.floor(totalB/(wLeft+1)); for (let w=0;w<wLeft;w++) wPos.add(iv*(w+1)); }

  for (let i = 0; i < totalB; i++) {
    const batId = batIds[bIdx % batIds.length];
    const bowId = bowlIds[bowIdx % bowlIds.length];
    let runs = 0, isW = false, wType = null;

    if (wPos.has(i) && wLeft > 0) { isW = true; wType = ['Bowled','Caught','LBW','Run Out'][Math.floor(Math.random()*4)]; wLeft--; }
    else if (runsLeft > 0) {
      const rem = totalB - i;
      const avg = runsLeft / rem;
      if (avg > 2 && Math.random() < 0.12) runs = 6;
      else if (avg > 1.5 && Math.random() < 0.18) runs = 4;
      else if (Math.random() < 0.3) runs = 0;
      else if (Math.random() < 0.5) runs = 1;
      else runs = Math.random() < 0.7 ? 2 : 3;
      runs = Math.min(runs, runsLeft);
      runsLeft -= runs;
    }

    balls.push([createId(),matchId,innings,ov,bl+1,batId,bowId,runs,false,false,false,false,isW,wType,0,null]);
    bl++;
    if (bl >= 6) { ov++; bl = 0; bowIdx++; }
    if (isW) { bIdx++; if (bIdx >= batIds.length) break; }
  }
  return balls;
}

async function insertBalls(ballsArr) {
  for (const b of ballsArr) {
    await pool.query(
      `INSERT INTO balls (id,match_id,innings,over_number,ball_number,batsman_id,bowler_id,runs,is_wide,is_noball,is_bye,is_legbye,is_wicket,wicket_type,extras,commentary)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`, b);
  }
}

// ==================== MAIN SEED ====================
async function seed() {
  const hash = await bcrypt.hash('password123', 10);
  console.log('=== Future Protea - Comprehensive Seed ===\n');

  // CLEAN
  console.log('Cleaning...');
  await pool.query('DELETE FROM balls'); await pool.query('DELETE FROM player_scores');
  await pool.query('DELETE FROM match_players'); await pool.query('DELETE FROM tournament_fixtures');
  await pool.query('DELETE FROM tournament_teams'); await pool.query('DELETE FROM team_players');
  await pool.query('UPDATE matches SET tournament_id=NULL'); await pool.query('DELETE FROM matches');
  await pool.query('DELETE FROM tournaments'); await pool.query('DELETE FROM teams');
  await pool.query('DELETE FROM registered_players'); await pool.query('DELETE FROM users');

  // ==================== USERS ====================
  console.log('Creating users...');
  const feeder = await insertUser('Liam van der Merwe','feeder@cricket.com',hash,'feeder',null,null);
  await insertUser('Cricket Fan','viewer@cricket.com',hash,'viewer',null,null);

  // 6 teams x 6 players = 36 players
  const P = {}; // name -> userId
  const allPlayers = [
    // Green Mambas (Cape Cobras CC)
    {n:'Shane van Wyk',    e:'shane.vw@p.com',  bat:'Right-hand Bat', bowl:'Right-arm Fast'},
    {n:'David Petersen',   e:'david.p@p.com',   bat:'Right-hand Bat', bowl:'Right-arm Spin'},
    {n:'Ravi Singh',       e:'ravi.s@p.com',    bat:'Left-hand Bat',  bowl:'Left-arm Fast'},
    {n:'Thabo Mokoena',    e:'thabo.m@p.com',   bat:'Right-hand Bat', bowl:'None'},
    {n:'Jayden September', e:'jayden.s@p.com',  bat:'Left-hand Bat',  bowl:'Left-arm Spin'},
    {n:'Brandon Davids',   e:'brandon.d@p.com', bat:'Right-hand Bat', bowl:'Right-arm Fast'},

    // Golden Eagles (Titans CC)
    {n:'Keegan Adams',     e:'keegan.a@p.com',  bat:'Right-hand Bat', bowl:'Right-arm Fast'},
    {n:'Sipho Ndlovu',     e:'sipho.n@p.com',   bat:'Right-hand Bat', bowl:'Right-arm Spin'},
    {n:'Andile Mthembu',   e:'andile.m@p.com',  bat:'Left-hand Bat',  bowl:'None'},
    {n:'Nico Erasmus',     e:'nico.e@p.com',    bat:'Right-hand Bat', bowl:'Right-arm Fast'},
    {n:'Lungelo Zulu',     e:'lungelo.z@p.com', bat:'Right-hand Bat', bowl:'Left-arm Spin'},
    {n:'Cameron Wright',   e:'cameron.w@p.com', bat:'Left-hand Bat',  bowl:'None'},

    // Blue Sharks (Riverton CC)
    {n:'Michael Brown',    e:'michael.b@p.com', bat:'Right-hand Bat', bowl:'Right-arm Fast'},
    {n:'Daniel Patel',     e:'daniel.p@p.com',  bat:'Right-hand Bat', bowl:'Right-arm Spin'},
    {n:'Ryan Phillips',    e:'ryan.p@p.com',    bat:'Left-hand Bat',  bowl:'Left-arm Fast'},
    {n:'Noah Williams',    e:'noah.w@p.com',    bat:'Right-hand Bat', bowl:'Right-arm Spin'},
    {n:'Liam Andrews',     e:'liam.a@p.com',    bat:'Right-hand Bat', bowl:'None'},
    {n:'Justin Naidoo',    e:'justin.n@p.com',  bat:'Right-hand Bat', bowl:'Right-arm Fast'},

    // Red Lions (Lions CC)
    {n:'Tshepo Modise',    e:'tshepo.m@p.com',  bat:'Right-hand Bat', bowl:'Left-arm Fast'},
    {n:'Jacques Fourie',   e:'jacques.f@p.com', bat:'Right-hand Bat', bowl:'Right-arm Fast'},
    {n:'Wandile Khumalo',  e:'wandile.k@p.com', bat:'Right-hand Bat', bowl:'Right-arm Spin'},
    {n:'Kabelo Mashaba',   e:'kabelo.m@p.com',  bat:'Left-hand Bat',  bowl:'None'},
    {n:'Tyrone Pillay',    e:'tyrone.p@p.com',  bat:'Right-hand Bat', bowl:'Right-arm Spin'},
    {n:'Mpho Dlamini',     e:'mpho.d@p.com',    bat:'Right-hand Bat', bowl:'Right-arm Fast'},

    // Dolphins (Dolphins CC) - extra team for variety
    {n:'Ethan Jacobs',     e:'ethan.j@p.com',   bat:'Right-hand Bat', bowl:'Right-arm Spin'},
    {n:'Logan Barton',     e:'logan.b@p.com',   bat:'Left-hand Bat',  bowl:'None'},
    {n:'Liam Smith',       e:'liam.s@p.com',    bat:'Right-hand Bat', bowl:'Right-arm Fast'},
    {n:'Aiden Brown',      e:'aiden.b@p.com',   bat:'Right-hand Bat', bowl:'Right-arm Fast'},
    {n:'Daniel Smith',     e:'daniel.s@p.com',  bat:'Left-hand Bat',  bowl:'None'},
    {n:'Liam Jacobs',      e:'liam.j@p.com',    bat:'Right-hand Bat', bowl:'Left-arm Spin'},

    // Warriors (extra)
    {n:'Marco Jansen',     e:'marco.j@p.com',   bat:'Left-hand Bat',  bowl:'Left-arm Fast'},
    {n:'Kyle Verreynne',   e:'kyle.v@p.com',    bat:'Right-hand Bat', bowl:'None'},
    {n:'George Linde',     e:'george.l@p.com',  bat:'Left-hand Bat',  bowl:'Left-arm Spin'},
    {n:'Anrich Nortje',    e:'anrich.n@p.com',  bat:'Right-hand Bat', bowl:'Right-arm Fast'},
    {n:'Wiaan Mulder',     e:'wiaan.m@p.com',   bat:'Right-hand Bat', bowl:'Right-arm Fast'},
    {n:'Keshav Maharaj',   e:'keshav.m@p.com',  bat:'Left-hand Bat',  bowl:'Left-arm Spin'},
  ];

  const regPlayerIds = [];
  for (let i = 0; i < allPlayers.length; i++) {
    const p = allPlayers[i];
    const uid = await insertUser(p.n, p.e, hash, 'player', p.bat, p.bowl);
    P[p.n] = uid;
    const dob = `200${7 + (i%3)}-${String((i%12)+1).padStart(2,'0')}-${String((i%28)+1).padStart(2,'0')}`;
    const schools = ['Greenfield HS','South High School','Paarl Boys High','Rondebosch Boys','Bishops','Hilton College','DHS','KES','Grey College','SACS'];
    const clubs = ['Cape Cobras CC','Titans CC','Riverton CC','Lions CC','Dolphins CC','Warriors CC'];
    const code = `GUCT-${String(i+1).padStart(4,'0')}`;
    const rid = createId();
    const r = await pool.query(
      `INSERT INTO registered_players (id,name,player_id_code,date_of_birth,school_name,club_name,batting_style,bowling_style,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [rid, p.n, code, dob, schools[i%10], clubs[i%6], p.bat, p.bowl, feeder]);
    regPlayerIds.push(r.rows[0].id);
  }
  console.log(`  ${allPlayers.length} players created`);

  // ==================== TEAMS ====================
  console.log('Creating teams...');
  const teamDefs = [
    {name:'Green Mambas',   type:'club',   club:'Cape Cobras CC', players:[0,1,2,3,4,5]},
    {name:'Golden Eagles',  type:'club',   club:'Titans CC',      players:[6,7,8,9,10,11]},
    {name:'Blue Sharks',    type:'club',   club:'Riverton CC',    players:[12,13,14,15,16,17]},
    {name:'Red Lions',      type:'club',   club:'Lions CC',       players:[18,19,20,21,22,23]},
    {name:'Dolphins',       type:'club',   club:'Dolphins CC',    players:[24,25,26,27,28,29]},
    {name:'Warriors',       type:'club',   club:'Warriors CC',    players:[30,31,32,33,34,35]},
  ];
  const teamIds = [];
  for (const t of teamDefs) {
    const tid = createId();
    const r = await pool.query(
      `INSERT INTO teams (id,team_name,team_type,school_name,club_name,created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [tid, t.name, t.type, null, t.club, feeder]);
    teamIds.push(r.rows[0].id);
    for (const pi of t.players) {
      const tpid = createId();
      await pool.query(`INSERT INTO team_players (id,team_id,player_id) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`, [tpid, r.rows[0].id, regPlayerIds[pi]]);
    }
  }
  console.log(`  ${teamDefs.length} teams created`);

  // Team player user IDs grouped
  const T = teamDefs.map(t => t.players.map(i => P[allPlayers[i].n]));

  // ==================== TOURNAMENT 1: Protea T20 Championship (COMPLETED) ====================
  console.log('Creating Protea T20 Championship (completed)...');
  const trid = createId();
  const ct = await pool.query(
    `INSERT INTO tournaments (id,name,type,overs,start_date,end_date,venue,organizer,status,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [trid,'Protea T20 Championship','T20',20,'2025-09-01','2025-10-15','Various Grounds, SA','Cricket South Africa Youth','completed',feeder]);
  const ctId = ct.rows[0].id;

  // 4 teams: Mambas, Eagles, Sharks, Lions in Group A; + Group B with Dolphins, Warriors, Mambas B, Eagles B
  // Simplified: 4 teams round-robin group stage, then semis + final
  const ctTeams = [
    {tid:teamIds[0], group:'Group A', p:6, w:5, l:1, nr:0, pts:10},   // Green Mambas
    {tid:teamIds[1], group:'Group A', p:6, w:4, l:2, nr:0, pts:8},    // Golden Eagles
    {tid:teamIds[2], group:'Group A', p:6, w:2, l:4, nr:0, pts:4},    // Blue Sharks
    {tid:teamIds[3], group:'Group A', p:6, w:1, l:5, nr:0, pts:2},    // Red Lions
    {tid:teamIds[4], group:'Group B', p:6, w:5, l:1, nr:0, pts:10},   // Dolphins
    {tid:teamIds[5], group:'Group B', p:6, w:3, l:3, nr:0, pts:6},    // Warriors
  ];
  for (const t of ctTeams) {
    const ttid = createId();
    await pool.query(`INSERT INTO tournament_teams (id,tournament_id,team_id,group_name,played,won,lost,no_result,points) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [ttid,ctId,t.tid,t.group,t.p,t.w,t.l,t.nr,t.pts]);
  }

  // Group A fixtures (round robin = 6 matches)
  const gaFixtures = [
    {t1:'Green Mambas',t2:'Golden Eagles', d:'2025-09-01 10:00',v:'Newlands B',      s:'completed',g:'Group A',w:'Green Mambas'},
    {t1:'Blue Sharks', t2:'Red Lions',     d:'2025-09-01 14:00',v:'Cape Town Oval',   s:'completed',g:'Group A',w:'Blue Sharks'},
    {t1:'Green Mambas',t2:'Blue Sharks',   d:'2025-09-08 10:00',v:'Durban Cricket Gnd',s:'completed',g:'Group A',w:'Green Mambas'},
    {t1:'Golden Eagles',t2:'Red Lions',    d:'2025-09-08 14:00',v:'SuperSport Park',  s:'completed',g:'Group A',w:'Golden Eagles'},
    {t1:'Green Mambas',t2:'Red Lions',     d:'2025-09-15 10:00',v:'Newlands B',       s:'completed',g:'Group A',w:'Green Mambas'},
    {t1:'Golden Eagles',t2:'Blue Sharks',  d:'2025-09-15 14:00',v:'SuperSport Park',  s:'completed',g:'Group A',w:'Golden Eagles'},
    // Each team plays each other twice (return leg)
    {t1:'Golden Eagles',t2:'Green Mambas', d:'2025-09-22 10:00',v:'SuperSport Park',  s:'completed',g:'Group A',w:'Golden Eagles'},
    {t1:'Red Lions',t2:'Blue Sharks',      d:'2025-09-22 14:00',v:'Wanderers',        s:'completed',g:'Group A',w:'Blue Sharks'},
    {t1:'Blue Sharks',t2:'Green Mambas',   d:'2025-09-29 10:00',v:'Cape Town Oval',   s:'completed',g:'Group A',w:'Green Mambas'},
    {t1:'Red Lions',t2:'Golden Eagles',    d:'2025-09-29 14:00',v:'Wanderers',        s:'completed',g:'Group A',w:'Golden Eagles'},
    {t1:'Red Lions',t2:'Green Mambas',     d:'2025-10-04 10:00',v:'Wanderers',        s:'completed',g:'Group A',w:'Green Mambas'},
    {t1:'Blue Sharks',t2:'Golden Eagles',  d:'2025-10-04 14:00',v:'Cape Town Oval',   s:'completed',g:'Group A',w:'Blue Sharks'},
  ];
  // Group B
  const gbFixtures = [
    {t1:'Dolphins',t2:'Warriors',  d:'2025-09-02 10:00',v:'Kingsmead',    s:'completed',g:'Group B',w:'Dolphins'},
    {t1:'Warriors',t2:'Dolphins',  d:'2025-09-09 10:00',v:'St Georges',   s:'completed',g:'Group B',w:'Dolphins'},
    {t1:'Dolphins',t2:'Warriors',  d:'2025-09-16 14:00',v:'Kingsmead',    s:'completed',g:'Group B',w:'Warriors'},
    {t1:'Warriors',t2:'Dolphins',  d:'2025-09-23 14:00',v:'St Georges',   s:'completed',g:'Group B',w:'Dolphins'},
    {t1:'Dolphins',t2:'Warriors',  d:'2025-09-30 10:00',v:'Kingsmead',    s:'completed',g:'Group B',w:'Dolphins'},
    {t1:'Warriors',t2:'Dolphins',  d:'2025-10-05 10:00',v:'St Georges',   s:'completed',g:'Group B',w:'Dolphins'},
  ];
  // Semis
  const semiFixtures = [
    {t1:'Green Mambas',t2:'Warriors',  d:'2025-10-10 10:00',v:'Newlands',      s:'completed',g:'Semi Final',w:'Green Mambas'},
    {t1:'Dolphins',t2:'Golden Eagles', d:'2025-10-10 14:00',v:'Kingsmead',     s:'completed',g:'Semi Final',w:'Golden Eagles'},
  ];
  // Final
  const finalFixture = [
    {t1:'Green Mambas',t2:'Golden Eagles',d:'2025-10-15 14:00',v:'Newlands Cricket Ground',s:'completed',g:'Final',w:'Green Mambas'},
  ];

  const allFixtures = [...gaFixtures,...gbFixtures,...semiFixtures,...finalFixture];
  for (const f of allFixtures) {
    const fid = createId();
    await pool.query(`INSERT INTO tournament_fixtures (id,tournament_id,team1_name,team2_name,match_date,venue,status,group_name,winner) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [fid,ctId,f.t1,f.t2,f.d,f.v,f.s,f.g,f.w]);
  }
  console.log(`  ${allFixtures.length} fixtures (Group A: ${gaFixtures.length}, Group B: ${gbFixtures.length}, Semis: ${semiFixtures.length}, Final: 1)`);

  // Create actual match records with scoring for key matches
  // We'll create 12 completed matches with full scoring
  const matchScoring = [
    // Match 1: Mambas vs Eagles (Group A)
    {t1:'Green Mambas',t2:'Golden Eagles',v:'Newlands B Ground',d:'2025-09-01 10:00',w:'Green Mambas',tw:'Green Mambas',td:'bat',tid:ctId,
     t1b:[{i:0,r:82,b:55,f:9,s:3,o:false},{i:1,r:45,b:35,f:4,s:1,o:true,ot:'c Adams b Ndlovu'},{i:2,r:28,b:20,f:3,s:0,o:true,ot:'b Erasmus'},{i:3,r:18,b:14,f:2,s:0,o:false}],
     t2b:[{i:6,r:55,b:40,f:5,s:2,o:true,ot:'c Singh b Petersen'},{i:7,r:42,b:32,f:4,s:1,o:true,ot:'b van Wyk'},{i:8,r:30,b:25,f:2,s:1,o:true,ot:'run out'},{i:9,r:15,b:12,f:1,s:0,o:true,ot:'lbw b September'}],
     t1bowl:[{i:2,ov:4,r:32,w:1,m:0},{i:1,ov:4,r:28,w:1,m:1},{i:4,ov:4,r:35,w:1,m:0},{i:0,ov:4,r:30,w:0,m:0},{i:5,ov:4,r:25,w:1,m:0}],
     t2bowl:[{i:6,ov:4,r:38,w:0,m:0},{i:7,ov:4,r:35,w:1,m:0},{i:9,ov:4,r:42,w:1,m:0},{i:10,ov:4,r:30,w:0,m:0},{i:11,ov:4,r:28,w:0,m:0}],
     s1:188,w1:2,o1:20,s2:155,w2:4,o2:20},

    // Match 2: Sharks vs Lions (Group A)
    {t1:'Blue Sharks',t2:'Red Lions',v:'Cape Town Oval',d:'2025-09-01 14:00',w:'Blue Sharks',tw:'Red Lions',td:'bowl',tid:ctId,
     t1b:[{i:12,r:72,b:48,f:7,s:3,o:false},{i:13,r:40,b:32,f:4,s:1,o:true,ot:'c Fourie b Modise'},{i:14,r:25,b:18,f:2,s:1,o:true,ot:'b Khumalo'},{i:16,r:15,b:12,f:1,s:0,o:false}],
     t2b:[{i:18,r:48,b:38,f:4,s:2,o:true,ot:'c Brown b Phillips'},{i:19,r:35,b:28,f:3,s:1,o:true,ot:'b Patel'},{i:21,r:22,b:20,f:2,s:0,o:true,ot:'lbw b Williams'},{i:22,r:18,b:15,f:1,s:1,o:false}],
     t1bowl:[{i:14,ov:4,r:30,w:1,m:0},{i:13,ov:4,r:25,w:1,m:1},{i:15,ov:4,r:32,w:1,m:0},{i:12,ov:4,r:28,w:0,m:0},{i:17,ov:4,r:22,w:0,m:0}],
     t2bowl:[{i:18,ov:4,r:35,w:0,m:0},{i:19,ov:4,r:38,w:1,m:0},{i:20,ov:4,r:30,w:1,m:0},{i:22,ov:4,r:28,w:0,m:0},{i:23,ov:4,r:21,w:0,m:0}],
     s1:165,w1:2,o1:20,s2:138,w2:3,o2:20},

    // Match 3: Mambas vs Sharks (Group A)
    {t1:'Green Mambas',t2:'Blue Sharks',v:'Durban Cricket Ground',d:'2025-09-08 10:00',w:'Green Mambas',tw:'Blue Sharks',td:'bowl',tid:ctId,
     t1b:[{i:0,r:65,b:42,f:6,s:3,o:false},{i:3,r:48,b:38,f:5,s:1,o:true,ot:'c Andrews b Patel'},{i:1,r:32,b:24,f:3,s:1,o:true,ot:'b Phillips'},{i:2,r:20,b:15,f:2,s:0,o:false}],
     t2b:[{i:12,r:58,b:42,f:5,s:2,o:true,ot:'c van Wyk b Singh'},{i:16,r:35,b:28,f:3,s:1,o:true,ot:'b Davids'},{i:13,r:22,b:18,f:2,s:0,o:true,ot:'run out'},{i:14,r:18,b:15,f:1,s:1,o:false}],
     t1bowl:[{i:2,ov:4,r:30,w:1,m:0},{i:5,ov:4,r:28,w:1,m:0},{i:0,ov:4,r:35,w:0,m:0},{i:1,ov:4,r:25,w:0,m:1},{i:4,ov:4,r:22,w:1,m:0}],
     t2bowl:[{i:14,ov:4,r:38,w:1,m:0},{i:13,ov:4,r:35,w:1,m:0},{i:17,ov:4,r:30,w:0,m:0},{i:15,ov:4,r:32,w:0,m:0},{i:12,ov:4,r:30,w:0,m:0}],
     s1:178,w1:2,o1:20,s2:148,w2:3,o2:20},

    // Match 4: Eagles vs Lions (Group A)
    {t1:'Golden Eagles',t2:'Red Lions',v:'SuperSport Park',d:'2025-09-08 14:00',w:'Golden Eagles',tw:'Golden Eagles',td:'bat',tid:ctId,
     t1b:[{i:6,r:75,b:50,f:8,s:3,o:false},{i:8,r:42,b:34,f:4,s:1,o:true,ot:'c Pillay b Modise'},{i:7,r:28,b:22,f:2,s:1,o:true,ot:'b Fourie'}],
     t2b:[{i:18,r:52,b:40,f:5,s:1,o:true,ot:'c Ndlovu b Adams'},{i:23,r:38,b:30,f:3,s:1,o:true,ot:'b Zulu'},{i:22,r:25,b:20,f:2,s:0,o:false},{i:19,r:12,b:10,f:1,s:0,o:true,ot:'run out'}],
     t1bowl:[{i:6,ov:4,r:32,w:1,m:0},{i:7,ov:4,r:28,w:0,m:1},{i:10,ov:4,r:30,w:1,m:0},{i:9,ov:4,r:22,w:0,m:0},{i:11,ov:4,r:25,w:1,m:0}],
     t2bowl:[{i:18,ov:4,r:38,w:1,m:0},{i:19,ov:4,r:35,w:1,m:0},{i:20,ov:4,r:32,w:0,m:0},{i:22,ov:4,r:28,w:0,m:0}],
     s1:160,w1:2,o1:20,s2:142,w2:3,o2:20},

    // Match 5: Dolphins vs Warriors (Group B)
    {t1:'Dolphins',t2:'Warriors',v:'Kingsmead, Durban',d:'2025-09-02 10:00',w:'Dolphins',tw:'Dolphins',td:'bat',tid:ctId,
     t1b:[{i:24,r:68,b:45,f:7,s:2,o:false},{i:25,r:42,b:35,f:4,s:1,o:true,ot:'c Mulder b Nortje'},{i:26,r:30,b:22,f:2,s:2,o:true,ot:'b Maharaj'},{i:29,r:15,b:10,f:1,s:0,o:false}],
     t2b:[{i:30,r:55,b:42,f:5,s:2,o:true,ot:'c Jacobs b Smith'},{i:31,r:38,b:30,f:3,s:1,o:true,ot:'b Jacobs'},{i:32,r:22,b:18,f:2,s:0,o:true,ot:'run out'},{i:33,r:12,b:10,f:1,s:0,o:false}],
     t1bowl:[{i:26,ov:4,r:30,w:1,m:0},{i:24,ov:4,r:28,w:0,m:1},{i:29,ov:4,r:25,w:1,m:0},{i:27,ov:4,r:32,w:1,m:0},{i:25,ov:4,r:22,w:0,m:0}],
     t2bowl:[{i:33,ov:4,r:38,w:1,m:0},{i:30,ov:4,r:35,w:0,m:0},{i:35,ov:4,r:28,w:1,m:0},{i:32,ov:4,r:30,w:0,m:0},{i:34,ov:4,r:24,w:0,m:0}],
     s1:172,w1:2,o1:20,s2:142,w2:3,o2:20},

    // Match 6: Semi Final - Mambas vs Warriors
    {t1:'Green Mambas',t2:'Warriors',v:'Newlands Cricket Ground',d:'2025-10-10 10:00',w:'Green Mambas',tw:'Warriors',td:'bowl',tid:ctId,
     t1b:[{i:0,r:88,b:52,f:10,s:4,o:false},{i:1,r:52,b:38,f:5,s:2,o:true,ot:'c Verreynne b Nortje'},{i:3,r:25,b:18,f:2,s:1,o:true,ot:'b Maharaj'},{i:2,r:15,b:10,f:1,s:0,o:false}],
     t2b:[{i:30,r:62,b:45,f:6,s:2,o:true,ot:'c Mokoena b Singh'},{i:31,r:35,b:28,f:3,s:1,o:true,ot:'b September'},{i:34,r:28,b:22,f:2,s:1,o:true,ot:'c van Wyk b Petersen'},{i:32,r:15,b:12,f:1,s:0,o:false}],
     t1bowl:[{i:2,ov:4,r:35,w:1,m:0},{i:0,ov:4,r:30,w:0,m:1},{i:4,ov:4,r:28,w:1,m:0},{i:1,ov:4,r:25,w:1,m:0},{i:5,ov:4,r:32,w:0,m:0}],
     t2bowl:[{i:33,ov:4,r:42,w:1,m:0},{i:30,ov:4,r:38,w:0,m:0},{i:35,ov:4,r:32,w:1,m:0},{i:32,ov:4,r:35,w:0,m:0},{i:34,ov:4,r:33,w:0,m:0}],
     s1:195,w1:2,o1:20,s2:155,w2:3,o2:20},

    // Match 7: Semi Final - Dolphins vs Eagles
    {t1:'Dolphins',t2:'Golden Eagles',v:'Kingsmead, Durban',d:'2025-10-10 14:00',w:'Golden Eagles',tw:'Dolphins',td:'bat',tid:ctId,
     t1b:[{i:24,r:55,b:40,f:5,s:2,o:true,ot:'c Adams b Ndlovu'},{i:26,r:38,b:30,f:3,s:1,o:true,ot:'b Erasmus'},{i:25,r:22,b:18,f:2,s:0,o:true,ot:'lbw b Zulu'},{i:29,r:18,b:14,f:1,s:1,o:false}],
     t2b:[{i:6,r:72,b:48,f:7,s:3,o:false},{i:8,r:45,b:35,f:4,s:1,o:true,ot:'c Barton b Jacobs'},{i:7,r:28,b:22,f:2,s:1,o:false}],
     t1bowl:[{i:26,ov:4,r:32,w:0,m:0},{i:24,ov:4,r:38,w:1,m:0},{i:29,ov:4,r:30,w:0,m:0},{i:27,ov:4,r:28,w:0,m:0},{i:25,ov:4,r:20,w:0,m:1}],
     t2bowl:[{i:6,ov:4,r:30,w:1,m:0},{i:9,ov:4,r:28,w:1,m:0},{i:10,ov:4,r:25,w:1,m:0},{i:7,ov:4,r:22,w:0,m:1},{i:11,ov:4,r:30,w:0,m:0}],
     s1:148,w1:3,o1:20,s2:152,w2:1,o2:18.2},

    // Match 8: FINAL - Green Mambas vs Golden Eagles
    {t1:'Green Mambas',t2:'Golden Eagles',v:'Newlands Cricket Ground, Cape Town',d:'2025-10-15 14:00',w:'Green Mambas',tw:'Green Mambas',td:'bat',tid:ctId,
     t1b:[{i:0,r:95,b:58,f:10,s:5,o:false},{i:1,r:55,b:40,f:5,s:2,o:true,ot:'c Ndlovu b Adams'},{i:3,r:35,b:22,f:3,s:2,o:true,ot:'b Zulu'},{i:2,r:18,b:12,f:2,s:0,o:false}],
     t2b:[{i:6,r:68,b:48,f:6,s:3,o:true,ot:'c van Wyk b Singh'},{i:7,r:45,b:35,f:4,s:1,o:true,ot:'b Davids'},{i:8,r:30,b:24,f:2,s:1,o:true,ot:'run out (September)'},{i:9,r:22,b:18,f:2,s:0,o:true,ot:'c Mokoena b Petersen'},{i:11,r:8,b:6,f:1,s:0,o:false}],
     t1bowl:[{i:2,ov:4,r:35,w:1,m:0},{i:0,ov:4,r:32,w:0,m:1},{i:1,ov:4,r:30,w:1,m:0},{i:5,ov:4,r:38,w:1,m:0},{i:4,ov:4,r:28,w:1,m:0}],
     t2bowl:[{i:6,ov:4,r:45,w:1,m:0},{i:7,ov:4,r:40,w:0,m:0},{i:9,ov:4,r:38,w:1,m:0},{i:10,ov:4,r:35,w:0,m:0},{i:11,ov:4,r:45,w:0,m:0}],
     s1:218,w1:2,o1:20,s2:185,w2:4,o2:20},
  ];

  for (const ms of matchScoring) {
    const mId = await createMatch(ms.t1,ms.t2,ms.v,20,ms.d,'completed',ms.tw,ms.td,ms.w,feeder,ms.tid);
    const t1Users = ms.t1b.map(b => P[allPlayers[b.i].n]);
    const t2Users = ms.t2b.map(b => P[allPlayers[b.i].n]);
    const allT1 = [...new Set([...ms.t1b.map(b=>b.i),...ms.t1bowl.map(b=>b.i)])];
    const allT2 = [...new Set([...ms.t2b.map(b=>b.i),...ms.t2bowl.map(b=>b.i)])];
    await assignPlayers(mId, allT1.map(i=>P[allPlayers[i].n]), 1);
    await assignPlayers(mId, allT2.map(i=>P[allPlayers[i].n]), 2);

    for (const b of ms.t1b) await addBatting(mId,P[allPlayers[b.i].n],1,b.r,b.b,b.f,b.s,b.o||false,b.ot||null);
    for (const b of ms.t2b) await addBatting(mId,P[allPlayers[b.i].n],2,b.r,b.b,b.f,b.s,b.o||false,b.ot||null);
    for (const b of ms.t1bowl) await addBowling(mId,P[allPlayers[b.i].n],1,b.ov,b.r,b.w,b.m);
    for (const b of ms.t2bowl) await addBowling(mId,P[allPlayers[b.i].n],2,b.ov,b.r,b.w,b.m);
    await updateMatchScore(mId, ms.s1,ms.w1,ms.o1, ms.s2,ms.w2,ms.o2);

    // Generate balls
    const b1 = genBalls(mId,1,t1Users,ms.t2bowl.map(b=>P[allPlayers[b.i].n]),ms.s1,ms.w1,ms.o1);
    const b2 = genBalls(mId,2,t2Users,ms.t1bowl.map(b=>P[allPlayers[b.i].n]),ms.s2,ms.w2,ms.o2);
    await insertBalls(b1); await insertBalls(b2);
  }
  console.log(`  ${matchScoring.length} matches with full scoring + balls`);

  // ==================== TOURNAMENT 2: Protea Youth Cup (IN PROGRESS) ====================
  console.log('Creating Protea Youth Cup (in progress)...');
  const pycid = createId();
  const t2 = await pool.query(
    `INSERT INTO tournaments (id,name,type,overs,start_date,end_date,venue,organizer,status,created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [pycid,'Protea Youth Cup','T20',20,'2026-01-21','2026-06-07','Various','CSA Youth Development','in_progress',feeder]);
  const t2Id = t2.rows[0].id;

  await pool.query(`INSERT INTO tournament_teams (id,tournament_id,team_id,group_name,played,won,lost,no_result,points) VALUES ($1,$2,$3,'Group A',3,3,0,0,1.75)`, [createId(),t2Id,teamIds[0]]);
  await pool.query(`INSERT INTO tournament_teams (id,tournament_id,team_id,group_name,played,won,lost,no_result,points) VALUES ($1,$2,$3,'Group A',3,2,1,0,0.75)`, [createId(),t2Id,teamIds[1]]);
  await pool.query(`INSERT INTO tournament_teams (id,tournament_id,team_id,group_name,played,won,lost,no_result,points) VALUES ($1,$2,$3,'Group A',3,1,2,0,-0.65)`, [createId(),t2Id,teamIds[2]]);
  await pool.query(`INSERT INTO tournament_teams (id,tournament_id,team_id,group_name,played,won,lost,no_result,points) VALUES ($1,$2,$3,'Group A',3,0,3,0,-1.85)`, [createId(),t2Id,teamIds[3]]);

  const t2Fix = [
    {t1:'Green Mambas',t2:'Blue Sharks',  d:'2026-01-21 10:00',v:'Durban Cricket Ground',s:'completed',g:'Group A',w:'Green Mambas'},
    {t1:'Golden Eagles',t2:'Red Lions',   d:'2026-01-22 14:00',v:'SuperSport Park',      s:'completed',g:'Group A',w:'Golden Eagles'},
    {t1:'Green Mambas',t2:'Golden Eagles',d:'2026-01-24 10:00',v:'Durban Cricket Ground',s:'completed',g:'Group A',w:'Green Mambas'},
    {t1:'Blue Sharks',t2:'Red Lions',     d:'2026-02-01 14:00',v:'Cape Town Oval',       s:'completed',g:'Group A',w:'Blue Sharks'},
    {t1:'Green Mambas',t2:'Red Lions',    d:'2026-02-08 10:00',v:'Newlands B Ground',    s:'completed',g:'Group A',w:'Green Mambas'},
    {t1:'Golden Eagles',t2:'Blue Sharks', d:'2026-02-15 14:00',v:'SuperSport Park',      s:'completed',g:'Group A',w:'Golden Eagles'},
    {t1:'Green Mambas',t2:'Dolphins',     d:'2026-04-28 14:00',v:'Durban Cricket Ground', s:'upcoming', g:'Group A',w:null},
  ];
  for (const f of t2Fix) {
    const fid = createId();
    await pool.query(`INSERT INTO tournament_fixtures (id,tournament_id,team1_name,team2_name,match_date,venue,status,group_name,winner) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [fid,t2Id,f.t1,f.t2,f.d,f.v,f.s,f.g,f.w]);
  }

  // ==================== TOURNAMENT 3: High School League (UPCOMING) ====================
  await pool.query(
    `INSERT INTO tournaments (id,name,type,overs,start_date,end_date,venue,organizer,status,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [createId(),'High School League','T20',20,'2026-06-15','2026-07-12','Various Schools','WP Schools Cricket','upcoming',feeder]);

  // ==================== TOURNAMENT 4: Junior Cricket Series (UPCOMING) ====================
  await pool.query(
    `INSERT INTO tournaments (id,name,type,overs,start_date,end_date,venue,organizer,status,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [createId(),'Junior Cricket Series','T20',20,'2026-07-20','2026-08-08','Various','CSA Development','upcoming',feeder]);

  console.log('  4 tournaments created');

  // ==================== LIVE MATCH ====================
  console.log('Creating live match...');
  const liveId = await createMatch('Cape Cobras','Titans','Newlands Cricket Ground',20,'2026-04-20 14:00','live','Cape Cobras','bat',null,feeder,t2Id);
  await assignPlayers(liveId, T[0], 1); await assignPlayers(liveId, T[1], 2);
  await addBatting(liveId,T[0][0],1,42,30,4,2,false,null);
  await addBatting(liveId,T[0][1],1,35,25,3,1,false,null);
  await addBatting(liveId,T[0][2],1,12,8,1,0,true,'c Ndlovu b Adams');
  await addBowling(liveId,T[1][0],2,3,24,1,0);
  await addBowling(liveId,T[1][1],2,3,28,0,0);
  await addBowling(liveId,T[1][2],2,3,22,0,0);
  await addBowling(liveId,T[1][3],2,2,15,0,0);
  await updateMatchScore(liveId,95,1,11,0,0,0);
  const liveBalls = genBalls(liveId,1,[T[0][0],T[0][1],T[0][2]],[T[1][0],T[1][1],T[1][2],T[1][3]],95,1,11);
  await insertBalls(liveBalls);

  // ==================== UPCOMING MATCHES ====================
  console.log('Creating upcoming matches...');
  await createMatch('Bishops 1st XI','Hilton College 1st XI','Bishops Ground, Cape Town',20,'2026-04-25 10:00','upcoming',null,null,null,feeder,null);
  await createMatch('Green Mambas','Dolphins','Durban Cricket Ground',20,'2026-04-28 14:00','upcoming',null,null,null,feeder,t2Id);
  await createMatch('Blue Sharks','Warriors','Cape Town Oval',20,'2026-05-02 10:00','upcoming',null,null,null,feeder,null);

  // ==================== SUMMARY ====================
  const counts = {};
  for (const t of ['users','registered_players','teams','team_players','tournaments','tournament_teams','tournament_fixtures','matches','match_players','player_scores','balls']) {
    counts[t] = (await pool.query(`SELECT COUNT(*) FROM ${t}`)).rows[0].count;
  }

  console.log('\n=== Seed Complete! ===\n');
  console.log('Data Summary:');
  for (const [k,v] of Object.entries(counts)) console.log(`  ${k}: ${v}`);
  console.log('\nLogin Accounts:');
  console.log('  Feeder:  feeder@cricket.com / password123');
  console.log('  Viewer:  viewer@cricket.com / password123');
  console.log('  Player:  shane.vw@p.com / password123');

  await pool.end();
}

seed().catch(e => { console.error(e); process.exit(1); });
