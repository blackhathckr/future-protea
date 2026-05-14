import { z } from 'zod';

// ── Animation Variants ──────────────────────────────────────────────────────
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
} as const;

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
} as const;

// ── Profile ──────────────────────────────────────────────────────────────────
export interface AdminProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string | null;
  bio: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  avatar: string | null;
  role: string;
  lastLogin: string;
  createdAt: string;
}

export const profileFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email(),
  phone: z.string().max(15),
  bio: z.string().max(500),
  address: z.string().max(200),
  city: z.string().max(100),
  state: z.string().max(100),
  pincode: z.string().max(10),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

// ── Password ─────────────────────────────────────────────────────────────────
export const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type PasswordFormValues = z.infer<typeof passwordFormSchema>;

// ── Notification Preferences ─────────────────────────────────────────────────
export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  inAppNotifications: boolean;
  pushNotifications: boolean;
  systemAlerts: boolean;
  securityAlerts: boolean;
  weeklyDigest: boolean;
}

// ── Security Settings ────────────────────────────────────────────────────────
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  loginAlerts: boolean;
}

export interface ActiveSession {
  id: string;
  device: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}

// ── Session Timeout Options ──────────────────────────────────────────────────
export const SESSION_TIMEOUT_OPTIONS = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '4 hours', value: 240 },
] as const;
