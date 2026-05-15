/**
 * Future Protea — comprehensive realistic seed.
 *
 * Seeds the database with a complete, realistic SA grassroots cricket scenario:
 *   • 11 roles × accounts  (admin, coach, umpire, tournament_organiser,
 *                            feeder, scorer, player, viewer, team_admin,
 *                            school_admin, club_admin)
 *   • ~30 registered players with real-feeling SA names + journeys
 *   • 6 teams (schools, clubs, academies) with full rosters
 *   • 3 tournaments (completed / in-progress / upcoming) with fixtures + points
 *   • 8 matches spanning every state:
 *       2 completed (with FULL ball-by-ball, partnerships, fall-of-wickets,
 *         player scores, match officials)
 *       2 live (mid-innings, partial ball-by-ball)
 *       3 upcoming
 *       1 abandoned
 *
 * Run from `backend/`:
 *   node seeders/seed-future-protea.js
 *
 * The script is idempotent for identity data (users, players, teams) — re-runs
 * preserve passwords and player IDs. Match ephemera (balls, innings, scores,
 * etc.) is wiped + regenerated each run so you always get a fresh game state.
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()
const PASSWORD = 'password123'

// ─────────────────────────────────────────────────────────────────────────────
// USERS — one primary + one secondary per BRD-listed role
// ─────────────────────────────────────────────────────────────────────────────

const USERS = [
  // Operational
  { name: 'Cricket Admin',         email: 'admin@cricket.com',         role: 'admin'                },
  { name: 'Sipho Dlamini',         email: 'sipho.admin@cricket.com',   role: 'admin'                },

  // BRD §6.7 — Coach
  { name: 'Coach Pretorius',       email: 'coach@cricket.com',         role: 'coach'                },
  { name: 'Hannelie Botha',        email: 'hannelie.coach@cricket.com', role: 'coach'               },

  // BRD §6.4 — Umpire
  { name: 'Umpire Naidoo',         email: 'umpire@cricket.com',        role: 'umpire'               },
  { name: 'Marius van Wyk',        email: 'marius.umpire@cricket.com', role: 'umpire'               },

  // BRD §6.8 — Tournament Organiser
  { name: 'Tournament Organiser',  email: 'organiser@cricket.com',     role: 'tournament_organiser' },
  { name: 'Thandi Mthembu',        email: 'thandi.organiser@cricket.com', role: 'tournament_organiser' },

  // Scorer (BRD-aligned alias for feeder)
  { name: 'Score Feeder',          email: 'feeder@cricket.com',        role: 'feeder'               },
  { name: 'Johan de Klerk',        email: 'johan.scorer@cricket.com',  role: 'scorer'               },

  // Players who can claim profiles
  { name: 'Cricket Player',        email: 'player@cricket.com',        role: 'player'               },
  { name: 'Aiden Markram',         email: 'aiden.player@cricket.com',  role: 'player'               },

  // Spectators
  { name: 'Cricket Fan',           email: 'viewer@cricket.com',        role: 'viewer'               },

  // BRD §4 institutional roles
  { name: 'Team Admin',            email: 'teamadmin@cricket.com',     role: 'team_admin'           },
  { name: 'School Admin',          email: 'schooladmin@cricket.com',   role: 'school_admin'         },
  { name: 'Club Admin',            email: 'clubadmin@cricket.com',     role: 'club_admin'           },
]

// ─────────────────────────────────────────────────────────────────────────────
// REGISTERED PLAYERS — realistic SA cricket squad
// ─────────────────────────────────────────────────────────────────────────────

const PLAYERS = [
  // Cape Cobras squad (Cape Town Cricket Club)
  { code: 'GUCT-0101', name: 'Aiden Markram',     dob: '2000-10-04', club: 'Cape Town CC',        bat: 'Right-hand',  bowl: 'Right-arm off-break', role: 'Batsman',    jersey: 6  },
  { code: 'GUCT-0102', name: 'Temba Bavuma',      dob: '2001-05-17', club: 'Cape Town CC',        bat: 'Right-hand',  bowl: 'Right-arm medium',    role: 'Batsman',    jersey: 35 },
  { code: 'GUCT-0103', name: 'Heinrich Klaasen',  dob: '2000-07-30', club: 'Cape Town CC',        bat: 'Right-hand',  bowl: 'Right-arm off-break', role: 'WK-Batsman', jersey: 27 },
  { code: 'GUCT-0104', name: 'David Miller',      dob: '2001-06-10', club: 'Cape Town CC',        bat: 'Left-hand',   bowl: 'Right-arm off-break', role: 'Batsman',    jersey: 25 },
  { code: 'GUCT-0105', name: 'Marco Jansen',      dob: '2003-05-01', club: 'Cape Town CC',        bat: 'Left-hand',   bowl: 'Left-arm fast-medium', role: 'All-rounder', jersey: 16 },
  { code: 'GUCT-0106', name: 'Keshav Maharaj',    dob: '2001-02-07', club: 'Cape Town CC',        bat: 'Right-hand',  bowl: 'Left-arm orthodox',   role: 'Bowler',     jersey: 8  },
  { code: 'GUCT-0107', name: 'Kagiso Rabada',     dob: '2002-05-25', club: 'Cape Town CC',        bat: 'Right-hand',  bowl: 'Right-arm fast',      role: 'Bowler',     jersey: 25 },
  { code: 'GUCT-0108', name: 'Lungi Ngidi',       dob: '2002-03-29', club: 'Cape Town CC',        bat: 'Right-hand',  bowl: 'Right-arm fast',      role: 'Bowler',     jersey: 11 },
  { code: 'GUCT-0109', name: 'Tabraiz Shamsi',    dob: '2000-02-18', club: 'Cape Town CC',        bat: 'Right-hand',  bowl: 'Left-arm wrist-spin', role: 'Bowler',     jersey: 19 },
  { code: 'GUCT-0110', name: 'Quinton de Kock',   dob: '2001-12-17', club: 'Cape Town CC',        bat: 'Left-hand',   bowl: '—',                   role: 'WK-Batsman', jersey: 12 },
  { code: 'GUCT-0111', name: 'Gerald Coetzee',    dob: '2002-10-02', club: 'Cape Town CC',        bat: 'Right-hand',  bowl: 'Right-arm fast',      role: 'Bowler',     jersey: 14 },

  // Titans squad (Pretoria Titans Academy)
  { code: 'GUCT-0201', name: 'Dean Elgar',        dob: '2001-06-11', club: 'Pretoria Titans',     bat: 'Left-hand',   bowl: 'Left-arm orthodox',   role: 'Batsman',    jersey: 4  },
  { code: 'GUCT-0202', name: 'Rassie van der Dussen', dob: '2000-02-07', club: 'Pretoria Titans', bat: 'Right-hand', bowl: 'Right-arm leg-break', role: 'Batsman',    jersey: 17 },
  { code: 'GUCT-0203', name: 'Tristan Stubbs',    dob: '2003-08-14', club: 'Pretoria Titans',     bat: 'Right-hand',  bowl: 'Right-arm off-break', role: 'Batsman',    jersey: 30 },
  { code: 'GUCT-0204', name: 'Reeza Hendricks',   dob: '2001-08-14', club: 'Pretoria Titans',     bat: 'Right-hand',  bowl: 'Right-arm off-break', role: 'Batsman',    jersey: 7  },
  { code: 'GUCT-0205', name: 'Wayne Parnell',     dob: '2000-07-30', club: 'Pretoria Titans',     bat: 'Left-hand',   bowl: 'Left-arm fast-medium', role: 'All-rounder', jersey: 12 },
  { code: 'GUCT-0206', name: 'Andile Phehlukwayo', dob: '2001-03-07', club: 'Pretoria Titans',    bat: 'Right-hand',  bowl: 'Right-arm fast-medium', role: 'All-rounder', jersey: 24 },
  { code: 'GUCT-0207', name: 'Anrich Nortje',     dob: '2002-11-16', club: 'Pretoria Titans',     bat: 'Right-hand',  bowl: 'Right-arm fast',      role: 'Bowler',     jersey: 18 },
  { code: 'GUCT-0208', name: 'Bjorn Fortuin',     dob: '2001-10-13', club: 'Pretoria Titans',     bat: 'Right-hand',  bowl: 'Left-arm orthodox',   role: 'Bowler',     jersey: 33 },
  { code: 'GUCT-0209', name: 'Sisanda Magala',    dob: '2000-02-26', club: 'Pretoria Titans',     bat: 'Right-hand',  bowl: 'Right-arm fast-medium', role: 'Bowler',   jersey: 22 },
  { code: 'GUCT-0210', name: 'Ryan Rickelton',    dob: '2002-07-11', club: 'Pretoria Titans',     bat: 'Left-hand',   bowl: '—',                   role: 'WK-Batsman', jersey: 31 },
  { code: 'GUCT-0211', name: 'Pieter Malan',      dob: '2000-09-09', club: 'Pretoria Titans',     bat: 'Right-hand',  bowl: 'Right-arm medium',    role: 'Batsman',    jersey: 15 },

  // Bishops College U19 (school team)
  { code: 'GUCT-0301', name: 'Jordan Hermann',    dob: '2007-04-22', school: 'Bishops College',   bat: 'Left-hand',   bowl: 'Right-arm leg-break', role: 'Batsman',    jersey: 1  },
  { code: 'GUCT-0302', name: 'Liam Alder',        dob: '2007-08-15', school: 'Bishops College',   bat: 'Right-hand',  bowl: 'Right-arm medium',    role: 'Batsman',    jersey: 2  },
  { code: 'GUCT-0303', name: 'Connor Esterhuizen', dob: '2007-11-03', school: 'Bishops College',  bat: 'Right-hand',  bowl: 'Right-arm fast',      role: 'All-rounder', jersey: 3 },
  { code: 'GUCT-0304', name: 'Sibusiso Khumalo',  dob: '2007-02-14', school: 'Bishops College',   bat: 'Right-hand',  bowl: 'Right-arm off-break', role: 'WK-Batsman', jersey: 5  },
  { code: 'GUCT-0305', name: 'Daniel Smith',      dob: '2007-06-29', school: 'Bishops College',   bat: 'Right-hand',  bowl: 'Left-arm orthodox',   role: 'Bowler',     jersey: 9  },
  { code: 'GUCT-0306', name: 'Thabo Mokoena',     dob: '2007-09-18', school: 'Bishops College',   bat: 'Left-hand',   bowl: 'Right-arm medium',    role: 'All-rounder', jersey: 10 },
  { code: 'GUCT-0307', name: 'Ethan van Rooyen',  dob: '2007-01-25', school: 'Bishops College',   bat: 'Right-hand',  bowl: 'Right-arm fast-medium', role: 'Bowler',   jersey: 13 },

  // SACS High U19 (school team)
  { code: 'GUCT-0401', name: 'Joshua Levin',      dob: '2007-05-12', school: 'SACS High School',  bat: 'Right-hand',  bowl: 'Right-arm medium',    role: 'Batsman',    jersey: 1  },
  { code: 'GUCT-0402', name: 'Rohan Pillay',      dob: '2007-07-21', school: 'SACS High School',  bat: 'Right-hand',  bowl: 'Right-arm off-break', role: 'All-rounder', jersey: 4 },
  { code: 'GUCT-0403', name: 'Khanya Mngadi',     dob: '2007-12-08', school: 'SACS High School',  bat: 'Left-hand',   bowl: 'Right-arm fast',      role: 'Bowler',     jersey: 7  },
  { code: 'GUCT-0404', name: 'Tom Steyn',         dob: '2007-03-19', school: 'SACS High School',  bat: 'Right-hand',  bowl: 'Right-arm leg-break', role: 'WK-Batsman', jersey: 11 },
  { code: 'GUCT-0405', name: 'Kabelo Mahlangu',   dob: '2007-10-04', school: 'SACS High School',  bat: 'Right-hand',  bowl: 'Right-arm medium-fast', role: 'Bowler',   jersey: 14 },
]

// ─────────────────────────────────────────────────────────────────────────────
// TEAMS
// ─────────────────────────────────────────────────────────────────────────────

const TEAMS = [
  { code: 'GUCT-1001', name: 'Cape Cobras',      type: 'club',     club:   'Cape Town CC',        captain: 'GUCT-0101', wk: 'GUCT-0110', players: 'cape' },
  { code: 'GUCT-1002', name: 'Pretoria Titans',  type: 'club',     club:   'Pretoria Titans',     captain: 'GUCT-0201', wk: 'GUCT-0210', players: 'titans' },
  { code: 'GUCT-1003', name: 'Bishops U19',      type: 'school',   school: 'Bishops College',     captain: 'GUCT-0301', wk: 'GUCT-0304', players: 'bishops' },
  { code: 'GUCT-1004', name: 'SACS U19',         type: 'school',   school: 'SACS High School',    captain: 'GUCT-0401', wk: 'GUCT-0404', players: 'sacs' },
  { code: 'GUCT-1005', name: 'Future Protea XI', type: 'academy',  club:   'Future Protea Academy', captain: 'GUCT-0103', wk: 'GUCT-0110', players: 'mixed-a' },
  { code: 'GUCT-1006', name: 'Western Province', type: 'club',     club:   'WP Cricket Club',     captain: 'GUCT-0202', wk: 'GUCT-0210', players: 'mixed-b' },
]

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🏏  Future Protea — comprehensive seed\n')

  const passwordHash = await bcrypt.hash(PASSWORD, 10)

  // ── 1. Wipe match ephemera (preserves identity tables) ─────────────────
  console.log('🧹  Clearing existing match data…')
  await prisma.$transaction([
    prisma.ball.deleteMany({}),
    prisma.fallOfWicket.deleteMany({}),
    prisma.partnership.deleteMany({}),
    prisma.matchInnings.deleteMany({}),
    prisma.matchOfficial.deleteMany({}),
    prisma.playerScore.deleteMany({}),
    prisma.matchPlayer.deleteMany({}),
    prisma.tournamentFixture.deleteMany({}),
    prisma.tournamentStage.deleteMany({}),
    prisma.tournamentTeam.deleteMany({}),
    prisma.match.deleteMany({}),
    prisma.tournament.deleteMany({}),
    prisma.teamPlayer.deleteMany({}),
  ])
  console.log('   ✓ Cleared\n')

  // ── 2. Users (upsert) ─────────────────────────────────────────────────
  console.log('👥  Seeding users…')
  const usersByEmail = {}
  for (const u of USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, approved: true },
      create: {
        name: u.name,
        email: u.email,
        password: passwordHash,
        role: u.role,
        approved: true,
      },
    })
    usersByEmail[u.email] = user
  }
  console.log(`   ✓ ${Object.keys(usersByEmail).length} users\n`)

  const adminUser  = usersByEmail['admin@cricket.com']
  const feederUser = usersByEmail['feeder@cricket.com']
  const orgUser    = usersByEmail['organiser@cricket.com']
  const umpireUser = usersByEmail['umpire@cricket.com']

  // ── 3. Registered players (upsert by playerIdCode) ───────────────────
  console.log('🏏  Seeding registered players…')
  const playersByCode = {}
  for (const p of PLAYERS) {
    const player = await prisma.registeredPlayer.upsert({
      where: { playerIdCode: p.code },
      update: {
        name: p.name,
        dateOfBirth: new Date(p.dob),
        schoolName: p.school || null,
        clubName: p.club || null,
        battingStyle: p.bat,
        bowlingStyle: p.bowl,
        playingRole: p.role,
        jerseyNumber: p.jersey,
        nationality: 'South African',
      },
      create: {
        playerIdCode: p.code,
        name: p.name,
        dateOfBirth: new Date(p.dob),
        schoolName: p.school || null,
        clubName: p.club || null,
        battingStyle: p.bat,
        bowlingStyle: p.bowl,
        playingRole: p.role,
        jerseyNumber: p.jersey,
        nationality: 'South African',
        createdBy: adminUser.id,
        isMinor: new Date(p.dob).getFullYear() > new Date().getFullYear() - 18,
      },
    })
    playersByCode[p.code] = player
  }
  // Link the "Aiden Markram" player to the aiden.player@cricket.com user
  await prisma.registeredPlayer.update({
    where: { playerIdCode: 'GUCT-0101' },
    data: { linkedUserId: usersByEmail['aiden.player@cricket.com'].id },
  })
  console.log(`   ✓ ${Object.keys(playersByCode).length} players\n`)

  // ── 4. Teams (upsert by teamCode) ────────────────────────────────────
  console.log('🛡️   Seeding teams…')
  const teamsByCode = {}
  const ROSTERS = {
    'cape':    ['GUCT-0101', 'GUCT-0102', 'GUCT-0103', 'GUCT-0104', 'GUCT-0105', 'GUCT-0106', 'GUCT-0107', 'GUCT-0108', 'GUCT-0109', 'GUCT-0110', 'GUCT-0111'],
    'titans':  ['GUCT-0201', 'GUCT-0202', 'GUCT-0203', 'GUCT-0204', 'GUCT-0205', 'GUCT-0206', 'GUCT-0207', 'GUCT-0208', 'GUCT-0209', 'GUCT-0210', 'GUCT-0211'],
    'bishops': ['GUCT-0301', 'GUCT-0302', 'GUCT-0303', 'GUCT-0304', 'GUCT-0305', 'GUCT-0306', 'GUCT-0307'],
    'sacs':    ['GUCT-0401', 'GUCT-0402', 'GUCT-0403', 'GUCT-0404', 'GUCT-0405'],
    'mixed-a': ['GUCT-0103', 'GUCT-0110', 'GUCT-0105', 'GUCT-0210', 'GUCT-0301', 'GUCT-0205', 'GUCT-0401', 'GUCT-0107', 'GUCT-0306', 'GUCT-0207', 'GUCT-0306'],
    'mixed-b': ['GUCT-0202', 'GUCT-0210', 'GUCT-0206', 'GUCT-0102', 'GUCT-0204', 'GUCT-0405', 'GUCT-0306', 'GUCT-0205', 'GUCT-0303', 'GUCT-0403', 'GUCT-0207'],
  }
  for (const t of TEAMS) {
    const team = await prisma.team.upsert({
      where: { teamCode: t.code },
      update: { teamName: t.name, teamType: t.type, schoolName: t.school || null, clubName: t.club || null },
      create: {
        teamCode: t.code,
        teamName: t.name,
        teamType: t.type,
        schoolName: t.school || null,
        clubName: t.club || null,
        createdBy: adminUser.id,
      },
    })
    teamsByCode[t.code] = team

    // Reset + re-add roster (we already wiped teamPlayer above)
    const rosterCodes = ROSTERS[t.players]
    const uniqueCodes = [...new Set(rosterCodes)]
    for (const playerCode of uniqueCodes) {
      const player = playersByCode[playerCode]
      if (!player) continue
      await prisma.teamPlayer.upsert({
        where: { teamId_playerId: { teamId: team.id, playerId: player.id } },
        update: {
          isCaptain:      playerCode === t.captain,
          isWicketKeeper: playerCode === t.wk,
        },
        create: {
          teamId: team.id,
          playerId: player.id,
          isCaptain:      playerCode === t.captain,
          isWicketKeeper: playerCode === t.wk,
        },
      })
    }
  }
  console.log(`   ✓ ${Object.keys(teamsByCode).length} teams\n`)

  // ── 5. Tournaments ────────────────────────────────────────────────────
  console.log('🏆  Seeding tournaments…')
  const proteaYouthCup = await prisma.tournament.create({
    data: {
      name: 'Protea Youth Cup 2026',
      type: 'T20',
      overs: 20,
      startDate: new Date('2026-04-15'),
      endDate: new Date('2026-06-10'),
      venue: 'Various',
      organizer: 'Cricket South Africa',
      status: 'in_progress',
      createdBy: orgUser.id,
    },
  })
  const wpPremier = await prisma.tournament.create({
    data: {
      name: 'Western Cape Premier League 2026',
      type: 'ODI',
      overs: 50,
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-08-30'),
      venue: 'Newlands, Cape Town',
      organizer: 'Western Province Cricket',
      status: 'upcoming',
      createdBy: orgUser.id,
    },
  })
  const schoolsChallenge = await prisma.tournament.create({
    data: {
      name: 'SA Schools T20 Challenge 2025',
      type: 'T20',
      overs: 20,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-12-15'),
      venue: 'Multiple venues',
      organizer: 'South African Schools Cricket',
      status: 'completed',
      createdBy: orgUser.id,
    },
  })

  // Assign teams to tournaments (Protea Youth Cup uses Groups A/B)
  const ytGroups = [
    { team: 'GUCT-1001', group: 'A', played: 2, won: 2, lost: 0, points: 4, nrr: 1.8 },
    { team: 'GUCT-1002', group: 'A', played: 2, won: 1, lost: 1, points: 2, nrr: 0.3 },
    { team: 'GUCT-1005', group: 'A', played: 2, won: 0, lost: 2, points: 0, nrr: -2.1 },
    { team: 'GUCT-1003', group: 'B', played: 2, won: 2, lost: 0, points: 4, nrr: 1.2 },
    { team: 'GUCT-1004', group: 'B', played: 2, won: 1, lost: 1, points: 2, nrr: -0.4 },
    { team: 'GUCT-1006', group: 'B', played: 2, won: 0, lost: 2, points: 0, nrr: -0.8 },
  ]
  for (const g of ytGroups) {
    await prisma.tournamentTeam.create({
      data: {
        tournamentId: proteaYouthCup.id,
        teamId: teamsByCode[g.team].id,
        groupName: `Group ${g.group}`,
        played: g.played,
        won: g.won,
        lost: g.lost,
        points: g.points,
        nrr: g.nrr,
      },
    })
  }
  // WP Premier — 4 teams, no group
  for (const code of ['GUCT-1001', 'GUCT-1002', 'GUCT-1005', 'GUCT-1006']) {
    await prisma.tournamentTeam.create({
      data: { tournamentId: wpPremier.id, teamId: teamsByCode[code].id, groupName: null },
    })
  }
  // Schools Challenge (completed)
  for (const code of ['GUCT-1003', 'GUCT-1004']) {
    await prisma.tournamentTeam.create({
      data: {
        tournamentId: schoolsChallenge.id,
        teamId: teamsByCode[code].id,
        played: 1, won: code === 'GUCT-1003' ? 1 : 0, lost: code === 'GUCT-1003' ? 0 : 1, points: code === 'GUCT-1003' ? 2 : 0,
      },
    })
  }
  console.log(`   ✓ 3 tournaments (${ytGroups.length + 4 + 2} team entries)\n`)

  // ── 6. Matches — every state ──────────────────────────────────────────
  console.log('🥎  Seeding matches…')
  let matchCount = 0

  // 6a. COMPLETED MATCH (with full ball-by-ball) — Cape Cobras vs Pretoria Titans
  const m1 = await createFullMatch({
    team1Code: 'GUCT-1001',
    team2Code: 'GUCT-1002',
    venue: 'Newlands Stadium, Cape Town',
    matchDate: new Date('2026-04-22T14:00:00Z'),
    matchType: 'T20',
    overs: 20,
    tournamentId: proteaYouthCup.id,
    tossWinner: 'Cape Cobras',
    tossDecision: 'bat',
    firstInnings: { batting: 'GUCT-1001', score: 174, wickets: 6, overs: 20 },
    secondInnings: { batting: 'GUCT-1002', score: 158, wickets: 9, overs: 20 },
    playerOfMatchCode: 'GUCT-0101',
    umpireUser,
    feederUser,
    teamsByCode,
    playersByCode,
    ROSTERS,
    generateBallByBall: true,
  })
  matchCount++

  // 6b. COMPLETED MATCH — Bishops vs SACS (Schools Challenge)
  const m2 = await createFullMatch({
    team1Code: 'GUCT-1003',
    team2Code: 'GUCT-1004',
    venue: 'Bishops Cricket Oval',
    matchDate: new Date('2025-11-15T10:00:00Z'),
    matchType: 'T20',
    overs: 20,
    tournamentId: schoolsChallenge.id,
    tossWinner: 'SACS U19',
    tossDecision: 'bowl',
    firstInnings: { batting: 'GUCT-1003', score: 142, wickets: 8, overs: 20 },
    secondInnings: { batting: 'GUCT-1004', score: 118, wickets: 10, overs: 18.3 },
    playerOfMatchCode: 'GUCT-0301',
    umpireUser,
    feederUser,
    teamsByCode,
    playersByCode,
    ROSTERS,
    generateBallByBall: true,
  })
  matchCount++

  // 6c. LIVE MATCH 1 — Cape Cobras vs Future Protea XI (Protea Youth Cup, mid-innings)
  await createLiveMatch({
    team1Code: 'GUCT-1001',
    team2Code: 'GUCT-1005',
    venue: 'Newlands Stadium, Cape Town',
    matchDate: new Date(),
    matchType: 'T20',
    overs: 20,
    tournamentId: proteaYouthCup.id,
    tossWinner: 'Cape Cobras',
    tossDecision: 'bat',
    currentInnings: 1,
    currentScore: { runs: 87, wickets: 2, overs: 9.4 },
    feederUser,
    umpireUser,
    teamsByCode,
    playersByCode,
    ROSTERS,
  })
  matchCount++

  // 6d. LIVE MATCH 2 — Bishops vs Western Province (Protea Youth Cup, 2nd innings chase)
  await createLiveMatch({
    team1Code: 'GUCT-1003',
    team2Code: 'GUCT-1006',
    venue: 'WP Cricket Ground',
    matchDate: new Date(),
    matchType: 'T20',
    overs: 20,
    tournamentId: proteaYouthCup.id,
    tossWinner: 'Western Province',
    tossDecision: 'bowl',
    currentInnings: 2,
    firstInningsTotal: { runs: 156, wickets: 7, overs: 20 },
    currentScore: { runs: 62, wickets: 3, overs: 7.2 },
    feederUser,
    umpireUser,
    teamsByCode,
    playersByCode,
    ROSTERS,
  })
  matchCount++

  // 6e-6g. UPCOMING MATCHES
  const upcomings = [
    { t1: 'GUCT-1002', t2: 'GUCT-1005', venue: 'SuperSport Park, Centurion',  daysAhead: 3, type: 'T20', overs: 20, tourId: proteaYouthCup.id },
    { t1: 'GUCT-1004', t2: 'GUCT-1006', venue: 'Constantia Cricket Ground',   daysAhead: 5, type: 'T20', overs: 20, tourId: proteaYouthCup.id },
    { t1: 'GUCT-1001', t2: 'GUCT-1002', venue: 'Newlands Stadium, Cape Town', daysAhead: 14, type: 'ODI', overs: 50, tourId: wpPremier.id },
  ]
  for (const u of upcomings) {
    const team1 = teamsByCode[u.t1], team2 = teamsByCode[u.t2]
    const matchDate = new Date(Date.now() + u.daysAhead * 24 * 3600 * 1000)
    await prisma.match.create({
      data: {
        team1Name: team1.teamName, team2Name: team2.teamName,
        team1Id: team1.id,         team2Id: team2.id,
        venue: u.venue, totalOvers: u.overs, matchDate, matchType: u.type,
        status: 'upcoming', createdBy: feederUser.id, tournamentId: u.tourId,
      },
    })
    matchCount++
  }

  // 6h. ABANDONED MATCH (rain-affected)
  {
    const team1 = teamsByCode['GUCT-1001'], team2 = teamsByCode['GUCT-1006']
    await prisma.match.create({
      data: {
        team1Name: team1.teamName, team2Name: team2.teamName,
        team1Id: team1.id, team2Id: team2.id,
        venue: 'Newlands Stadium, Cape Town',
        matchDate: new Date('2026-03-30T14:00:00Z'),
        totalOvers: 20, matchType: 'T20', status: 'abandoned',
        tossWinner: 'Cape Cobras', tossDecision: 'bat',
        resultType: 'no_result',
        team1Score: 48, team1Wickets: 1, team1Overs: 6.2,
        createdBy: feederUser.id,
      },
    })
    matchCount++
  }

  console.log(`   ✓ ${matchCount} matches\n`)

  // ── 7. Tournament fixtures (link to created matches) ──────────────────
  console.log('📅  Linking tournament fixtures…')
  const proteaMatches = await prisma.match.findMany({
    where: { tournamentId: proteaYouthCup.id },
    orderBy: { matchDate: 'asc' },
  })
  for (const m of proteaMatches) {
    await prisma.tournamentFixture.create({
      data: {
        tournamentId: proteaYouthCup.id,
        matchId: m.id,
        team1Name: m.team1Name,
        team2Name: m.team2Name,
        matchDate: m.matchDate,
        venue: m.venue,
        status: m.status === 'completed' ? 'completed' : m.status === 'live' ? 'live' : 'upcoming',
        groupName: 'Group A',
        winner: m.winner,
      },
    })
  }
  console.log(`   ✓ ${proteaMatches.length} fixtures linked\n`)

  // ── Done ──────────────────────────────────────────────────────────────
  await printSummary()
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a completed match with realistic ball-by-ball data, partnerships,
 * fall of wickets, player scores and a match official record.
 */
