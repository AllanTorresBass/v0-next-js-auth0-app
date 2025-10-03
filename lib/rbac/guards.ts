import { auth0 } from "@/lib/auth0"
import { redirect } from "next/navigation"
import type { Permission, UserRole } from "./permissions"
import { hasPermission, hasAnyPermission, hasAllPermissions } from "./permissions"


export async function requireAuth() {
  // For now, always redirect to user switcher in development
  // This bypasses the traditional Auth0 login process
  redirect("/auth/login")
}

export async function requirePermission(permission: Permission) {
  const session = await requireAuth()
  const userRole = session.user.role as UserRole | undefined
  const customPermissions = session.user.customPermissions as Permission[] | undefined

  if (!hasPermission(userRole, permission, customPermissions)) {
    redirect("/unauthorized")
  }

  return session
}

export async function requireAnyPermission(permissions: Permission[]) {
  const session = await requireAuth()
  const userRole = session.user.role as UserRole | undefined
  const customPermissions = session.user.customPermissions as Permission[] | undefined

  if (!hasAnyPermission(userRole, permissions, customPermissions)) {
    redirect("/unauthorized")
  }

  return session
}

export async function requireAllPermissions(permissions: Permission[]) {
  const session = await requireAuth()
  const userRole = session.user.role as UserRole | undefined
  const customPermissions = session.user.customPermissions as Permission[] | undefined

  if (!hasAllPermissions(userRole, permissions, customPermissions)) {
    redirect("/unauthorized")
  }

  return session
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth()
  const userRole = session.user.role as UserRole | undefined

  if (!userRole || !allowedRoles.includes(userRole)) {
    redirect("/unauthorized")
  }

  return session
}

export function getUserRole(session: any): UserRole | undefined {
  return session?.user?.role as UserRole | undefined
}

export function getUserPermissions(session: any): Permission[] | undefined {
  return session?.user?.customPermissions as Permission[] | undefined
}
