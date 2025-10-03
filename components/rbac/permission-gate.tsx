"use client"

import type React from "react"

import { useAuth0 } from "@/lib/auth0-provider"
import type { Permission, UserRole } from "@/lib/rbac/permissions"
import { hasPermission } from "@/lib/rbac/permissions"

interface PermissionGateProps {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { user } = useAuth0()
  const userRole = user?.role as UserRole | undefined
  const customPermissions = user?.customPermissions as Permission[] | undefined
  const auth0Permissions = user?.permissions

  if (!hasPermission(userRole, permission, customPermissions, auth0Permissions)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
