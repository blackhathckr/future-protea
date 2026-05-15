/**
 * @fileoverview Support ticket admin — list, escalate, resolve, respond.
 */

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { LifeBuoy, Plus, AlertTriangle, Check, MessageSquare, Filter } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { PageHero } from '@/components/cricket/PageHero'
import { SupportAdmin } from '@/services/admin/admin-core.service'
import type { SupportTicket } from '@/types/admin-core.types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function SupportPage() {
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<SupportTicket | null>(null)

  useEffect(() => { load() }, [statusFilter, priorityFilter])

  const load = async () => {
    setLoading(true)
    try {
      const params: any = { limit: 100 }
      if (statusFilter !== 'all') params.status = statusFilter
      if (priorityFilter !== 'all') params.priority = priorityFilter
      const r = await SupportAdmin.list(params)
      setTickets((r as any)?.data ?? [])
    } catch { toast.error('Failed to load tickets') }
    finally { setLoading(false) }
  }

  const filtered = useMemo(() => {
    if (!search) return tickets
    const q = search.toLowerCase()
    return tickets.filter((t) => t.subject.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
  }, [tickets, search])

  const open = filtered.filter((t) => t.status === 'open')
  const inProgress = filtered.filter((t) => t.status === 'in_progress')
  const resolved = filtered.filter((t) => t.status === 'resolved')
  const escalated = filtered.filter((t) => t.escalated && t.status !== 'resolved')

  if (loading) return <div className="flex items-center justify-center h-96"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHero
        title="Support Tickets"
        description={`${tickets.length} total · ${open.length} open · ${escalated.length} escalated.`}
        icon={LifeBuoy}
        variant="slate"
        actions={
          <Button onClick={() => setCreateOpen(true)} className="bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/30">
            <Plus className="mr-2 h-4 w-4" /> New Ticket
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input className="max-w-md" placeholder="Search subject or description…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open" className="gap-1.5">Open ({open.length})</TabsTrigger>
          <TabsTrigger value="in_progress" className="gap-1.5">In Progress ({inProgress.length})</TabsTrigger>
          <TabsTrigger value="escalated" className="gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Escalated ({escalated.length})</TabsTrigger>
          <TabsTrigger value="resolved" className="gap-1.5">Resolved ({resolved.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="open" className="mt-4"><TicketList items={open} onSelect={setSelected} /></TabsContent>
        <TabsContent value="in_progress" className="mt-4"><TicketList items={inProgress} onSelect={setSelected} /></TabsContent>
        <TabsContent value="escalated" className="mt-4"><TicketList items={escalated} onSelect={setSelected} /></TabsContent>
        <TabsContent value="resolved" className="mt-4"><TicketList items={resolved} onSelect={setSelected} /></TabsContent>
      </Tabs>

      <CreateTicketDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={() => { setCreateOpen(false); load() }} />
      <TicketDetailDialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)} ticket={selected} onChanged={() => { setSelected(null); load() }} />
    </motion.div>
  )
}

