import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth0"
import { getAllUsers, getUserRoles, getUserPermissions } from "@/lib/auth0-management"
import type { UserRole, Permission } from "@/lib/rbac/permissions"
import { hasPermission } from "@/lib/rbac/permissions"
// Mock functionality removed - using Auth0 sessions only

export async function GET(request: Request) {
  try {
    // Get Auth0 session
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const auth0Users = await getAllUsers()
    
    // Calculate comprehensive statistics
    const stats = {
      overview: {
        total: auth0Users.length,
        active: auth0Users.filter(u => !u.blocked).length,
        blocked: auth0Users.filter(u => u.blocked).length,
        emailVerified: auth0Users.filter(u => u.email_verified).length,
        emailUnverified: auth0Users.filter(u => !u.email_verified).length,
      },
      byRole: {},
      byStatus: {
        active: auth0Users.filter(u => !u.blocked).length,
        blocked: auth0Users.filter(u => u.blocked).length,
      },
      byEmailVerification: {
        verified: auth0Users.filter(u => u.email_verified).length,
        unverified: auth0Users.filter(u => !u.email_verified).length,
      },
      recentActivity: {
        last24Hours: auth0Users.filter(u => {
          const createdAt = new Date(u.created_at)
          const now = new Date()
          const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
          return diffHours <= 24
        }).length,
        last7Days: auth0Users.filter(u => {
          const createdAt = new Date(u.created_at)
          const now = new Date()
          const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
          return diffDays <= 7
        }).length,
        last30Days: auth0Users.filter(u => {
          const createdAt = new Date(u.created_at)
          const now = new Date()
          const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
          return diffDays <= 30
        }).length,
      },
      growth: {
        daily: calculateGrowthRate(auth0Users, 1),
        weekly: calculateGrowthRate(auth0Users, 7),
        monthly: calculateGrowthRate(auth0Users, 30),
      }
    }

    // Calculate role statistics
    for (const user of auth0Users) {
      try {
        const roles = await getUserRoles(user.user_id)
        for (const role of roles) {
          stats.byRole[role.name] = (stats.byRole[role.name] || 0) + 1
        }
      } catch (error) {
        console.error(`Error fetching roles for user ${user.user_id}:`, error)
      }
    }

    return NextResponse.json({ stats })
  } catch (error: any) {
    console.error("Error fetching user statistics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function calculateGrowthRate(users: any[], days: number): number {
  const now = new Date()
  const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))
  
  const recentUsers = users.filter(u => new Date(u.created_at) >= cutoffDate)
  const previousUsers = users.filter(u => new Date(u.created_at) < cutoffDate)
  
  if (previousUsers.length === 0) return recentUsers.length > 0 ? 100 : 0
  
  return ((recentUsers.length - previousUsers.length) / previousUsers.length) * 100
}
