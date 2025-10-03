/**
 * Zod validation schemas for the RBAC application
 */

import { z } from 'zod'
import { UserStatus, PermissionCategory, UserRole } from '../types'

// ===== BASE SCHEMAS =====

export const emailSchema = z.string().email('Invalid email format')
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')
export const nameSchema = z.string().min(1, 'Name is required').max(100, 'Name too long')
export const descriptionSchema = z.string().max(500, 'Description too long')

// ===== ENUM SCHEMAS =====

export const userStatusSchema = z.nativeEnum(UserStatus)
export const permissionCategorySchema = z.nativeEnum(PermissionCategory)
export const userRoleSchema = z.nativeEnum(UserRole)

// ===== USER SCHEMAS =====

export const createUserSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  password: passwordSchema,
  roles: z.array(z.string()).optional(),
  picture: z.string().url().optional(),
  emailVerified: z.boolean().optional().default(false)
})

export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  picture: z.string().url().optional(),
  emailVerified: z.boolean().optional(),
  status: userStatusSchema.optional(),
  roles: z.array(z.string()).optional()
})

export const userQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  status: userStatusSchema.optional(),
  role: z.string().optional(),
  sortBy: z.enum(['name', 'email', 'createdAt', 'lastLogin']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  includeInactive: z.coerce.boolean().optional().default(false)
})

// ===== ROLE SCHEMAS =====

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(50, 'Role name too long'),
  description: descriptionSchema,
  permissions: z.array(z.string()).optional()
})

export const updateRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(50, 'Role name too long').optional(),
  description: descriptionSchema.optional(),
  permissions: z.array(z.string()).optional()
})

// ===== PERMISSION SCHEMAS =====

export const createPermissionSchema = z.object({
  name: z.string().min(1, 'Permission name is required').max(100, 'Permission name too long'),
  description: descriptionSchema,
  resourceServerIdentifier: z.string().min(1, 'Resource server identifier is required'),
  category: permissionCategorySchema
})

// ===== BULK OPERATION SCHEMAS =====

export const bulkUserOperationSchema = z.object({
  action: z.enum(['bulk-create', 'bulk-update', 'bulk-delete', 'export']),
  userIds: z.array(z.string()).optional(),
  data: z.record(z.any()).optional(),
  filters: z.record(z.any()).optional()
})

export const bulkCreateUsersSchema = z.object({
  users: z.array(createUserSchema).min(1, 'At least one user is required').max(100, 'Too many users')
})

export const bulkUpdateUsersSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user ID is required'),
  data: updateUserSchema
})

export const bulkDeleteUsersSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user ID is required')
})

// ===== EXPORT SCHEMAS =====

export const exportUsersSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'json']).default('csv'),
  fields: z.array(z.string()).optional(),
  filters: z.record(z.any()).optional()
})

// ===== AUTH SCHEMAS =====

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// ===== PAGINATION SCHEMAS =====

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

// ===== VALIDATION UTILITIES =====

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
      throw new Error(`Validation failed: ${JSON.stringify(validationErrors)}`)
    }
    throw error
  }
}

export function validateQuery<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams): T {
  const params = Object.fromEntries(searchParams.entries())
  return validateRequest(schema, params)
}

// ===== TYPE INFERENCE =====

export type CreateUserRequest = z.infer<typeof createUserSchema>
export type UpdateUserRequest = z.infer<typeof updateUserSchema>
export type UserQuery = z.infer<typeof userQuerySchema>
export type CreateRoleRequest = z.infer<typeof createRoleSchema>
export type UpdateRoleRequest = z.infer<typeof updateRoleSchema>
export type CreatePermissionRequest = z.infer<typeof createPermissionSchema>
export type BulkUserOperation = z.infer<typeof bulkUserOperationSchema>
export type ExportUsersRequest = z.infer<typeof exportUsersSchema>
export type LoginRequest = z.infer<typeof loginSchema>
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>
export type PaginationQuery = z.infer<typeof paginationSchema>