function TicketList({ items, onSelect }: { items: SupportTicket[]; onSelect: (t: SupportTicket) => void }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No tickets in this view</p>
  return (
    <div className="space-y-2">
      {items.map((t) => (
        <Card key={t.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => onSelect(t)}>
          <CardContent className="p-4 flex items-center gap-3">
            <PriorityDot priority={t.priority} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate flex items-center gap-2">
                {t.subject}
                {t.escalated && <Badge className="bg-amber-500 hover:bg-amber-600 text-[10px]"><AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> ESCALATED</Badge>}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{t.description}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{t.reporter_email ?? 'system'} · {new Date(t.created_at).toLocaleDateString()}</p>
            </div>
            <Badge variant="outline" className="capitalize text-[10px]">{t.status.replace('_', ' ')}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function PriorityDot({ priority }: { priority: string }) {
  const color = priority === 'urgent' ? 'bg-red-500' : priority === 'high' ? 'bg-amber-500' : priority === 'low' ? 'bg-zinc-400' : 'bg-blue-500'
  return <div className={cn('h-2.5 w-2.5 rounded-full', color)} title={`${priority} priority`} />
}

function CreateTicketDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [form, setForm] = useState({ subject: '', description: '', category: '', priority: 'normal' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (open) setForm({ subject: '', description: '', category: '', priority: 'normal' }) }, [open])

  const handleSave = async () => {
    if (!form.subject || !form.description) { toast.error('Subject and description are required'); return }
    setSaving(true)
    try { await SupportAdmin.create(form); toast.success('Ticket created'); onSaved() }
    catch (e: any) { toast.error(e?.response?.data?.error?.message || 'Failed to create') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>New Ticket</DialogTitle></DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1.5"><Label>Subject *</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Description *</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input placeholder="e.g. scoring" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? 'Saving…' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TicketDetailDialog({ open, onOpenChange, ticket, onChanged }: { open: boolean; onOpenChange: (v: boolean) => void; ticket: SupportTicket | null; onChanged: () => void }) {
  const [detail, setDetail] = useState<SupportTicket | null>(null)
  const [reply, setReply] = useState('')
  const [internal, setInternal] = useState(false)
  const [busy, setBusy] = useState(false)
  // Inline styled prompt for the escalation reason — replaces window.prompt().
  const [escalateOpen, setEscalateOpen] = useState(false)
  const [escalateReason, setEscalateReason] = useState('')

  useEffect(() => {
    if (open && ticket) {
      SupportAdmin.get(ticket.id).then((r) => setDetail((r as any)?.data ?? ticket)).catch(() => setDetail(ticket))
      setReply('')
    } else { setDetail(null) }
  }, [open, ticket])

  if (!ticket || !detail) return null

  const submitReply = async () => {
    if (!reply.trim()) return
    setBusy(true)
    try { await SupportAdmin.addResponse(ticket.id, { message: reply, isInternal: internal }); toast.success('Response added'); setReply(''); const r = await SupportAdmin.get(ticket.id); setDetail((r as any)?.data ?? ticket) }
    catch { toast.error('Failed to add response') }
    finally { setBusy(false) }
  }

  const confirmEscalate = async () => {
    setBusy(true)
    try {
      await SupportAdmin.escalate(ticket.id, escalateReason.trim() || undefined)
      toast.success('Ticket escalated')
      setEscalateOpen(false)
      setEscalateReason('')
      onChanged()
    } catch { toast.error('Failed to escalate') }
    finally { setBusy(false) }
  }

  const resolve = async () => {
    setBusy(true)
    try { await SupportAdmin.resolve(ticket.id); toast.success('Resolved'); onChanged() }
    catch { toast.error('Failed to resolve') } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PriorityDot priority={detail.priority} /> {detail.subject}
            {detail.escalated && <Badge className="bg-amber-500"><AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> ESCALATED</Badge>}
            <Badge variant="outline" className="capitalize">{detail.status.replace('_', ' ')}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto">
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-sm whitespace-pre-line">{detail.description}</p>
            <p className="text-[11px] text-muted-foreground mt-2">{detail.reporter_email ?? 'system'} · {new Date(detail.created_at).toLocaleString()}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Responses ({detail.responses?.length ?? 0})</p>
            {(detail.responses ?? []).map((r) => (
              <div key={r.id} className={cn('rounded-md border p-3', r.is_internal ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200/50' : 'bg-card')}>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold">{r.author_name ?? 'Admin'}</span>
                  {r.is_internal && <Badge variant="outline" className="text-[9px]">INTERNAL</Badge>}
                  <span className="text-muted-foreground ml-auto">{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm mt-1 whitespace-pre-line">{r.message}</p>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label>Reply</Label>
            <Textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your response…" />
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} /> Internal note (not visible to reporter)
            </label>
          </div>
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          {!detail.escalated && detail.status !== 'resolved' && (
            <Button variant="outline" onClick={() => { setEscalateReason(''); setEscalateOpen(true) }} disabled={busy}>
              <AlertTriangle className="h-4 w-4 mr-2" /> Escalate
            </Button>
          )}
          {detail.status !== 'resolved' && (
            <Button onClick={resolve} disabled={busy} className="bg-emerald-600 hover:bg-emerald-700"><Check className="h-4 w-4 mr-2" /> Resolve</Button>
          )}
          <Button onClick={submitReply} disabled={busy || !reply.trim()}><MessageSquare className="h-4 w-4 mr-2" /> Reply</Button>
        </DialogFooter>
      </DialogContent>

      {/* Styled escalation dialog — replaces the ugly browser prompt() */}
      <Dialog open={escalateOpen} onOpenChange={setEscalateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" /> Escalate ticket
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-md border bg-amber-50/60 dark:bg-amber-900/10 p-3 text-xs">
              <p className="font-semibold mb-0.5">{detail.subject}</p>
              <p className="text-muted-foreground line-clamp-2">{detail.description}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Reason for escalation</Label>
              <Textarea
                rows={4}
                placeholder="Explain why this ticket needs immediate attention…"
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                Optional. The ticket will be marked <strong>HIGH priority</strong> and flagged as escalated.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEscalateOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={confirmEscalate} disabled={busy} className="bg-amber-600 hover:bg-amber-700 text-white">
              <AlertTriangle className="h-4 w-4 mr-2" /> {busy ? 'Escalating…' : 'Escalate ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
