/**
 * @fileoverview Announcements page — create, edit, publish, target by role.
 * Publishing fans the announcement out as a notification to every user
 * whose role matches.
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, Plus, Edit, Trash2, Send, EyeOff, Eye, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { PageHero } from '@/components/cricket/PageHero'
import { AnnouncementAdmin, RoleAdmin } from '@/services/admin/admin-core.service'
import type { Announcement, RoleConfig } from '@/types/admin-core.types'
import { toast } from 'sonner'
import { confirm } from '@/lib/confirm'
import { cn } from '@/lib/utils'

export function AnnouncementsPage() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Announcement[]>([])
  const [roles, setRoles] = useState<RoleConfig[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [a, r] = await Promise.all([
        AnnouncementAdmin.list({ limit: 100 }).catch(() => ({ data: [] as Announcement[] })),
        RoleAdmin.listRoles().catch(() => ({ data: [] as RoleConfig[] })),
      ])
      setItems((a as any)?.data ?? [])
      setRoles((r as any)?.data ?? [])
    } catch { toast.error('Failed to load announcements') }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Delete this announcement?', confirmLabel: 'Delete' })
    if (!ok) return
    try { await AnnouncementAdmin.remove(id); toast.success('Deleted'); load() }
    catch { toast.error('Failed to delete') }
  }

  const handlePublish = async (a: Announcement) => {
    try {
      const r = await AnnouncementAdmin.publish(a.id)
      toast.success(`Published and notified ${(r.data as any)?.recipients_notified ?? 0} users`)
      load()
    } catch { toast.error('Failed to publish') }
  }

  const handleUnpublish = async (a: Announcement) => {
    try { await AnnouncementAdmin.unpublish(a.id); toast.success('Unpublished'); load() }
    catch { toast.error('Failed to unpublish') }
  }

  if (loading) return <div className="flex items-center justify-center h-96"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>

  const active = items.filter((a) => a.is_active)
  const drafts = items.filter((a) => !a.is_active)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHero
        title="Announcements"
        description={`${active.length} live · ${drafts.length} draft. Publishing fans a notification to every matching role.`}
        icon={Megaphone}
        variant="slate"
        actions={
          <Button onClick={() => { setEditing(null); setOpen(true) }} className="bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/30">
            <Plus className="mr-2 h-4 w-4" /> New Announcement
          </Button>
        }
      />

      <Section title="Active" badge={active.length} variant="emerald" items={active} onEdit={(a) => { setEditing(a); setOpen(true) }} onDelete={handleDelete} onPublish={handlePublish} onUnpublish={handleUnpublish} />
      <Section title="Drafts" badge={drafts.length} variant="muted" items={drafts} onEdit={(a) => { setEditing(a); setOpen(true) }} onDelete={handleDelete} onPublish={handlePublish} onUnpublish={handleUnpublish} />

      {items.length === 0 && (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No announcements yet. Click "New Announcement" to broadcast something.</CardContent></Card>
      )}

      <AnnouncementDialog open={open} onOpenChange={setOpen} announcement={editing} roles={roles} onSaved={() => { setOpen(false); setEditing(null); load() }} />
    </motion.div>
  )
}

function Section({ title, badge, variant, items, onEdit, onDelete, onPublish, onUnpublish }: {
  title: string; badge: number; variant: 'emerald' | 'muted'; items: Announcement[];
  onEdit: (a: Announcement) => void; onDelete: (id: string) => void; onPublish: (a: Announcement) => void; onUnpublish: (a: Announcement) => void
}) {
  if (items.length === 0) return null
  return (
    <div className="space-y-3">
      <h2 className="font-semibold flex items-center gap-2">
        <span className={cn('inline-flex h-2 w-2 rounded-full', variant === 'emerald' ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/40')} />
        {title} <span className="text-muted-foreground font-normal">({badge})</span>
      </h2>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((a) => (
          <Card key={a.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{a.title}</CardTitle>
                {a.is_active && <Badge className="bg-emerald-600 hover:bg-emerald-700 text-[10px]">LIVE</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-3">{a.content}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {a.target_roles.length === 0 ? (
                  <Badge variant="outline" className="text-[10px]">Everyone</Badge>
                ) : (
                  a.target_roles.map((r) => <Badge key={r} variant="outline" className="text-[10px] capitalize">{r}</Badge>)
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />{a.published_at ? `Published ${new Date(a.published_at).toLocaleDateString()}` : `Created ${new Date(a.created_at).toLocaleDateString()}`}</span>
                {a.expires_at && <span>Expires {new Date(a.expires_at).toLocaleDateString()}</span>}
              </div>
              <div className="flex gap-2 pt-2 border-t">
                {a.is_active ? (
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => onUnpublish(a)}>
                    <EyeOff className="h-3.5 w-3.5 mr-1.5" /> Unpublish
                  </Button>
                ) : (
                  <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => onPublish(a)}>
                    <Send className="h-3.5 w-3.5 mr-1.5" /> Publish & Notify
                  </Button>
                )}
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(a)}><Edit className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => onDelete(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

interface DialogProps { open: boolean; onOpenChange: (v: boolean) => void; announcement: Announcement | null; roles: RoleConfig[]; onSaved: () => void }

function AnnouncementDialog({ open, onOpenChange, announcement, roles, onSaved }: DialogProps) {
  const [form, setForm] = useState({ title: '', content: '', targetRoles: [] as string[], expiresAt: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && announcement) {
      setForm({ title: announcement.title, content: announcement.content, targetRoles: announcement.target_roles, expiresAt: announcement.expires_at ? announcement.expires_at.slice(0, 10) : '' })
    } else if (open) {
      setForm({ title: '', content: '', targetRoles: [], expiresAt: '' })
    }
  }, [open, announcement])

  const toggleRole = (name: string) => setForm((f) => ({
    ...f,
    targetRoles: f.targetRoles.includes(name) ? f.targetRoles.filter((r) => r !== name) : [...f.targetRoles, name],
  }))

  const handleSave = async () => {
    if (!form.title || !form.content) { toast.error('Title and content are required'); return }
    setSaving(true)
    try {
      const payload = { title: form.title, content: form.content, targetRoles: form.targetRoles, expiresAt: form.expiresAt || null }
      if (announcement) {
        await AnnouncementAdmin.update(announcement.id, payload)
        toast.success('Updated')
      } else {
        await AnnouncementAdmin.create(payload)
        toast.success('Created')
      }
      onSaved()
    } catch (e: any) { toast.error(e?.response?.data?.error?.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{announcement ? 'Edit announcement' : 'New announcement'}</DialogTitle></DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Content *</Label><Textarea rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
          <div className="space-y-1.5">
            <Label>Target roles {form.targetRoles.length === 0 && <span className="text-xs text-muted-foreground">(none = everyone)</span>}</Label>
            <div className="flex flex-wrap gap-1.5">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleRole(r.name)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors capitalize',
                    form.targetRoles.includes(r.name) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-background hover:bg-accent',
                  )}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Expires (optional)</Label>
            <Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Suppress unused-imports
void Eye
