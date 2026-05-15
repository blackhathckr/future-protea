/**
 * @fileoverview Prisma seed entrypoint. Runs:
 *   1) `seedAdminDefaults` — 16 permissions + 8 system roles.
 *   2) `seedRealistic`     — full set of users, teams, players, a tournament,
 *      a finished match with ball-by-ball, a live match, upcoming fixtures,
 *      announcements, notifications, support tickets.
 *
 * Triggered by:
 *   - `pnpm exec prisma migrate dev` (Prisma calls this automatically)
 *   - `pnpm exec prisma db seed`     (manual run)
 *   - `pnpm run seed:admin`          (script alias)
 */

import dotenv from 'dotenv'
dotenv.config()

import prisma from '../src/config/database'
import { seedAdminDefaults } from '../src/utils/seedAdmin'
import { seedRealistic } from './seed-realistic'

async function main() {
  console.log('[seed] starting admin defaults…')
  await seedAdminDefaults()
  console.log('[seed] starting realistic dataset…')
  const result = await seedRealistic()

  const [perms, roles, rolePerms, users, players, teams, matches, balls, tickets, notifs] = await Promise.all([
    prisma.permission.count(),
    (prisma as any).roleConfig.count(),
    (prisma as any).rolePermission.count(),
    prisma.user.count(),
    prisma.registeredPlayer.count(),
    prisma.team.count(),
    prisma.match.count(),
    prisma.ball.count(),
    (prisma as any).supportTicket.count(),
    (prisma as any).notification.count(),
  ])

  console.log('\n══════════════════════════════════════════════════════════════════════')
  console.log('  Future Protea seed — counts')
  console.log('══════════════════════════════════════════════════════════════════════')
  console.log(`  permissions:        ${perms}`)
  console.log(`  role_configs:       ${roles}`)
  console.log(`  role_permissions:   ${rolePerms}`)
  console.log(`  users:              ${users}`)
  console.log(`  registered_players: ${players}`)
  console.log(`  teams:              ${teams}`)
  console.log(`  matches:            ${matches}`)
  console.log(`  balls:              ${balls}`)
  console.log(`  notifications:      ${notifs}`)
  console.log(`  support_tickets:    ${tickets}`)
  console.log('══════════════════════════════════════════════════════════════════════\n')

  // Print credentials table — useful for QA / demos.
  console.log('  Test credentials (all share the same password):')
  console.log('  Password: Cricket@2026\n')
  const byRole = new Map<string, string[]>()
  result.credentials.forEach((c) => {
    if (!byRole.has(c.role)) byRole.set(c.role, [])
    byRole.get(c.role)!.push(c.email)
  })
  Array.from(byRole.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([role, emails]) => {
      console.log(`  [${role}]`)
      emails.forEach((e) => console.log(`    ${e}`))
    })
  console.log('\n══════════════════════════════════════════════════════════════════════\n')
}

main()
  .catch((e) => {
    console.error('[seed] failed:', e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