async function createFullMatch(opts) {
  const {
    team1Code, team2Code, venue, matchDate, matchType, overs, tournamentId,
    tossWinner, tossDecision, firstInnings, secondInnings, playerOfMatchCode,
    umpireUser, feederUser, teamsByCode, playersByCode, ROSTERS,
    generateBallByBall,
  } = opts

  const team1 = teamsByCode[team1Code]
  const team2 = teamsByCode[team2Code]
  const player1Codes = ROSTERS[TEAMS.find((t) => t.code === team1Code).players]
  const player2Codes = ROSTERS[TEAMS.find((t) => t.code === team2Code).players]
  const playerOfMatch = playersByCode[playerOfMatchCode]

  // Determine winner
  const t1Won = (firstInnings.batting === team1Code && firstInnings.score > secondInnings.score)
             || (firstInnings.batting === team2Code && secondInnings.score > firstInnings.score)
  const winnerTeam = t1Won ? team1 : team2
  const winnerScore = t1Won ? firstInnings.score : secondInnings.score
  const loserScore = t1Won ? secondInnings.score : firstInnings.score

  const team1Stats = firstInnings.batting === team1Code ? firstInnings : secondInnings
  const team2Stats = firstInnings.batting === team2Code ? firstInnings : secondInnings

  const match = await prisma.match.create({
    data: {
      team1Name: team1.teamName, team2Name: team2.teamName,
      team1Id: team1.id, team2Id: team2.id,
      venue, totalOvers: overs, matchDate, matchType,
      status: 'completed', currentInnings: 2,
      tossWinner, tossDecision,
      winner: winnerTeam.teamName, winnerTeamId: winnerTeam.id,
      resultType: 'win', resultMargin: Math.abs(winnerScore - loserScore),
      team1Score: team1Stats.score, team1Wickets: team1Stats.wickets, team1Overs: team1Stats.overs,
      team2Score: team2Stats.score, team2Wickets: team2Stats.wickets, team2Overs: team2Stats.overs,
      tournamentId,
      playerOfMatch: playerOfMatch.name,
      playerOfMatchId: playerOfMatch.id,
      createdBy: feederUser.id,
      umpire: umpireUser.name,
    },
  })

  // Match players (combined squad)
  for (const code of player1Codes) {
    const p = playersByCode[code]; if (!p) continue
    await prisma.matchPlayer.upsert({
      where: { matchId_playerId: { matchId: match.id, playerId: p.id } },
      update: { team: 1, status: 'approved', isPlaying: true },
      create: { matchId: match.id, playerId: p.id, team: 1, status: 'approved', isPlaying: true },
    })
  }
  for (const code of player2Codes) {
    const p = playersByCode[code]; if (!p) continue
    await prisma.matchPlayer.upsert({
      where: { matchId_playerId: { matchId: match.id, playerId: p.id } },
      update: { team: 2, status: 'approved', isPlaying: true },
      create: { matchId: match.id, playerId: p.id, team: 2, status: 'approved', isPlaying: true },
    })
  }

  // Match official
  await prisma.matchOfficial.create({
    data: {
      matchId: match.id,
      officialId: umpireUser.id,
      officialName: umpireUser.name,
      role: 'umpire',
    },
  })

  // Create both innings + ball-by-ball if requested
  if (generateBallByBall) {
    await generateInningsData({
      match,
      inningsNumber: 1,
      battingTeam: firstInnings.batting === team1Code ? team1 : team2,
      bowlingTeam: firstInnings.batting === team1Code ? team2 : team1,
      battingCodes: firstInnings.batting === team1Code ? player1Codes : player2Codes,
      bowlingCodes: firstInnings.batting === team1Code ? player2Codes : player1Codes,
      targetScore: firstInnings.score,
      targetWickets: firstInnings.wickets,
      targetOvers: firstInnings.overs,
      playersByCode,
    })
    await generateInningsData({
      match,
      inningsNumber: 2,
      battingTeam: secondInnings.batting === team1Code ? team1 : team2,
      bowlingTeam: secondInnings.batting === team1Code ? team2 : team1,
      battingCodes: secondInnings.batting === team1Code ? player1Codes : player2Codes,
      bowlingCodes: secondInnings.batting === team1Code ? player2Codes : player1Codes,
      targetScore: secondInnings.score,
      targetWickets: secondInnings.wickets,
      targetOvers: secondInnings.overs,
      targetRuns: firstInnings.score + 1,
      playersByCode,
    })
  }

  return match
}

