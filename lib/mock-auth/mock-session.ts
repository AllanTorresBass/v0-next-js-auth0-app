import type { UserRole } from "@/lib/rbac/permissions"

interface MockSession {
  user: {
    sub: string
    email: string
    name: string
    picture?: string
    role?: UserRole
    email_verified?: boolean
    updated_at?: string
  }
}

// Mock session for server-side - simulates an admin user
export async function getSession(): Promise<MockSession | null> {
  // In preview, always return a mock admin session
  return {
    user: {
      sub: "auth0|mock123456",
      email: "admin@company.com",
      name: "Admin User",
      picture: "/admin-avatar.png",
      role: "admin",
      email_verified: true,
      updated_at: new Date().toISOString(),
    },
  }
}

export async function handleAuth() {
  // Mock auth handler for preview
  return new Response("Mock Auth Handler", { status: 200 })
}
