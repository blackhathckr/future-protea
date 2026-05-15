/**
 * @fileoverview User Management page — list, search, filter, edit, delete users.
 * Backed by /api/users via UserAdmin service.
 */

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { UserPlus, Search, Edit, Trash2, ShieldCheck, ShieldOff, Users, Filter } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { PageHero } from '@/components/cricket/PageHero'
import { UserAdmin, RoleAdmin } from '@/services/admin/admin-core.service'
import type { AdminUser, RoleConfig } from '@/types/admin-core.types'
import { toast } from 'sonner'
import { confirm } from '@/lib/confirm'

export function UserManagementPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [roles, setRoles] = useState<RoleConfig[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const [u, r] = await Promise.all([
        UserAdmin.list({ limit: 200 }).catch(() => ({ data: [] as AdminUser[] })),
        RoleAdmin.listRoles().catch(() => ({ data: [] as RoleConfig[] })),
      ])
      setUsers((u as any)?.data ?? [])
      setRoles((r as any)?.data ?? [])
    } catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }

  const filtered = useMemo(() => users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (statusFilter === 'approved' && !u.approved) return false
    if (statusFilter === 'pending' && u.approved) return false
    if (search) {
      const q = search.toLowerCase()
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    }
    return true
  }), [users, roleFilter, statusFilter, search])

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Delete this user?', description: 'This cannot be undone.', confirmLabel: 'Delete' })
    if (!ok) return
    try {
      await UserAdmin.remove(id)
      toast.success('User deleted')
      load()
    } catch { toast.error('Failed to delete user') }
  }

  const handleToggleApproval = async (u: AdminUser) => {
    try {
      await UserAdmin.update(u.id, { approved: !u.approved } as any)
      toast.success(u.approved ? 'Approval revoked' : 'User approved')
      load()
    } catch { toast.error('Failed to update user') }
  }

  if (loading) return <div className="flex items-center justify-center h-96"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHero
        title="User Management"
        description={`${users.length} total · ${users.filter((u) => u.approved).length} approved · ${users.filter((u) => !u.approved).length} pending`}
        icon={Users}
        variant="slate"
        actions={
          <Button onClick={() => setCreateOpen(true)} className="bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/30">
            <UserPlus className="mr-2 h-4 w-4" /> Add User
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {roles.map((r) => <SelectItem key={r.id} value={r.name} className="capitalize">{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-center p-3">Status</th>
                  <th className="text-left p-3">Phone</th>
                  <th className="text-left p-3">Joined</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="p-12 text-center text-sm text-muted-foreground">No users match the filters</td></tr>
                ) : filtered.map((u) => (
                  <tr key={u.id} className="border-t hover:bg-accent/40">
                    <td className="p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {u.photo_url ? (
                          <img src={u.photo_url} className="h-9 w-9 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-500 to-rose-500 text-white text-xs font-bold flex items-center justify-center">{u.name.charAt(0).toUpperCase()}</div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{u.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3"><Badge variant="outline" className="capitalize">{u.role}</Badge></td>
                    <td className="p-3 text-center">
                      {u.approved ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px]">APPROVED</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">PENDING</Badge>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">{u.phone || '—'}</td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" title={u.approved ? 'Revoke approval' : 'Approve'} onClick={() => handleToggleApproval(u)}>
                          {u.approved ? <ShieldOff className="h-3.5 w-3.5 text-amber-600" /> : <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(u)} title="Edit">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => handleDelete(u.id)} title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <UserFormDialog open={createOpen} onOpenChange={setCreateOpen} roles={roles} mode="create" onSaved={load} />
      <UserFormDialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)} roles={roles} mode="edit" user={editing} onSaved={() => { setEditing(null); load() }} />
    </motion.div>
  )
}

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  roles: RoleConfig[]
  mode: 'create' | 'edit'
  user?: AdminUser | null
  onSaved: () => void
}

function UserFormDialog({ open, onOpenChange, roles, mode, user, onSaved }: UserFormDialogProps) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'player', phone: '', approved: true })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (mode === 'edit' && user) setForm({ name: user.name, email: user.email, password: '', role: user.role, phone: user.phone ?? '', approved: user.approved })
    if (mode === 'create' && open) setForm({ name: '', email: '', password: '', role: 'player', phone: '', approved: true })
  }, [mode, user, open])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (mode === 'create') {
        if (!form.name || !form.email || !form.password) { toast.error('Name, email and password are required'); return }
        await UserAdmin.create(form as any)
        toast.success('User created')
      } else if (user) {
        const patch: any = { name: form.name, role: form.role, phone: form.phone, approved: form.approved }
        if (form.password) patch.password = form.password
        await UserAdmin.update(user.id, patch)
        toast.success('User updated')
      }
      onSaved()
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || 'Failed to save user')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{mode === 'create' ? 'Add User' : `Edit ${user?.name}`}</DialogTitle></DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Email *</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={mode === 'edit'} />
          </div>
          <div className="space-y-1.5">
            <Label>Password {mode === 'edit' && <span className="text-xs text-muted-foreground">(leave blank to keep)</span>}</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => <SelectItem key={r.id} value={r.name} className="capitalize">{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.approved} onChange={(e) => setForm({ ...form, approved: e.target.checked })} />
            Approved
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
