/**
 * @fileoverview Roles & Permissions page
 * @module Admin/UserManagement/roles-page
 */

import { motion } from 'framer-motion';
import { RolesPermissionsTab } from './components';

export function RolesPermissionsPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Roles & Permissions</h2>
        <p className="text-sm text-muted-foreground">Manage roles and permission assignments</p>
      </div>
      <RolesPermissionsTab />
    </motion.div>
  );
}
