import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ children, redirectTo = '/' }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  // Admin portal access: any role that isn't EDUCATOR or LEARNER
  const hasAdminAccess = user?.role && user.role !== 'EDUCATOR' && user.role !== 'LEARNER'

  if (!hasAdminAccess) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-semibold">Access Denied</h1>
        <p className="text-muted-foreground">
          You don't have access to the admin portal. Contact a Super Admin to get a role assigned.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
