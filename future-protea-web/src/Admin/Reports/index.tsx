/**
 * @fileoverview Reports page — cricket-focused, backed by real APIs.
 *
 * Five tabs (Matches / Tournaments / Teams / Players / Activity) each render
 * the same shape: a filter strip + a server-loaded table + a 3-format export
 * (CSV / Excel / PDF). All export logic lives in `lib/report-export.ts`.
 */

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Filter, Download, FileSpreadsheet, FileDown,
  Activity, Trophy, Shield, Users, ScrollText,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PageHero } from '@/components/cricket/PageHero'
import { MatchService, type Match } from '@/services/cricket/match.service'
import { TournamentService, type Tournament } from '@/services/cricket/tournament.service'
import { TeamService, type Team } from '@/services/cricket/team.service'
import { PlayerService, type Player } from '@/services/cricket/player.service'
import { AnalyticsAdmin, UserAdmin } from '@/services/admin/admin-core.service'
import type { AuditLogEntry } from '@/types/admin-core.types'
import { exportReport, type ReportColumn, type ReportFormat } from '@/lib/report-export'
import { toast } from 'sonner'

// ─────────────────────────────────────────────────────────────────────────────

interface DateRange { from: string; to: string }

function inRange(iso: string | null | undefined, range: DateRange): boolean {
  if (!iso) return true
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return true
  if (range.from && t < new Date(range.from).getTime()) return false
  if (range.to && t > new Date(range.to + 'T23:59:59').getTime()) return false
  return true
}

type TabKey = 'matches' | 'tournaments' | 'teams' | 'players' | 'activity'

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const [tab, setTab] = useState<TabKey>('matches')
  const [range, setRange] = useState<DateRange>({ from: '', to: '' })
  const [search, setSearch] = useState('')

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHero
        title="Reports & Exports"
        description="Pull match, tournament, team, player, and audit data — filter by date, then export to CSV, Excel, or PDF."
        icon={FileText}
        variant="slate"
      />

      <FilterStrip range={range} setRange={setRange} search={search} setSearch={setSearch} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-auto min-w-full sm:min-w-0">
            <TabsTrigger value="matches"     className="gap-1.5"><Activity   className="h-3.5 w-3.5" /> Matches</TabsTrigger>
            <TabsTrigger value="tournaments" className="gap-1.5"><Trophy     className="h-3.5 w-3.5" /> Tournaments</TabsTrigger>
            <TabsTrigger value="teams"       className="gap-1.5"><Shield     className="h-3.5 w-3.5" /> Teams</TabsTrigger>
            <TabsTrigger value="players"     className="gap-1.5"><Users      className="h-3.5 w-3.5" /> Players</TabsTrigger>
            <TabsTrigger value="activity"    className="gap-1.5"><ScrollText className="h-3.5 w-3.5" /> Activity</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="matches"     className="mt-4"><MatchesReport     range={range} search={search} /></TabsContent>
        <TabsContent value="tournaments" className="mt-4"><TournamentsReport range={range} search={search} /></TabsContent>
        <TabsContent value="teams"       className="mt-4"><TeamsReport       search={search} /></TabsContent>
        <TabsContent value="players"     className="mt-4"><PlayersReport     search={search} /></TabsContent>
        <TabsContent value="activity"    className="mt-4"><ActivityReport    range={range} search={search} /></TabsContent>
      </Tabs>
    </motion.div>
  )
}

/**
 * Inline filter row — search expands to fill, dates and the clear button stay
 * compact and wrap onto the next row only when the viewport is genuinely tight.
 * Same flex-wrap pattern the User Management / Support pages use, so the
 * Reports header sits flush with the rest of the admin.
 */
function FilterStrip({ range, setRange, search, setSearch }: { range: DateRange; setRange: (r: DateRange) => void; search: string; setSearch: (s: string) => void }) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px] space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Filter className="h-3 w-3" /> Search
            </Label>
            <Input
              placeholder="Filter the current tab…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">From</Label>
            <Input
              type="date"
              value={range.from}
              onChange={(e) => setRange({ ...range, from: e.target.value })}
              className="w-[150px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">To</Label>
            <Input
              type="date"
              value={range.to}
              onChange={(e) => setRange({ ...range, to: e.target.value })}
              className="w-[150px]"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setRange({ from: '', to: '' })}
            disabled={!range.from && !range.to}
            className="shrink-0"
          >
            Clear dates
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic report shell — table + export menu
// ─────────────────────────────────────────────────────────────────────────────

