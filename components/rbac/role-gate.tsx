"use client"

import type React from "react"

import { useUser } from "@/lib/mock-auth/mock-auth-provider"
import type { UserRole } from "@/lib/rbac/permissions"

interface RoleGateProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
  const { user } = useUser()
  const userRole = user?.role as UserRole | undefined

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
