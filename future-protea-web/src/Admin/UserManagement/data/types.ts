/**
 * @fileoverview User Management data types and form schemas
 * @module Admin/UserManagement/data/types
 */

import { z } from 'zod';
import type {
  AdminUserFilters,
  CreateUserRequest,
  BulkUploadRow,
  BulkUploadResult,
  Permission,
  RoleWithPermissions,
} from '@/types/admin.types';
import type { User, UserRole, UserStatus } from '@/types/auth.types';

// ── Re-exports ─────────────────────────────────────────────
export type {
  AdminUserFilters,
  CreateUserRequest,
  BulkUploadRow,
  BulkUploadResult,
  Permission,
  RoleWithPermissions,
  User,
  UserRole,
  UserStatus,
};

// ── Filter state ───────────────────────────────────────────
export interface UserFiltersState {
  search: string;
  role: string;
  status: string;
  page: number;
  limit: number;
}

// ── Form Schemas ───────────────────────────────────────────
const nameRegex = /^[a-zA-Z\s.\-]+$/;

export const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100)
    .regex(nameRegex, 'Only letters, spaces, dots, and hyphens allowed'),
  lastName: z.string().min(1, 'Last name is required').max(100)
    .regex(nameRegex, 'Only letters, spaces, dots, and hyphens allowed'),
  email: z.string().email('Valid email is required'),
  phone: z.string()
    .optional()
    .refine(
      (val) => !val || /^\d{10,15}$/.test(val),
      'Phone number must be between 10 to 15 digits'
    ),
  role: z.string().min(1, 'Role is required'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DEACTIVATED', 'BLOCKED', 'PENDING_VERIFICATION']).default('ACTIVE'),
  deactivationReason: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(50)
    .regex(/^[A-Z_]+$/, 'Role name must be uppercase letters and underscores only (e.g. CONTENT_REVIEWER)'),
  description: z.string()
    .max(250, 'Description must not exceed 250 characters')
    .optional(),
  maxUsers: z.preprocess(
    (val) => (val === '' || val === undefined || val === null || Number.isNaN(val) ? undefined : Number(val)),
    z.number().int().min(1, 'Must be at least 1').optional(),
  ),
  permissions: z.array(z.string()).default([]),
});

export type CreateRoleFormValues = z.infer<typeof createRoleSchema>;

// ── Bulk upload parsed row ─────────────────────────────────
export interface ParsedBulkRow extends BulkUploadRow {
  rowIndex: number;
  isValid: boolean;
}

// ── Permission grid ────────────────────────────────────────
export interface PermissionGridItem {
  resource: string;
  actions: {
    action: string;
    permissionId: string;
    checked: boolean;
  }[];
}

// ── Animation Variants ─────────────────────────────────────
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
} as const;

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
} as const;
