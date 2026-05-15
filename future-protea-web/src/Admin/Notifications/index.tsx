/**
 * @fileoverview Notifications inbox page — full list of the signed-in user's
 * notifications. Admin/organisers can also broadcast from here.
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bell, Send, CheckCheck, Trash2, Megaphone, Activity, Trophy, Settings } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { PageHero } from '@/components/cricket/PageHero'
import { NotificationService, RoleAdmin } from '@/services/admin/admin-core.service'
import type { NotificationItem, RoleConfig } from '@/types/admin-core.types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

const ICONS: Record<string, any> = { announcement: Megaphone, match: Activity, tournament: Trophy, system: Settings }

export function NotificationsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [broadcastOpen, setBroadcastOpen] = useState(false)

  const isAdmin = user?.role === 'admin' || (user as any)?.roles?.includes?.('admin')

  const load = async () => {
    setLoading(true)
    try { const r = await NotificationService.list({ limit: 200 }); setItems((r as any)?.data ?? []) }
    catch { toast.error('Failed to load notifications') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleRead = async (n: NotificationItem) => {
    if (n.is_read) return
    await NotificationService.markRead(n.id).catch(() => {})
    setItems((p) => p.map((x) => x.id === n.id ? { ...x, is_read: true } : x))
  }
  const handleAllRead = async () => {
    await NotificationService.markAllRead().catch(() => {})
    setItems((p) => p.map((x) => ({ ...x, is_read: true })))
    toast.success('All marked read')
  }
  const handleDelete = async (id: string) => {
    await NotificationService.remove(id).catch(() => {})
    setItems((p) => p.filter((x) => x.id !== id))
  }
  const handleDeleteAll = async (readOnly: boolean) => {
    const msg = readOnly
      ? 'Delete all read notifications? This cannot be undone.'
      : 'Delete every notification? This cannot be undone.'
    if (!confirm(msg)) return
    await NotificationService.removeAll(readOnly).catch(() => {})
    setItems((p) => readOnly ? p.filter((x) => !x.is_read) : [])
    toast.success(readOnly ? 'Cleared read notifications' : 'Inbox cleared')
  }

  if (loading) return <div className="flex items-center justify-center h-96"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>

  const unread = items.filter((n) => !n.is_read)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHero
        title="Notifications"
        description={`${items.length} total · ${unread.length} unread`}
        icon={Bell}
        variant="slate"
        actions={
          <div className="flex gap-2 flex-wrap">
            {unread.length > 0 && (
              <Button variant="secondary" onClick={handleAllRead} className="bg-white/10 hover:bg-white/20 text-white border-0">
                <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
              </Button>
            )}
            {items.length > 0 && items.some((n) => n.is_read) && (
              <Button variant="secondary" onClick={() => handleDeleteAll(true)} className="bg-white/10 hover:bg-white/20 text-white border-0">
                <Trash2 className="mr-2 h-4 w-4" /> Clear read
              </Button>
            )}
            {items.length > 0 && (
              <Button variant="secondary" onClick={() => handleDeleteAll(false)} className="bg-red-500/20 hover:bg-red-500/30 text-white border-0">
                <Trash2 className="mr-2 h-4 w-4" /> Delete all
              </Button>
            )}
            {isAdmin && (
              <Button onClick={() => setBroadcastOpen(true)} className="bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/30">
                <Send className="mr-2 h-4 w-4" /> Broadcast
              </Button>
            )}
          </div>
        }
      />

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({items.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unread.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <NotificationList items={items} onRead={handleRead} onDelete={handleDelete} onOpenLink={(link) => navigate(link)} />
        </TabsContent>
        <TabsContent value="unread" className="mt-4">
          <NotificationList items={unread} onRead={handleRead} onDelete={handleDelete} onOpenLink={(link) => navigate(link)} />
        </TabsContent>
      </Tabs>

      <BroadcastDialog open={broadcastOpen} onOpenChange={setBroadcastOpen} />
    </motion.div>
  )
}

function NotificationList({ items, onRead, onDelete, onOpenLink }: { items: NotificationItem[]; onRead: (n: NotificationItem) => void; onDelete: (id: string) => void; onOpenLink: (link: string) => void }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No notifications.</p>
  return (
    <div className="space-y-2">
      {items.map((n) => {
        const Icon = ICONS[n.category ?? ''] ?? Bell
        return (
          <Card key={n.id} className={cn(!n.is_read && 'border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/10')}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className={cn('h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0', !n.is_read ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground')}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { onRead(n); if (n.link) onOpenLink(n.link) }}>
                <p className={cn('text-sm', !n.is_read && 'font-semibold')}>{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  {n.category && <Badge variant="outline" className="text-[10px] capitalize">{n.category}</Badge>}
                  <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
                </div>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => onDelete(n.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function BroadcastDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [roles, setRoles] = useState<RoleConfig[]>([])
  const [form, setForm] = useState({ title: '', message: '', type: 'info', category: '', link: '', targetRoles: [] as string[] })
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!open) return
    RoleAdmin.listRoles().then((r) => setRoles((r as any)?.data ?? [])).catch(() => {})
    setForm({ title: '', message: '', type: 'info', category: '', link: '', targetRoles: [] })
  }, [open])

  const toggleRole = (name: string) => setForm((f) => ({
    ...f,
    targetRoles: f.targetRoles.includes(name) ? f.targetRoles.filter((r) => r !== name) : [...f.targetRoles, name],
  }))

  const handle = async () => {
    if (!form.title || !form.message) return toast.error('Title and message are required')
    setSending(true)
    try {
      const r = await NotificationService.broadcast({
        title: form.title, message: form.message, type: form.type, category: form.category || undefined,
        link: form.link || undefined, target_roles: form.targetRoles,
      })
      toast.success(`Sent to ${(r as any)?.data?.recipients ?? 0} users`)
      onOpenChange(false)
    } catch (e: any) { toast.error(e?.response?.data?.error?.message || 'Failed to send') }
    finally { setSending(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Broadcast notification</DialogTitle></DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Message *</Label><Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Category</Label><Input placeholder="e.g. match, system" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Link (optional)</Label><Input placeholder="/matches/123" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Target roles {form.targetRoles.length === 0 && <span className="text-xs text-muted-foreground">(none = everyone)</span>}</Label>
            <div className="flex flex-wrap gap-1.5">
              {roles.map((r) => (
                <button key={r.id} type="button" onClick={() => toggleRole(r.name)} className={cn('rounded-full border px-3 py-1 text-xs font-medium capitalize', form.targetRoles.includes(r.name) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-background hover:bg-accent')}>
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handle} disabled={sending} className="bg-emerald-600 hover:bg-emerald-700"><Send className="h-4 w-4 mr-2" />{sending ? 'Sending…' : 'Send'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
