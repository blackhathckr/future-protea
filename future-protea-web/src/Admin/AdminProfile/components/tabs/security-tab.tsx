import { memo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { LoadingState } from '../loading-state';
import { EmptyState } from '../empty-state';
import {
  useUpdateSecuritySettingsMutation,
  useActiveSessionsQuery,
  useRevokeSessionMutation,
} from '../../hooks';
import { formatLastLogin } from '../../data';
import { SESSION_TIMEOUT_OPTIONS } from '../../data/types';

export const SecurityTab = memo(function SecurityTab() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [loginAlerts, setLoginAlerts] = useState(true);

  const securityMutation = useUpdateSecuritySettingsMutation();
  const {
    data: sessions,
    isLoading: sessionsLoading,
    isError: sessionsError,
    refetch: refetchSessions,
  } = useActiveSessionsQuery();
  const revokeMutation = useRevokeSessionMutation();

  const handleSaveSettings = () => {
    securityMutation.mutate({
      twoFactorEnabled,
      sessionTimeout,
      loginAlerts,
    });
  };

  const handleRevoke = (sessionId: string) => {
    revokeMutation.mutate(sessionId);
  };

  return (
    <div className="space-y-6">
      {/* Security Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure your account security preferences.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Two-Factor Authentication</Label>
              <p className="text-xs text-muted-foreground">
                Add an extra layer of security to your account.
              </p>
              <Badge variant="outline" className={twoFactorEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                {twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={setTwoFactorEnabled}
            />
          </div>

          <Separator />

          {/* Session Timeout */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Session Timeout</Label>
              <p className="text-xs text-muted-foreground">
                Automatically log out after inactivity.
              </p>
            </div>
            <Select
              value={sessionTimeout.toString()}
              onValueChange={(v) => setSessionTimeout(Number(v))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SESSION_TIMEOUT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Login Alerts */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Login Alerts</Label>
              <p className="text-xs text-muted-foreground">
                Get notified when your account is accessed from a new device.
              </p>
            </div>
            <Switch
              checked={loginAlerts}
              onCheckedChange={setLoginAlerts}
            />
          </div>

          <Button onClick={handleSaveSettings} disabled={securityMutation.isPending}>
            {securityMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* Active Sessions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage your active sessions across devices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <LoadingState
              message="Loading sessions..."
              variant="inline"
            />
          ) : sessionsError ? (
            <EmptyState
              title="Error"
              message="Failed to load sessions."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="w-[100px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(sessions ?? []).map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{session.device}</span>
                        {session.isCurrent && (
                          <Badge variant="secondary" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {session.ipAddress}
                    </TableCell>
                    <TableCell>{formatLastLogin(session.lastActive)}</TableCell>
                    <TableCell>
                      {!session.isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRevoke(session.id)}
                          disabled={revokeMutation.isPending}
                        >
                          Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