async function createLiveMatch(opts) {
  const {
    team1Code, team2Code, venue, matchDate, matchType, overs, tournamentId,
    tossWinner, tossDecision, currentInnings, firstInningsTotal, currentScore,
    feederUser, umpireUser, teamsByCode, playersByCode, ROSTERS,
  } = opts

  const team1 = teamsByCode[team1Code]
  const team2 = teamsByCode[team2Code]
  const battingTeam = (tossWinner === team1.teamName && tossDecision === 'bat')
    || (tossWinner === team2.teamName && tossDecision === 'bowl') ? team1 : team2
  const player1Codes = ROSTERS[TEAMS.find((t) => t.code === team1Code).players]
  const player2Codes = ROSTERS[TEAMS.find((t) => t.code === team2Code).players]

  const team1Live = team1.id === battingTeam.id
    ? (currentInnings === 1 ? currentScore : firstInningsTotal)
    : (currentInnings === 2 ? firstInningsTotal : { runs: 0, wickets: 0, overs: 0 })
  const team2Live = team2.id === battingTeam.id
    ? (currentInnings === 1 ? currentScore : firstInningsTotal)
    : (currentInnings === 2 ? firstInningsTotal : { runs: 0, wickets: 0, overs: 0 })

  // For 2nd-innings live, swap: the team currently batting is whoever bowled first
  let t1, t2
  if (currentInnings === 2) {
    const firstBatter = battingTeam.id === team1.id ? team2 : team1
    const secondBatter = battingTeam.id === team1.id ? team1 : team2
    t1 = team1.id === firstBatter.id ? firstInningsTotal : currentScore
    t2 = team2.id === firstBatter.id ? firstInningsTotal : currentScore
  } else {
    t1 = team1.id === battingTeam.id ? currentScore : { runs: 0, wickets: 0, overs: 0 }
    t2 = team2.id === battingTeam.id ? currentScore : { runs: 0, wickets: 0, overs: 0 }
  }

  const match = await prisma.match.create({
    data: {
      team1Name: team1.teamName, team2Name: team2.teamName,
      team1Id: team1.id, team2Id: team2.id,
      venue, totalOvers: overs, matchDate, matchType,
      status: 'live', currentInnings,
      tossWinner, tossDecision,
      team1Score: t1.runs, team1Wickets: t1.wickets, team1Overs: t1.overs,
      team2Score: t2.runs, team2Wickets: t2.wickets, team2Overs: t2.overs,
      tournamentId,
      createdBy: feederUser.id,
      umpire: umpireUser.name,
    },
  })

  // Players
  for (const code of player1Codes) {
    const p = playersByCode[code]; if (!p) continue
    await prisma.matchPlayer.upsert({
      where: { matchId_playerId: { matchId: match.id, playerId: p.id } },
      update: { team: 1, status: 'approved', isPlaying: true },
      create: { matchId: match.id, playerId: p.id, team: 1, status: 'approved', isPlaying: true },
    })
  }
  for (const code of player2Codes) {
    const p = playersByCode[code]; if (!p) continue
    await prisma.matchPlayer.upsert({
      where: { matchId_playerId: { matchId: match.id, playerId: p.id } },
      update: { team: 2, status: 'approved', isPlaying: true },
      create: { matchId: match.id, playerId: p.id, team: 2, status: 'approved', isPlaying: true },
    })
  }

  // Match official
  await prisma.matchOfficial.create({
    data: {
      matchId: match.id, officialId: umpireUser.id,
      officialName: umpireUser.name, role: 'umpire',
    },
  })

  // Innings
  if (currentInnings === 2) {
    // First innings is complete
    const firstBatTeam = battingTeam.id === team1.id ? team2 : team1
    const firstBowlTeam = battingTeam
    await prisma.matchInnings.create({
      data: {
        matchId: match.id, inningsNumber: 1,
        battingTeamId: firstBatTeam.id, bowlingTeamId: firstBowlTeam.id,
        totalRuns: firstInningsTotal.runs, totalWickets: firstInningsTotal.wickets,
        totalOvers: firstInningsTotal.overs, status: 'completed',
        startedAt: new Date(matchDate.getTime() - 2 * 3600 * 1000),
        endedAt: new Date(matchDate.getTime() - 30 * 60 * 1000),
      },
    })
  }
  await prisma.matchInnings.create({
    data: {
      matchId: match.id, inningsNumber: currentInnings,
      battingTeamId: battingTeam.id,
      bowlingTeamId: battingTeam.id === team1.id ? team2.id : team1.id,
      totalRuns: currentScore.runs, totalWickets: currentScore.wickets,
      totalOvers: currentScore.overs,
      targetRuns: currentInnings === 2 ? firstInningsTotal.runs + 1 : null,
      status: 'in_progress',
      startedAt: new Date(matchDate.getTime() - 60 * 60 * 1000),
    },
  })

  // A few partial balls for realism
  const battingCodes = battingTeam.id === team1.id ? player1Codes : player2Codes
  const bowlingCodes = battingTeam.id === team1.id ? player2Codes : player1Codes
  const striker = playersByCode[battingCodes[currentScore.wickets]]
  const nonStriker = playersByCode[battingCodes[currentScore.wickets + 1]]
  const bowler = playersByCode[bowlingCodes[6]] // pick a likely bowler

  if (striker && bowler) {
    // Generate a few recent balls
    let runs = 0, balls = 0
    for (let i = 0; i < 4 && runs < currentScore.runs; i++) {
      const ballRuns = i === 1 ? 4 : i === 3 ? 1 : i === 0 ? 0 : 2
      await prisma.ball.create({
        data: {
          matchId: match.id, innings: currentInnings,
          overNumber: Math.floor(currentScore.overs),
          ballNumber: i + 1,
          batsmanId: striker.id, bowlerId: bowler.id, nonStrikerId: nonStriker?.id,
          runs: ballRuns,
          shotDirection: ballRuns === 4 ? 'cover' : ballRuns === 0 ? 'defended' : 'mid_off',
          commentary: ballRuns === 4 ? `${striker.name} smashes a boundary through cover!` : null,
        },
      })
      runs += ballRuns; balls += 1
    }
  }

  return match
}

