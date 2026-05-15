/**
 * @fileoverview Notification bell + dropdown.
 * Calls /api/notifications for the signed-in user's inbox, polls unread count.
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Trash2, Megaphone, Activity, Trophy, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationService } from '@/services/admin/admin-core.service'
import type { NotificationItem } from '@/types/admin-core.types'
import { cn } from '@/lib/utils'

const CATEGORY_ICON: Record<string, any> = {
  announcement: Megaphone,
  match: Activity,
  tournament: Trophy,
  system: Settings,
}

export function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(0)
  const [items, setItems] = useState<NotificationItem[]>([])

  const loadCount = async () => {
    try {
      const r = await NotificationService.unreadCount()
      setCount(r.count ?? 0)
    } catch { /* ignore */ }
  }

  const loadItems = async () => {
    try {
      const r = await NotificationService.list({ limit: 20 })
      setItems((r as any)?.data ?? [])
    } catch { /* ignore */ }
  }

  useEffect(() => {
    loadCount()
    const t = setInterval(loadCount, 30_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => { if (open) loadItems() }, [open])

  const markRead = async (n: NotificationItem) => {
    if (!n.is_read) {
      await NotificationService.markRead(n.id).catch(() => {})
      setItems((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x))
      loadCount()
    }
    if (n.link) {
      setOpen(false)
      navigate(n.link)
    }
  }

  const markAllRead = async () => {
    await NotificationService.markAllRead().catch(() => {})
    setItems((prev) => prev.map((x) => ({ ...x, is_read: true })))
    setCount(0)
  }

  const remove = async (id: string) => {
    await NotificationService.remove(id).catch(() => {})
    setItems((prev) => prev.filter((x) => x.id !== id))
    loadCount()
  }

  const clearAll = async () => {
    if (!confirm('Delete all notifications? This cannot be undone.')) return
    await NotificationService.removeAll(false).catch(() => {})
    setItems([])
    setCount(0)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] bg-red-500 hover:bg-red-500 text-white border-0">
              {count > 99 ? '99+' : count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-[70vh] overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-popover/95 backdrop-blur border-b p-3 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">Notifications</p>
          <div className="flex items-center gap-1">
            {count > 0 && (
              <Button size="sm" variant="ghost" onClick={markAllRead} className="h-7 text-xs">
                <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark all read
              </Button>
            )}
            {items.length > 0 && (
              <Button size="sm" variant="ghost" onClick={clearAll} className="h-7 text-xs text-red-500 hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete all
              </Button>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((n) => {
              const Icon = CATEGORY_ICON[n.category ?? ''] ?? Bell
              return (
                <li
                  key={n.id}
                  className={cn('p-3 flex items-start gap-3 cursor-pointer hover:bg-accent transition-colors', !n.is_read && 'bg-emerald-50/40 dark:bg-emerald-950/10')}
                  onClick={() => markRead(n)}
                >
                  <div className={cn('h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0', !n.is_read ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground')}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm', !n.is_read && 'font-semibold')}>{n.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(n.id) }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <div className="sticky bottom-0 bg-popover/95 backdrop-blur border-t p-2">
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setOpen(false); navigate('/notifications') }}>
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
