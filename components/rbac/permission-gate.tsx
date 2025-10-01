"use client"

import type React from "react"

import { useUser } from "@/lib/mock-auth/mock-auth-provider"
import type { Permission, UserRole } from "@/lib/rbac/permissions"
import { hasPermission } from "@/lib/rbac/permissions"

interface PermissionGateProps {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { user } = useUser()
  const userRole = user?.role as UserRole | undefined
  const customPermissions = user?.customPermissions as Permission[] | undefined

  if (!hasPermission(userRole, permission, customPermissions)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
