import type { UserRole, Permission } from "@/lib/rbac/permissions"
import type { UserRoleAssignment, UserPermissionAssignment } from "@/lib/auth0-management"

export interface User {
  id: string
  email: string
  name: string
  status: "active" | "blocked"
  createdAt: string
  updatedAt?: string
  lastLogin?: string
  lastLoginAt?: string
  picture?: string
  blocked?: boolean
  emailVerified?: boolean
  roles: UserRoleAssignment[]
  permissions: UserPermissionAssignment[]
}

export interface CreateUserData {
  email: string
  name: string
  password: string
  picture?: string
  emailVerified?: boolean
}

export interface UpdateUserData {
  email?: string
  name?: string
  password?: string
  blocked?: boolean
  picture?: string
  emailVerified?: boolean
  roles?: string[]
}
