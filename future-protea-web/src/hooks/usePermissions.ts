import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { PERMISSIONS } from '@/config/permissions'
import type { PermissionName } from '@/config/permissions'

/** Routes ordered by priority for determining landing page. */
const PERMISSION_ROUTES: { permission: PermissionName; path: string }[] = [
  { permission: PERMISSIONS.USERS_VIEW, path: '/users' },
  { permission: PERMISSIONS.SUPPORT_VIEW, path: '/support' },
  { permission: PERMISSIONS.NOTIFICATIONS_SEND, path: '/announcements' },
  { permission: PERMISSIONS.REPORTS_VIEW, path: '/reports' },
  { permission: PERMISSIONS.SETTINGS_VIEW, path: '/settings' },
]

export function usePermissions() {
  const { user } = useAuth()

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const isBuiltInAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
  const permissions = user?.permissions ?? []

  const helpers = useMemo(() => {
    const hasPermission = (permission: PermissionName): boolean => {
      if (isSuperAdmin) return true
      if (permissions.includes('*')) return true
      return permissions.includes(permission)
    }

    const hasAnyPermission = (perms: PermissionName[]): boolean => {
      if (isSuperAdmin) return true
      if (permissions.includes('*')) return true
      return perms.some((p) => permissions.includes(p))
    }

    const hasAllPermissions = (perms: PermissionName[]): boolean => {
      if (isSuperAdmin) return true
      if (permissions.includes('*')) return true
      return perms.every((p) => permissions.includes(p))
    }

    /** Returns the best landing page for the current user. */
    const getLandingPage = (): string => {
      // SUPER_ADMIN and ADMIN always land on dashboard
      if (isBuiltInAdmin) return '/dashboard'
      // Custom roles: find first permitted route
      for (const route of PERMISSION_ROUTES) {
        if (hasPermission(route.permission)) return route.path
      }
      // Fallback: profile page (always accessible)
      return '/profile'
    }

    return { hasPermission, hasAnyPermission, hasAllPermissions, getLandingPage }
  }, [isSuperAdmin, isBuiltInAdmin, permissions])

  return { ...helpers, isSuperAdmin, isBuiltInAdmin, permissions }
}
