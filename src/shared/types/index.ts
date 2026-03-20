/**
 * Shared types used across multiple features
 */

export type UserRole = 'admin' | 'doctor' | 'assistant' | 'staff';

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
