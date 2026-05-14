/** Cricket management permissions mapped to typed constants. */
export const PERMISSIONS = {
  // Users
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_BULK: 'users.bulk',

  // Matches
  MATCHES_VIEW: 'matches.view',
  MATCHES_CREATE: 'matches.create',
  MATCHES_UPDATE: 'matches.update',
  MATCHES_DELETE: 'matches.delete',
  MATCHES_PUBLISH: 'matches.publish',

  // Players
  PLAYERS_VIEW: 'players.view',
  PLAYERS_CREATE: 'players.create',
  PLAYERS_UPDATE: 'players.update',
  PLAYERS_DELETE: 'players.delete',

  // Teams
  TEAMS_VIEW: 'teams.view',
  TEAMS_CREATE: 'teams.create',
  TEAMS_UPDATE: 'teams.update',
  TEAMS_DELETE: 'teams.delete',

  // Tournaments
  TOURNAMENTS_VIEW: 'tournaments.view',
  TOURNAMENTS_CREATE: 'tournaments.create',
  TOURNAMENTS_UPDATE: 'tournaments.update',
  TOURNAMENTS_DELETE: 'tournaments.delete',

  // Support
  SUPPORT_VIEW: 'support.view',
  SUPPORT_RESPOND: 'support.respond',
  SUPPORT_ASSIGN: 'support.assign',

  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',

  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_UPDATE: 'settings.update',

  // Notifications
  NOTIFICATIONS_SEND: 'notifications.send',
  NOTIFICATIONS_BULK: 'notifications.bulk',
} as const

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
