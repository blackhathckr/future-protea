import type { ReactNode } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { AccessDenied } from '@/components/AccessDenied'
import type { PermissionName } from '@/config/permissions'

interface PermissionGuardProps {
  /** Single permission required to view children */
  permission?: PermissionName
  /** Multiple permissions — user needs ALL of them */
  permissions?: PermissionName[]
  /** Multiple permissions — user needs ANY one of them */
  anyPermission?: PermissionName[]
  /** Shown when user lacks permission. Defaults to AccessDenied. */
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGuard({
  permission,
  permissions,
  anyPermission,
  fallback,
  children,
}: PermissionGuardProps) {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermissions()

  let allowed = true

  if (permission) {
    allowed = hasPermission(permission)
  } else if (permissions) {
    allowed = hasAllPermissions(permissions)
  } else if (anyPermission) {
    allowed = hasAnyPermission(anyPermission)
  }

  if (!allowed) {
    return <>{fallback ?? <AccessDenied />}</>
  }

  return <>{children}</>
}
