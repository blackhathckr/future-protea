import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  MonitoringTab,
  MaintenanceTab,
  SystemLogsTab,
  AdminLogsTab,
  UserLogsTab,
  EmailTemplatesTab,
  ReviewConfigTab,
} from './components';

export function SystemSettingsPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Monitor system health, manage maintenance windows, and review logs.
        </p>
      </div>

      <Tabs defaultValue="monitoring" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="system-logs">System Logs</TabsTrigger>
          <TabsTrigger value="admin-logs">Admin Logs</TabsTrigger>
          <TabsTrigger value="user-logs">User Logs</TabsTrigger>
          <TabsTrigger value="email-templates">Email Templates</TabsTrigger>
          <TabsTrigger value="review-config">Review Config</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring">
          <MonitoringTab />
        </TabsContent>

        <TabsContent value="maintenance">
          <MaintenanceTab />
        </TabsContent>

        <TabsContent value="system-logs">
          <SystemLogsTab />
        </TabsContent>

        <TabsContent value="admin-logs">
          <AdminLogsTab />
        </TabsContent>

        <TabsContent value="user-logs">
          <UserLogsTab />
        </TabsContent>

        <TabsContent value="email-templates">
          <EmailTemplatesTab />
        </TabsContent>

        <TabsContent value="review-config">
          <ReviewConfigTab />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
