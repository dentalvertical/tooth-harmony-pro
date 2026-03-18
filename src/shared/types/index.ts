/**
 * Shared types used across multiple features
 */

export type UserRole = 'admin' | 'doctor' | 'assistant';

export interface User {
  email: string;
  role: UserRole;
  clinicId: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type EntityStatus = 'active' | 'archived' | 'deleted';
