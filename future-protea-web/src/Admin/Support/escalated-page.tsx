/**
 * @fileoverview Escalated Tickets page
 * @module Admin/Support/escalated-page
 */

import { motion } from 'framer-motion';
import { EscalatedTab } from './components';

export function EscalatedPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Escalated Tickets</h2>
        <p className="text-sm text-muted-foreground">Review and resolve escalated support tickets</p>
      </div>
      <EscalatedTab />
    </motion.div>
  );
}
