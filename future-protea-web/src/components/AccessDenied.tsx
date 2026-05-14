import { ShieldX } from 'lucide-react'

export function AccessDenied() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <ShieldX className="h-16 w-16 text-muted-foreground/50" />
      <div>
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You don't have permission to access this page. Contact your administrator if you need access.
        </p>
      </div>
    </div>
  )
}
