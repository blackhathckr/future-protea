/**
 * Comprehensive realistic seed for Future Protea (CUID schema).
 *
 * Run with:  node seeders/seed-realistic.js
 *
 * WIPES all existing data and seeds a Western Cape / Protea-themed dataset:
 *   - 2 feeder accounts (admin/scorer) + 2 viewer accounts
 *   - 24 player accounts (linked to RegisteredPlayers via matching email)
 *   - 30 RegisteredPlayer profiles with full bio data
 *   - 6 teams (3 schools + 3 clubs) with TeamPlayer rosters & captains/wks
 *   - 2 tournaments (Schools T20 + Cape Premier League) with standings & fixtures
 *   - 12 matches: 6 completed (full ball-by-ball), 1 live, 5 upcoming
 *   - PlayerScores (batting & bowling) for every completed match
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];
const daysAgo = (n) => new Date(Date.now() - n * 86400000);
const daysAhead = (n) => new Date(Date.now() + n * 86400000);
const hoursAgo = (n) => new Date(Date.now() - n * 3600000);

async function wipe() {
  console.log('Wiping existing data...');
  // Delete in FK-respecting order
  await prisma.ball.deleteMany();
  await prisma.playerScore.deleteMany();
  await prisma.matchPlayer.deleteMany();
  await prisma.tournamentFixture.deleteMany();
  await prisma.tournamentTeam.deleteMany();
  await prisma.match.deleteMany();
  await prisma.teamPlayer.deleteMany();
  await prisma.team.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.registeredPlayer.deleteMany();
  await prisma.user.deleteMany();
}

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────

async function createAdminAndViewerUsers() {
  console.log('Creating feeder & viewer accounts...');
  const pwd = await bcrypt.hash('password123', 10);

  const accounts = [
    { name: 'Coach Adams',     email: 'coach.adams@futureprotea.za', role: 'feeder', approved: true },
    { name: 'Match Scorer',    email: 'scorer@futureprotea.za',      role: 'feeder', approved: true },
    { name: 'Varun Reddy',     email: 'varun@gmail.com',             role: 'viewer', approved: true },
    { name: 'Nikhil Patel',    email: 'nikhill@gmail.com',           role: 'viewer', approved: true },
  ];

  const out = {};
  for (const a of accounts) {
    const u = await prisma.user.create({
      data: { ...a, password: pwd },
    });
    out[a.email] = u;
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTERED PLAYERS  (the cricketing roster — full bio data)
// ─────────────────────────────────────────────────────────────────────────────

const PLAYER_ROSTER = [
  // Wynberg Boys' High XI — 11 players
  { name: 'Rassie van der Merwe', dob: '2006-03-12', email: 'rassie.vdm@futureprotea.za',     phone: '+27 82 555 0101', city: 'Cape Town',  state: 'Western Cape', country: 'South Africa', schoolName: "Wynberg Boys' High",   battingStyle: 'Right Hand',   bowlingStyle: 'Right-arm Off Spin',  playingRole: 'Batsman',       jerseyNumber: 11, height: 178, weight: 72, bloodGroup: 'O+',  fatherName: 'Pieter van der Merwe',     guardianName: 'Pieter van der Merwe', emergencyContact: '+27 82 555 0001', emergencyContactName: 'Pieter van der Merwe', address: '12 Constantia Rd', postalCode: '7800', nationality: 'South African' },
  { name: 'Aiden Markram',         dob: '2006-07-04', email: 'aiden.markram@futureprotea.za',  phone: '+27 82 555 0102', city: 'Cape Town',  state: 'Western Cape', country: 'South Africa', schoolName: "Wynberg Boys' High",   battingStyle: 'Right Hand',   bowlingStyle: 'Right-arm Off Spin',  playingRole: 'All-rounder',   jerseyNumber: 7,  height: 182, weight: 78, bloodGroup: 'A+',  fatherName: 'John Markram',              guardianName: 'John Markram',         emergencyContact: '+27 82 555 0002', emergencyContactName: 'John Markram',         address: '8 Newlands Ave', postalCode: '7700', nationality: 'South African' },
  { name: 'Lungi Ngidi',           dob: '2006-11-29', email: 'lungi.ngidi@futureprotea.za',    phone: '+27 82 555 0103', city: 'Cape Town',  state: 'Western Cape', country: 'South Africa', schoolName: "Wynberg Boys' High",   battingStyle: 'Right Hand',   bowlingStyle: 'Right-arm Fast',      playingRole: 'Bowler',        jerseyNumber: 18, height: 196, weight: 96, bloodGroup: 'B+',  fatherName: 'Sipho Ngidi',               guardianName: 'Sipho Ngidi',          emergencyContact: '+27 82 555 0003', emergencyContactName: 'Sipho Ngidi',          address: '4 Khayelitsha Cres', postalCode: '7783', nationality: 'South African' },
  { name: 'Quinton de Kock',       dob: '2006-12-17', email: 'quinton.dk@futureprotea.za',     phone: '+27 82 555 0104', city: 'Cape Town',  state: 'Western Cape', country: 'South Africa', schoolName: "Wynberg Boys' High",   battingStyle: 'Left Hand',    bowlingStyle: 'Right-arm Medium',    playingRole: 'Wicket-keeper', jerseyNumber: 12, height: 174, weight: 70, bloodGroup: 'O-',  fatherName: 'Andy de Kock',              guardianName: 'Andy de Kock',         emergencyContact: '+27 82 555 0004', emergencyContactName: 'Andy de Kock',         address: '21 Claremont Way', postalCode: '7708', nationality: 'South African' },
  { name: 'Temba Bavuma',          dob: '2006-05-17', email: 'temba.bavuma@futureprotea.za',   phone: '+27 82 555 0105', city: 'Cape Town',  state: 'Western Cape', country: 'South Africa', schoolName: "Wynberg Boys' High",   battingStyle: 'Right Hand',   bowlingStyle: 'Right-arm Off Spin',  playingRole: 'Batsman',       jerseyNumber: 8,  height: 168, weight: 65, bloodGroup: 'A+',  fatherName: 'Vuyo Bavuma',               guardianName: 'Vuyo Bavuma',          emergencyContact: '+27 82 555 0005', emergencyContactName: 'Vuyo Bavuma',          address: '6 Langa Rd', postalCode: '7455', nationality: 'South African' },
  { name: 'Anrich Nortje',         dob: '2006-11-16', email: 'anrich.nortje@futureprotea.za',  phone: '+27 82 555 0106', city: 'Cape Town',  state: 'Western Cape', country: 'South Africa', schoolName: "Wynberg Boys' High",   battingStyle: 'Right Hand',   bowlingStyle: 'Right-arm Fast',      playingRole: 'Bowler',        jerseyNumber: 21, height: 188, weight: 84, bloodGroup: 'AB+', fatherName: 'Hennie Nortje',             guardianName: 'Hennie Nortje',        emergencyContact: '+27 82 555 0006', emergencyContactName: 'Hennie Nortje',        address: '14 Stellenbosch Rd', postalCode: '7600', nationality: 'South African' },
  { name: 'Wiaan Mulder',          dob: '2006-02-19', email: 'wiaan.mulder@futureprotea.za',   phone: '+27 82 555 0107', city: 'Cape Town',  state: 'Western Cape', country: 'South Africa', schoolName: "Wynberg Boys' High",   battingStyle: 'Right Hand',   bowlingStyle: 'Right-arm Medium-fast', playingRole: 'All-rounder', jerseyNumber: 5, height: 184, weight: 80, bloodGroup: 'O+',  fatherName: 'Frans Mulder',              guardianName: 'Frans Mulder',         emergencyContact: '+27 82 555 0007', emergencyContactName: 'Frans Mulder',         address: '9 Rondebosch Rd', postalCode: '7700', nationality: 'South African' },
  { name: 'Marco Jansen',          dob: '2006-05-01', email: 'marco.jansen@futureprotea.za',   phone: '+27 82 555 0108', city: 'Cape Town',  state: 'Western Cape', country: 'South Africa', schoolName: "Wynberg Boys' High",   battingStyle: 'Left Hand',    bowlingStyle: 'Left-arm Fast',       playingRole: 'All-rounder',   jerseyNumber: 25, height: 207, weight: 95, bloodGroup: 'B+',  fatherName: 'Andre Jansen',              guardianName: 'Andre Jansen',         emergencyContact: '+27 82 555 0008', emergencyContactName: 'Andre Jansen',         address: '15 Sea Point Rd', postalCode: '8005', nationality: 'South African' },
  { name: 'Tabraiz Shamsi',        dob: '2006-02-18', email: 'tabraiz.shamsi@futureprotea.za', phone: '+27 82 555 0109', city: 'Cape Town',  state: 'Western Cape', country: 'South Africa', schoolName: "Wynberg Boys' High",   battingStyle: 'Right Hand',   bowlingStyle: 'Left-arm Wrist Spin', playingRole: 'Bowler',        jerseyNumber: 99, height: 175, weight: 70, bloodGroup: 'A-',  fatherName: 'Yusuf Shamsi',              guardianName: 'Yusuf Shamsi',         emergencyContact: '+27 82 555 0009', emergencyContactName: 'Yusuf Shamsi',         address: '11 Bo-Kaap Lane', postalCode: '8001', nationality: 'South African' },
  { name: 'Reeza Hendricks',       dob: '2006-08-14', email: 'reeza.hendricks@futureprotea.za',phone: '+27 82 555 0110', city: 'Cape Town',  state: 'Western Cape', country: 'South Africa', schoolName: "Wynberg Boys' High",   battingStyle: 'Right Hand',   bowlingStyle: 'Right-arm Off Spin',  playingRole: 'Batsman',       jerseyNumber: 14, height: 178, weight: 74, bloodGroup: 'O+',  fatherName: 'Errol Hendricks',           guardianName: 'Errol Hendricks',      emergencyContact: '+27 82 555 0010', emergencyContactName: 'Errol Hendricks',      address: '3 Mowbray St', postalCode: '7700', nationality: 'South African' },
  { name: 'Tristan Stubbs',        dob: '2006-08-14', email: 'tristan.stubbs@futureprotea.za', phone: '+27 82 555 0111', city: 'Cape Town',  state: 'Western Cape', country: 'South Africa', schoolName: "Wynberg Boys' High",   battingStyle: 'Right Hand',   bowlingStyle: 'Right-arm Medium',    playingRole: 'Batsman',       jerseyNumber: 17, height: 180, weight: 76, bloodGroup: 'A+',  fatherName: 'Greg Stubbs',               guardianName: 'Greg Stubbs',          emergencyContact: '+27 82 555 0011', emergencyContactName: 'Greg Stubbs',          address: '7 Tokai Rd', postalCode: '7945', nationality: 'South African' },

  // Bishops Cricket Club (school) — 11 players
  { name: 'Heinrich Klaasen',      dob: '2006-06-30', email: 'heinrich.klaasen@futureprotea.za', phone: '+27 82 555 0201', city: 'Cape Town', state: 'Western Cape', country: 'South Africa', schoolName: 'Diocesan College (Bishops)', battingStyle: 'Right Hand',   bowlingStyle: 'Right-arm Off Spin',  playingRole: 'Wicket-keeper', jerseyNumber: 9,  height: 175, weight: 78, bloodGroup: 'B+',  fatherName: 'Ronnie Klaasen',  guardianName: 'Ronnie Klaasen',  emergencyContact: '+27 82 555 0021', emergencyContactName: 'Ronnie Klaasen',  address: '2 Bishops Rd, Rondebosch',     postalCode: '7700', nationality: 'South African' },
  { name: 'David Miller',          dob: '2006-06-10', email: 'david.miller@futureprotea.za',     phone: '+27 82 555 0202', city: 'Cape Town', state: 'Western Cape', country: 'South Africa', schoolName: 'Diocesan College (Bishops)', battingStyle: 'Left Hand',    bowlingStyle: 'Right-arm Off Spin',  playingRole: 'Batsman',       jerseyNumber: 10, height: 184, weight: 82, bloodGroup: 'O+',  fatherName: 'Andrew Miller',  guardianName: 'Andrew Miller',  emergencyContact: '+27 82 555 0022', emergencyContactName: 'Andrew Miller',  address: '5 Sandown Rd, Pinelands',      postalCode: '7405', nationality: 'South African' },
  { name: 'Kagiso Rabada',         dob: '2006-05-25', email: 'kagiso.rabada@futureprotea.za',    phone: '+27 82 555 0203', city: 'Cape Town', state: 'Western Cape', country: 'South Africa', schoolName: 'Diocesan College (Bishops)', battingStyle: 'Right Hand',   bowlingStyle: 'Right-arm Fast',      playingRole: 'Bowler',        jerseyNumber: 25, height: 191, weight: 87, bloodGroup: 'A+',  fatherName: 'Mpho Rabada',     guardianName: 'Mpho Rabada',     emergencyContact: '+27 82 555 0023', emergencyContactName: 'Mpho Rabada',     address: '11 Rosebank Way',              postalCode: '7700', nationality: 'South African' },
  { name: 'Keshav Maharaj',        dob: '2006-02-07', email: 'keshav.maharaj@futureprotea.za',   phone: '+27 82 555 0204', city: 'Cape Town', state: 'Western Cape', country: 'South Africa', schoolName: 'Diocesan College (Bishops)', battingStyle: 'Right Hand',   bowlingStyle: 'Slow Left-arm Orthodox', playingRole: 'Bowler',     jerseyNumber: 16, height: 178, weight: 76, bloodGroup: 'B-',  fatherName: 'Atul Maharaj',    guardianName: 'Atul Maharaj',    emergencyContact: '+27 82 555 0024', emergencyContactName: 'Atul Maharaj',    address: '8 Salt River Rd',               postalCode: '7925', nationality: 'South African' },
  { name: 'Andile Phehlukwayo',    dob: '2006-03-07', email: 'andile.p@futureprotea.za',         phone: '+27 82 555 0205', city: 'Cape Town', state: 'Western Cape', country: 'South Africa', schoolName: 'Diocesan College (Bishops)', battingStyle: 'Left Hand',    bowlingStyle: 'Right-arm Medium-fast', playingRole: 'All-rounder',jerseyNumber: 6, height: 180, weight: 80, bloodGroup: 'O+',  fatherName: 'Bonga Phehlukwayo', guardianName: 'Bonga Phehlukwayo', emergencyContact: '+27 82 555 0025', emergencyContactName: 'Bonga Phehlukwayo', address: '20 Kirstenhof Cres',          postalCode: '7945', nationality: 'South African' },
  { name: 'Ryan Rickelton',        dob: '2006-07-11', email: 'ryan.rickelton@futureprotea.za',   phone: '+27 82 555 0206', city: 'Cape Town', state: 'Western Cape', country: 'South Africa', schoolName: 'Diocesan College (Bishops)', battingStyle: 'Left Hand',    bowlingStyle: 'Right-arm Off Spin',  playingRole: 'Batsman',       jerseyNumber: 22, height: 178, weight: 75, bloodGroup: 'A+',  fatherName: 'Mark Rickelton', guardianName: 'Mark Rickelton', emergencyContact: '+27 82 555 0026', emergencyContactName: 'Mark Rickelton',  address: '3 Plumstead Way',              postalCode: '7800', nationality: 'South African' },
  { name: 'Dewald Brevis',         dob: '2006-04-29', email: 'dewald.brevis@futureprotea.za',    phone: '+27 82 555 0207', city: 'Cape Town', state: 'Western Cape', country: 'South Africa', schoolName: 'Diocesan College (Bishops)', battingStyle: 'Right Hand',   bowlingStyle: 'Right-arm Leg Spin',  playingRole: 'All-rounder',   jerseyNumber: 31, height: 175, weight: 70, bloodGroup: 'O+',  fatherName: 'Hendrik Brevis',  guardianName: 'Hendrik Brevis',  emergencyContact: '+27 82 555 0027', emergencyContactName: 'Hendrik Brevis',  address: '7 Steenberg Rd',               postalCode: '7945', nationality: 'South African' },
  { name: 'Gerald Coetzee',        dob: '2006-10-02', email: 'gerald.coetzee@futureprotea.za',   phone: '+27 82 555 0208', city: 'Cape Town', state: 'Western Cape', country: 'South Africa', schoolName: 'Diocesan College (Bishops)', battingStyle: 'Right Hand',   bowlingStyle: 'Right-arm Fast',      playingRole: 'Bowler',        jerseyNumber: 30, height: 188, weight: 86, bloodGroup: 'B+',  fatherName: 'Jaco Coetzee',    guardianName: 'Jaco Coetzee',    emergencyContact: '+27 82 555 0028', emergencyContactName: 'Jaco Coetzee',    address: '17 Bergvliet Rd',              postalCode: '7945', nationality: 'South African' },
  { name: 'Sisanda Magala',        dob: '2006-12-26', email: 'sisanda.magala@futureprotea.za',   phone: '+27 82 555 0209', city: 'Cape Town', state: 'Western Cape', country: 'South Africa', schoolName: 'Diocesan College (Bishops)', battingStyle: 'Right Hand',   bowlingStyle: 'Right-arm Medium-fast',playingRole: 'Bowler',       jerseyNumber: 27, height: 183, weight: 88, bloodGroup: 'AB+', fatherName: 'Zola Magala',     guardianName: 'Zola Magala',     emergencyContact: '+27 82 555 0029', emergencyContactName: 'Zola Magala',     address: '1 Diep River Rd',              postalCode: '7800', nationality: 'South African' },
  { name: 'Tony de Zorzi',         dob: '2006-05-28', email: 'tony.dezorzi@futureprotea.za',     phone: '+27 82 555 0210', city: 'Cape Town', state: 'Western Cape', country: 'South Africa', schoolName: 'Diocesan College (Bishops)', battingStyle: 'Left Hand',    bowlingStyle: 'Right-arm Off Spin',  playingRole: 'Batsman',       jerseyNumber: 13, height: 178, weight: 74, bloodGroup: 'O-',  fatherName: 'Vincent de Zorzi', guardianName: 'Vincent de Zorzi', emergencyContact: '+27 82 555 0030', emergencyContactName: 'Vincent de Zorzi', address: '4 Tokai Rd',                  postalCode: '7945', nationality: 'South African' },
  { name: 'Lutho Sipamla',         dob: '2006-05-12', email: 'lutho.sipamla@futureprotea.za',    phone: '+27 82 555 0211', city: 'Cape Town', state: 'Western Cape', country: 'South Africa', schoolName: 'Diocesan College (Bishops)', battingStyle: 'Right Hand',   bowlingStyle: 'Right-arm Fast-medium', playingRole: 'Bowler',      jerseyNumber: 19, height: 185, weight: 78, bloodGroup: 'A+',  fatherName: 'Mzwandile Sipamla', guardianName: 'Mzwandile Sipamla', emergencyContact: '+27 82 555 0031', emergencyContactName: 'Mzwandile Sipamla', address: '6 Bergsig Rd',              postalCode: '7800', nationality: 'South African' },

  // SACS Saints (school) — 8 players
  { name: 'Eddie Moore',           dob: '2007-03-14', email: 'eddie.moore@futureprotea.za',      phone: '+27 82 555 0301', city: 'Cape Town', state: 'Western Cape', country: 'South Africa', schoolName: 'South African College Schools', battingStyle: 'Right Hand', bowlingStyle: 'Right-arm Off Spin', playingRole: 'Batsman',     jerseyNumber: 4,  height: 174, weight: 68, bloodGroup: 'O+',  fatherName: 'Greg Moore',       guardianName: 'Greg Moore',       emergencyContact: '+27 82 555 0041', emergencyContactName: 'Greg Moore',       address: '14 Newlands Cres',          postalCode: '7700', nationality: 'South African' },
  { name: 'Janneman Malan',        dob: '2006-12-26', email: 'janneman.malan@futureprotea.za',   phone: '+27 82 555 0302', city: 'Cape Town', state: 'Western Cape', country: 'South Africa', schoolName: 'South African College Schools', battingStyle: 'Right Hand', bowlingStyle: 'Right-arm Off Spin', playingRole: 'Batsman',     jerseyNumber: 35, height: 178, weight: 74, bloodGroup: 'A+',  fatherName: 'Andries Malan',    guardianName: 'Andries Malan',    emergencyContact: '+27 82 555 0042', emergencyContactName: 'Andries Malan',    address: '21 Constantia Rd',          postalCode: '7806', nationality: 'South African' },
  { name: 'Tony Pillay',           dob: '2007-01-22', email: 'tony.pillay@futureprotea.za',      phone: '+27 82 555 0303', city: 'Cape Town', state: 'Western Cape', country: 'South Africa', schoolName: 'South African College Schools', battingStyle: 'Right Hand', bowlingStyle: 'Slow Left-arm Orthodox', playingRole: 'All-rounder', jerseyNumber: 3, height: 176, weight: 72, bloodGroup: 'B+', fatherName: 'Ravi Pillay',      guardianName: 'Ravi Pillay',      emergencyContact: '+27 82 555 0043', emergencyContactName: 'Ravi Pillay',      address: '8 Mowbray Cir',             postalCode: '7700', nationality: 'South African' },
  { name: 'Ferisco Adams',         dob: '2006-09-09', email: 'ferisco.adams@futureprotea.za',    phone: '+27 82 555 0304', city: 'Cape Town', state: 'Western Cape', country: 'South Africa', schoolName: 'South African College Schools', battingStyle: 'Right Hand', bowlingStyle: 'Right-arm Medium', playingRole: 'Bowler',         jerseyNumber: 28, height: 184, weight: 80, bloodGroup: 'O-',  fatherName: 'Eddie Adams',     guardianName: 'Eddie Adams',     emergencyContact: '+27 82 555 0044', emergencyContactName: 'Eddie Adams',     address: '11 Athlone Rd',              postalCode: '7764', nationality: 'South African' },
  { name: 'Khaya Zondo',           dob: '2006-09-22', email: 'khaya.zondo@futureprotea.za',      phone: '+27 82 555 0305', city: 'Cape Town', state: 'Western Cape', country: 'South Africa', schoolName: 'South African College Schools', battingStyle: 'Right Hand', bowlingStyle: 'Right-arm Off Spin', playingRole: 'Batsman',     jerseyNumber: 23, height: 174, weight: 71, bloodGroup: 'A+',  fatherName: 'Mthokozisi Zondo', guardianName: 'Mthokozisi Zondo', emergencyContact: '+27 82 555 0045', emergencyContactName: 'Mthokozisi Zondo', address: '5 Gugulethu Rd',             postalCode: '7750', nationality: 'South African' },
  { name: 'Daryn Dupavillon',      dob: '2006-04-14', email: 'daryn.d@futureprotea.za',          phone: '+27 82 555 0306', city: 'Cape Town', state: 'Western Cape', country: 'South Africa', schoolName: 'South African College Schools', battingStyle: 'Left Hand',  bowlingStyle: 'Left-arm Fast-medium', playingRole: 'All-rounder',jerseyNumber: 33, height: 188, weight: 86, bloodGroup: 'B+',  fatherName: 'Pierre Dupavillon', guardianName: 'Pierre Dupavillon', emergencyContact: '+27 82 555 0046', emergencyContactName: 'Pierre Dupavillon', address: '2 Pinelands Way',         postalCode: '7405', nationality: 'South African' },
  { name: 'Kyle Verreynne',        dob: '2007-05-12', email: 'kyle.verreynne@futureprotea.za',   phone: '+27 82 555 0307', city: 'Cape Town', state: 'Western Cape', country: 'South Africa', schoolName: 'South African College Schools', battingStyle: 'Right Hand', bowlingStyle: 'Right-arm Medium', playingRole: 'Wicket-keeper',  jerseyNumber: 1,  height: 175, weight: 72, bloodGroup: 'O+',  fatherName: 'Andre Verreynne', guardianName: 'Andre Verreynne', emergencyContact: '+27 82 555 0047', emergencyContactName: 'Andre Verreynne', address: '12 Wynberg Rd',           postalCode: '7800', nationality: 'South African' },
  { name: 'Beuran Hendricks',      dob: '2006-06-08', email: 'beuran.hendricks@futureprotea.za', phone: '+27 82 555 0308', city: 'Cape Town', state: 'Western Cape', country: 'South Africa', schoolName: 'South African College Schools', battingStyle: 'Left Hand',  bowlingStyle: 'Left-arm Fast-medium', playingRole: 'Bowler',     jerseyNumber: 20, height: 183, weight: 79, bloodGroup: 'A-',  fatherName: 'Gavin Hendricks', guardianName: 'Gavin Hendricks', emergencyContact: '+27 82 555 0048', emergencyContactName: 'Gavin Hendricks', address: '17 Mitchells Plain Way',     postalCode: '7785', nationality: 'South African' },
];

async function createPlayers() {
  console.log(`Creating ${PLAYER_ROSTER.length} registered players + matching user accounts...`);
  const pwd = await bcrypt.hash('player123', 10);
  const results = []; // { reg, user }

  let counter = 1;
  for (const p of PLAYER_ROSTER) {
    const playerIdCode = `WCP-${String(counter++).padStart(4, '0')}`;
    const reg = await prisma.registeredPlayer.create({
      data: {
        name:                 p.name,
        playerIdCode,
        dateOfBirth:          new Date(p.dob),
        email:                p.email,
        phone:                p.phone,
        emergencyContact:     p.emergencyContact,
        emergencyContactName: p.emergencyContactName,
        address:              p.address,
        city:                 p.city,
        state:                p.state,
        country:              p.country,
        postalCode:           p.postalCode,
        height:               p.height,
        weight:               p.weight,
        bloodGroup:           p.bloodGroup,
        schoolName:           p.schoolName,
        battingStyle:         p.battingStyle,
        bowlingStyle:         p.bowlingStyle,
        playingRole:          p.playingRole,
        jerseyNumber:         p.jerseyNumber,
        fatherName:           p.fatherName,
        guardianName:         p.guardianName,
        nationality:          p.nationality,
      },
    });
    const user = await prisma.user.create({
      data: {
        name:         p.name,
        email:        p.email,
        password:     pwd,
        role:         'player',
        phone:        p.phone,
        dateOfBirth:  new Date(p.dob),
        battingStyle: p.battingStyle,
        bowlingStyle: p.bowlingStyle,
        approved:     true,
      },
    });
    results.push({ reg, user });
  }
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEAMS  — 3 schools, 3 clubs (clubs reuse the same player pool)
// ─────────────────────────────────────────────────────────────────────────────

async function createTeams(roster, feederId) {
  console.log('Creating teams & rosters...');

  // Map players by name for easy lookup
  const byName = new Map(roster.map((r) => [r.reg.name, r]));

  const wynberg = await prisma.team.create({
    data: {
      teamName:  "Wynberg Boys' XI",
      teamType:  'school',
      schoolName:"Wynberg Boys' High School",
      createdBy: feederId,
    },
  });
  const bishops = await prisma.team.create({
    data: {
      teamName:  'Bishops 1st XI',
      teamType:  'school',
      schoolName:'Diocesan College (Bishops)',
      createdBy: feederId,
    },
  });
  const sacs = await prisma.team.create({
    data: {
      teamName:  'SACS Saints',
      teamType:  'school',
      schoolName:'South African College Schools',
      createdBy: feederId,
    },
  });
  const wpStrikers = await prisma.team.create({
    data: {
      teamName:  'Western Province Strikers',
      teamType:  'club',
      clubName:  'Western Province CC',
      createdBy: feederId,
    },
  });
  const cobras = await prisma.team.create({
    data: {
      teamName:  'Cape Cobras',
      teamType:  'club',
      clubName:  'Cape Town Cricket Club',
      createdBy: feederId,
    },
  });
  const boland = await prisma.team.create({
    data: {
      teamName:  'Boland Rocks',
      teamType:  'club',
      clubName:  'Boland Cricket Club',
      createdBy: feederId,
    },
  });

  // Roster assignments. Captain (c) and wicket-keeper (wk) flagged.
  const assignments = [
    // Wynberg
    { team: wynberg, captain: 'Aiden Markram', wk: 'Quinton de Kock', members: [
      'Rassie van der Merwe','Aiden Markram','Lungi Ngidi','Quinton de Kock',
      'Temba Bavuma','Anrich Nortje','Wiaan Mulder','Marco Jansen',
      'Tabraiz Shamsi','Reeza Hendricks','Tristan Stubbs',
    ]},
    // Bishops
    { team: bishops, captain: 'Kagiso Rabada', wk: 'Heinrich Klaasen', members: [
      'Heinrich Klaasen','David Miller','Kagiso Rabada','Keshav Maharaj',
      'Andile Phehlukwayo','Ryan Rickelton','Dewald Brevis','Gerald Coetzee',
      'Sisanda Magala','Tony de Zorzi','Lutho Sipamla',
    ]},
    // SACS
    { team: sacs, captain: 'Janneman Malan', wk: 'Kyle Verreynne', members: [
      'Eddie Moore','Janneman Malan','Tony Pillay','Ferisco Adams',
      'Khaya Zondo','Daryn Dupavillon','Kyle Verreynne','Beuran Hendricks',
    ]},
    // WP Strikers (club) — borrows top players
    { team: wpStrikers, captain: 'David Miller', wk: 'Quinton de Kock', members: [
      'Quinton de Kock','David Miller','Aiden Markram','Kagiso Rabada',
      'Lungi Ngidi','Wiaan Mulder','Tabraiz Shamsi','Marco Jansen',
      'Heinrich Klaasen','Janneman Malan','Keshav Maharaj',
    ]},
    // Cape Cobras
    { team: cobras, captain: 'Temba Bavuma', wk: 'Kyle Verreynne', members: [
      'Temba Bavuma','Reeza Hendricks','Anrich Nortje','Andile Phehlukwayo',
      'Ryan Rickelton','Dewald Brevis','Gerald Coetzee','Tristan Stubbs',
      'Kyle Verreynne','Tony de Zorzi','Beuran Hendricks',
    ]},
    // Boland Rocks
    { team: boland, captain: 'Eddie Moore', wk: 'Heinrich Klaasen', members: [
      'Eddie Moore','Janneman Malan','Tony Pillay','Ferisco Adams',
      'Khaya Zondo','Daryn Dupavillon','Lutho Sipamla','Sisanda Magala',
      'Heinrich Klaasen','Marco Jansen','Beuran Hendricks',
    ]},
  ];

  for (const a of assignments) {
    for (const playerName of a.members) {
      const r = byName.get(playerName);
      if (!r) { console.warn(`  ! roster missing: ${playerName}`); continue; }
      await prisma.teamPlayer.create({
        data: {
          teamId:         a.team.id,
          playerId:       r.reg.id,
          isCaptain:      playerName === a.captain,
          isWicketKeeper: playerName === a.wk,
        },
      });
    }
  }

  return { wynberg, bishops, sacs, wpStrikers, cobras, boland };
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCH HELPERS — populate match_players + player_scores + balls
// ─────────────────────────────────────────────────────────────────────────────

/**
 * For a completed match: create match_players (both teams) + player_scores
 * derived from the supplied innings summaries, then synthesise ball-by-ball.
 *
 * Each `innings` entry: { team: 1|2, batsmen: [{name, runs, balls, fours, sixes, isOut, outType}], bowlers: [{name, overs, runs, wickets, maidens}] }
 */
