/**
 * Central type definitions for the RBAC application
 */

// ===== BASE ENTITIES =====

export interface User {
  id: string
  sub: string
  email: string
  name: string
  picture?: string
  emailVerified: boolean
  status: UserStatus
  createdAt: string
  updatedAt: string
  lastLogin?: string
  roles: Role[]
  permissions: Permission[]
}

export interface Role {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  permissions: Permission[]
  userCount?: number
}

export interface Permission {
  id: string
  name: string
  description: string
  category: PermissionCategory
  resourceServerIdentifier: string
  resourceServerName: string
  createdAt?: string
  updatedAt?: string
}

// ===== ENUMS =====

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

export enum PermissionCategory {
  USERS = 'users',
  DASHBOARD = 'dashboard',
  REPORTS = 'reports',
  SETTINGS = 'settings',
  ROLES = 'roles'
}

export enum UserRole {
  ADMIN = 'admin',
  SALES_SENIOR = 'sales_senior',
  SALES_JUNIOR = 'sales_junior',
  MARKETING_SENIOR = 'marketing_senior',
  MARKETING_JUNIOR = 'marketing_junior',
  CLIENT = 'client'
}

// ===== API REQUEST/RESPONSE TYPES =====

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: PaginationMeta
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// ===== USER OPERATIONS =====

export interface CreateUserRequest {
  email: string
  name: string
  password: string
  roles?: string[]
  picture?: string
  emailVerified?: boolean
}

export interface UpdateUserRequest {
  name?: string
  picture?: string
  emailVerified?: boolean
  status?: UserStatus
  roles?: string[]
}

export interface BulkUserOperation {
  action: 'bulk-create' | 'bulk-update' | 'bulk-delete' | 'export'
  userIds?: string[]
  data?: any
  filters?: Record<string, any>
}

// ===== ROLE OPERATIONS =====

export interface CreateRoleRequest {
  name: string
  description: string
  permissions?: string[]
}

export interface UpdateRoleRequest {
  name?: string
  description?: string
  permissions?: string[]
}

// ===== PERMISSION OPERATIONS =====

export interface CreatePermissionRequest {
  name: string
  description: string
  resourceServerIdentifier: string
  category: PermissionCategory
}

// ===== AUTH0 SPECIFIC TYPES =====

export interface Auth0User {
  user_id: string
  email: string
  name: string
  picture?: string
  email_verified: boolean
  created_at: string
  updated_at: string
  last_login?: string
  app_metadata?: {
    role?: string
    status?: string
  }
  user_metadata?: Record<string, any>
}

export interface Auth0Role {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

export interface Auth0Permission {
  id: string
  name: string
  description: string
  resource_server_identifier: string
  resource_server_name: string
}

// ===== ERROR TYPES =====

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: string
  path: string
}

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  AUTH0_ERROR = 'AUTH0_ERROR'
}

// ===== CONTEXT TYPES =====

export interface UserContext {
  id: string
  email: string
  name: string
  roles: string[]
  permissions: string[]
  isAuthenticated: boolean
}

export interface ApiContext {
  user?: UserContext
  requestId: string
  timestamp: string
}

// ===== UTILITY TYPES =====

export type SortOrder = 'asc' | 'desc'

export interface FilterOptions {
  search?: string
  status?: UserStatus
  role?: string
  dateFrom?: string
  dateTo?: string
}

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json'
  fields?: string[]
  filters?: FilterOptions
}

// ===== COMPONENT PROPS =====

export interface TableColumn<T = any> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: any, item: T) => React.ReactNode
}

export interface TableProps<T = any> {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  error?: string
  pagination?: PaginationMeta
  onSort?: (key: keyof T, order: SortOrder) => void
  onPageChange?: (page: number) => void
}

// ===== HOOK TYPES =====

export interface UseApiResult<T = any> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export interface UsePaginationResult<T = any> {
  data: T[]
  loading: boolean
  error: string | null
  pagination: PaginationMeta | null
  refetch: () => Promise<void>
  loadMore: () => Promise<void>
}
