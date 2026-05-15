/**
 * @fileoverview Realistic seed — every role, two complete teams, a tournament,
 * a finished match with full ball-by-ball, a live match in progress, upcoming
 * fixtures, announcements, support tickets, notifications. Idempotent: every
 * record is upserted by a stable key so re-running just refreshes.
 *
 * Test credentials are returned at the end and also printed to stdout.
 */

import bcrypt from 'bcryptjs'
import prisma from '../src/config/database'
import logger from '../src/utils/logger'

const PASSWORD = 'Cricket@2026'

// ─────────────────────────────────────────────────────────────────────────────
// Users — one of every role with a known email/password.
// ─────────────────────────────────────────────────────────────────────────────

interface SeedUser {
  email: string
  name: string
  role: string
  phone?: string
  battingStyle?: string
  bowlingStyle?: string
}

const STAFF_USERS: SeedUser[] = [
  { email: 'admin@cricket.com',              name: 'Aarav Sharma',    role: 'admin',                phone: '+27-71-555-0001' },
  { email: 'organiser@cricket.com',          name: 'Priya Naidoo',    role: 'tournament_organiser', phone: '+27-71-555-0002' },
  { email: 'scorer@cricket.com',             name: 'Sipho Dlamini',   role: 'scorer',               phone: '+27-71-555-0003' },
  { email: 'feeder@cricket.com',             name: 'Ravi Pillay',     role: 'feeder',               phone: '+27-71-555-0004' },
  { email: 'coach@cricket.com',              name: 'Lebo Mokoena',    role: 'coach',                phone: '+27-71-555-0005' },
  { email: 'umpire@cricket.com',             name: 'Daniel Botha',    role: 'umpire',               phone: '+27-71-555-0006' },
  { email: 'spectator@cricket.com',          name: 'Anika Joshi',     role: 'spectator',            phone: '+27-71-555-0007' },
]

// Two full XIs.  Players are auto-approved and get a User row so they can log in.
const MUMBAI_PLAYERS: SeedUser[] = [
  { email: 'rohit@mumbai.com',     name: 'Rohit Sharma',     role: 'player', battingStyle: 'Right-hand bat',  bowlingStyle: 'Right-arm off-break' },
  { email: 'ishan@mumbai.com',     name: 'Ishan Kishan',     role: 'player', battingStyle: 'Left-hand bat',   bowlingStyle: '—' },
  { email: 'surya@mumbai.com',     name: 'Suryakumar Yadav', role: 'player', battingStyle: 'Right-hand bat',  bowlingStyle: 'Right-arm off-break' },
  { email: 'tilak@mumbai.com',     name: 'Tilak Varma',      role: 'player', battingStyle: 'Left-hand bat',   bowlingStyle: 'Right-arm off-break' },
  { email: 'tim@mumbai.com',       name: 'Tim David',        role: 'player', battingStyle: 'Right-hand bat',  bowlingStyle: 'Right-arm off-break' },
  { email: 'hardik@mumbai.com',    name: 'Hardik Pandya',    role: 'player', battingStyle: 'Right-hand bat',  bowlingStyle: 'Right-arm medium-fast' },
  { email: 'green@mumbai.com',     name: 'Cameron Green',    role: 'player', battingStyle: 'Right-hand bat',  bowlingStyle: 'Right-arm fast-medium' },
  { email: 'piyush@mumbai.com',    name: 'Piyush Chawla',    role: 'player', battingStyle: 'Right-hand bat',  bowlingStyle: 'Right-arm leg-break' },
  { email: 'jasprit@mumbai.com',   name: 'Jasprit Bumrah',   role: 'player', battingStyle: 'Right-hand bat',  bowlingStyle: 'Right-arm fast' },
  { email: 'akash@mumbai.com',     name: 'Akash Madhwal',    role: 'player', battingStyle: 'Right-hand bat',  bowlingStyle: 'Right-arm medium-fast' },
  { email: 'arjun@mumbai.com',     name: 'Arjun Tendulkar',  role: 'player', battingStyle: 'Left-hand bat',   bowlingStyle: 'Left-arm fast-medium' },
]