async function recordCompletedInnings(match, t1Players, t2Players, innings) {
  // Resolve player name → user.id by querying once
  const allNames = [
    ...t1Players.map((p) => p.user.name),
    ...t2Players.map((p) => p.user.name),
  ];
  const users = await prisma.user.findMany({
    where: { name: { in: allNames } },
    select: { id: true, name: true },
  });
  const uid = (n) => users.find((u) => u.name === n).id;

  // match_players (both teams)
  for (const p of t1Players) {
    await prisma.matchPlayer.create({
      data: { matchId: match.id, playerId: p.user.id, team: 1, status: 'approved' },
    });
  }
  for (const p of t2Players) {
    await prisma.matchPlayer.create({
      data: { matchId: match.id, playerId: p.user.id, team: 2, status: 'approved' },
    });
  }

  // For each innings, upsert scores
  for (const inn of innings) {
    // Batting
    for (const b of inn.batsmen) {
      await prisma.playerScore.upsert({
        where: { matchId_playerId: { matchId: match.id, playerId: uid(b.name) } },
        create: {
          matchId:    match.id,
          playerId:   uid(b.name),
          team:       inn.team,
          runsScored: b.runs,
          ballsFaced: b.balls,
          fours:      b.fours || 0,
          sixes:      b.sixes || 0,
          isOut:      b.isOut,
          outType:    b.isOut ? (b.outType || 'Bowled') : null,
        },
        update: {
          team:       inn.team,
          runsScored: b.runs,
          ballsFaced: b.balls,
          fours:      b.fours || 0,
          sixes:      b.sixes || 0,
          isOut:      b.isOut,
          outType:    b.isOut ? (b.outType || 'Bowled') : null,
        },
      });
    }
    // Bowling
    const bowlerTeam = inn.team === 1 ? 2 : 1;
    for (const bw of inn.bowlers) {
      await prisma.playerScore.upsert({
        where: { matchId_playerId: { matchId: match.id, playerId: uid(bw.name) } },
        create: {
          matchId:      match.id,
          playerId:     uid(bw.name),
          team:         bowlerTeam,
          oversBowled:  bw.overs,
          runsConceded: bw.runs,
          wicketsTaken: bw.wickets,
          maidens:      bw.maidens || 0,
        },
        update: {
          oversBowled:  bw.overs,
          runsConceded: bw.runs,
          wicketsTaken: bw.wickets,
          maidens:      bw.maidens || 0,
        },
      });
    }
  }

  // Generate plausible ball-by-ball for each innings.
  for (const inn of innings) {
    const totalRuns    = inn.batsmen.reduce((s, b) => s + b.runs, 0);
    const totalWickets = inn.batsmen.filter((b) => b.isOut).length;
    const totalOversD  = inn.bowlers.reduce((s, b) => s + b.overs, 0);
    const fullO        = Math.floor(totalOversD);
    const partB        = Math.round((totalOversD - fullO) * 10);
    const totalBalls   = fullO * 6 + partB;
    if (totalBalls === 0) continue;

    const batIds  = inn.batsmen.map((b) => uid(b.name));
    const bowlIds = inn.bowlers.map((b) => uid(b.name));

    // Place wickets at evenly-spaced ball positions
    const wPos = new Set();
    if (totalWickets > 0) {
      const interval = Math.floor(totalBalls / (totalWickets + 1));
      for (let w = 0; w < totalWickets; w++) wPos.add(interval * (w + 1));
    }

    let runsLeft = totalRuns;
    let bIdx = 0, bowIdx = 0, ovr = 0, ballNum = 0;

    for (let i = 0; i < totalBalls; i++) {
      const batId = batIds[bIdx % batIds.length];
      const bowId = bowlIds[bowIdx % bowlIds.length];
      let runs = 0, isWicket = false, wicketType = null;

      if (wPos.has(i)) {
        isWicket = true;
        wicketType = pick(['Bowled','Caught','LBW','Run Out','Stumped']);
        bIdx++;
      } else if (runsLeft > 0) {
        const rem = totalBalls - i;
        const avg = runsLeft / rem;
        if      (avg > 1.8 && Math.random() < 0.10) runs = 6;
        else if (avg > 1.4 && Math.random() < 0.18) runs = 4;
        else if (Math.random() < 0.32)              runs = 0;
        else if (Math.random() < 0.55)              runs = 1;
        else if (Math.random() < 0.78)              runs = 2;
        else                                        runs = 3;
        if (runs > runsLeft) runs = runsLeft;
        runsLeft -= runs;
      }

      ballNum++;
      await prisma.ball.create({
        data: {
          matchId:    match.id,
          innings:    inn.team,
          overNumber: ovr,
          ballNumber: ballNum,
          batsmanId:  batId,
          bowlerId:   bowId,
          runs,
          isWicket,
          wicketType,
        },
      });
      if (ballNum === 6) { ovr++; ballNum = 0; bowIdx++; }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCHES, TOURNAMENTS, FIXTURES, LIVE STATE
// ─────────────────────────────────────────────────────────────────────────────

async function createTournaments(teams, feederId) {
  console.log('Creating tournaments...');

  const schoolsT20 = await prisma.tournament.create({
    data: {
      name:      'Western Cape Schools T20 Cup 2026',
      type:      'T20',
      overs:     20,
      startDate: daysAgo(14),
      endDate:   daysAhead(14),
      venue:     'Newlands Cricket Ground',
      organizer: 'Western Province Cricket Association',
      status:    'in_progress',
      createdBy: feederId,
    },
  });
  const cpl = await prisma.tournament.create({
    data: {
      name:      'Cape Premier League 2026',
      type:      'T20',
      overs:     20,
      startDate: daysAhead(7),
      endDate:   daysAhead(35),
      venue:     'Newlands Cricket Ground',
      organizer: 'Cape Town Cricket Board',
      status:    'upcoming',
      createdBy: feederId,
    },
  });

  // TournamentTeam entries
  const schoolsTeams = [teams.wynberg, teams.bishops, teams.sacs];
  for (const t of schoolsTeams) {
    await prisma.tournamentTeam.create({
      data: { tournamentId: schoolsT20.id, teamId: t.id, groupName: 'Group A' },
    });
  }
  const clubTeams = [teams.wpStrikers, teams.cobras, teams.boland];
  for (const t of clubTeams) {
    await prisma.tournamentTeam.create({
      data: { tournamentId: cpl.id, teamId: t.id, groupName: 'Group A' },
    });
  }

  return { schoolsT20, cpl };
}

async function getTeamPlayersForMatch(team, roster) {
  // Pull TeamPlayer rows for this team + map to roster (which has user objects)
  const tps = await prisma.teamPlayer.findMany({
    where: { teamId: team.id },
    include: { player: { select: { name: true } } },
  });
  const byName = new Map(roster.map((r) => [r.reg.name, r]));
  return tps.map((tp) => byName.get(tp.player.name)).filter(Boolean);
}

async function createMatches(teams, roster, tournaments, feederId) {
  console.log('Creating matches (completed/live/upcoming)...');

  const wynbergPlayers    = await getTeamPlayersForMatch(teams.wynberg, roster);
  const bishopsPlayers    = await getTeamPlayersForMatch(teams.bishops, roster);
  const sacsPlayers       = await getTeamPlayersForMatch(teams.sacs, roster);
  const wpStrikersPlayers = await getTeamPlayersForMatch(teams.wpStrikers, roster);
  const cobrasPlayers     = await getTeamPlayersForMatch(teams.cobras, roster);
  const bolandPlayers     = await getTeamPlayersForMatch(teams.boland, roster);

  // ─────── COMPLETED MATCH 1: Wynberg 174/6 beat Bishops 162/9 (12 days ago) ───────
  const m1 = await prisma.match.create({
    data: {
      team1Name:     teams.wynberg.teamName,
      team2Name:     teams.bishops.teamName,
      venue:         'Newlands',
      totalOvers:    20,
      status:        'completed',
      tossWinner:    teams.wynberg.teamName,
      tossDecision:  'bat',
      winner:        teams.wynberg.teamName,
      team1Score:    174,
      team1Wickets:  6,
      team1Overs:    20.0,
      team2Score:    162,
      team2Wickets:  9,
      team2Overs:    20.0,
      currentInnings: 2,
      matchDate:     daysAgo(12),
      createdBy:     feederId,
      tournamentId:  tournaments.schoolsT20.id,
      matchType:     'T20',
      umpire:        'Marais Erasmus',
      playerOfMatch: 'Aiden Markram',
    },
  });
  await recordCompletedInnings(m1, wynbergPlayers, bishopsPlayers, [
    { team: 1, batsmen: [
        { name: 'Quinton de Kock',       runs: 38, balls: 28, fours: 5, sixes: 1, isOut: true,  outType: 'Caught' },
        { name: 'Aiden Markram',         runs: 64, balls: 41, fours: 6, sixes: 3, isOut: true,  outType: 'Bowled' },
        { name: 'Rassie van der Merwe',  runs: 22, balls: 19, fours: 2, sixes: 0, isOut: true,  outType: 'LBW' },
        { name: 'Temba Bavuma',          runs: 18, balls: 15, fours: 1, sixes: 0, isOut: true,  outType: 'Run Out' },
        { name: 'Tristan Stubbs',        runs: 14, balls: 9,  fours: 1, sixes: 1, isOut: false },
        { name: 'Wiaan Mulder',          runs: 8,  balls: 6,  fours: 1, sixes: 0, isOut: true,  outType: 'Caught' },
        { name: 'Marco Jansen',          runs: 6,  balls: 4,  fours: 0, sixes: 0, isOut: true,  outType: 'Caught' },
        { name: 'Reeza Hendricks',       runs: 4,  balls: 3,  fours: 0, sixes: 0, isOut: false },
      ], bowlers: [
        { name: 'Kagiso Rabada',         overs: 4.0, runs: 28, wickets: 2, maidens: 0 },
        { name: 'Lutho Sipamla',         overs: 4.0, runs: 36, wickets: 1, maidens: 0 },
        { name: 'Gerald Coetzee',        overs: 4.0, runs: 31, wickets: 1, maidens: 0 },
        { name: 'Andile Phehlukwayo',    overs: 4.0, runs: 39, wickets: 1, maidens: 0 },
        { name: 'Keshav Maharaj',        overs: 4.0, runs: 38, wickets: 0, maidens: 0 },
      ]
    },
    { team: 2, batsmen: [
        { name: 'Heinrich Klaasen',      runs: 42, balls: 29, fours: 4, sixes: 2, isOut: true,  outType: 'Caught' },
        { name: 'David Miller',          runs: 31, balls: 24, fours: 3, sixes: 1, isOut: true,  outType: 'Caught' },
        { name: 'Tony de Zorzi',         runs: 18, balls: 14, fours: 2, sixes: 0, isOut: true,  outType: 'Bowled' },
        { name: 'Dewald Brevis',         runs: 26, balls: 19, fours: 2, sixes: 1, isOut: true,  outType: 'LBW' },
        { name: 'Ryan Rickelton',        runs: 14, balls: 10, fours: 1, sixes: 0, isOut: true,  outType: 'Caught' },
        { name: 'Andile Phehlukwayo',    runs: 12, balls: 9,  fours: 1, sixes: 0, isOut: true,  outType: 'Run Out' },
        { name: 'Kagiso Rabada',         runs: 8,  balls: 7,  fours: 1, sixes: 0, isOut: true,  outType: 'Bowled' },
        { name: 'Keshav Maharaj',        runs: 4,  balls: 3,  fours: 0, sixes: 0, isOut: true,  outType: 'Caught' },
        { name: 'Sisanda Magala',        runs: 3,  balls: 4,  fours: 0, sixes: 0, isOut: true,  outType: 'LBW' },
        { name: 'Gerald Coetzee',        runs: 2,  balls: 3,  fours: 0, sixes: 0, isOut: false },
      ], bowlers: [
        { name: 'Marco Jansen',          overs: 4.0, runs: 24, wickets: 3, maidens: 0 },
        { name: 'Lungi Ngidi',           overs: 4.0, runs: 32, wickets: 2, maidens: 0 },
        { name: 'Anrich Nortje',         overs: 4.0, runs: 28, wickets: 2, maidens: 0 },
        { name: 'Tabraiz Shamsi',        overs: 4.0, runs: 35, wickets: 1, maidens: 0 },
        { name: 'Wiaan Mulder',          overs: 4.0, runs: 38, wickets: 1, maidens: 0 },
      ]
    },
  ]);

  // ─────── COMPLETED MATCH 2: SACS 198/4 beat Wynberg 196/8 (9 days ago) ───────
  const m2 = await prisma.match.create({
    data: {
      team1Name: teams.sacs.teamName, team2Name: teams.wynberg.teamName,
      venue: 'Newlands', totalOvers: 20, status: 'completed',
      tossWinner: teams.wynberg.teamName, tossDecision: 'bat', winner: teams.sacs.teamName,
      team1Score: 198, team1Wickets: 4, team1Overs: 19.4,
      team2Score: 196, team2Wickets: 8, team2Overs: 20.0,
      currentInnings: 2, matchDate: daysAgo(9),
      createdBy: feederId, tournamentId: tournaments.schoolsT20.id, matchType: 'T20',
      umpire: 'Adrian Holdstock', playerOfMatch: 'Janneman Malan',
    },
  });
  await recordCompletedInnings(m2, sacsPlayers, wynbergPlayers, [
    { team: 2, batsmen: [
        { name: 'Quinton de Kock',       runs: 54, balls: 38, fours: 6, sixes: 2, isOut: true, outType: 'Caught' },
        { name: 'Aiden Markram',         runs: 47, balls: 33, fours: 5, sixes: 1, isOut: true, outType: 'Bowled' },
        { name: 'Rassie van der Merwe',  runs: 28, balls: 22, fours: 3, sixes: 0, isOut: true, outType: 'Caught' },
        { name: 'Temba Bavuma',          runs: 22, balls: 18, fours: 2, sixes: 0, isOut: true, outType: 'LBW' },
        { name: 'Tristan Stubbs',        runs: 18, balls: 11, fours: 1, sixes: 1, isOut: true, outType: 'Caught' },
        { name: 'Wiaan Mulder',          runs: 12, balls: 8,  fours: 1, sixes: 0, isOut: true, outType: 'Run Out' },
        { name: 'Marco Jansen',          runs: 9,  balls: 7,  fours: 1, sixes: 0, isOut: true, outType: 'Caught' },
        { name: 'Reeza Hendricks',       runs: 4,  balls: 4,  fours: 0, sixes: 0, isOut: true, outType: 'Bowled' },
        { name: 'Anrich Nortje',         runs: 2,  balls: 3,  fours: 0, sixes: 0, isOut: false },
      ], bowlers: [
        { name: 'Beuran Hendricks',      overs: 4.0, runs: 33, wickets: 3, maidens: 0 },
        { name: 'Daryn Dupavillon',      overs: 4.0, runs: 41, wickets: 2, maidens: 0 },
        { name: 'Ferisco Adams',         overs: 4.0, runs: 38, wickets: 1, maidens: 0 },
        { name: 'Tony Pillay',           overs: 4.0, runs: 42, wickets: 1, maidens: 0 },
        { name: 'Khaya Zondo',           overs: 4.0, runs: 42, wickets: 1, maidens: 0 },
      ]
    },
    { team: 1, batsmen: [
        { name: 'Janneman Malan',        runs: 89, balls: 52, fours: 9, sixes: 4, isOut: false },
        { name: 'Eddie Moore',           runs: 41, balls: 34, fours: 4, sixes: 1, isOut: true, outType: 'Caught' },
        { name: 'Kyle Verreynne',        runs: 32, balls: 21, fours: 3, sixes: 2, isOut: true, outType: 'Bowled' },
        { name: 'Khaya Zondo',           runs: 18, balls: 9,  fours: 1, sixes: 1, isOut: false },
        { name: 'Tony Pillay',           runs: 8,  balls: 4,  fours: 1, sixes: 0, isOut: true, outType: 'Caught' },
        { name: 'Daryn Dupavillon',      runs: 4,  balls: 1,  fours: 1, sixes: 0, isOut: true, outType: 'Caught' },
      ], bowlers: [
        { name: 'Marco Jansen',          overs: 4.0, runs: 38, wickets: 2, maidens: 0 },
        { name: 'Lungi Ngidi',           overs: 4.0, runs: 42, wickets: 1, maidens: 0 },
        { name: 'Anrich Nortje',         overs: 3.4, runs: 39, wickets: 1, maidens: 0 },
        { name: 'Tabraiz Shamsi',        overs: 4.0, runs: 41, wickets: 0, maidens: 0 },
        { name: 'Wiaan Mulder',          overs: 4.0, runs: 36, wickets: 0, maidens: 0 },
      ]
    },
  ]);

  // ─────── COMPLETED MATCH 3: Bishops 156/8 beat SACS 154 (6 days ago) ───────
  const m3 = await prisma.match.create({
    data: {
      team1Name: teams.bishops.teamName, team2Name: teams.sacs.teamName,
      venue: 'Newlands', totalOvers: 20, status: 'completed',
      tossWinner: teams.sacs.teamName, tossDecision: 'bat', winner: teams.bishops.teamName,
      team1Score: 156, team1Wickets: 8, team1Overs: 19.5,
      team2Score: 154, team2Wickets: 10, team2Overs: 19.4,
      currentInnings: 2, matchDate: daysAgo(6),
      createdBy: feederId, tournamentId: tournaments.schoolsT20.id, matchType: 'T20',
      umpire: 'Bongani Jele', playerOfMatch: 'Kagiso Rabada',
    },
  });
  await recordCompletedInnings(m3, bishopsPlayers, sacsPlayers, [
    { team: 2, batsmen: [
        { name: 'Janneman Malan',        runs: 38, balls: 31, fours: 4, sixes: 1, isOut: true, outType: 'Caught' },
        { name: 'Eddie Moore',           runs: 24, balls: 22, fours: 3, sixes: 0, isOut: true, outType: 'Bowled' },
        { name: 'Kyle Verreynne',        runs: 31, balls: 28, fours: 3, sixes: 1, isOut: true, outType: 'LBW' },
        { name: 'Khaya Zondo',           runs: 18, balls: 17, fours: 2, sixes: 0, isOut: true, outType: 'Caught' },
        { name: 'Tony Pillay',           runs: 14, balls: 11, fours: 1, sixes: 0, isOut: true, outType: 'Run Out' },
        { name: 'Ferisco Adams',         runs: 12, balls: 8,  fours: 1, sixes: 0, isOut: true, outType: 'Caught' },
        { name: 'Daryn Dupavillon',      runs: 8,  balls: 5,  fours: 1, sixes: 0, isOut: true, outType: 'Bowled' },
        { name: 'Beuran Hendricks',      runs: 5,  balls: 4,  fours: 0, sixes: 0, isOut: true, outType: 'Caught' },
        { name: 'Tony Pillay',           runs: 2,  balls: 2,  fours: 0, sixes: 0, isOut: true, outType: 'Bowled' },
        { name: 'Eddie Moore',           runs: 1,  balls: 1,  fours: 0, sixes: 0, isOut: true, outType: 'LBW' },
      ], bowlers: [
        { name: 'Kagiso Rabada',         overs: 4.0, runs: 23, wickets: 4, maidens: 1 },
        { name: 'Lutho Sipamla',         overs: 3.4, runs: 28, wickets: 2, maidens: 0 },
        { name: 'Gerald Coetzee',        overs: 4.0, runs: 31, wickets: 2, maidens: 0 },
        { name: 'Andile Phehlukwayo',    overs: 4.0, runs: 34, wickets: 1, maidens: 0 },
        { name: 'Keshav Maharaj',        overs: 4.0, runs: 38, wickets: 1, maidens: 0 },
      ]
    },
    { team: 1, batsmen: [
        { name: 'Heinrich Klaasen',      runs: 51, balls: 38, fours: 5, sixes: 2, isOut: true, outType: 'Caught' },
        { name: 'David Miller',          runs: 38, balls: 32, fours: 3, sixes: 1, isOut: true, outType: 'Bowled' },
        { name: 'Dewald Brevis',         runs: 22, balls: 19, fours: 2, sixes: 0, isOut: true, outType: 'LBW' },
        { name: 'Tony de Zorzi',         runs: 14, balls: 13, fours: 1, sixes: 0, isOut: true, outType: 'Caught' },
        { name: 'Ryan Rickelton',        runs: 12, balls: 9,  fours: 1, sixes: 0, isOut: true, outType: 'Caught' },
        { name: 'Andile Phehlukwayo',    runs: 6,  balls: 5,  fours: 0, sixes: 0, isOut: true, outType: 'Run Out' },
        { name: 'Sisanda Magala',        runs: 4,  balls: 4,  fours: 0, sixes: 0, isOut: true, outType: 'Caught' },
        { name: 'Gerald Coetzee',        runs: 5,  balls: 4,  fours: 0, sixes: 0, isOut: true, outType: 'Caught' },
        { name: 'Keshav Maharaj',        runs: 2,  balls: 3,  fours: 0, sixes: 0, isOut: false },
        { name: 'Lutho Sipamla',         runs: 2,  balls: 2,  fours: 0, sixes: 0, isOut: false },
      ], bowlers: [
        { name: 'Beuran Hendricks',      overs: 4.0, runs: 28, wickets: 3, maidens: 0 },
        { name: 'Ferisco Adams',         overs: 4.0, runs: 34, wickets: 2, maidens: 0 },
        { name: 'Daryn Dupavillon',      overs: 3.5, runs: 30, wickets: 2, maidens: 0 },
        { name: 'Tony Pillay',           overs: 4.0, runs: 32, wickets: 1, maidens: 0 },
        { name: 'Khaya Zondo',           overs: 4.0, runs: 32, wickets: 0, maidens: 0 },
      ]
    },
  ]);

  // ─────── COMPLETED MATCH 4: WP Strikers 187/5 beat Cape Cobras 178/8 (3 days ago) ───────
  const m4 = await prisma.match.create({
    data: {
      team1Name: teams.wpStrikers.teamName, team2Name: teams.cobras.teamName,
      venue: 'Boland Park', totalOvers: 20, status: 'completed',
      tossWinner: teams.cobras.teamName, tossDecision: 'bowl', winner: teams.wpStrikers.teamName,
      team1Score: 187, team1Wickets: 5, team1Overs: 20.0,
      team2Score: 178, team2Wickets: 8, team2Overs: 20.0,
      currentInnings: 2, matchDate: daysAgo(3),
      createdBy: feederId, matchType: 'T20',
      umpire: 'Bongani Jele', playerOfMatch: 'David Miller',
    },
  });
  await recordCompletedInnings(m4, wpStrikersPlayers, cobrasPlayers, [
    { team: 1, batsmen: [
        { name: 'Quinton de Kock',       runs: 41, balls: 28, fours: 5, sixes: 1, isOut: true, outType: 'Caught' },
        { name: 'Aiden Markram',         runs: 32, balls: 22, fours: 3, sixes: 1, isOut: true, outType: 'Bowled' },
        { name: 'David Miller',          runs: 71, balls: 44, fours: 6, sixes: 4, isOut: false },
        { name: 'Heinrich Klaasen',      runs: 22, balls: 14, fours: 2, sixes: 1, isOut: true, outType: 'Caught' },
        { name: 'Wiaan Mulder',          runs: 12, balls: 8,  fours: 1, sixes: 0, isOut: true, outType: 'Run Out' },
        { name: 'Janneman Malan',        runs: 7,  balls: 4,  fours: 1, sixes: 0, isOut: false },
      ], bowlers: [
        { name: 'Anrich Nortje',         overs: 4.0, runs: 34, wickets: 2, maidens: 0 },
        { name: 'Gerald Coetzee',        overs: 4.0, runs: 38, wickets: 1, maidens: 0 },
        { name: 'Andile Phehlukwayo',    overs: 4.0, runs: 42, wickets: 1, maidens: 0 },
        { name: 'Beuran Hendricks',      overs: 4.0, runs: 31, wickets: 0, maidens: 0 },
        { name: 'Ryan Rickelton',        overs: 4.0, runs: 39, wickets: 0, maidens: 0 },
      ]
    },
    { team: 2, batsmen: [
        { name: 'Temba Bavuma',          runs: 38, balls: 30, fours: 4, sixes: 1, isOut: true, outType: 'Caught' },
        { name: 'Reeza Hendricks',       runs: 41, balls: 31, fours: 5, sixes: 1, isOut: true, outType: 'Bowled' },
        { name: 'Dewald Brevis',         runs: 33, balls: 25, fours: 3, sixes: 1, isOut: true, outType: 'LBW' },
        { name: 'Tristan Stubbs',        runs: 22, balls: 16, fours: 2, sixes: 1, isOut: true, outType: 'Caught' },
        { name: 'Kyle Verreynne',        runs: 18, balls: 12, fours: 2, sixes: 0, isOut: true, outType: 'Caught' },
        { name: 'Andile Phehlukwayo',    runs: 12, balls: 8,  fours: 1, sixes: 0, isOut: true, outType: 'Run Out' },
        { name: 'Ryan Rickelton',        runs: 8,  balls: 5,  fours: 1, sixes: 0, isOut: true, outType: 'Caught' },
        { name: 'Tony de Zorzi',         runs: 4,  balls: 3,  fours: 0, sixes: 0, isOut: true, outType: 'Bowled' },
        { name: 'Anrich Nortje',         runs: 2,  balls: 4,  fours: 0, sixes: 0, isOut: false },
      ], bowlers: [
        { name: 'Kagiso Rabada',         overs: 4.0, runs: 28, wickets: 3, maidens: 0 },
        { name: 'Marco Jansen',          overs: 4.0, runs: 32, wickets: 2, maidens: 0 },
        { name: 'Lungi Ngidi',           overs: 4.0, runs: 34, wickets: 1, maidens: 0 },
        { name: 'Tabraiz Shamsi',        overs: 4.0, runs: 38, wickets: 1, maidens: 0 },
        { name: 'Keshav Maharaj',        overs: 4.0, runs: 46, wickets: 1, maidens: 0 },
      ]
    },
  ]);

  // ─────── LIVE MATCH: Wynberg vs Bishops, mid 2nd innings ───────
  const liveMatch = await prisma.match.create({
    data: {
      team1Name: teams.wynberg.teamName, team2Name: teams.bishops.teamName,
      venue: 'Newlands', totalOvers: 20, status: 'live',
      tossWinner: teams.bishops.teamName, tossDecision: 'bowl', winner: null,
      team1Score: 168, team1Wickets: 7, team1Overs: 20.0,
      team2Score:  98, team2Wickets: 3, team2Overs: 11.2,
      currentInnings: 2, matchDate: hoursAgo(2),
      createdBy: feederId, tournamentId: tournaments.schoolsT20.id, matchType: 'T20',
      umpire: 'Marais Erasmus',
    },
  });
  await recordCompletedInnings(liveMatch, wynbergPlayers, bishopsPlayers, [
    { team: 1, batsmen: [
        { name: 'Aiden Markram',         runs: 62, balls: 44, fours: 7, sixes: 2, isOut: true, outType: 'Caught' },
        { name: 'Quinton de Kock',       runs: 38, balls: 28, fours: 4, sixes: 1, isOut: true, outType: 'Bowled' },
        { name: 'Rassie van der Merwe',  runs: 24, balls: 19, fours: 2, sixes: 1, isOut: true, outType: 'LBW' },
        { name: 'Temba Bavuma',          runs: 16, balls: 14, fours: 1, sixes: 0, isOut: true, outType: 'Caught' },
        { name: 'Tristan Stubbs',        runs: 12, balls: 8,  fours: 1, sixes: 0, isOut: true, outType: 'Run Out' },
        { name: 'Wiaan Mulder',          runs:  9, balls: 6,  fours: 1, sixes: 0, isOut: true, outType: 'Caught' },
        { name: 'Marco Jansen',          runs:  4, balls: 3,  fours: 0, sixes: 0, isOut: true, outType: 'Caught' },
        { name: 'Reeza Hendricks',       runs:  3, balls: 2,  fours: 0, sixes: 0, isOut: false },
      ], bowlers: [
        { name: 'Kagiso Rabada',         overs: 4.0, runs: 28, wickets: 3, maidens: 0 },
        { name: 'Lutho Sipamla',         overs: 4.0, runs: 36, wickets: 1, maidens: 0 },
        { name: 'Gerald Coetzee',        overs: 4.0, runs: 32, wickets: 1, maidens: 0 },
        { name: 'Andile Phehlukwayo',    overs: 4.0, runs: 34, wickets: 1, maidens: 0 },
        { name: 'Keshav Maharaj',        overs: 4.0, runs: 38, wickets: 1, maidens: 0 },
      ]
    },
    { team: 2, batsmen: [
        { name: 'Heinrich Klaasen',      runs: 41, balls: 28, fours: 5, sixes: 1, isOut: true, outType: 'Caught' },
        { name: 'David Miller',          runs: 28, balls: 22, fours: 3, sixes: 0, isOut: true, outType: 'Bowled' },
        { name: 'Dewald Brevis',         runs: 18, balls: 14, fours: 2, sixes: 0, isOut: true, outType: 'LBW' },
        { name: 'Tony de Zorzi',         runs: 11, balls:  4, fours: 1, sixes: 1, isOut: false },
      ], bowlers: [
        { name: 'Marco Jansen',          overs: 3.0, runs: 22, wickets: 1, maidens: 0 },
        { name: 'Lungi Ngidi',           overs: 3.0, runs: 28, wickets: 1, maidens: 0 },
        { name: 'Anrich Nortje',         overs: 3.0, runs: 26, wickets: 1, maidens: 0 },
        { name: 'Tabraiz Shamsi',        overs: 2.2, runs: 22, wickets: 0, maidens: 0 },
      ]
    },
  ]);

  // ─────── UPCOMING MATCHES ───────
  const upcoming = [
    { t1: teams.bishops, t2: teams.sacs,       venue: 'Newlands',   date: daysAhead(2),  tourn: tournaments.schoolsT20 },
    { t1: teams.wynberg, t2: teams.sacs,       venue: 'Newlands',   date: daysAhead(5),  tourn: tournaments.schoolsT20 },
    { t1: teams.wpStrikers, t2: teams.boland,  venue: 'Boland Park',date: daysAhead(8),  tourn: tournaments.cpl },
    { t1: teams.cobras,  t2: teams.boland,     venue: 'Newlands',   date: daysAhead(11), tourn: tournaments.cpl },
    { t1: teams.wpStrikers, t2: teams.cobras,  venue: 'Newlands',   date: daysAhead(14), tourn: tournaments.cpl },
  ];
  const upcomingMatches = [];
  for (const u of upcoming) {
    const m = await prisma.match.create({
      data: {
        team1Name: u.t1.teamName, team2Name: u.t2.teamName,
        venue: u.venue, totalOvers: 20, status: 'upcoming',
        matchDate: u.date, createdBy: feederId,
        tournamentId: u.tourn.id, matchType: 'T20',
      },
    });
    upcomingMatches.push({ match: m, t1: u.t1, t2: u.t2, tournId: u.tourn.id });
  }

  return { completed: [m1, m2, m3, m4], live: liveMatch, upcoming: upcomingMatches };
}

// ─────────────────────────────────────────────────────────────────────────────
// TOURNAMENT FIXTURES (linked to matches above) + standings rebuild
// ─────────────────────────────────────────────────────────────────────────────

async function createFixtures(matches, tournaments, teams) {
  console.log('Creating tournament fixtures...');
  const allMatches = [
    ...matches.completed.map((m) => ({ m, status: 'completed' })),
    { m: matches.live, status: 'live' },
    ...matches.upcoming.map((u) => ({ m: u.match, status: 'upcoming' })),
  ];

  for (const { m, status } of allMatches) {
    if (!m.tournamentId) continue;
    await prisma.tournamentFixture.create({
      data: {
        tournamentId: m.tournamentId,
        matchId:      m.id,
        team1Name:    m.team1Name,
        team2Name:    m.team2Name,
        matchDate:    m.matchDate,
        venue:        m.venue,
        status,
        groupName:    'Group A',
        winner:       m.winner,
      },
    });
  }
}

async function rebuildStandings(tournaments) {
  console.log('Recomputing tournament standings from completed matches...');
  for (const t of [tournaments.schoolsT20, tournaments.cpl]) {
    const matches = await prisma.match.findMany({
      where: { tournamentId: t.id, status: 'completed' },
    });
    const tts = await prisma.tournamentTeam.findMany({
      where: { tournamentId: t.id },
      include: { team: true },
    });

    const stats = new Map();
    for (const tt of tts) {
      stats.set(tt.teamId, { played: 0, won: 0, lost: 0, noResult: 0, runsFor: 0, oversFor: 0, runsAgainst: 0, oversAgainst: 0 });
    }

    for (const m of matches) {
      const t1 = tts.find((tt) => tt.team.teamName === m.team1Name);
      const t2 = tts.find((tt) => tt.team.teamName === m.team2Name);
      if (!t1 || !t2) continue;
      const s1 = stats.get(t1.teamId);
      const s2 = stats.get(t2.teamId);
      s1.played++; s2.played++;
      const o1 = m.team1Overs > 0 ? m.team1Overs : m.totalOvers;
      const o2 = m.team2Overs > 0 ? m.team2Overs : m.totalOvers;
      s1.runsFor += m.team1Score; s1.oversFor += o1; s1.runsAgainst += m.team2Score; s1.oversAgainst += o2;
      s2.runsFor += m.team2Score; s2.oversFor += o2; s2.runsAgainst += m.team1Score; s2.oversAgainst += o1;
      if (!m.winner)                       { s1.noResult++; s2.noResult++; }
      else if (m.winner === m.team1Name)   { s1.won++; s2.lost++; }
      else                                 { s2.won++; s1.lost++; }
    }

    for (const tt of tts) {
      const s = stats.get(tt.teamId);
      const points = s.won * 2 + s.noResult;
      const rrFor   = s.oversFor > 0     ? s.runsFor / s.oversFor         : 0;
      const rrAgnst = s.oversAgainst > 0 ? s.runsAgainst / s.oversAgainst : 0;
      await prisma.tournamentTeam.update({
        where: { id: tt.id },
        data: {
          played: s.played, won: s.won, lost: s.lost, noResult: s.noResult,
          points, runsFor: s.runsFor, oversFor: s.oversFor,
          runsAgainst: s.runsAgainst, oversAgainst: s.oversAgainst,
          nrr: rrFor - rrAgnst,
        },
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('───── Future Protea: realistic seed (Western Cape) ─────');
  await wipe();

  const adminUsers = await createAdminAndViewerUsers();
  const feederId   = adminUsers['coach.adams@futureprotea.za'].id;

  const roster      = await createPlayers();
  const teams       = await createTeams(roster, feederId);
  const tournaments = await createTournaments(teams, feederId);
  const matches     = await createMatches(teams, roster, tournaments, feederId);
  await createFixtures(matches, tournaments, teams);
  await rebuildStandings(tournaments);

  console.log('\n──── Seed complete ────');
  console.log('Login credentials:');
  console.log('  Feeder : coach.adams@futureprotea.za / password123');
  console.log('  Feeder : scorer@futureprotea.za / password123');
  console.log('  Viewer : varun@gmail.com / password123');
  console.log('  Viewer : nikhill@gmail.com / password123');
  console.log('  Player : <any of the player emails> / player123');
  console.log(`           e.g. aiden.markram@futureprotea.za / player123`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