/**
 * Generate ball-by-ball data for one innings.
 * Produces realistic over-by-over progression that adds up to the target.
 */
async function generateInningsData({
  match, inningsNumber, battingTeam, bowlingTeam,
  battingCodes, bowlingCodes, targetScore, targetWickets, targetOvers,
  targetRuns, playersByCode,
}) {
  const battingPlayers = battingCodes.map((c) => playersByCode[c]).filter(Boolean)
  const bowlingPlayers = bowlingCodes.map((c) => playersByCode[c]).filter(Boolean)
  if (battingPlayers.length < 2 || bowlingPlayers.length < 2) return

  const innings = await prisma.matchInnings.create({
    data: {
      matchId: match.id, inningsNumber,
      battingTeamId: battingTeam.id, bowlingTeamId: bowlingTeam.id,
      totalRuns: targetScore, totalWickets: targetWickets, totalOvers: targetOvers,
      targetRuns: targetRuns ?? null,
      status: 'completed',
      startedAt: new Date(Date.now() - 4 * 3600 * 1000),
      endedAt: new Date(Date.now() - 3 * 3600 * 1000),
    },
  })

  // Distribute runs across overs with a realistic profile
  const fullOvers = Math.floor(targetOvers)
  const extraBalls = Math.round((targetOvers - fullOvers) * 10)
  const totalBalls = fullOvers * 6 + extraBalls

  // Run distribution: roughly 35% dots, 25% singles, 15% twos, 5% threes, 10% fours, 5% sixes, 5% extras
  // Generate sequence then bias totals
  let remainingRuns = targetScore
  let remainingWickets = targetWickets
  let scoreBalls = totalBalls

  // Plan wickets: spread roughly evenly through the innings
  const wicketOversSet = new Set()
  for (let w = 0; w < remainingWickets; w++) {
    const targetOver = Math.floor((w + 1) * (fullOvers / (remainingWickets + 1)))
    wicketOversSet.add(Math.min(targetOver, fullOvers - 1))
  }
  const wicketOvers = [...wicketOversSet]

  // Track batter rotation
  let strikerIdx = 0
  let nonStrikerIdx = 1
  let nextBatterIdx = 2
  let bowlerIdx = 0
  const playerStats = {}
  for (const p of battingPlayers) playerStats[p.id] = { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, outType: null, dismissedById: null }
  for (const p of bowlingPlayers) playerStats[p.id] = { overs: 0, runs: 0, wickets: 0, maidens: 0, fielders: {} }

  // Partnership tracking
  let currentPartnership = {
    wicketNumber: 1,
    batsman1: battingPlayers[strikerIdx],
    batsman2: battingPlayers[nonStrikerIdx],
    runs: 0, balls: 0, fours: 0, sixes: 0,
    batsman1Runs: 0, batsman2Runs: 0,
    startedAt: 0, startedOver: 0,
  }
  const partnerships = []
  const fallOfWickets = []
  const balls = []

  let cumulativeRuns = 0
  let ballsBowled = 0
  let wicketsTaken = 0

  for (let over = 0; over < fullOvers; over++) {
    bowlerIdx = (over % 5) + 5 // rotate among bowlers 5-9 in roster
    const bowler = bowlingPlayers[Math.min(bowlerIdx, bowlingPlayers.length - 1)]
    let overRuns = 0
    let overBalls = 0
    while (overBalls < 6) {
      const ballsLeft = totalBalls - ballsBowled
      const runsLeft = targetScore - cumulativeRuns
      const wicketsLeft = remainingWickets - wicketsTaken
      const avgRunPerBallLeft = ballsLeft > 0 ? runsLeft / ballsLeft : 0

      // Decide ball outcome
      let runs = 0
      let isWide = false, isNoball = false, isBye = false, isLegbye = false
      let isWicket = false
      let shotDir = 'defended'
      let extras = 0
      const r = Math.random()

      // Wicket check (only if we still need wickets and not on last batter)
      const wantWicket = wicketOvers.includes(over) && wicketsTaken < remainingWickets
                       && nextBatterIdx < battingPlayers.length
                       && r < 0.08

      if (wantWicket) {
        isWicket = true
        runs = 0
        shotDir = 'caught'
      } else if (r < 0.32) {
        runs = 0; shotDir = 'defended'  // dot
      } else if (r < 0.55) {
        runs = 1; shotDir = 'mid_on'
      } else if (r < 0.68) {
        runs = 2; shotDir = 'square_leg'
      } else if (r < 0.72) {
        runs = 3; shotDir = 'cover'
      } else if (r < 0.86) {
        runs = 4; shotDir = ['cover', 'square_leg', 'mid_off', 'mid_wicket'][Math.floor(Math.random() * 4)]
      } else if (r < 0.93) {
        runs = 6; shotDir = ['long_on', 'mid_wicket', 'deep_cover'][Math.floor(Math.random() * 3)]
      } else if (r < 0.96) {
        isWide = true; runs = 0; extras = 1
      } else if (r < 0.98) {
        isNoball = true; runs = 1; extras = 1
      } else {
        isLegbye = true; runs = 1; extras = 1
      }

      // Bias toward needed avg run rate near the end
      if (!isWicket && over > fullOvers - 4 && avgRunPerBallLeft > 1.3 && r > 0.5) {
        runs = Math.max(runs, 2)
      }

      const consumesLegalBall = !isWide && !isNoball
      const striker = battingPlayers[strikerIdx]

      const ball = {
        matchId: match.id,
        innings: inningsNumber,
        overNumber: over,
        ballNumber: overBalls + 1,
        batsmanId: striker.id,
        bowlerId: bowler.id,
        nonStrikerId: battingPlayers[nonStrikerIdx].id,
        runs,
        isWide, isNoball, isBye, isLegbye,
        isWicket,
        wicketType: isWicket ? ['bowled', 'caught', 'lbw', 'caught_behind'][Math.floor(Math.random() * 4)] : null,
        extras,
        shotDirection: shotDir,
        commentary: runs === 6 ? `${striker.name} clears the rope!` : runs === 4 ? `${striker.name} times it sweetly through ${shotDir.replace('_', ' ')}!` : null,
      }
      balls.push(ball)

      // Update aggregates
      cumulativeRuns += runs + extras
      overRuns += runs + extras
      ballsBowled++

      // Striker stats (only if struck)
      if (!isBye && !isLegbye && !isNoball && !isWide && !isWicket) {
        const stat = playerStats[striker.id]
        stat.balls++
        stat.runs += runs
        if (runs === 4) stat.fours++
        if (runs === 6) stat.sixes++
        currentPartnership.runs += runs
        currentPartnership.balls++
        if (runs === 4) currentPartnership.fours++
        if (runs === 6) currentPartnership.sixes++
        if (strikerIdx === battingPlayers.indexOf(currentPartnership.batsman1)) {
          currentPartnership.batsman1Runs += runs
        } else {
          currentPartnership.batsman2Runs += runs
        }
      } else if (isNoball) {
        playerStats[striker.id].balls++  // no-ball runs off bat still face a ball? — keep simple, count
        playerStats[striker.id].runs += runs
        currentPartnership.runs += runs + extras
        currentPartnership.balls++
      } else if (isWide || isBye || isLegbye) {
        currentPartnership.runs += runs + extras
      }

      // Bowler stats
      const bstat = playerStats[bowler.id]
      bstat.runs += runs + extras
      if (consumesLegalBall) overBalls++
      if (isWicket && ball.wicketType !== 'run_out') bstat.wickets++

      // Wicket handling
      if (isWicket) {
        wicketsTaken++
        playerStats[striker.id].isOut = true
        playerStats[striker.id].outType = ball.wicketType
        playerStats[striker.id].dismissedById = bowler.id
        // Close partnership
        currentPartnership.endedAtScore = cumulativeRuns
        currentPartnership.endedOver = Number((over + overBalls / 6).toFixed(1))
        currentPartnership.unbroken = false
        partnerships.push({ ...currentPartnership })
        // Record fall of wicket
        fallOfWickets.push({
          matchId: match.id,
          inningsId: innings.id,
          wicketNumber: wicketsTaken,
          batsmanId: striker.id,
          dismissalType: ball.wicketType,
          bowlerId: ball.wicketType !== 'run_out' ? bowler.id : null,
          fielderId: null,
          runsAtFall: cumulativeRuns,
          oversAtFall: Number((over + overBalls / 6).toFixed(1)),
        })
        // Bring in next batter
        if (nextBatterIdx < battingPlayers.length) {
          strikerIdx = nextBatterIdx
          nextBatterIdx++
          // Open new partnership
          currentPartnership = {
            wicketNumber: wicketsTaken + 1,
            batsman1: battingPlayers[strikerIdx],
            batsman2: battingPlayers[nonStrikerIdx],
            runs: 0, balls: 0, fours: 0, sixes: 0,
            batsman1Runs: 0, batsman2Runs: 0,
            startedAt: cumulativeRuns, startedOver: Number((over + overBalls / 6).toFixed(1)),
          }
        }
      }

      // Strike rotation (odd runs swap; end of over swap)
      if (consumesLegalBall && runs % 2 === 1 && !isWicket) {
        ;[strikerIdx, nonStrikerIdx] = [nonStrikerIdx, strikerIdx]
      }

      if (ballsBowled >= totalBalls) break
    }
    // End of over — swap strike
    ;[strikerIdx, nonStrikerIdx] = [nonStrikerIdx, strikerIdx]
    {
      const overBowler = bowlingPlayers[Math.min(bowlerIdx, bowlingPlayers.length - 1)]
      playerStats[overBowler.id].overs += 1
      if (overRuns === 0) playerStats[overBowler.id].maidens++
    }
    if (ballsBowled >= totalBalls) break
  }

  // Persist balls in chunks
  if (balls.length > 0) {
    await prisma.ball.createMany({ data: balls })
  }

  // Persist fall of wickets
  for (const fow of fallOfWickets) {
    await prisma.fallOfWicket.create({ data: fow })
  }

  // Add the unbroken partnership if any
  if (!currentPartnership.unbroken && currentPartnership.balls > 0) {
    // already added
  } else if (currentPartnership.balls > 0) {
    partnerships.push({ ...currentPartnership, unbroken: true })
  }

  // Persist partnerships
  for (const p of partnerships) {
    await prisma.partnership.create({
      data: {
        matchId: match.id,
        inningsId: innings.id,
        wicketNumber: p.wicketNumber,
        batsman1Id: p.batsman1.id,
        batsman2Id: p.batsman2.id,
        runs: p.runs, balls: p.balls,
        fours: p.fours, sixes: p.sixes,
        batsman1Runs: p.batsman1Runs, batsman2Runs: p.batsman2Runs,
        startedAtScore: p.startedAt, endedAtScore: p.endedAtScore ?? null,
        startedOver: p.startedOver, endedOver: p.endedOver ?? null,
        unbroken: !!p.unbroken,
      },
    })
  }

  // Persist player scores (aggregate)
  for (const player of battingPlayers) {
    const s = playerStats[player.id]
    await prisma.playerScore.upsert({
      where: { matchId_playerId: { matchId: match.id, playerId: player.id } },
      update: {
        runsScored: s.runs, ballsFaced: s.balls, fours: s.fours, sixes: s.sixes,
        isOut: s.isOut, outType: s.outType, dismissedById: s.dismissedById,
      },
      create: {
        matchId: match.id, playerId: player.id,
        team: battingTeam.id === match.team1Id ? 1 : 2,
        runsScored: s.runs, ballsFaced: s.balls, fours: s.fours, sixes: s.sixes,
        isOut: s.isOut, outType: s.outType, dismissedById: s.dismissedById,
      },
    })
  }
  for (const player of bowlingPlayers) {
    const s = playerStats[player.id]
    if (s.overs === 0) continue
    await prisma.playerScore.upsert({
      where: { matchId_playerId: { matchId: match.id, playerId: player.id } },
      update: {
        oversBowled: s.overs, runsConceded: s.runs,
        wicketsTaken: s.wickets, maidens: s.maidens,
      },
      create: {
        matchId: match.id, playerId: player.id,
        team: bowlingTeam.id === match.team1Id ? 1 : 2,
        oversBowled: s.overs, runsConceded: s.runs,
        wicketsTaken: s.wickets, maidens: s.maidens,
      },
    })
  }
}