interface ReportShellProps<T> {
  title: string
  subtitle?: string
  filename: string
  columns: ReportColumn<T>[]
  rows: T[]
  loading: boolean
  empty?: string
  filterChips?: React.ReactNode
}

function ReportShell<T>({ title, subtitle, filename, columns, rows, loading, empty, filterChips }: ReportShellProps<T>) {
  const handleExport = (format: ReportFormat) => {
    if (rows.length === 0) return toast.error('Nothing to export with the current filters')
    try {
      exportReport(format, { filename, columns, rows, title, subtitle })
      toast.success(`Exported ${rows.length} row${rows.length === 1 ? '' : 's'} as ${format.toUpperCase()}`)
    } catch (e: any) {
      toast.error(e?.message ?? `Export to ${format.toUpperCase()} failed`)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Title + filter chips + export — wraps cleanly on narrow screens. */}
        <div className="p-3 sm:p-4 flex items-center justify-between gap-3 flex-wrap border-b">
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{title}</p>
            <p className="text-xs text-muted-foreground">{subtitle ?? `${rows.length} row${rows.length === 1 ? '' : 's'}`}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {filterChips}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" disabled={rows.length === 0} className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
                  <Download className="h-4 w-4 mr-2" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <FileText className="h-4 w-4 mr-2" /> CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <FileDown className="h-4 w-4 mr-2" /> PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">{empty ?? 'No rows match the current filters.'}</div>
        ) : (
          // Horizontal scroll lives on the table wrapper so the rest of the
          // card stays the full content width even when the table overflows.
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground sticky top-0">
                <tr>
                  {columns.map((c, i) => <th key={i} className="text-left p-3 whitespace-nowrap font-semibold">{c.header}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 200).map((r, i) => (
                  <tr key={i} className="border-t hover:bg-accent/40">
                    {columns.map((c, j) => {
                      const v = typeof c.accessor === 'function' ? c.accessor(r) : (r as any)[c.accessor]
                      return <td key={j} className="p-3 whitespace-nowrap">{v == null ? '—' : String(v)}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rows.length > 200 && (
          <p className="text-xs text-muted-foreground p-3 border-t">
            Showing first 200 rows in preview · the export contains all {rows.length}.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Matches
// ─────────────────────────────────────────────────────────────────────────────

function MatchesReport({ range, search }: { range: DateRange; search: string }) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'upcoming' | 'completed'>('all')

  useEffect(() => {
    setLoading(true)
    const status = statusFilter === 'all' ? undefined : statusFilter
    MatchService.getMatches(status, 500)
      .then((data) => setMatches(data))
      .catch(() => toast.error('Failed to load matches'))
      .finally(() => setLoading(false))
  }, [statusFilter])

  const rows = useMemo(() => matches.filter((m) => {
    if (!inRange(m.match_date, range)) return false
    if (search) {
      const q = search.toLowerCase()
      return [m.team1_name, m.team2_name, m.venue, m.winner].some((v) => v?.toLowerCase().includes(q))
    }
    return true
  }), [matches, range, search])

  const columns: ReportColumn<Match>[] = [
    { header: 'Date',     accessor: (r) => new Date(r.match_date).toLocaleString() },
    { header: 'Team 1',   accessor: 'team1_name' },
    { header: 'Team 2',   accessor: 'team2_name' },
    { header: 'Venue',    accessor: (r) => r.venue || '—' },
    { header: 'Status',   accessor: (r) => r.status.toUpperCase() },
    { header: 'Overs',    accessor: 'total_overs' },
    { header: 'T1 Score', accessor: (r) => `${r.team1_score}/${r.team1_wickets} (${r.team1_overs.toFixed(1)})` },
    { header: 'T2 Score', accessor: (r) => `${r.team2_score}/${r.team2_wickets} (${r.team2_overs.toFixed(1)})` },
    { header: 'Toss',     accessor: (r) => r.toss_winner ? `${r.toss_winner} → ${r.toss_decision ?? '—'}` : '—' },
    { header: 'Winner',   accessor: (r) => r.winner ?? '—' },
  ]

  return (
    <ReportShell
      title="Match report"
      subtitle={`${rows.length} match${rows.length === 1 ? '' : 'es'}${range.from || range.to ? ' in date range' : ''}`}
      filename="matches_report"
      columns={columns}
      rows={rows}
      loading={loading}
      filterChips={
        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      }
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tournaments
// ─────────────────────────────────────────────────────────────────────────────

function TournamentsReport({ range, search }: { range: DateRange; search: string }) {
  const [items, setItems] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    TournamentService.getTournaments()
      .then((data) => setItems(data))
      .catch(() => toast.error('Failed to load tournaments'))
      .finally(() => setLoading(false))
  }, [])

  const rows = useMemo(() => items.filter((t) => {
    if (!inRange(t.start_date, range) && !inRange(t.end_date, range)) return false
    if (search) {
      const q = search.toLowerCase()
      return [t.name, t.type, t.venue, t.organizer].some((v) => v?.toLowerCase().includes(q))
    }
    return true
  }), [items, range, search])

  const columns: ReportColumn<Tournament>[] = [
    { header: 'Name',      accessor: 'name' },
    { header: 'Type',      accessor: (r) => r.type ?? '—' },
    { header: 'Overs',     accessor: (r) => r.overs ?? '—' },
    { header: 'Start',     accessor: (r) => new Date(r.start_date).toLocaleDateString() },
    { header: 'End',       accessor: (r) => new Date(r.end_date).toLocaleDateString() },
    { header: 'Venue',     accessor: (r) => r.venue ?? '—' },
    { header: 'Organizer', accessor: (r) => r.organizer ?? '—' },
    { header: 'Status',    accessor: (r) => r.status.replace('_', ' ').toUpperCase() },
  ]

  return (
    <ReportShell
      title="Tournament report"
      filename="tournaments_report"
      columns={columns}
      rows={rows}
      loading={loading}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Teams
// ─────────────────────────────────────────────────────────────────────────────

function TeamsReport({ search }: { search: string }) {
  const [items, setItems] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    TeamService.getTeams()
      .then((data) => setItems(data))
      .catch(() => toast.error('Failed to load teams'))
      .finally(() => setLoading(false))
  }, [])

  const rows = useMemo(() => items.filter((t) => {
    if (search) {
      const q = search.toLowerCase()
      return [t.team_name, t.team_code, t.team_type, t.school_name, t.club_name]
        .some((v) => v?.toLowerCase().includes(q))
    }
    return true
  }), [items, search])

  const columns: ReportColumn<Team>[] = [
    { header: 'Code',      accessor: 'team_code' },
    { header: 'Name',      accessor: 'team_name' },
    { header: 'Type',      accessor: 'team_type' },
    { header: 'School',    accessor: (r) => r.school_name ?? '—' },
    { header: 'Club',      accessor: (r) => r.club_name ?? '—' },
    { header: 'Players',   accessor: (r) => r.players?.length ?? 0 },
    { header: 'Created',   accessor: (r) => r.created_at ? new Date(r.created_at).toLocaleDateString() : '—' },
  ]

  return (
    <ReportShell
      title="Team report"
      filename="teams_report"
      columns={columns}
      rows={rows}
      loading={loading}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Players (career stats merged with player list)
// ─────────────────────────────────────────────────────────────────────────────

interface PlayerRow {
  player_id: string
  name: string
  email?: string | null
  role?: string | null
  approved: boolean
  total_runs: number
  total_wickets: number
  matches: number
}

function PlayersReport({ search }: { search: string }) {
  const [rows, setRows] = useState<PlayerRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      PlayerService.getAllPlayers().catch(() => [] as Player[]),
      AnalyticsAdmin.topPlayers(200).catch(() => ({ data: { top_run_scorers: [], top_wicket_takers: [] } })),
    ])
      .then(([players, top]) => {
        const stats = new Map<string, { runs: number; wickets: number; matches: number; name: string }>()
        const runScorers: any[] = ((top as any)?.data?.top_run_scorers ?? [])
        const wicketTakers: any[] = ((top as any)?.data?.top_wicket_takers ?? [])
        runScorers.forEach((r) => {
          stats.set(r.player_id, {
            name: r.player_name,
            runs: r.total_runs ?? 0,
            wickets: stats.get(r.player_id)?.wickets ?? 0,
            matches: r.matches_played ?? 0,
          })
        })
        wicketTakers.forEach((w) => {
          const existing = stats.get(w.player_id)
          stats.set(w.player_id, {
            name: w.player_name,
            runs: existing?.runs ?? 0,
            wickets: w.total_wickets ?? 0,
            matches: Math.max(existing?.matches ?? 0, w.matches_played ?? 0),
          })
        })
        const byId = new Map<string, PlayerRow>()
        players.forEach((p) => {
          const s = stats.get(p.id)
          byId.set(p.id, {
            player_id: p.id,
            name: p.name,
            email: p.email,
            role: p.playing_role ?? p.role ?? null,
            approved: p.approved,
            total_runs: s?.runs ?? 0,
            total_wickets: s?.wickets ?? 0,
            matches: s?.matches ?? 0,
          })
        })
        stats.forEach((s, id) => {
          if (!byId.has(id)) {
            byId.set(id, { player_id: id, name: s.name, approved: true, total_runs: s.runs, total_wickets: s.wickets, matches: s.matches })
          }
        })
        setRows(Array.from(byId.values()).sort((a, b) => b.total_runs - a.total_runs))
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => rows.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return r.name.toLowerCase().includes(q) || (r.email ?? '').toLowerCase().includes(q)
  }), [rows, search])

  const columns: ReportColumn<PlayerRow>[] = [
    { header: 'Name',           accessor: 'name' },
    { header: 'Email',          accessor: (r) => r.email ?? '—' },
    { header: 'Role',           accessor: (r) => r.role ?? '—' },
    { header: 'Approved',       accessor: (r) => (r.approved ? 'Yes' : 'No') },
    { header: 'Matches',        accessor: 'matches' },
    { header: 'Total Runs',     accessor: 'total_runs' },
    { header: 'Total Wickets',  accessor: 'total_wickets' },
  ]

  return (
    <ReportShell
      title="Player report"
      subtitle={`${filtered.length} of ${rows.length} players`}
      filename="players_report"
      columns={columns}
      rows={filtered}
      loading={loading}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity / Audit log
// ─────────────────────────────────────────────────────────────────────────────

function ActivityReport({ range, search }: { range: DateRange; search: string }) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')

  useEffect(() => {
    setLoading(true)
    UserAdmin.auditLogs({ limit: 500, action: action || undefined })
      .then((r) => setLogs((r as any)?.data ?? []))
      .catch(() => toast.error('Failed to load audit logs'))
      .finally(() => setLoading(false))
  }, [action])

  const rows = useMemo(() => logs.filter((l) => {
    if (!inRange(l.created_at, range)) return false
    if (search) {
      const q = search.toLowerCase()
      return [l.action, l.entity_type, l.entity_id, l.actor?.name, l.actor?.email]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    }
    return true
  }), [logs, range, search])

  const columns: ReportColumn<AuditLogEntry>[] = [
    { header: 'When',   accessor: (r) => new Date(r.created_at).toLocaleString() },
    { header: 'Actor',  accessor: (r) => r.actor?.name ?? 'system' },
    { header: 'Email',  accessor: (r) => r.actor?.email ?? '—' },
    { header: 'Role',   accessor: (r) => r.actor?.role ?? '—' },
    { header: 'Action', accessor: 'action' },
    { header: 'Entity', accessor: 'entity_type' },
    { header: 'Entity ID', accessor: (r) => r.entity_id.slice(0, 12) },
    { header: 'IP',     accessor: (r) => r.ip_address ?? '—' },
  ]

  return (
    <ReportShell
      title="Activity / audit log"
      filename="audit_log"
      columns={columns}
      rows={rows}
      loading={loading}
      filterChips={
        <Input
          placeholder="Filter by action (e.g. user.create)"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="w-[220px] h-9"
        />
      }
    />
  )
}
