"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { UserRole, Permission } from "@/lib/rbac/permissions"

interface MockUser {
  sub: string
  email: string
  name: string
  picture?: string
  role?: UserRole
  email_verified?: boolean
  updated_at?: string
  customPermissions?: Permission[]
}

interface MockAuthContextType {
  user: MockUser | undefined
  error: Error | undefined
  isLoading: boolean
  switchUser: (userId: string) => void
}

const MockAuthContext = createContext<MockAuthContextType>({
  user: undefined,
  error: undefined,
  isLoading: true,
  switchUser: () => {},
})

const MOCK_USERS: Record<string, MockUser> = {
  admin: {
    sub: "auth0|admin123",
    email: "allaneduar80@gmail.com",
    name: "Allan Torres",
    picture: "/admin-avatar.png",
    role: "admin",
    email_verified: true,
    updated_at: new Date().toISOString(),
    customPermissions: [
      "users:read",
      "users:create",
      "users:update",
      "users:delete",
      "dashboard:view_all",
      "reports:view",
      "reports:create",
      "settings:manage",
    ],
  },
  client: {
    sub: "auth0|client123",
    email: "storres@podetic.com",
    name: "Client User",
    picture: "/client-avatar.png",
    role: "client",
    email_verified: false,
    updated_at: new Date().toISOString(),
    customPermissions: ["dashboard:view_own"],
  },
  marketing_senior: {
    sub: "auth0|marketing123",
    email: "storres@podertechnology.com",
    name: "Joker User",
    picture: "/marketing-avatar.png",
    role: "marketing_senior",
    email_verified: false,
    updated_at: new Date().toISOString(),
    customPermissions: [
      "users:read",
      "users:create",
      "users:update",
      "dashboard:view_all",
      "reports:create",
      "settings:manage",
    ],
  },
  sales_senior: {
    sub: "auth0|sales_senior123",
    email: "alan@webtixpro.com",
    name: "Webtixpro AT",
    picture: "/sales-avatar.png",
    role: "sales_senior",
    email_verified: false,
    updated_at: new Date().toISOString(),
    customPermissions: [
      "users:read",
      "reports:view_all",
      "reports:create",
      "dashboard:view_all",
      "users:create",
      "users:delete",
    ],
  },
  sales_junior: {
    sub: "auth0|sales_junior123",
    email: "tjeniorcapote@gmail.com",
    name: "Sale person Junior",
    picture: "/sales-junior-avatar.png",
    role: "sales_junior",
    email_verified: false,
    updated_at: new Date().toISOString(),
    customPermissions: ["dashboard:view_own", "reports:view"],
  },
}

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState<string>("admin")
  const [user, setUser] = useState<MockUser | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading user session
    const timer = setTimeout(() => {
      setUser(MOCK_USERS[currentUserId])
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [currentUserId])

  const switchUser = (userId: string) => {
    if (MOCK_USERS[userId]) {
      setIsLoading(true)
      setCurrentUserId(userId)
    }
  }

  return (
    <MockAuthContext.Provider value={{ user, error: undefined, isLoading, switchUser }}>
      {children}
    </MockAuthContext.Provider>
  )
}

export function useUser() {
  return useContext(MockAuthContext)
}

export { MOCK_USERS }
