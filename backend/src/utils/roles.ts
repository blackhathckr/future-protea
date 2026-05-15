/**
 * Single source of truth for valid role strings accepted by the API.
 *
 * Values match the BRD's stakeholder list and the UserRole comment block in
 * prisma/schema.prisma. Stored as lowercase plain strings to match existing
 * User.role / UserRole.role columns (VarChar, no enum).
 *
 * The Flutter app's HomeScreen dispatches on these exact strings — keep in
 * sync with protea-app/lib/screens/core/home_screen.dart.
 */

export const VALID_ROLES = [
  // Existing roles
  'player',
  'feeder',           // legacy scorer role
  'scorer',           // BRD-aligned alias for feeder
  'viewer',           // a.k.a. spectator
  'spectator',
  'admin',

  // BRD §6.7 — read-only analytics consumer
  'coach',

  // BRD §6.4 — data-only field official (recorded by scorer)
  'umpire',

  // BRD §6.8 — event admin owning tournaments, fixtures, points table
  'tournament_organiser',

  // Future roles already declared in the UserRole comment block
  'team_admin',
  'school_admin',
  'club_admin',
] as const;

export type Role = (typeof VALID_ROLES)[number];

/** Roles that are auto-approved on registration (do not require admin review). */
export const AUTO_APPROVED_ROLES: ReadonlySet<Role> = new Set<Role>([
  'feeder',
  'scorer',
  'viewer',
  'spectator',
  'admin',
  'coach',
  'umpire',
  'tournament_organiser',
  'team_admin',
  'school_admin',
  'club_admin',
]);

export function isValidRole(value: unknown): value is Role {
  return typeof value === 'string' && (VALID_ROLES as readonly string[]).includes(value);
}
