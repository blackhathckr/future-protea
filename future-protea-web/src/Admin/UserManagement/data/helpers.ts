/**
 * @fileoverview User Management helper functions
 * @module Admin/UserManagement/data/helpers
 */

import * as XLSX from 'xlsx';
import type { UserRole, UserStatus, BulkUploadRow } from './types';

/**
 * Returns badge variant class for user status
 */
export function getUserStatusBadgeVariant(status: UserStatus): string {
  const variants: Record<UserStatus, string> = {
    ACTIVE: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400',
    INACTIVE: 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    DEACTIVATED: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    BLOCKED: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400',
    PENDING_VERIFICATION: 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  };
  return variants[status] ?? variants.INACTIVE;
}

/**
 * Returns human-readable status label
 */
export function formatStatus(status: UserStatus): string {
  const labels: Record<UserStatus, string> = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    DEACTIVATED: 'Deactivated',
    BLOCKED: 'Blocked',
    PENDING_VERIFICATION: 'Pending Verification',
  };
  return labels[status] ?? status;
}

/**
 * Returns human-readable role label
 */
export function formatRole(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    EDUCATOR: 'Educator',
    LEARNER: 'Learner',
  };
  return labels[role] ?? role;
}

/**
 * Returns badge variant class for user role
 */
export function getRoleBadgeVariant(role: UserRole): string {
  const variants: Record<UserRole, string> = {
    SUPER_ADMIN: 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    ADMIN: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    EDUCATOR: 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-900/20 dark:text-teal-400',
    LEARNER: 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  };
  return variants[role] ?? variants.LEARNER;
}

/**
 * Validates a single row from the bulk upload CSV
 */
export function validateBulkUploadRow(row: Record<string, string>, rowIndex: number): BulkUploadRow & { isValid: boolean; rowIndex: number } {
  const errors: string[] = [];
  const firstName = row.firstName?.trim() ?? '';
  const lastName = row.lastName?.trim() ?? '';
  const email = row.email?.trim() ?? '';
  // Strip common formatting characters from phone (spaces, dashes, parentheses, dots)
  const storedPhone = row.phone?.trim() ?? '';
  const phone = storedPhone ? storedPhone.replace(/[\s\-().]/g, '') : undefined;
  const storedCountryCode = row.countryCode?.trim() ?? '';
  const countryCode = storedCountryCode || (phone ? '+91' : undefined);
  const role = row.role?.trim().toUpperCase() ?? '';

  if (!firstName) errors.push('First name is required');
  if (firstName.length > 50) errors.push('First name must be 50 characters or less');
  if (!lastName) errors.push('Last name is required');
  if (lastName.length > 50) errors.push('Last name must be 50 characters or less');
  if (!email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email format');
  }
  if (phone && !/^\+?[1-9]\d{9,14}$/.test(phone)) {
    errors.push('Invalid phone format (e.g. 9876543210 or +919876543210)');
  }
  if (countryCode && !/^\+\d{1,4}$/.test(countryCode)) {
    errors.push('Invalid country code (e.g. +91, +1, +44)');
  }
  if (!['SUPER_ADMIN', 'ADMIN', 'EDUCATOR', 'LEARNER'].includes(role)) {
    errors.push('Invalid role. Must be SUPER_ADMIN, ADMIN, EDUCATOR, or LEARNER');
  }

  return {
    firstName,
    lastName,
    email,
    phone,
    countryCode,
    role,
    errors: errors.length > 0 ? errors : undefined,
    isValid: errors.length === 0,
    rowIndex,
  };
}

/**
 * Parse CSV string into array of key-value objects
 */
export function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/"/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = values[i] ?? '';
    });
    return row;
  });
}

/**
 * Parse XLSX/XLS file buffer into array of key-value objects
 */
export function parseXLSX(buffer: ArrayBuffer): Record<string, string>[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  return rows.map((row) => {
    const stringRow: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      stringRow[key] = String(value ?? '').trim();
    }
    return stringRow;
  });
}

/**
 * Generate and download a sample XLSX template for bulk user upload
 */
export function downloadBulkUploadTemplate(): void {
  const sampleData = [
    { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '9876543210', countryCode: '+91', role: 'LEARNER' },
    { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phone: '9876543211', countryCode: '+1', role: 'EDUCATOR' },
  ];
  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
  XLSX.writeFile(workbook, 'bulk-upload-template.xlsx');
}
