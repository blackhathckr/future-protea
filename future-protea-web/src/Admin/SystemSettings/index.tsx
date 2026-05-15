/**
 * @fileoverview System Settings page — monitoring, maintenance windows,
 * feature-flag style key/value settings, and audit logs.
 *
 * Visual layer only — all data hooks, handlers, and service calls are
 * unchanged. The four tabs (Monitoring / Settings / Maintenance / Audit Logs)
 * have been reworked for hierarchy, status colour-coding, and polish.
 */

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon, Activity, Wrench, FileText, KeyRound, Save, Plus, Trash2,
  Database, Cpu, MemoryStick, Server, Clock, Gauge, RefreshCw, Search,
  CheckCircle2, AlertTriangle, XCircle, CircleDot, CalendarClock, ChevronRight, Tag,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { PageHero } from '@/components/cricket/PageHero'
import { SystemAdmin, UserAdmin } from '@/services/admin/admin-core.service'
import type { MaintenanceWindow, AuditLogEntry } from '@/types/admin-core.types'
import { toast } from 'sonner'
import { confirm } from '@/lib/confirm'
import { cn } from '@/lib/utils'

interface Monitoring {
  status: string
  uptime_seconds: number
  database: string
  memory: { rss_mb: number; heap_used_mb: number; heap_total_mb: number }
  host: { platform: string; node_version: string; cpu_count: number; load_average: number[] }
  settings: Array<{ id?: string; key: string; value: string; description?: string | null; category?: string | null }>
}

// ─────────────────────────────────────────────────────────────────────────────
// Root page
// ─────────────────────────────────────────────────────────────────────────────

export function SystemSettingsPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHero
        title="System Settings"
        description="Monitor the API, schedule maintenance windows, manage feature flags, and audit activity."
        icon={SettingsIcon}
        variant="slate"
      />

      <Tabs defaultValue="monitoring">
        <TabsList className="bg-muted/50 p-1 h-11">
          <TabsTrigger value="monitoring"  className="gap-1.5 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm"><Activity className="h-4 w-4" /> Monitoring</TabsTrigger>
          <TabsTrigger value="settings"    className="gap-1.5 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm"><KeyRound className="h-4 w-4" /> Settings</TabsTrigger>
          <TabsTrigger value="maintenance" className="gap-1.5 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm"><Wrench   className="h-4 w-4" /> Maintenance</TabsTrigger>
          <TabsTrigger value="logs"        className="gap-1.5 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm"><FileText className="h-4 w-4" /> Audit Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="monitoring"  className="mt-5"><MonitoringTab  /></TabsContent>
        <TabsContent value="settings"    className="mt-5"><SettingsTab    /></TabsContent>
        <TabsContent value="maintenance" className="mt-5"><MaintenanceTab /></TabsContent>
        <TabsContent value="logs"        className="mt-5"><AuditLogsTab   /></TabsContent>
      </Tabs>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Monitoring
// ─────────────────────────────────────────────────────────────────────────────

