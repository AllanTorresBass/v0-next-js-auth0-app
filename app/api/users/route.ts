import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth0"
import { getAllUsers, createUser, getUserRoles, getUserPermissions, deleteUser, updateUser, assignUserRoles, getRolePermissions } from "@/lib/auth0-management"
import type { UserRole, Permission } from "@/lib/rbac/permissions"
import { hasPermission } from "@/lib/rbac/permissions"
import type { CreateUserData, UserRoleAssignment, UserPermissionAssignment, UpdateUserData } from "@/lib/auth0-management"
// Mock functionality removed - using Auth0 sessions only
import { getRolePermissions as getStoredRolePermissions } from "@/lib/permission-storage"
import { PERMISSION_METADATA } from "@/lib/rbac/permissions"

// Helper function to fetch roles and permissions for all users with better error handling
async function getUsersWithRolesAndPermissions(auth0Users: any[]): Promise<any[]> {
  console.log(`[Users API] Processing ${auth0Users.length} users for roles and permissions`)
  
  // Process users in smaller batches to avoid rate limiting
  const batchSize = 5
  const usersWithRolesAndPermissions = []
  
  for (let i = 0; i < auth0Users.length; i += batchSize) {
    const batch = auth0Users.slice(i, i + batchSize)
    console.log(`[Users API] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(auth0Users.length / batchSize)}`)
    
    // Process batch in parallel with controlled concurrency
    const batchPromises = batch.map(async (user) => {
      try {
        const [roles, permissions] = await Promise.all([
          getUserRoles(user.user_id).catch(err => {
            console.warn(`[Users API] Failed to fetch roles for ${user.user_id}:`, err.message)
            return []
          }),
          getUserPermissions(user.user_id).catch(err => {
            console.warn(`[Users API] Failed to fetch permissions for ${user.user_id}:`, err.message)
            return []
          })
        ])
        
        // Also fetch application permissions from user's roles
        const rolePermissions: UserPermissionAssignment[] = []
        for (const role of roles) {
          try {
            // Get Auth0 permissions for the role
            const auth0RolePerms = await getRolePermissions(role.id)
            rolePermissions.push(...auth0RolePerms.map(perm => ({
              ...perm,
              assignment: 'Role' as const
            })))
            
            // Get application permissions for the role
            const appRolePerms = getStoredRolePermissions(role.id)
            const appPermissions = appRolePerms.map(permissionId => {
              const metadata = PERMISSION_METADATA.find(p => p.id === permissionId)
              return {
                id: permissionId,
                name: permissionId,
                description: metadata?.description || `Application permission: ${permissionId}`,
                resource_server_identifier: 'app-permissions',
                resource_server_name: 'Application Permissions',
                category: metadata?.category,
                assignment: 'Role' as const
              }
            })
            rolePermissions.push(...appPermissions)
          } catch (error) {
            console.error(`[Users API] Error fetching permissions for role ${role.id}:`, error)
          }
        }
        
        // Combine Auth0 permissions and role-based permissions
        const allPermissions = [...permissions, ...rolePermissions]
        
        const userData = {
          id: user.user_id || "",
          email: user.email || "",
          name: user.name || "",
          status: user.blocked ? "blocked" : "active",
          createdAt: user.created_at || new Date().toISOString(),
          updatedAt: user.updated_at || undefined,
          lastLogin: user.last_login || undefined,
          lastLoginAt: user.last_login_at || undefined,
          picture: user.picture || undefined,
          blocked: user.blocked || false,
          emailVerified: user.email_verified || false,
          roles: roles,
          permissions: allPermissions,
        }
        
        // Debug logging for role data
        console.log(`[Users API] User ${userData.name} processed with roles:`, roles)
        
        // Special debugging for Luis Rivera
        if (userData.id.includes('68dd9f3bd8af3d5f5b3fec5b') || userData.name.includes('Luis')) {
          console.log(`[Users API] SPECIAL DEBUG for Luis Rivera:`)
          console.log(`[Users API] - User ID: ${userData.id}`)
          console.log(`[Users API] - User name: ${userData.name}`)
          console.log(`[Users API] - User email: ${userData.email}`)
          console.log(`[Users API] - Roles:`, JSON.stringify(roles, null, 2))
          console.log(`[Users API] - Permissions:`, JSON.stringify(permissions, null, 2))
        }
        
        return userData
      } catch (error) {
        console.error(`[Users API] Error processing user ${user.user_id} (${user.name}):`, error)
        
        // Return user with empty roles and permissions on error
        const errorUserData = {
          id: user.user_id || "",
          email: user.email || "",
          name: user.name || "",
          status: user.blocked ? "blocked" : "active",
          createdAt: user.created_at || new Date().toISOString(),
          updatedAt: user.updated_at || undefined,
          lastLogin: user.last_login || undefined,
          lastLoginAt: user.last_login_at || undefined,
          picture: user.picture || undefined,
          blocked: user.blocked || false,
          emailVerified: user.email_verified || false,
          roles: [],
          permissions: [],
        }
        
        console.log(`[Users API] User ${errorUserData.name} processed with empty roles due to error`)
        
        return errorUserData
      }
    })
    
    const batchResults = await Promise.all(batchPromises)
    usersWithRolesAndPermissions.push(...batchResults)
    
    // Add delay between batches to avoid rate limiting
    if (i + batchSize < auth0Users.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
  
  console.log(`[Users API] Completed processing ${usersWithRolesAndPermissions.length} users`)
  return usersWithRolesAndPermissions
}

export async function GET(request: Request) {
  try {
    // Authentication removed for user listing - using Auth0 sessions only

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const role = searchParams.get('role') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const auth0Users = await getAllUsers()
    
    // Transform Auth0 users to our app format with roles and permissions
    let users = await getUsersWithRolesAndPermissions(auth0Users)
    
    // Apply filters
    if (search) {
      users = users.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    if (status) {
      users = users.filter(user => user.status === status)
    }
    
    if (role) {
      users = users.filter(user => 
        user.roles.some((r: any) => r.name.toLowerCase().includes(role.toLowerCase()))
      )
    }
    
    if (!includeInactive) {
      users = users.filter(user => user.status === 'active')
    }
    
    // Apply sorting
    users.sort((a, b) => {
      let aValue = a[sortBy as keyof typeof a]
      let bValue = b[sortBy as keyof typeof b]
      
      if (sortBy === 'createdAt') {
        aValue = new Date(aValue as string).getTime()
        bValue = new Date(bValue as string).getTime()
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
    
    // Calculate pagination
    const total = users.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedUsers = users.slice(startIndex, endIndex)
    
    // Calculate statistics
    const stats = {
      total,
      active: users.filter(u => u.status === 'active').length,
      blocked: users.filter(u => u.status === 'blocked').length,
      byRole: users.reduce((acc, user) => {
        user.roles.forEach((r: any) => {
          acc[r.name] = (acc[r.name] || 0) + 1
        })
        return acc
      }, {} as Record<string, number>)
    }
    
    return NextResponse.json({ 
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      stats
    })
  } catch (error) {
    console.error("[v0] Error fetching users:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Authentication removed for user creation - using Auth0 sessions only

    const body = await request.json()
    const { action } = body

    // Handle different POST actions
    switch (action) {
      case 'create':
        return await handleCreateUser(body)
      case 'bulk-create':
        return await handleBulkCreateUsers(body)
      case 'bulk-update':
        return await handleBulkUpdateUsers(body)
      case 'bulk-delete':
        return await handleBulkDeleteUsers(body)
      case 'export':
        return await handleExportUsers(body)
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("[v0] Error in POST /api/users:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// Handle single user creation
async function handleCreateUser(body: any) {
  // All authenticated users can create users

  const { email, name, password, roles, picture, emailVerified } = body

  console.log('[API] User creation - Request data:', { email, name, roles })

  if (!email || !name || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const auth0User = await createUser({
    email,
    name,
    password,
    picture,
    email_verified: emailVerified,
  })

  console.log('[API] User created successfully:', auth0User.user_id)

  // Assign roles if provided
  if (roles && Array.isArray(roles) && roles.length > 0) {
    console.log('[API] Assigning roles to new user:', roles)
    try {
      await assignUserRoles(auth0User.user_id, roles)
      console.log('[API] Successfully assigned roles to user')
    } catch (error) {
      console.error(`[API] Error assigning roles to new user ${auth0User.user_id}:`, error)
    }
  } else {
    console.log('[API] No roles provided for user creation')
  }

  // Fetch roles and permissions for the newly created user
  let userRoles: UserRoleAssignment[] = []
  let permissions: UserPermissionAssignment[] = []
  try {
    [userRoles, permissions] = await Promise.all([
      getUserRoles(auth0User.user_id),
      getUserPermissions(auth0User.user_id)
    ])
    
    // Also fetch application permissions from user's roles
    const rolePermissions: UserPermissionAssignment[] = []
    for (const role of userRoles) {
      try {
        // Get Auth0 permissions for the role
        const auth0RolePerms = await getRolePermissions(role.id)
        rolePermissions.push(...auth0RolePerms.map(perm => ({
          ...perm,
          assignment: 'Role' as const
        })))
        
        // Get application permissions for the role
        const appRolePerms = getStoredRolePermissions(role.id)
        const appPermissions = appRolePerms.map(permissionId => {
          const metadata = PERMISSION_METADATA.find(p => p.id === permissionId)
          return {
            id: permissionId,
            name: permissionId,
            description: metadata?.description || `Application permission: ${permissionId}`,
            resource_server_identifier: 'app-permissions',
            resource_server_name: 'Application Permissions',
            category: metadata?.category,
            assignment: 'Role' as const
          }
        })
        rolePermissions.push(...appPermissions)
      } catch (error) {
        console.error(`Error fetching permissions for role ${role.id}:`, error)
      }
    }
    
    // Combine Auth0 permissions and role-based permissions
    permissions = [...permissions, ...rolePermissions]
    
  } catch (error) {
    console.error(`Error fetching roles and permissions for new user ${auth0User.user_id}:`, error)
  }

  // Transform to our app format
  const newUser = {
    id: auth0User.user_id || "",
    email: auth0User.email || "",
    name: auth0User.name || "",
    status: auth0User.blocked ? "blocked" : "active",
    createdAt: auth0User.created_at || new Date().toISOString(),
    lastLogin: auth0User.last_login || undefined,
    picture: auth0User.picture || undefined,
    roles: userRoles,
    permissions: permissions,
  }

  return NextResponse.json({ user: newUser }, { status: 201 })
}

// Handle bulk user creation
async function handleBulkCreateUsers(body: any) {
  // All authenticated users can create users

  const { users } = body

  if (!Array.isArray(users) || users.length === 0) {
    return NextResponse.json({ error: "Users array is required" }, { status: 400 })
  }

  const results = []
  const errors = []

  for (const userData of users) {
    try {
      const { email, name, password, roles } = userData
      
      if (!email || !name || !password) {
        errors.push({ email, error: "Missing required fields" })
        continue
      }

      const auth0User = await createUser({ email, name, password })

      // Assign roles if provided
      if (roles && Array.isArray(roles) && roles.length > 0) {
        try {
          await assignUserRoles(auth0User.user_id, roles)
        } catch (error) {
          console.error(`Error assigning roles to user ${auth0User.user_id}:`, error)
        }
      }

      // Fetch roles and permissions
      let userRoles: UserRoleAssignment[] = []
      let permissions: UserPermissionAssignment[] = []
      try {
        [userRoles, permissions] = await Promise.all([
          getUserRoles(auth0User.user_id),
          getUserPermissions(auth0User.user_id)
        ])
      } catch (error) {
        console.error(`Error fetching roles and permissions for user ${auth0User.user_id}:`, error)
      }

      results.push({
        id: auth0User.user_id || "",
        email: auth0User.email || "",
        name: auth0User.name || "",
        status: auth0User.blocked ? "blocked" : "active",
        createdAt: auth0User.created_at || new Date().toISOString(),
        lastLogin: auth0User.last_login || undefined,
        picture: auth0User.picture || undefined,
        roles: userRoles,
        permissions: permissions,
      })
    } catch (error) {
      errors.push({ email: userData.email, error: error instanceof Error ? error.message : "Unknown error" })
    }
  }

  return NextResponse.json({ 
    users: results, 
    errors,
    summary: {
      total: users.length,
      created: results.length,
      failed: errors.length
    }
  }, { status: 201 })
}

// Handle bulk user updates
async function handleBulkUpdateUsers(body: any) {
  // All authenticated users can update users

  const { userIds, updates } = body

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "User IDs array is required" }, { status: 400 })
  }

  const results = []
  const errors = []

  for (const userId of userIds) {
    try {
      const auth0User = await updateUser(userId, updates)

      // Fetch updated roles and permissions
      let userRoles: UserRoleAssignment[] = []
      let permissions: UserPermissionAssignment[] = []
      try {
        [userRoles, permissions] = await Promise.all([
          getUserRoles(userId),
          getUserPermissions(userId)
        ])
      } catch (error) {
        console.error(`Error fetching roles and permissions for user ${userId}:`, error)
      }

      results.push({
        id: auth0User.user_id || "",
        email: auth0User.email || "",
        name: auth0User.name || "",
        status: auth0User.blocked ? "blocked" : "active",
        createdAt: auth0User.created_at || new Date().toISOString(),
        lastLogin: auth0User.last_login || undefined,
        picture: auth0User.picture || undefined,
        roles: userRoles,
        permissions: permissions,
      })
    } catch (error) {
      errors.push({ userId, error: error instanceof Error ? error.message : "Unknown error" })
    }
  }

  return NextResponse.json({ 
    users: results, 
    errors,
    summary: {
      total: userIds.length,
      updated: results.length,
      failed: errors.length
    }
  })
}

// Handle bulk user deletion
async function handleBulkDeleteUsers(body: any) {
  // All authenticated users can delete users

  const { userIds } = body

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "User IDs array is required" }, { status: 400 })
  }

  const results = []
  const errors = []

  for (const userId of userIds) {
    try {
      await deleteUser(userId)
      results.push({ userId, success: true })
    } catch (error) {
      errors.push({ userId, error: error instanceof Error ? error.message : "Unknown error" })
    }
  }

  return NextResponse.json({ 
    results, 
    errors,
    summary: {
      total: userIds.length,
      deleted: results.length,
      failed: errors.length
    }
  })
}

// Handle user export
async function handleExportUsers(body: any) {
  // All authenticated users can export users

  const { format = 'json', includeInactive = false } = body

  const auth0Users = await getAllUsers()
  let users = await getUsersWithRolesAndPermissions(auth0Users)

  if (!includeInactive) {
    users = users.filter(user => user.status === 'active')
  }

  if (format === 'csv') {
    // Convert to CSV format
    const csvHeaders = ['ID', 'Email', 'Name', 'Status', 'Created At', 'Roles', 'Permissions']
    const csvRows = users.map(user => [
      user.id,
      user.email,
      user.name,
      user.status,
      user.createdAt,
      user.roles.map((r: any) => r.name).join(';'),
      user.permissions.map((p: any) => p.name).join(';')
    ])

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="users.csv"'
      }
    })
  }

  // Default to JSON format
  return NextResponse.json({ users })
}
