"use client"

import type React from "react"

import { useAuth0 } from "@/lib/auth0-provider"
import type { UserRole } from "@/lib/rbac/permissions"
import { hasAuth0Role } from "@/lib/rbac/permissions"

interface RoleGateProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
  const { user } = useAuth0()
  const userRole = user?.role as UserRole | undefined
  const auth0Roles = user?.roles

  // Check Auth0 roles first
  const hasAuth0RoleMatch = allowedRoles.some(role => hasAuth0Role(auth0Roles, role))
  
  // Fall back to legacy role check
  const hasLegacyRoleMatch = userRole && allowedRoles.includes(userRole)

  if (!hasAuth0RoleMatch && !hasLegacyRoleMatch) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