const CHENNAI_PLAYERS: SeedUser[] = [
  { email: 'ruturaj@chennai.com',  name: 'Ruturaj Gaikwad',  role: 'player', battingStyle: 'Right-hand bat',  bowlingStyle: '—' },
  { email: 'devon@chennai.com',    name: 'Devon Conway',     role: 'player', battingStyle: 'Left-hand bat',   bowlingStyle: '—' },
  { email: 'ajinkya@chennai.com',  name: 'Ajinkya Rahane',   role: 'player', battingStyle: 'Right-hand bat',  bowlingStyle: 'Right-arm medium' },
  { email: 'shivam@chennai.com',   name: 'Shivam Dube',      role: 'player', battingStyle: 'Left-hand bat',   bowlingStyle: 'Right-arm medium' },
  { email: 'dhoni@chennai.com',    name: 'MS Dhoni',         role: 'player', battingStyle: 'Right-hand bat',  bowlingStyle: 'Right-arm medium' },
  { email: 'ravindra@chennai.com', name: 'Ravindra Jadeja',  role: 'player', battingStyle: 'Left-hand bat',   bowlingStyle: 'Slow left-arm orthodox' },
  { email: 'mitchell@chennai.com', name: 'Mitchell Santner', role: 'player', battingStyle: 'Left-hand bat',   bowlingStyle: 'Slow left-arm orthodox' },
  { email: 'deepak@chennai.com',   name: 'Deepak Chahar',    role: 'player', battingStyle: 'Right-hand bat',  bowlingStyle: 'Right-arm medium-fast' },
  { email: 'tushar@chennai.com',   name: 'Tushar Deshpande', role: 'player', battingStyle: 'Right-hand bat',  bowlingStyle: 'Right-arm medium-fast' },
  { email: 'matheesha@chennai.com',name: 'Matheesha Pathirana', role: 'player', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm fast' },
  { email: 'mahesh@chennai.com',   name: 'Maheesh Theekshana', role: 'player', battingStyle: 'Right-hand bat', bowlingStyle: 'Right-arm off-break' },
]

const ALL_USERS: SeedUser[] = [...STAFF_USERS, ...MUMBAI_PLAYERS, ...CHENNAI_PLAYERS]

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function oversFloat(legalBalls: number, ballsPerOver = 6): number {
  const overs = Math.floor(legalBalls / ballsPerOver)
  const balls = legalBalls % ballsPerOver
  return parseFloat(`${overs}.${balls}`)
}

async function upsertUser(u: SeedUser, hash: string) {
  return prisma.user.upsert({
    where: { email: u.email },
    update: {
      name: u.name,
      role: u.role,
      phone: u.phone ?? null,
      battingStyle: u.battingStyle ?? null,
      bowlingStyle: u.bowlingStyle ?? null,
      approved: true,
    },
    create: {
      name: u.name,
      email: u.email,
      password: hash,
      role: u.role,
      phone: u.phone ?? null,
      battingStyle: u.battingStyle ?? null,
      bowlingStyle: u.bowlingStyle ?? null,
      approved: true,
    },
  })
}

// Ball-by-ball scripts for the completed match.  Each entry is one delivery:
//   r  = batter runs off the bat
//   ex = 'wd' | 'nb' | 'b' | 'lb' | undefined
//   w  = wicket type (omit for no wicket); pairs with `out` index into batting order
type ScriptBall = {
  r: number
  ex?: 'wd' | 'nb' | 'b' | 'lb'
  w?: { type: string; out: 'striker' | 'non_striker'; fielder?: number }
  shot?: string
}

// Deterministic, realistic 20-over innings 1 — Mumbai Mavericks bat first.
// 182/6 in 20 overs.  Designed so the aggregates work out cleanly.
const MUM_INNINGS: ScriptBall[][] = [
  // Over 1 (Bumrah-equivalent bowler) — cautious start
  [{ r: 1 }, { r: 0 }, { r: 4, shot: 'Cover' }, { r: 1 }, { r: 0 }, { r: 1 }],
  // Over 2
  [{ r: 0 }, { r: 4, shot: 'Mid Off' }, { r: 1 }, { r: 2 }, { r: 1 }, { r: 0 }],
  // Over 3
  [{ r: 1, ex: 'wd' }, { r: 1 }, { r: 0 }, { r: 6, shot: 'Long On' }, { r: 1 }, { r: 1 }, { r: 4, shot: 'Square Leg' }],
  // Over 4
  [{ r: 0 }, { r: 0 }, { r: 1 }, { r: 0, w: { type: 'caught', out: 'striker', fielder: 4 } }, { r: 1 }, { r: 2 }],
  // Over 5
  [{ r: 4, shot: 'Cover' }, { r: 1 }, { r: 0 }, { r: 6, shot: 'Long Off' }, { r: 1 }, { r: 1 }],
  // Over 6 — powerplay finale
  [{ r: 1 }, { r: 4, shot: 'Third Man' }, { r: 2 }, { r: 0 }, { r: 1 }, { r: 4, shot: 'Long On' }],
  // Over 7
  [{ r: 1 }, { r: 1 }, { r: 0 }, { r: 1 }, { r: 2 }, { r: 1 }],
  // Over 8
  [{ r: 0 }, { r: 6, shot: 'Mid Wicket' }, { r: 1 }, { r: 0, w: { type: 'bowled', out: 'non_striker' } }, { r: 1 }, { r: 2 }],
  // Over 9
  [{ r: 1 }, { r: 4, shot: 'Cover' }, { r: 0 }, { r: 1 }, { r: 0 }, { r: 2 }],
  // Over 10
  [{ r: 1 }, { r: 1 }, { r: 0 }, { r: 1 }, { r: 4, shot: 'Square Leg' }, { r: 0 }],
  // Over 11
  [{ r: 1 }, { r: 0 }, { r: 6, shot: 'Long On' }, { r: 1 }, { r: 0 }, { r: 1 }],
  // Over 12
  [{ r: 0 }, { r: 2 }, { r: 1 }, { r: 1 }, { r: 4, shot: 'Cover' }, { r: 1 }],
  // Over 13
  [{ r: 1 }, { r: 0, w: { type: 'lbw', out: 'striker' } }, { r: 6, shot: 'Long Off' }, { r: 1 }, { r: 1 }, { r: 2 }],
  // Over 14
  [{ r: 4, shot: 'Mid Wicket' }, { r: 1 }, { r: 1 }, { r: 0 }, { r: 6, shot: 'Long On' }, { r: 0 }],
  // Over 15
  [{ r: 1, ex: 'nb' }, { r: 4, shot: 'Cover' }, { r: 1 }, { r: 6, shot: 'Long Off' }, { r: 0, w: { type: 'caught', out: 'striker', fielder: 7 } }, { r: 1 }, { r: 2 }],
  // Over 16
  [{ r: 1 }, { r: 2 }, { r: 1 }, { r: 6, shot: 'Mid Wicket' }, { r: 4, shot: 'Square Leg' }, { r: 1 }],
  // Over 17
  [{ r: 4, shot: 'Cover' }, { r: 1 }, { r: 0, w: { type: 'caught', out: 'striker', fielder: 9 } }, { r: 6, shot: 'Long On' }, { r: 1 }, { r: 2 }],
  // Over 18
  [{ r: 1 }, { r: 4, shot: 'Third Man' }, { r: 6, shot: 'Long Off' }, { r: 1 }, { r: 0 }, { r: 2 }],
  // Over 19 — death
  [{ r: 4, shot: 'Cover' }, { r: 6, shot: 'Long On' }, { r: 1 }, { r: 0, w: { type: 'caught', out: 'striker', fielder: 5 } }, { r: 6, shot: 'Mid Wicket' }, { r: 1 }],
  // Over 20
  [{ r: 1 }, { r: 4, shot: 'Square Leg' }, { r: 6, shot: 'Long Off' }, { r: 1 }, { r: 2 }, { r: 4, shot: 'Cover' }],
]

// Chennai chase — falls short.  168/8 in 20 overs.
const CHE_INNINGS: ScriptBall[][] = [
  [{ r: 1 }, { r: 0 }, { r: 4, shot: 'Cover' }, { r: 1 }, { r: 1 }, { r: 0 }],
  [{ r: 2 }, { r: 0 }, { r: 1 }, { r: 4, shot: 'Mid Off' }, { r: 1 }, { r: 0 }],
  [{ r: 6, shot: 'Long On' }, { r: 0, w: { type: 'lbw', out: 'striker' } }, { r: 1 }, { r: 4, shot: 'Square Leg' }, { r: 0 }, { r: 1 }],
  [{ r: 1 }, { r: 0 }, { r: 4, shot: 'Cover' }, { r: 2 }, { r: 1 }, { r: 0 }],
  [{ r: 6, shot: 'Long Off' }, { r: 1 }, { r: 4, shot: 'Mid Wicket' }, { r: 0 }, { r: 1 }, { r: 2 }],
  [{ r: 0 }, { r: 6, shot: 'Long On' }, { r: 1 }, { r: 4, shot: 'Cover' }, { r: 1 }, { r: 1 }],
  [{ r: 1 }, { r: 0 }, { r: 0, w: { type: 'caught', out: 'striker', fielder: 5 } }, { r: 6, shot: 'Long Off' }, { r: 1 }, { r: 0 }],
  [{ r: 4, shot: 'Cover' }, { r: 1 }, { r: 1 }, { r: 0 }, { r: 0, w: { type: 'bowled', out: 'non_striker' } }, { r: 1 }],
  [{ r: 1 }, { r: 0 }, { r: 4, shot: 'Square Leg' }, { r: 0 }, { r: 1 }, { r: 2 }],
  [{ r: 1, ex: 'wd' }, { r: 1 }, { r: 6, shot: 'Long On' }, { r: 0 }, { r: 1 }, { r: 0 }, { r: 1 }],
  [{ r: 1 }, { r: 0 }, { r: 0, w: { type: 'run_out', out: 'striker', fielder: 3 } }, { r: 4, shot: 'Cover' }, { r: 1 }, { r: 2 }],
  [{ r: 0 }, { r: 6, shot: 'Long Off' }, { r: 1 }, { r: 0 }, { r: 4, shot: 'Mid Wicket' }, { r: 1 }],
  [{ r: 1 }, { r: 4, shot: 'Square Leg' }, { r: 0 }, { r: 1 }, { r: 1 }, { r: 2 }],
  [{ r: 6, shot: 'Long On' }, { r: 1 }, { r: 0, w: { type: 'caught', out: 'striker', fielder: 6 } }, { r: 0 }, { r: 4, shot: 'Cover' }, { r: 1 }],
  [{ r: 1 }, { r: 2 }, { r: 0 }, { r: 4, shot: 'Mid Off' }, { r: 1 }, { r: 0 }],
  [{ r: 4, shot: 'Square Leg' }, { r: 0, w: { type: 'caught', out: 'striker', fielder: 4 } }, { r: 1 }, { r: 6, shot: 'Long Off' }, { r: 1 }, { r: 1 }],
  [{ r: 2 }, { r: 1 }, { r: 0 }, { r: 4, shot: 'Cover' }, { r: 0, w: { type: 'bowled', out: 'striker' } }, { r: 1 }],
  [{ r: 1 }, { r: 4, shot: 'Mid Wicket' }, { r: 1 }, { r: 0 }, { r: 6, shot: 'Long On' }, { r: 1 }],
  [{ r: 4, shot: 'Cover' }, { r: 0, w: { type: 'caught', out: 'striker', fielder: 8 } }, { r: 1 }, { r: 2 }, { r: 6, shot: 'Long Off' }, { r: 1 }],
  [{ r: 1 }, { r: 0 }, { r: 4, shot: 'Square Leg' }, { r: 1 }, { r: 0 }, { r: 0, w: { type: 'caught', out: 'striker', fielder: 2 } }],
]

// ─────────────────────────────────────────────────────────────────────────────
// Innings playback — converts script → balls + aggregates + fall-of-wickets
// ─────────────────────────────────────────────────────────────────────────────

interface Squad {
  battingIds: string[]   // RegisteredPlayer ids in batting order
  bowlingIds: string[]   // RegisteredPlayer ids in bowling rotation
  fieldingIds: string[]  // same as bowling team for fielder lookups
}

interface PlayedInnings {
  balls: any[]              // ready-to-insert Ball rows
  totalRuns: number
  totalWickets: number
  totalLegalBalls: number
  extrasWides: number
  extrasNoballs: number
  extrasByes: number
  extrasLegbyes: number
  battingStats: Map<string, { runs: number; balls: number; fours: number; sixes: number; isOut: boolean; outType?: string; dismissedById?: string; fielderId?: string }>
  bowlingStats: Map<string, { runs: number; balls: number; wickets: number; maidens: number }>
  fielderCatches: Map<string, number>
  fielderRunOuts: Map<string, number>
  fallOfWickets: Array<{ wicketNumber: number; batsmanId: string; dismissalType: string; bowlerId?: string; fielderId?: string; runsAtFall: number; oversAtFall: number }>
  finalStrikerId: string
  finalNonStrikerId: string
  finalBowlerId: string
}

function playInnings(matchId: string, inningsNo: number, script: ScriptBall[][], batting: Squad): PlayedInnings {
  const out: PlayedInnings = {
    balls: [],
    totalRuns: 0, totalWickets: 0, totalLegalBalls: 0,
    extrasWides: 0, extrasNoballs: 0, extrasByes: 0, extrasLegbyes: 0,
    battingStats: new Map(),
    bowlingStats: new Map(),
    fielderCatches: new Map(),
    fielderRunOuts: new Map(),
    fallOfWickets: [],
    finalStrikerId: '',
    finalNonStrikerId: '',
    finalBowlerId: '',
  }

  // Stat helpers
  const bat = (id: string) => {
    if (!out.battingStats.has(id)) out.battingStats.set(id, { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false })
    return out.battingStats.get(id)!
  }
  const bowl = (id: string) => {
    if (!out.bowlingStats.has(id)) out.bowlingStats.set(id, { runs: 0, balls: 0, wickets: 0, maidens: 0 })
    return out.bowlingStats.get(id)!
  }

  // Track state
  let strikerIdx = 0
  let nonStrikerIdx = 1
  let nextInIdx = 2   // who comes in on a wicket

  // Bowler rotation: cycle through bowlers, but never same bowler 2 overs in a row.
  const bowlers = batting.bowlingIds
  let lastBowlerIdx = -1
  const pickBowler = (overIdx: number) => {
    let idx = overIdx % bowlers.length
    if (idx === lastBowlerIdx) idx = (idx + 1) % bowlers.length
    lastBowlerIdx = idx
    return bowlers[idx]!
  }

  for (let overIdx = 0; overIdx < script.length; overIdx++) {
    const bowlerId = pickBowler(overIdx)
    const overBalls = script[overIdx]!
    let ballNo = 0
    let runsThisOver = 0

    for (const b of overBalls) {
      ballNo++
      const strikerId = batting.battingIds[strikerIdx]!
      const nonStrikerId = batting.battingIds[nonStrikerIdx]!
      const legal = !b.ex || (b.ex !== 'wd' && b.ex !== 'nb')
      // Total runs scored on this delivery (off-the-bat + extras)
      let extras = 0
      if (b.ex === 'wd' || b.ex === 'nb') extras = 1
      const totalRuns = b.r + extras

      // Update batting stats only for legal deliveries off the bat
      const sb = bat(strikerId)
      if (!b.ex || b.ex === 'b' || b.ex === 'lb') {
        if (legal) sb.balls++
      }
      if (!b.ex) {
        sb.runs += b.r
        if (b.r === 4) sb.fours++
        if (b.r === 6) sb.sixes++
      }

      // Bowler stats: legal balls only, runs conceded includes extras except byes/legbyes
      const bw = bowl(bowlerId)
      if (legal) bw.balls++
      if (b.ex === 'wd' || b.ex === 'nb') bw.runs += 1 + b.r
      else if (b.ex === 'b' || b.ex === 'lb') {/* byes & legbyes don't count vs bowler */}
      else bw.runs += b.r

      // Wicket handling
      let fielderId: string | undefined
      let dismissedById: string | undefined
      if (b.w) {
        out.totalWickets++
        const fellId = b.w.out === 'striker' ? strikerId : nonStrikerId
        if (b.w.fielder !== undefined && batting.fieldingIds[b.w.fielder]) {
          fielderId = batting.fieldingIds[b.w.fielder]
          if (b.w.type === 'caught') out.fielderCatches.set(fielderId, (out.fielderCatches.get(fielderId) ?? 0) + 1)
          if (b.w.type === 'run_out') out.fielderRunOuts.set(fielderId, (out.fielderRunOuts.get(fielderId) ?? 0) + 1)
        }
        // Bowler gets credit for everything except run-outs
        if (b.w.type !== 'run_out') {
          dismissedById = bowlerId
          bw.wickets++
        }
        const fb = bat(fellId)
        fb.isOut = true
        fb.outType = b.w.type
        if (dismissedById) fb.dismissedById = dismissedById
        if (fielderId) fb.fielderId = fielderId

        out.fallOfWickets.push({
          wicketNumber: out.totalWickets,
          batsmanId: fellId,
          dismissalType: b.w.type,
          bowlerId: dismissedById,
          fielderId,
          runsAtFall: out.totalRuns + totalRuns,
          oversAtFall: oversFloat(out.totalLegalBalls + (legal ? 1 : 0)),
        })

        // Swap in next batter at the fallen end
        if (nextInIdx < batting.battingIds.length) {
          if (b.w.out === 'striker') strikerIdx = nextInIdx
          else nonStrikerIdx = nextInIdx
          nextInIdx++
        }
      }

      // Build the ball record
      out.balls.push({
        matchId,
        clientBallId: `seed-${inningsNo}-${overIdx}-${ballNo}`,
        innings: inningsNo,
        overNumber: overIdx,
        ballNumber: ballNo,
        batsmanId: strikerId,
        bowlerId,
        nonStrikerId,
        fielderId: fielderId ?? null,
        runs: b.r,
        isWide: b.ex === 'wd',
        isNoball: b.ex === 'nb',
        isBye: b.ex === 'b',
        isLegbye: b.ex === 'lb',
        isWicket: !!b.w,
        wicketType: b.w?.type ?? null,
        extras,
        overthrows: 0,
        shotDirection: b.shot ?? null,
        commentary: null,
        isActive: true,
        createdAt: new Date(Date.now() - (script.length - overIdx) * 60_000),
      })

      out.totalRuns += totalRuns
      if (b.ex === 'wd') out.extrasWides += 1
      if (b.ex === 'nb') out.extrasNoballs += 1
      if (b.ex === 'b')  out.extrasByes  += b.r
      if (b.ex === 'lb') out.extrasLegbyes += b.r
      if (legal) out.totalLegalBalls++

      runsThisOver += totalRuns

      // Swap strike on odd runs off the bat (and not on wicket / wide / no-ball)
      if (!b.w && b.r % 2 === 1 && !b.ex) {
        const tmp = strikerIdx; strikerIdx = nonStrikerIdx; nonStrikerIdx = tmp
      }
    }
    // End of over: maiden if no runs and no wickets, swap strike
    if (runsThisOver === 0) bowl(bowlerId).maidens++
    const tmp = strikerIdx; strikerIdx = nonStrikerIdx; nonStrikerIdx = tmp
  }

  out.finalStrikerId = batting.battingIds[strikerIdx]!
  out.finalNonStrikerId = batting.battingIds[nonStrikerIdx]!
  out.finalBowlerId = bowlers[lastBowlerIdx === -1 ? 0 : lastBowlerIdx]!
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// Main seed
// ─────────────────────────────────────────────────────────────────────────────

export async function seedRealistic(): Promise<{ credentials: Array<{ email: string; password: string; role: string }> }> {
  logger.info('[seed-realistic] start')
  const hash = await bcrypt.hash(PASSWORD, 10)

  // ── 1. Users ───────────────────────────────────────────────────────────────
  const userMap = new Map<string, string>() // email → user id
  for (const u of ALL_USERS) {
    const created = await upsertUser(u, hash)
    userMap.set(u.email, created.id)
    // Ensure UserRole entry exists too so authorize() can match
    await prisma.userRole.upsert({
      where: { userId_role: { userId: created.id, role: u.role } },
      update: {},
      create: { userId: created.id, role: u.role, grantedBy: null },
    })
  }
  const adminId = userMap.get('admin@cricket.com')!

  // ── 2. RegisteredPlayer rows for everyone in MUM + CHE squads, linked to users
  const playerIdByEmail = new Map<string, string>()
  const seedPlayer = async (u: SeedUser, idx: number, club: string) => {
    const linkedUserId = userMap.get(u.email)!
    // Find existing by linkedUserId so we don't create duplicates on re-runs
    let p = await prisma.registeredPlayer.findFirst({ where: { linkedUserId } })
    const data = {
      name: u.name,
      email: u.email,
      battingStyle: u.battingStyle ?? null,
      bowlingStyle: u.bowlingStyle ?? null,
      clubName: club,
      playerIdCode: `${club.slice(0, 3).toUpperCase()}-${String(idx + 1).padStart(3, '0')}`,
      linkedUserId,
      createdBy: adminId,
    }
    if (p) {
      p = await prisma.registeredPlayer.update({ where: { id: p.id }, data })
    } else {
      p = await prisma.registeredPlayer.create({ data })
    }
    playerIdByEmail.set(u.email, p.id)
  }
  for (let i = 0; i < MUMBAI_PLAYERS.length; i++)  await seedPlayer(MUMBAI_PLAYERS[i]!,  i, 'Mumbai Mavericks')
  for (let i = 0; i < CHENNAI_PLAYERS.length; i++) await seedPlayer(CHENNAI_PLAYERS[i]!, i, 'Chennai Champions')

  // ── 3. Teams ──────────────────────────────────────────────────────────────
  const upsertTeam = async (code: string, name: string, club: string) => {
    const existing = await prisma.team.findUnique({ where: { teamCode: code } })
    const data = { teamCode: code, teamName: name, teamType: 'club', clubName: club, createdBy: adminId }
    return existing
      ? prisma.team.update({ where: { id: existing.id }, data })
      : prisma.team.create({ data })
  }
  const mumTeam = await upsertTeam('TEAM-0001', 'Mumbai Mavericks',  'Mumbai Mavericks')
  const cheTeam = await upsertTeam('TEAM-0002', 'Chennai Champions', 'Chennai Champions')
  const blrTeam = await upsertTeam('TEAM-0003', 'Bangalore Blasters','Bangalore Blasters')
  const delTeam = await upsertTeam('TEAM-0004', 'Delhi Dynamos',     'Delhi Dynamos')

  // ── 4. TeamPlayer rows (rosters) ──────────────────────────────────────────
  const linkRoster = async (teamId: string, players: SeedUser[]) => {
    for (let i = 0; i < players.length; i++) {
      const pid = playerIdByEmail.get(players[i]!.email)!
      await prisma.teamPlayer.upsert({
        where: { teamId_playerId: { teamId, playerId: pid } },
        update: { isCaptain: i === 0, isWicketKeeper: i === 4 },
        create: { teamId, playerId: pid, isCaptain: i === 0, isWicketKeeper: i === 4 },
      })
    }
  }
  await linkRoster(mumTeam.id, MUMBAI_PLAYERS)
  await linkRoster(cheTeam.id, CHENNAI_PLAYERS)

  // ── 5. Tournament ─────────────────────────────────────────────────────────
  const tournament = await prisma.tournament.upsert({
    where: { id: 'tour-seed-1' },
    update: {},
    create: {
      id: 'tour-seed-1',
      name: 'Future Protea Premier League 2026',
      type: 'T20',
      overs: 20,
      startDate: new Date(Date.now() - 7  * 24 * 3600_000),
      endDate:   new Date(Date.now() + 14 * 24 * 3600_000),
      venue: 'Multiple venues, South Africa',
      organizer: 'Future Protea Cricket Board',
      status: 'in_progress',
      createdBy: adminId,
    },
  })
  for (const t of [mumTeam, cheTeam, blrTeam, delTeam]) {
    await prisma.tournamentTeam.upsert({
      where: { tournamentId_teamId: { tournamentId: tournament.id, teamId: t.id } },
      update: {},
      create: { tournamentId: tournament.id, teamId: t.id, groupName: 'Group A' },
    })
  }

  // ── 6. The completed match — generate balls + aggregates ──────────────────
  const MATCH_ID = 'match-seed-completed'
  // Clean any stale data from a previous seed run so aggregates stay coherent.
  await prisma.ball.deleteMany({ where: { matchId: MATCH_ID } })
  await prisma.fallOfWicket.deleteMany({ where: { matchId: MATCH_ID } })
  await prisma.playerScore.deleteMany({ where: { matchId: MATCH_ID } })
  await prisma.matchInnings.deleteMany({ where: { matchId: MATCH_ID } })
  await prisma.matchPlayer.deleteMany({ where: { matchId: MATCH_ID } })
  await prisma.match.deleteMany({ where: { id: MATCH_ID } })

  const mumIds = MUMBAI_PLAYERS.map((p) => playerIdByEmail.get(p.email)!)
  const cheIds = CHENNAI_PLAYERS.map((p) => playerIdByEmail.get(p.email)!)

  const mumSquad: Squad = { battingIds: mumIds, bowlingIds: cheIds.slice(5).concat(cheIds.slice(2, 5)), fieldingIds: cheIds }
  const cheSquad: Squad = { battingIds: cheIds, bowlingIds: mumIds.slice(5).concat(mumIds.slice(2, 5)), fieldingIds: mumIds }

  const playedInn1 = playInnings(MATCH_ID, 1, MUM_INNINGS, mumSquad)
  const playedInn2 = playInnings(MATCH_ID, 2, CHE_INNINGS, cheSquad)

  const team1Overs = oversFloat(playedInn1.totalLegalBalls)
  const team2Overs = oversFloat(playedInn2.totalLegalBalls)
  const winnerName = playedInn1.totalRuns > playedInn2.totalRuns ? 'Mumbai Mavericks' : 'Chennai Champions'

  await prisma.match.create({
    data: {
      id: MATCH_ID,
      team1Name: 'Mumbai Mavericks',
      team2Name: 'Chennai Champions',
      team1Id: mumTeam.id,
      team2Id: cheTeam.id,
      venue: 'Wanderers Stadium, Johannesburg',
      totalOvers: 20,
      ballsPerOver: 6,
      matchType: 'T20',
      tournamentId: tournament.id,
      status: 'completed',
      tossWinner: 'Mumbai Mavericks',
      tossDecision: 'bat',
      currentInnings: 2,
      team1Score: playedInn1.totalRuns, team1Wickets: playedInn1.totalWickets, team1Overs,
      team2Score: playedInn2.totalRuns, team2Wickets: playedInn2.totalWickets, team2Overs,
      winner: winnerName,
      winnerTeamId: winnerName === 'Mumbai Mavericks' ? mumTeam.id : cheTeam.id,
      resultType: 'runs',
      resultMargin: Math.abs(playedInn1.totalRuns - playedInn2.totalRuns),
      matchDate: new Date(Date.now() - 24 * 3600_000),
      umpire: 'Daniel Botha',
      playerOfMatch: 'Rohit Sharma',
      playerOfMatchId: mumIds[0],
      createdBy: adminId,
    },
  })

  // Match players (full XIs, status=approved so live-scoring sees them)
  for (const pid of mumIds) {
    await prisma.matchPlayer.create({ data: { matchId: MATCH_ID, playerId: pid, team: 1, status: 'approved', isPlaying: true } })
  }
  for (const pid of cheIds) {
    await prisma.matchPlayer.create({ data: { matchId: MATCH_ID, playerId: pid, team: 2, status: 'approved', isPlaying: true } })
  }

  // Innings rows
  const inn1 = await prisma.matchInnings.create({
    data: {
      matchId: MATCH_ID, inningsNumber: 1,
      battingTeamId: mumTeam.id, bowlingTeamId: cheTeam.id,
      totalRuns: playedInn1.totalRuns, totalBalls: playedInn1.totalLegalBalls,
      totalOvers: team1Overs, totalWickets: playedInn1.totalWickets,
      extrasWides: playedInn1.extrasWides, extrasNoballs: playedInn1.extrasNoballs,
      extrasByes: playedInn1.extrasByes, extrasLegbyes: playedInn1.extrasLegbyes,
      status: 'completed', startedAt: new Date(Date.now() - 27 * 3600_000), endedAt: new Date(Date.now() - 25.5 * 3600_000),
    },
  })
  const inn2 = await prisma.matchInnings.create({
    data: {
      matchId: MATCH_ID, inningsNumber: 2,
      battingTeamId: cheTeam.id, bowlingTeamId: mumTeam.id,
      targetRuns: playedInn1.totalRuns + 1,
      totalRuns: playedInn2.totalRuns, totalBalls: playedInn2.totalLegalBalls,
      totalOvers: team2Overs, totalWickets: playedInn2.totalWickets,
      extrasWides: playedInn2.extrasWides, extrasNoballs: playedInn2.extrasNoballs,
      extrasByes: playedInn2.extrasByes, extrasLegbyes: playedInn2.extrasLegbyes,
      status: 'completed', startedAt: new Date(Date.now() - 25 * 3600_000), endedAt: new Date(Date.now() - 24.2 * 3600_000),
    },
  })

  // Balls — bulk insert
  if (playedInn1.balls.length > 0) await prisma.ball.createMany({ data: playedInn1.balls })
  if (playedInn2.balls.length > 0) await prisma.ball.createMany({ data: playedInn2.balls })

  // Fall of wickets
  for (const fow of playedInn1.fallOfWickets) {
    await prisma.fallOfWicket.create({ data: { matchId: MATCH_ID, inningsId: inn1.id, ...fow } })
  }
  for (const fow of playedInn2.fallOfWickets) {
    await prisma.fallOfWicket.create({ data: { matchId: MATCH_ID, inningsId: inn2.id, ...fow } })
  }

  // PlayerScore aggregates — one row per player per match
  const writeScores = async (
    played: PlayedInnings,
    battingTeamName: string,
    teamNumber: number,
    fieldingTeamPlayerIds: string[],
  ) => {
    const allPlayerIds = new Set<string>([
      ...played.battingStats.keys(),
      ...played.bowlingStats.keys(),
      ...fieldingTeamPlayerIds.filter((id) => played.fielderCatches.has(id) || played.fielderRunOuts.has(id)),
    ])
    for (const pid of allPlayerIds) {
      const bs = played.battingStats.get(pid)
      const bw = played.bowlingStats.get(pid)
      // Bowler/fielder team is the opposite of the batting team
      const isBatterOnThisInnings = !!bs
      await prisma.playerScore.upsert({
        where: { matchId_playerId: { matchId: MATCH_ID, playerId: pid } },
        update: {
          team: isBatterOnThisInnings ? teamNumber : (teamNumber === 1 ? 2 : 1),
          runsScored: (bs?.runs ?? 0) + (
            // If a row already exists for this player in the other innings, leave their
            // batting alone — they only bat once per match in this seed (T20).
            0
          ),
          ballsFaced: bs?.balls ?? 0,
          fours: bs?.fours ?? 0,
          sixes: bs?.sixes ?? 0,
          isOut: bs?.isOut ?? false,
          outType: bs?.outType ?? null,
          dismissedById: bs?.dismissedById ?? null,
          fielderId: bs?.fielderId ?? null,
          oversBowled: bw ? oversFloat(bw.balls) : 0,
          runsConceded: bw?.runs ?? 0,
          wicketsTaken: bw?.wickets ?? 0,
          maidens: bw?.maidens ?? 0,
          catches: played.fielderCatches.get(pid) ?? 0,
          runOuts: played.fielderRunOuts.get(pid) ?? 0,
        },
        create: {
          matchId: MATCH_ID,
          playerId: pid,
          team: isBatterOnThisInnings ? teamNumber : (teamNumber === 1 ? 2 : 1),
          runsScored: bs?.runs ?? 0,
          ballsFaced: bs?.balls ?? 0,
          fours: bs?.fours ?? 0,
          sixes: bs?.sixes ?? 0,
          isOut: bs?.isOut ?? false,
          outType: bs?.outType ?? null,
          dismissedById: bs?.dismissedById ?? null,
          fielderId: bs?.fielderId ?? null,
          oversBowled: bw ? oversFloat(bw.balls) : 0,
          runsConceded: bw?.runs ?? 0,
          wicketsTaken: bw?.wickets ?? 0,
          maidens: bw?.maidens ?? 0,
          catches: played.fielderCatches.get(pid) ?? 0,
          runOuts: played.fielderRunOuts.get(pid) ?? 0,
        },
      })
    }
    void battingTeamName // referenced for clarity only
  }
  await writeScores(playedInn1, 'Mumbai Mavericks', 1, cheIds)
  await writeScores(playedInn2, 'Chennai Champions', 2, mumIds)

  // ── 7. Live match (partial ball-by-ball) ──────────────────────────────────
  const LIVE_ID = 'match-seed-live'
  await prisma.ball.deleteMany({ where: { matchId: LIVE_ID } })
  await prisma.matchInnings.deleteMany({ where: { matchId: LIVE_ID } })
  await prisma.matchPlayer.deleteMany({ where: { matchId: LIVE_ID } })
  await prisma.match.deleteMany({ where: { id: LIVE_ID } })

  const liveScript = MUM_INNINGS.slice(0, 8) // 8 overs into a 20-over chase
  const liveSquad: Squad = { battingIds: cheIds, bowlingIds: mumIds.slice(5), fieldingIds: mumIds }
  const livePlayed = playInnings(LIVE_ID, 1, liveScript, liveSquad)

  await prisma.match.create({
    data: {
      id: LIVE_ID,
      team1Name: 'Chennai Champions', team2Name: 'Mumbai Mavericks',
      team1Id: cheTeam.id, team2Id: mumTeam.id,
      venue: 'Newlands Cricket Ground, Cape Town',
      totalOvers: 20, ballsPerOver: 6, matchType: 'T20',
      tournamentId: tournament.id,
      status: 'live', tossWinner: 'Chennai Champions', tossDecision: 'bat',
      currentInnings: 1,
      team1Score: livePlayed.totalRuns, team1Wickets: livePlayed.totalWickets, team1Overs: oversFloat(livePlayed.totalLegalBalls),
      team2Score: 0, team2Wickets: 0, team2Overs: 0,
      matchDate: new Date(Date.now() - 60 * 60_000),
      umpire: 'Daniel Botha',
      createdBy: adminId,
    },
  })
  await prisma.ball.createMany({ data: livePlayed.balls })
  for (const pid of cheIds) await prisma.matchPlayer.create({ data: { matchId: LIVE_ID, playerId: pid, team: 1, status: 'approved', isPlaying: true } })
  for (const pid of mumIds) await prisma.matchPlayer.create({ data: { matchId: LIVE_ID, playerId: pid, team: 2, status: 'approved', isPlaying: true } })
  await prisma.matchInnings.create({
    data: {
      matchId: LIVE_ID, inningsNumber: 1,
      battingTeamId: cheTeam.id, bowlingTeamId: mumTeam.id,
      totalRuns: livePlayed.totalRuns, totalBalls: livePlayed.totalLegalBalls,
      totalOvers: oversFloat(livePlayed.totalLegalBalls), totalWickets: livePlayed.totalWickets,
      extrasWides: livePlayed.extrasWides, extrasNoballs: livePlayed.extrasNoballs,
      extrasByes: livePlayed.extrasByes, extrasLegbyes: livePlayed.extrasLegbyes,
      strikerId: livePlayed.finalStrikerId, nonStrikerId: livePlayed.finalNonStrikerId,
      currentBowlerId: livePlayed.finalBowlerId,
      status: 'in_progress', startedAt: new Date(Date.now() - 60 * 60_000),
    },
  })

  // ── 8. Two upcoming fixtures ──────────────────────────────────────────────
  for (const id of ['match-seed-upcoming-1', 'match-seed-upcoming-2']) {
    await prisma.match.deleteMany({ where: { id } })
  }
  await prisma.match.create({
    data: {
      id: 'match-seed-upcoming-1',
      team1Name: 'Bangalore Blasters', team2Name: 'Delhi Dynamos',
      team1Id: blrTeam.id, team2Id: delTeam.id,
      venue: 'Kingsmead, Durban', totalOvers: 20, matchType: 'T20',
      tournamentId: tournament.id, status: 'upcoming',
      matchDate: new Date(Date.now() + 24 * 3600_000),
      createdBy: adminId,
    },
  })
  await prisma.match.create({
    data: {
      id: 'match-seed-upcoming-2',
      team1Name: 'Mumbai Mavericks', team2Name: 'Bangalore Blasters',
      team1Id: mumTeam.id, team2Id: blrTeam.id,
      venue: 'SuperSport Park, Centurion', totalOvers: 20, matchType: 'T20',
      tournamentId: tournament.id, status: 'upcoming',
      matchDate: new Date(Date.now() + 3 * 24 * 3600_000),
      createdBy: adminId,
    },
  })

  // ── 9. Announcements — and fan a notification out to every staff role ─────
  const annId = 'ann-seed-welcome'
  await prisma.announcement.deleteMany({ where: { id: annId } })
  const ann = await prisma.announcement.create({
    data: {
      id: annId,
      title: 'Welcome to Future Protea Premier League 2026',
      content: 'The tournament is officially live. Check the fixtures tab for upcoming matches. Players — please confirm availability with your captains.',
      targetRoles: [],
      isActive: true,
      publishedAt: new Date(),
      createdById: adminId,
    },
  })
  const allRecipients = await prisma.user.findMany({ select: { id: true } })
  await prisma.notification.deleteMany({ where: { category: 'announcement', metadata: { path: ['announcement_id'], equals: ann.id } as any } }).catch(() => {})
  await prisma.notification.createMany({
    data: allRecipients.map((u) => ({
      userId: u.id,
      title: ann.title,
      message: ann.content,
      type: 'info',
      category: 'announcement',
      link: `/announcements/${ann.id}`,
      metadata: { announcement_id: ann.id } as any,
    })),
  })

  // ── 10. Support tickets ───────────────────────────────────────────────────
  const playerUid = userMap.get('rohit@mumbai.com')!
  const coachUid = userMap.get('coach@cricket.com')!
  await prisma.supportTicket.deleteMany({ where: { reporterId: { in: [playerUid, coachUid] }, subject: { contains: '[seed]' } } })
  await prisma.supportTicket.create({
    data: {
      subject: '[seed] Cannot mark availability for tomorrow’s fixture',
      description: 'When I tap the availability toggle on the upcoming match it does not save.',
      category: 'players', priority: 'normal', status: 'open',
      reporterId: playerUid,
      reporterEmail: 'rohit@mumbai.com',
    },
  })
  await prisma.supportTicket.create({
    data: {
      subject: '[seed] Need score correction for last over of completed match',
      description: 'The last ball was recorded as a 4 but should have been 2 + 2 overthrows.',
      category: 'scoring', priority: 'high', status: 'in_progress', escalated: true,
      reporterId: coachUid,
      reporterEmail: 'coach@cricket.com',
    },
  })

  logger.info('[seed-realistic] done')

  return {
    credentials: [
      ...STAFF_USERS.map((u) => ({ email: u.email, password: PASSWORD, role: u.role })),
      ...MUMBAI_PLAYERS.map((u) => ({ email: u.email, password: PASSWORD, role: u.role })),
      ...CHENNAI_PLAYERS.map((u) => ({ email: u.email, password: PASSWORD, role: u.role })),
    ],
  }
}
