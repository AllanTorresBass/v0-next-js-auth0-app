"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useUser as useAuth0User } from "@auth0/nextjs-auth0"
import type { UserRole, Permission } from "./rbac/permissions"
import type { UserRoleAssignment, UserPermissionAssignment } from "./auth0-management"

interface EnhancedUser {
  sub: string
  email?: string
  name?: string
  picture?: string
  role?: UserRole
  customPermissions?: Permission[]
  roles?: UserRoleAssignment[]
  permissions?: UserPermissionAssignment[]
}

interface Auth0ContextType {
  user: EnhancedUser | undefined
  error: Error | undefined
  isLoading: boolean
  login: () => void
  logout: () => void
}

const Auth0Context = createContext<Auth0ContextType>({
  user: undefined,
  error: undefined,
  isLoading: true,
  login: () => {},
  logout: () => {},
})

export function useAuth0() {
  return useContext(Auth0Context)
}

export function Auth0Provider({ children }: { children: React.ReactNode }) {
  const { user: auth0User, error: auth0Error, isLoading: auth0Loading } = useAuth0User()
  const [user, setUser] = useState<EnhancedUser | undefined>(undefined)
  const [error, setError] = useState<Error | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true)
        setError(undefined)

        if (!auth0User) {
          setUser(undefined)
          setIsLoading(false)
          return
        }

        // Fetch roles and permissions for the user
        const [rolesResponse, permissionsResponse] = await Promise.all([
          fetch(`/api/users/${encodeURIComponent(auth0User.sub)}/roles`).catch(() => null),
          fetch(`/api/users/${encodeURIComponent(auth0User.sub)}/permissions`).catch(() => null)
        ])

        const roles = rolesResponse?.ok ? await rolesResponse.json() : []
        const permissions = permissionsResponse?.ok ? await permissionsResponse.json() : []

        setUser({
          sub: auth0User.sub,
          email: auth0User.email,
          name: auth0User.name,
          picture: auth0User.picture,
          roles: roles.roles || [],
          permissions: permissions.permissions || []
        })
      } catch (err) {
        console.error('Error fetching user data:', err)
        setError(err as Error)
        setUser(undefined)
      } finally {
        setIsLoading(false)
      }
    }

    if (auth0Loading) {
      setIsLoading(true)
    } else {
      fetchUserData()
    }
  }, [auth0User, auth0Loading])

  const login = () => {
    window.location.href = '/auth/login'
  }

  const logout = () => {
    window.location.href = '/auth/logout'
  }

  return (
    <Auth0Context.Provider value={{ 
      user, 
      error: error || auth0Error, 
      isLoading: isLoading || auth0Loading,
      login,
      logout
    }}>
      {children}
    </Auth0Context.Provider>
  )
}