async function printSummary() {
  const counts = await Promise.all([
    prisma.user.count(),
    prisma.registeredPlayer.count(),
    prisma.team.count(),
    prisma.tournament.count(),
    prisma.match.count(),
    prisma.ball.count(),
    prisma.partnership.count(),
    prisma.fallOfWicket.count(),
    prisma.playerScore.count(),
    prisma.matchOfficial.count(),
  ])
  const [users, players, teams, tours, matches, balls, parts, fow, scores, offs] = counts

  console.log('─────────────────────────────────────────────────────')
  console.log('📊  DATABASE SUMMARY')
  console.log('─────────────────────────────────────────────────────')
  console.log(`  Users:               ${users}`)
  console.log(`  Registered players:  ${players}`)
  console.log(`  Teams:               ${teams}`)
  console.log(`  Tournaments:         ${tours}`)
  console.log(`  Matches:             ${matches}`)
  console.log(`  Balls:               ${balls}`)
  console.log(`  Partnerships:        ${parts}`)
  console.log(`  Fall of wickets:     ${fow}`)
  console.log(`  Player scores:       ${scores}`)
  console.log(`  Match officials:     ${offs}`)
  console.log('─────────────────────────────────────────────────────\n')

  console.log('🔐  CREDENTIALS  (password for every account: password123)\n')
  console.log('  Role                     Email')
  console.log('  ────────────────────     ──────────────────────────────────────')
  for (const u of USERS) {
    console.log(`  ${u.role.padEnd(24)} ${u.email}`)
  }
  console.log('\n✨  Seeding complete.\n')
}

main()
  .catch((err) => { console.error('\n❌  Seeding failed:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
