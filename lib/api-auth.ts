import type { UserRole, Permission } from "./rbac/permissions"
import { hasPermission } from "./rbac/permissions"

export interface ApiUserContext {
  userId: string
  userRole?: UserRole
  customPermissions?: Permission[]
  roles?: Array<{
    id: string
    name: string
    description: string
    assignment: string
  }>
  permissions?: Array<{
    id: string
    name: string
    description: string
    assignment: string
  }>
}

// User switcher functionality removed - using Auth0 sessions only

// Permission checking moved to individual API routes using Auth0 sessions

// Mock session functionality removed - using Auth0 sessions only

// All API authentication middleware removed - using Auth0 sessions only
