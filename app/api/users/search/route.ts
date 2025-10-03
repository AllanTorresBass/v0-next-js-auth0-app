import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth0"
import { getAllUsers, getUserRoles, getUserPermissions } from "@/lib/auth0-management"
import type { UserRole, Permission } from "@/lib/rbac/permissions"
import { hasPermission } from "@/lib/rbac/permissions"

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role as UserRole | undefined
    const customPermissions = session.user.customPermissions as Permission[] | undefined

    if (!hasPermission(userRole, "users:read", customPermissions)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const filters = JSON.parse(searchParams.get('filters') || '{}')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query.trim()) {
      return NextResponse.json({ users: [], total: 0 })
    }

    const auth0Users = await getAllUsers()
    
    // Transform users with roles and permissions
    const usersWithRolesAndPermissions = await Promise.all(
      auth0Users.map(async (user) => {
        try {
          const [roles, permissions] = await Promise.all([
            getUserRoles(user.user_id),
            getUserPermissions(user.user_id)
          ])
          return {
            id: user.user_id || "",
            email: user.email || "",
            name: user.name || "",
            status: user.blocked ? "blocked" : "active",
            createdAt: user.created_at || new Date().toISOString(),
            emailVerified: user.email_verified || false,
            lastLogin: user.last_login || null,
            roles: roles,
            permissions: permissions,
          }
        } catch (error) {
          console.error(`Error fetching roles and permissions for user ${user.user_id}:`, error)
          return {
            id: user.user_id || "",
            email: user.email || "",
            name: user.name || "",
            status: user.blocked ? "blocked" : "active",
            createdAt: user.created_at || new Date().toISOString(),
            emailVerified: user.email_verified || false,
            lastLogin: user.last_login || null,
            roles: [],
            permissions: [],
          }
        }
      })
    )

    // Apply search query
    const searchResults = usersWithRolesAndPermissions.filter(user => {
      const searchText = `${user.name} ${user.email}`.toLowerCase()
      return searchText.includes(query.toLowerCase())
    })

    // Apply additional filters
    let filteredResults = searchResults

    if (filters.status) {
      filteredResults = filteredResults.filter(user => user.status === filters.status)
    }

    if (filters.role) {
      filteredResults = filteredResults.filter(user => 
        user.roles.some((r: any) => r.name.toLowerCase().includes(filters.role.toLowerCase()))
      )
    }

    if (filters.emailVerified !== undefined) {
      filteredResults = filteredResults.filter(user => user.emailVerified === filters.emailVerified)
    }

    if (filters.createdAfter) {
      const date = new Date(filters.createdAfter)
      filteredResults = filteredResults.filter(user => new Date(user.createdAt) >= date)
    }

    if (filters.createdBefore) {
      const date = new Date(filters.createdBefore)
      filteredResults = filteredResults.filter(user => new Date(user.createdAt) <= date)
    }

    // Sort by relevance (exact matches first, then partial matches)
    filteredResults.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(query.toLowerCase())
      const aEmailMatch = a.email.toLowerCase().includes(query.toLowerCase())
      const bNameMatch = b.name.toLowerCase().includes(query.toLowerCase())
      const bEmailMatch = b.email.toLowerCase().includes(query.toLowerCase())

      const aScore = (aNameMatch ? 2 : 0) + (aEmailMatch ? 1 : 0)
      const bScore = (bNameMatch ? 2 : 0) + (bEmailMatch ? 1 : 0)

      return bScore - aScore
    })

    // Apply limit
    const limitedResults = filteredResults.slice(0, limit)

    return NextResponse.json({ 
      users: limitedResults,
      total: filteredResults.length,
      query,
      filters
    })
  } catch (error: any) {
    console.error("Error searching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
