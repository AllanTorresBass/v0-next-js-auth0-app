import { getSession } from "@/lib/mock-auth/mock-session"
import type { UserRole } from "./rbac/permissions"

export async function getServerSession() {
  return await getSession()
}

export interface Auth0User {
  sub: string
  email: string
  name: string
  picture?: string
  role?: UserRole
}

export async function getCurrentUser(): Promise<Auth0User | null> {
  const session = await getSession()
  return session?.user as Auth0User | null
}