function MonitoringTab() {
  const [data, setData] = useState<Monitoring | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    let mounted = true
    const tick = async () => {
      try {
        const r = await SystemAdmin.monitoring()
        if (mounted) {
          setData((r as any)?.data ?? null)
          setLastUpdated(new Date())
        }
      } catch { /* ignore */ } finally { if (mounted) setLoading(false) }
    }
    tick()
    const t = setInterval(tick, 10_000)
    return () => { mounted = false; clearInterval(t) }
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl border bg-muted/30 animate-pulse" />
        ))}
      </div>
    )
  }
  if (!data) {
    return <EmptyState icon={Activity} title="No monitoring data" description="The /monitoring endpoint returned nothing." />
  }

  const uptimeMins = Math.floor(data.uptime_seconds / 60)
  const hours = Math.floor(uptimeMins / 60)
  const days = Math.floor(hours / 24)
  const uptime = `${days}d ${hours % 24}h ${uptimeMins % 60}m`

  const heapPct = Math.round((data.memory.heap_used_mb / Math.max(data.memory.heap_total_mb, 1)) * 100)

  return (
    <div className="space-y-5">
      {/* Live header strip */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-sm font-medium">Live · refreshes every 10s</span>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              · last updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Hero status cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <HeroTile
          label="API status"
          value={data.status}
          icon={Activity}
          tone={data.status === 'healthy' ? 'success' : 'warning'}
          hint={data.status === 'healthy' ? 'All systems operational' : 'Investigate'}
        />
        <HeroTile
          label="Database"
          value={data.database}
          icon={Database}
          tone={data.database === 'healthy' ? 'success' : 'danger'}
          hint={data.database === 'healthy' ? 'Connection healthy' : 'Connection issue'}
        />
        <HeroTile
          label="Uptime"
          value={uptime}
          icon={Clock}
          tone="info"
          hint={`Since ${new Date(Date.now() - data.uptime_seconds * 1000).toLocaleDateString()}`}
        />
      </div>

      {/* Memory + CPU group */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MemoryStick className="h-4 w-4 text-emerald-600" /> Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Heap usage bar */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Heap usage</span>
              <span className="text-sm font-semibold">
                {data.memory.heap_used_mb} <span className="text-muted-foreground font-normal">/ {data.memory.heap_total_mb} MB</span>
                <span className={cn('ml-2 text-xs font-medium', heapPct > 80 ? 'text-red-600' : heapPct > 60 ? 'text-amber-600' : 'text-emerald-600')}>
                  {heapPct}%
                </span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  heapPct > 80 ? 'bg-red-500' : heapPct > 60 ? 'bg-amber-500' : 'bg-emerald-500',
                )}
                style={{ width: `${Math.min(heapPct, 100)}%` }}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SubMetric icon={MemoryStick} label="RSS Memory" value={`${data.memory.rss_mb} MB`} />
            <SubMetric icon={Cpu}         label="CPU cores"  value={String(data.host.cpu_count)} />
            <SubMetric icon={Gauge}       label="Load avg (1m)" value={data.host.load_average[0]?.toFixed(2) ?? '—'} />
            <SubMetric icon={Server}      label="Runtime" value={`${data.host.platform} · Node ${data.host.node_version}`} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function HeroTile({
  label, value, icon: Icon, tone, hint,
}: {
  label: string
  value: string
  icon: any
  tone: 'success' | 'warning' | 'danger' | 'info'
  hint?: string
}) {
  const toneClasses = {
    success: { bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500' },
    warning: { bg: 'bg-amber-500/10',   ring: 'ring-amber-500/20',   text: 'text-amber-600 dark:text-amber-400',   icon: 'text-amber-500'   },
    danger:  { bg: 'bg-red-500/10',     ring: 'ring-red-500/20',     text: 'text-red-600 dark:text-red-400',       icon: 'text-red-500'     },
    info:    { bg: 'bg-sky-500/10',     ring: 'ring-sky-500/20',     text: 'text-sky-600 dark:text-sky-400',       icon: 'text-sky-500'     },
  }[tone]

  const toneIcon = {
    success: CheckCircle2,
    warning: AlertTriangle,
    danger:  XCircle,
    info:    CircleDot,
  }[tone]
  const ToneIcon = toneIcon

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <p className={cn('text-2xl font-bold capitalize truncate', toneClasses.text)}>{value}</p>
              <ToneIcon className={cn('h-4 w-4 shrink-0', toneClasses.icon)} />
            </div>
            {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
          </div>
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl ring-1', toneClasses.bg, toneClasses.ring)}>
            <Icon className={cn('h-5 w-5', toneClasses.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SubMetric({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-background ring-1 ring-border shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold truncate" title={value}>{value}</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────

function SettingsTab() {
  const [settings, setSettings] = useState<Monitoring['settings']>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState('')

  const load = async () => {
    try {
      const r = await SystemAdmin.monitoring()
      setSettings(((r as any)?.data?.settings ?? []) as Monitoring['settings'])
    } catch { toast.error('Failed to load settings') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleSave = async (key: string) => {
    setSaving((p) => ({ ...p, [key]: true }))
    try {
      await SystemAdmin.updateSetting(key, editing[key] ?? '')
      toast.success(`Saved ${key}`)
      load()
    } catch { toast.error('Failed to save') }
    finally { setSaving((p) => ({ ...p, [key]: false })) }
  }

  // Group by category for visual hierarchy. Settings without a category land
  // under "General".
  const grouped = useMemo(() => {
    const filtered = settings.filter((s) => {
      if (!search) return true
      const q = search.toLowerCase()
      return s.key.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q)
    })
    const out: Record<string, Monitoring['settings']> = {}
    for (const s of filtered) {
      const cat = (s.category && s.category.trim()) || 'General'
      if (!out[cat]) out[cat] = []
      out[cat].push(s)
    }
    return out
  }, [settings, search])

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl border bg-muted/30 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-emerald-600" /> Application settings
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Feature flags and runtime configuration values.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search keys…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 w-56"
              />
            </div>
            <Button size="sm" onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-1.5" /> Add setting
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.keys(grouped).length === 0 ? (
          <EmptyState
            icon={KeyRound}
            title={search ? 'No settings match your search' : 'No settings yet'}
            description={search ? 'Try a different keyword.' : 'Add a setting to drive a feature flag or runtime value.'}
            action={!search ? <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-1.5" /> Add your first setting</Button> : undefined}
          />
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{category}</h4>
                <span className="text-xs text-muted-foreground">· {items.length}</span>
              </div>
              <ul className="space-y-2">
                {items.map((s) => (
                  <li
                    key={s.key}
                    className="group flex items-start gap-3 p-3 rounded-lg border bg-card hover:border-emerald-500/30 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-semibold truncate">{s.key}</p>
                      {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 w-full max-w-md">
                      <Input
                        value={editing[s.key] ?? s.value}
                        onChange={(e) => setEditing((p) => ({ ...p, [s.key]: e.target.value }))}
                        className="flex-1 h-9 font-mono text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={saving[s.key]}
                        onClick={() => handleSave(s.key)}
                        className="h-9"
                      >
                        {saving[s.key] ? (
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Save
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </CardContent>
      <AddSettingDialog open={addOpen} onOpenChange={setAddOpen} onSaved={() => { setAddOpen(false); load() }} />
    </Card>
  )
}

function AddSettingDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [form, setForm] = useState({ key: '', value: '', description: '', category: '' })
  const [saving, setSaving] = useState(false)
  useEffect(() => { if (open) setForm({ key: '', value: '', description: '', category: '' }) }, [open])
  const handle = async () => {
    if (!form.key || !form.value) return toast.error('Key and value are required')
    setSaving(true)
    try { await SystemAdmin.updateSetting(form.key, form.value, { description: form.description, category: form.category }); toast.success('Saved'); onSaved() }
    catch { toast.error('Failed to save') } finally { setSaving(false) }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-emerald-600" /> Add setting</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1.5"><Label>Key *</Label><Input className="font-mono text-sm" placeholder="e.g. live_streaming_enabled" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Value *</Label><Input className="font-mono text-sm" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Category</Label><Input placeholder="e.g. features" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handle} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Maintenance
// ─────────────────────────────────────────────────────────────────────────────

function MaintenanceTab() {
  const [windows, setWindows] = useState<MaintenanceWindow[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)

  const load = async () => {
    try { const r = await SystemAdmin.listMaintenance({ limit: 50 }); setWindows((r as any)?.data ?? []) }
    catch { toast.error('Failed to load windows') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Delete this maintenance window?', confirmLabel: 'Delete' })
    if (!ok) return
    try { await SystemAdmin.deleteMaintenance(id); toast.success('Deleted'); load() }
    catch { toast.error('Failed to delete') }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border bg-muted/30 animate-pulse" />
        ))}
      </div>
    )
  }

  const now = Date.now()
  const active = windows.filter((w) => new Date(w.starts_at).getTime() <= now && new Date(w.ends_at).getTime() > now)
  const scheduled = windows.filter((w) => new Date(w.starts_at).getTime() > now)
  const past = windows.filter((w) => new Date(w.ends_at).getTime() <= now)

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-4 w-4 text-emerald-600" /> Maintenance windows
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Schedule downtime and notify the user base in advance.</p>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-1.5" /> Schedule
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {windows.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No maintenance scheduled"
            description="Schedule a window to give users advance notice of downtime."
            action={<Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-1.5" /> Schedule maintenance</Button>}
          />
        ) : (
          <>
            {active.length > 0 && (
              <MaintenanceGroup title="Active now" tone="danger" items={active} onDelete={handleDelete} />
            )}
            {scheduled.length > 0 && (
              <MaintenanceGroup title="Upcoming" tone="warning" items={scheduled} onDelete={handleDelete} />
            )}
            {past.length > 0 && (
              <MaintenanceGroup title="Past" tone="muted" items={past} onDelete={handleDelete} />
            )}
          </>
        )}
      </CardContent>
      <ScheduleMaintenanceDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={() => { setCreateOpen(false); load() }} />
    </Card>
  )
}

function MaintenanceGroup({
  title, tone, items, onDelete,
}: {
  title: string
  tone: 'danger' | 'warning' | 'muted'
  items: MaintenanceWindow[]
  onDelete: (id: string) => void
}) {
  const toneDot = {
    danger: 'bg-red-500',
    warning: 'bg-amber-500',
    muted: 'bg-muted-foreground/40',
  }[tone]
  const toneAccent = {
    danger: 'border-l-red-500',
    warning: 'border-l-amber-500',
    muted: 'border-l-muted',
  }[tone]

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className={cn('h-2 w-2 rounded-full', toneDot, tone === 'danger' && 'animate-pulse')} />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
        <span className="text-xs text-muted-foreground">· {items.length}</span>
      </div>
      <ul className="space-y-2">
        {items.map((w) => (
          <li
            key={w.id}
            className={cn(
              'flex items-start gap-3 p-3.5 rounded-lg border-l-4 border bg-card transition-colors hover:bg-muted/30',
              toneAccent,
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold">{w.title}</p>
                <Badge variant="outline" className="capitalize text-[10px]">{w.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <CalendarClock className="h-3 w-3" />
                {new Date(w.starts_at).toLocaleString()}
                <ChevronRight className="h-3 w-3" />
                {new Date(w.ends_at).toLocaleString()}
              </p>
              {w.description && <p className="text-sm text-muted-foreground mt-1.5">{w.description}</p>}
              {w.affects_services.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {w.affects_services.map((s) => (
                    <Badge key={s} variant="secondary" className="text-[10px] font-mono">{s}</Badge>
                  ))}
                </div>
              )}
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => onDelete(w.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ScheduleMaintenanceDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', startsAt: '', endsAt: '', affectsServices: '' })
  const [saving, setSaving] = useState(false)
  useEffect(() => { if (open) setForm({ title: '', description: '', startsAt: '', endsAt: '', affectsServices: '' }) }, [open])
  const handle = async () => {
    if (!form.title || !form.startsAt || !form.endsAt) return toast.error('Title and dates required')
    setSaving(true)
    try {
      await SystemAdmin.createMaintenance({
        title: form.title,
        description: form.description,
        startsAt: form.startsAt,
        endsAt: form.endsAt,
        affectsServices: form.affectsServices ? form.affectsServices.split(',').map((s) => s.trim()).filter(Boolean) : [],
      })
      toast.success('Scheduled')
      onSaved()
    } catch { toast.error('Failed to schedule') } finally { setSaving(false) }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Wrench className="h-4 w-4 text-emerald-600" /> Schedule maintenance</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Starts *</Label><Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Ends *</Label><Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5"><Label>Affects services (comma-separated)</Label><Input placeholder="api, scoring" value={form.affectsServices} onChange={(e) => setForm({ ...form, affectsServices: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handle} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? 'Saving…' : 'Schedule'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit logs
// ─────────────────────────────────────────────────────────────────────────────

function AuditLogsTab() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = async () => {
    try { const r = await UserAdmin.auditLogs({ limit: 100, search }); setLogs((r as any)?.data ?? []) }
    catch { toast.error('Failed to load logs') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" /> Audit logs
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Most recent 100 system events. Tracks every privileged action.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search action or entity…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 w-64" />
            </div>
            <Button size="sm" variant="outline" onClick={load} disabled={loading} className="h-9">
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', loading && 'animate-spin')} /> Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 rounded-md bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={FileText} title="No audit entries" description="Privileged actions will appear here." />
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="grid grid-cols-[110px_140px_1fr_160px_140px] gap-3 px-5 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b bg-muted/30">
              <span>Action</span>
              <span>Entity</span>
              <span>ID</span>
              <span>Actor</span>
              <span>When</span>
            </div>
            <ul className="divide-y">
              {logs.map((l) => (
                <li
                  key={l.id}
                  className="grid grid-cols-[110px_140px_1fr_160px_140px] gap-3 px-5 py-2.5 text-sm items-center hover:bg-muted/30 transition-colors"
                >
                  <ActionBadge action={l.action} />
                  <span className="text-muted-foreground capitalize truncate">{l.entity_type}</span>
                  <span className="font-mono text-xs text-muted-foreground truncate" title={l.entity_id}>{l.entity_id}</span>
                  <span className="text-xs truncate">{l.actor?.name ?? <span className="text-muted-foreground italic">system</span>}</span>
                  <span className="text-xs text-muted-foreground" title={new Date(l.created_at).toLocaleString()}>
                    {formatRelative(l.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ActionBadge({ action }: { action: string }) {
  const lower = action.toLowerCase()
  const tone =
    lower.includes('delete') || lower.includes('remove') ? 'red' :
    lower.includes('create') || lower.includes('add')    ? 'emerald' :
    lower.includes('update') || lower.includes('edit')   ? 'sky' :
    lower.includes('login')  || lower.includes('auth')   ? 'violet' :
    'muted'

  const cls = {
    red:     'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    sky:     'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
    violet:  'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400',
    muted:   'border-border bg-muted text-muted-foreground',
  }[tone]

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md border font-mono text-[10px] font-semibold uppercase tracking-wider w-fit', cls)}>
      {action}
    </span>
  )
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime()
  const diffSec = Math.floor((Date.now() - then) / 1000)
  if (diffSec < 60)     return `${diffSec}s ago`
  if (diffSec < 3600)   return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400)  return `${Math.floor(diffSec / 3600)}h ago`
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`
  return new Date(iso).toLocaleDateString()
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({
  icon: Icon, title, description, action,
}: {
  icon: any
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted ring-1 ring-border mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="font-semibold">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
