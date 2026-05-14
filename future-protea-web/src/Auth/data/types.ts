/**
 * @fileoverview Auth Types & Animation Variants
 * @module Auth/data/types
 *
 * @description
 * Type definitions for the authentication flow including step management,
 * role selection, and shared animation variants.
 *
 * Translation namespace: "auth"
 */

/** Authentication flow steps */
export type AuthStep = 'email' | 'otp';

/** Role options for sign-in selection */
export interface RoleOption {
  id: 'admin' | 'manager' | 'coach' | 'player';
  labelKey: string;
  descriptionKey: string;
  icon: string;
}

/** Container animation variant for staggered children */
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
} as const;

/** Item animation variant for spring-based entry */
export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
} as const;

/** Slide-in animation variant for step transitions */
export const slideVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
} as const;

/** Floating background shape animation */
export const floatingVariants = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.3, 0.5, 0.3],
  },
  transition: {
    duration: 8,
    repeat: Infinity,
  },
} as const;
