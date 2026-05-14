import { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Bell, Loader2 } from 'lucide-react';
import { LoadingState } from '../loading-state';
import { EmptyState } from '../empty-state';
import { useProfileQuery, useUpdateNotificationPreferencesMutation } from '../../hooks';
import type { NotificationPreferences } from '../../data/types';

const NOTIFICATION_ITEMS: Array<{
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}> = [
  {
    key: 'emailNotifications',
    label: 'Email Notifications',
    description: 'Receive notifications via email',
  },
  {
    key: 'smsNotifications',
    label: 'SMS Notifications',
    description: 'Receive notifications via SMS',
  },
  {
    key: 'inAppNotifications',
    label: 'In-App Notifications',
    description: 'Show notifications within the application',
  },
  {
    key: 'pushNotifications',
    label: 'Push Notifications',
    description: 'Receive browser push notifications',
  },
  {
    key: 'systemAlerts',
    label: 'System Alerts',
    description: 'Get notified about system events and issues',
  },
  {
    key: 'securityAlerts',
    label: 'Security Alerts',
    description: 'Get notified about security-related events',
  },
  {
    key: 'weeklyDigest',
    label: 'Weekly Digest',
    description: 'Receive a weekly summary email',
  },
];

export const NotificationsTab = memo(function NotificationsTab() {
  const { data: profile, isLoading, isError } = useProfileQuery();
  const updateMutation = useUpdateNotificationPreferencesMutation();

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    smsNotifications: false,
    inAppNotifications: true,
    pushNotifications: true,
    systemAlerts: true,
    securityAlerts: true,
    weeklyDigest: false,
  });

  useEffect(() => {
    if (profile) {
      // Profile may contain notification prefs as a nested object
      setPreferences((prev) => ({ ...prev }));
    }
  }, [profile]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    updateMutation.mutate(preferences);
  };

  if (isLoading) {
    return <LoadingState message="Loading preferences..." />;
  }

  if (isError) {
    return <EmptyState title="Error" message="Failed to load preferences." />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Choose how you want to receive notifications.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {NOTIFICATION_ITEMS.map((item, index) => (
            <div key={item.key}>
              <div className="flex items-center justify-between py-3">
                <div className="space-y-0.5">
                  <Label htmlFor={item.key} className="text-sm font-medium">
                    {item.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <Switch
                  id={item.key}
                  checked={preferences[item.key]}
                  onCheckedChange={() => handleToggle(item.key)}
                />
              </div>
              {index < NOTIFICATION_ITEMS.length - 1 && <Separator />}
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
