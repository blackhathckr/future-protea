/**
 * @fileoverview Roles & Permissions page — list system + custom roles, create new,
 * edit permissions, assign permissions, view users on each role.
 */

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Shield, Plus, Edit, Trash2, Users as UsersIcon, KeyRound } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { PageHero } from '@/components/cricket/PageHero'
import { RoleAdmin } from '@/services/admin/admin-core.service'
import type { RoleConfig, Permission } from '@/types/admin-core.types'
import { toast } from 'sonner'
import { confirm } from '@/lib/confirm'
import { cn } from '@/lib/utils'

export function RolesPermissionsPage() {
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<RoleConfig[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<RoleConfig | null>(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [r, p] = await Promise.all([
        RoleAdmin.listRoles().catch(() => ({ data: [] as RoleConfig[] })),
        RoleAdmin.listPermissions().catch(() => ({ data: [] as Permission[] })),
      ])
      const roleList = (r as any)?.data ?? []
      setRoles(roleList)
      setPermissions((p as any)?.data ?? [])
      if (roleList.length > 0 && !selectedRoleId) setSelectedRoleId(roleList[0].id)
    } catch { toast.error('Failed to load roles') }
    finally { setLoading(false) }
  }

  const selectedRole = useMemo(() => roles.find((r) => r.id === selectedRoleId) ?? null, [roles, selectedRoleId])

  const handleDelete = async (role: RoleConfig) => {
    if (role.is_system) return toast.error('Cannot delete a system role')
    const ok = await confirm({ title: `Delete the "${role.name}" role?`, description: 'Users assigned this role will need to be reassigned.', confirmLabel: 'Delete' })
    if (!ok) return
    try { await RoleAdmin.deleteRole(role.id); toast.success('Role deleted'); load() }
    catch { toast.error('Failed to delete role') }
  }

  if (loading) return <div className="flex items-center justify-center h-96"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHero
        title="Roles & Permissions"
        description={`${roles.length} roles · ${permissions.length} permissions across the system.`}
        icon={Shield}
        variant="slate"
        actions={
          <Button onClick={() => setCreateOpen(true)} className="bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/30">
            <Plus className="mr-2 h-4 w-4" /> New Role
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
        {/* Role list */}
        <Card>
          <CardHeader><CardTitle className="text-base">Roles</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {roles.map((r) => (
                <li
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={cn(
                    'p-3 cursor-pointer flex items-center justify-between transition-colors',
                    selectedRoleId === r.id ? 'bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-500 pl-2' : 'hover:bg-accent',
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-semibold capitalize truncate flex items-center gap-2">
                      {r.name}
                      {r.is_system && <Badge variant="outline" className="text-[9px] uppercase">System</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{r.user_count} users · {r.permissions.length} permissions</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Role detail */}
        {selectedRole ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="capitalize text-xl">{selectedRole.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{selectedRole.description || 'No description provided'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditing(selectedRole)}>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedRole)} disabled={selectedRole.is_system}>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4 text-sm">
                <Stat label="Users" value={selectedRole.user_count} icon={UsersIcon} />
                <Stat label="Permissions" value={selectedRole.permissions.length} icon={KeyRound} />
                <Stat label="Max users" value={selectedRole.max_users ?? '—'} icon={Shield} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Permissions</CardTitle></CardHeader>
              <CardContent>
                {selectedRole.permissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No permissions granted. Edit the role to assign permissions.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {selectedRole.permissions.map((p) => (
                      <div key={p.id} className="rounded-md border bg-muted/30 p-2.5">
                        <p className="text-sm font-mono">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground capitalize">{p.resource} · {p.action}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Select a role to manage</CardContent></Card>
        )}
      </div>

      <RoleFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        permissions={permissions}
        mode="create"
        onSaved={() => { setCreateOpen(false); load() }}
      />
      <RoleFormDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        permissions={permissions}
        mode="edit"
        role={editing}
        onSaved={() => { setEditing(null); load() }}
      />
    </motion.div>
  )
}

function Stat({ label, value, icon: Icon }: { label: string; value: any; icon: any }) {
  return (
    <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
      <Icon className="h-5 w-5 text-emerald-600" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-black tabular-nums">{value}</p>
      </div>
    </div>
  )
}

interface RoleFormProps { open: boolean; onOpenChange: (v: boolean) => void; permissions: Permission[]; mode: 'create' | 'edit'; role?: RoleConfig | null; onSaved: () => void }

function RoleFormDialog({ open, onOpenChange, permissions, mode, role, onSaved }: RoleFormProps) {
  const [form, setForm] = useState({ name: '', description: '', maxUsers: '' as string | number, permissions: [] as string[] })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && mode === 'edit' && role) {
      setForm({
        name: role.name,
        description: role.description ?? '',
        maxUsers: role.max_users ?? '',
        permissions: role.permissions.map((p) => p.id),
      })
    }
    if (open && mode === 'create') {
      setForm({ name: '', description: '', maxUsers: '', permissions: [] })
    }
  }, [open, mode, role])

  const togglePerm = (id: string) => setForm((f) => ({
    ...f,
    permissions: f.permissions.includes(id) ? f.permissions.filter((p) => p !== id) : [...f.permissions, id],
  }))

  const byResource = useMemo(() => {
    const groups: Record<string, Permission[]> = {}
    permissions.forEach((p) => { groups[p.resource] = groups[p.resource] ?? []; groups[p.resource]!.push(p) })
    return groups
  }, [permissions])

  const handleSave = async () => {
    setSaving(true)
    try {
      const maxUsersN = form.maxUsers === '' ? null : Number(form.maxUsers)
      if (mode === 'create') {
        if (!form.name) { toast.error('Name is required'); return }
        await RoleAdmin.createRole({ name: form.name, description: form.description, maxUsers: maxUsersN ?? undefined, permissions: form.permissions })
        toast.success('Role created')
      } else if (role) {
        await RoleAdmin.updateRole(role.id, { description: form.description, maxUsers: maxUsersN, permissions: form.permissions })
        toast.success('Role updated')
      }
      onSaved()
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || 'Failed to save role')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>{mode === 'create' ? 'Create role' : `Edit ${role?.name}`}</DialogTitle></DialogHeader>
        <div className="grid gap-3 py-2 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} disabled={mode === 'edit'} onChange={(e) => setForm({ ...form, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })} placeholder="e.g. tournament_organiser" />
            </div>
            <div className="space-y-1.5">
              <Label>Max users (optional)</Label>
              <Input type="number" value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: e.target.value })} placeholder="Unlimited" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Permissions ({form.permissions.length} selected)</Label>
            {Object.entries(byResource).map(([resource, perms]) => (
              <div key={resource} className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wider font-bold mb-2">{resource}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {perms.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent/40 rounded px-1.5 py-1">
                      <input type="checkbox" checked={form.permissions.includes(p.id)} onChange={() => togglePerm(p.id)} />
                      <span className="font-mono text-xs">{p.action}</span>
                      {p.description && <span className="text-[10px] text-muted-foreground truncate">{p.description}</span>}
                    </label>
                  ))}
                </div>
              </div>
            ))}
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
