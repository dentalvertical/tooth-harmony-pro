/**
 * Shared types used across multiple features
 */

export type UserRole = 'superuser' | 'administrator' | 'doctor';

export interface User {
  id?: string;
  email: string;
  role: UserRole;
  clinicId: string;
  fullName?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type EntityStatus = 'active' | 'archived' | 'deleted';
