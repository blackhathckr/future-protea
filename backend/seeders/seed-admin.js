/**
 * Seed test users for every BRD-defined role.
 *
 * Run from `backend/` with:
 *   node seeders/seed-admin.js
 *
 * Idempotent — safe to re-run. Uses upsert; existing rows are preserved
 * (password hash is *only* updated on first insert).
 *
 * Role list mirrors backend/src/utils/roles.ts and the BRD §4 stakeholder
 * table. Password is the same across all accounts for ease of testing.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const PASSWORD = 'password123';

const TEST_USERS = [
  // ── Core operational ──────────────────────────────────────────────
  {
    name: 'Cricket Admin',
    email: 'admin@cricket.com',
    role: 'admin',
    notes: 'Super-admin — bypasses all role gates',
  },

  // ── BRD §6.7 — Coach / Team Selector ─────────────────────────────
  {
    name: 'Coach Pretorius',
    email: 'coach@cricket.com',
    role: 'coach',
    notes: 'Read-only: Stats, Super Stars, Scorecard, Player Profiles',
  },

  // ── BRD §6.4 — Umpire / Field Official ───────────────────────────
  {
    name: 'Umpire Naidoo',
    email: 'umpire@cricket.com',
    role: 'umpire',
    notes: 'Data-only — recorded by scorer during innings setup',
  },

  // ── BRD §6.8 — Tournament Organiser / Event Admin ────────────────
  {
    name: 'Tournament Organiser',
    email: 'organiser@cricket.com',
    role: 'tournament_organiser',
    notes: 'Owns Create / Fixtures / Points Table / NRR / Knockouts',
  },

  // ── Existing roles ───────────────────────────────────────────────
  {
    name: 'Score Feeder',
    email: 'feeder@cricket.com',
    role: 'feeder',
    notes: 'Records ball-by-ball during live matches',
  },
  {
    name: 'Cricket Player',
    email: 'player@cricket.com',
    role: 'player',
    notes: 'Claims their player profile, views own career stats',
  },
  {
    name: 'Cricket Fan',
    email: 'viewer@cricket.com',
    role: 'viewer',
    notes: 'Spectator — follow live scores, view scorecards',
  },

  // ── BRD §4 stakeholders — accepted but no dedicated home yet ─────
  {
    name: 'Team Admin',
    email: 'teamadmin@cricket.com',
    role: 'team_admin',
    notes: 'Manages a single team roster (generic menu)',
  },
  {
    name: 'School Admin',
    email: 'schooladmin@cricket.com',
    role: 'school_admin',
    notes: 'School cricket administrator (generic menu)',
  },
  {
    name: 'Club Admin',
    email: 'clubadmin@cricket.com',
    role: 'club_admin',
    notes: 'Club / CSA manager (generic menu)',
  },
];

async function main() {
  console.log('🌱 Seeding test users for every BRD role…\n');

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  for (const u of TEST_USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      // On re-run: refresh role + name + approved flag, but DON'T overwrite
      // an existing password (avoids breaking already-shared credentials).
      update: {
        name: u.name,
        role: u.role,
        approved: true,
      },
      create: {
        name: u.name,
        email: u.email,
        password: passwordHash,
        role: u.role,
        approved: true,
      },
    });

    // The auth middleware backfills `roles` array from `User.role` when the
    // UserRole junction row is missing, so we don't need to seed it here.
    // (The runtime Prisma client may be stale and not expose `userRole`.)
    console.log(`  ✅ ${u.role.padEnd(22)}  ${u.email}`);
  }

  console.log('\n────────────────────────────────────────────────────────');
  console.log('📋  TEST ACCOUNT CREDENTIALS — password is the same for all');
  console.log('────────────────────────────────────────────────────────\n');

  const fmt = (role, email) => `   ${role.padEnd(22)}  ${email.padEnd(32)}  /  ${PASSWORD}`;

  console.log('  ── New roles (this session) ───────────────────────────');
  console.log(fmt('coach',                 'coach@cricket.com'));
  console.log(fmt('umpire',                'umpire@cricket.com'));
  console.log(fmt('tournament_organiser',  'organiser@cricket.com'));
  console.log('\n  ── Existing roles ─────────────────────────────────────');
  console.log(fmt('admin',                 'admin@cricket.com'));
  console.log(fmt('feeder (scorer)',       'feeder@cricket.com'));
  console.log(fmt('player',                'player@cricket.com'));
  console.log(fmt('viewer (spectator)',    'viewer@cricket.com'));
  console.log('\n  ── BRD stakeholders (generic menu home) ───────────────');
  console.log(fmt('team_admin',            'teamadmin@cricket.com'));
  console.log(fmt('school_admin',          'schooladmin@cricket.com'));
  console.log(fmt('club_admin',            'clubadmin@cricket.com'));

  console.log('\n✨  Seeding complete.\n');
}

main()
  .catch((err) => {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
