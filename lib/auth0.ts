import { Auth0Client } from "@auth0/nextjs-auth0/server"
import type { UserRole, Permission } from "./rbac/permissions"
import type { UserRoleAssignment, UserPermissionAssignment } from "./auth0-management"

export const auth0 = new Auth0Client({
  fetch: globalThis.fetch,
  domain: process.env.AUTH0_ISSUER_BASE_URL?.replace('https://', ''),
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET,
  appBaseUrl: process.env.AUTH0_BASE_URL,
  routes: {
    login: '/auth/login',
    logout: '/auth/logout',
    callback: '/auth/callback',
    profile: '/auth/profile',
    accessToken: '/auth/access-token',
    backchannelLogout: '/auth/backchannel-logout'
  }
})

export async function getServerSession(request?: Request) {
  // In App Router API routes, getSession can be called without parameters
  // The session is automatically extracted from the request context
  return await auth0.getSession()
}

export interface Auth0User {
  sub: string
  email: string
  name: string
  picture?: string
  role?: UserRole
  customPermissions?: Permission[]
  // Auth0 roles and permissions
  roles?: UserRoleAssignment[]
  permissions?: UserPermissionAssignment[]
}

export async function getCurrentUser(request: Request): Promise<Auth0User | null> {
  const session = await getSession(request)
  return session?.user as Auth0User | null
}
