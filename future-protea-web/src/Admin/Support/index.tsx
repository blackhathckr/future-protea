/**
 * @fileoverview Support admin page — All Tickets view
 * @module Admin/Support
 */

import { motion } from 'framer-motion';
import { AllTicketsTab } from './components';

export function SupportPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold tracking-tight">All Tickets</h2>
        <p className="text-sm text-muted-foreground">
          Manage support tickets, assign to admins, and handle escalations.
        </p>
      </div>
      <AllTicketsTab />
    </motion.div>
  );
}
