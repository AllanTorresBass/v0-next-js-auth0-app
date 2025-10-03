import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth0"
import { getUser, updateUser, deleteUser, getUserRoles, getUserPermissions, getRolePermissions, assignUserRoles, removeUserRoles } from "@/lib/auth0-management"
import type { UserRole, Permission } from "@/lib/rbac/permissions"
import { hasPermission } from "@/lib/rbac/permissions"
import type { UpdateUserData, UserRoleAssignment, UserPermissionAssignment } from "@/lib/auth0-management"
// Mock functionality removed - using Auth0 sessions only
import { getRolePermissions as getStoredRolePermissions } from "@/lib/permission-storage"
import { PERMISSION_METADATA } from "@/lib/rbac/permissions"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authentication removed for user details - using Auth0 sessions only

    const { id } = await params
    const decodedId = decodeURIComponent(id)

    const auth0User = await getUser(decodedId)

    // Fetch roles and permissions for the user
    let roles: UserRoleAssignment[] = []
    let permissions: UserPermissionAssignment[] = []
    try {
      [roles, permissions] = await Promise.all([
        getUserRoles(decodedId),
        getUserPermissions(decodedId)
      ])
      
      // Also fetch application permissions from user's roles
      const rolePermissions: UserPermissionAssignment[] = []
      for (const role of roles) {
        try {
          // Get Auth0 permissions for the role
          const auth0RolePerms = await getRolePermissions(role.id)
          rolePermissions.push(...auth0RolePerms.map(perm => ({
            ...perm,
            id: perm.id || perm.permission_name || '',
            name: perm.name || perm.permission_name || '',
            assignment: 'Inherited' as const // Fix: must be "Direct" or "Inherited"
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
              assignment: 'Inherited' as const
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
      console.error(`Error fetching roles and permissions for user ${decodedId}:`, error)
      // Continue with empty arrays
    }

    const user = {
      id: auth0User.user_id || "",
      email: auth0User.email || "",
      name: auth0User.name || "",
      status: auth0User.blocked ? "blocked" : "active",
      createdAt: auth0User.created_at || new Date().toISOString(),
      lastLogin: auth0User.last_login || undefined,
      picture: auth0User.picture || undefined,
      roles: roles,
      permissions: permissions,
    }

    return NextResponse.json({ user })
  } catch (error: any) {
    console.error("Error fetching user:", error)
    if (error.message.includes("404") || error.message.includes("not found")) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authentication removed for user updates - using Auth0 sessions only

    const { id } = await params
    const decodedId = decodeURIComponent(id)

    const body = (await request.json()) as UpdateUserData
    const { roles: newRoles, ...userData } = body

    const auth0User = await updateUser(decodedId, userData)

    // Handle role updates if provided
    if (newRoles !== undefined) {
      try {
        // Get current roles
        const currentRoles = await getUserRoles(decodedId)
        const currentRoleIds = currentRoles.map(role => role.id)
        
        // Find roles to add and remove
        const rolesToAdd = newRoles.filter(roleId => !currentRoleIds.includes(roleId))
        const rolesToRemove = currentRoleIds.filter(roleId => !newRoles.includes(roleId))
        
        // Add new roles
        if (rolesToAdd.length > 0) {
          await assignUserRoles(decodedId, rolesToAdd)
        }
        
        // Remove old roles
        if (rolesToRemove.length > 0) {
          await removeUserRoles(decodedId, rolesToRemove)
        }
      } catch (error) {
        console.error(`Error updating roles for user ${decodedId}:`, error)
      }
    }

    // Fetch roles and permissions for the updated user
    let roles: UserRoleAssignment[] = []
    let permissions: UserPermissionAssignment[] = []
    try {
      [roles, permissions] = await Promise.all([
        getUserRoles(decodedId),
        getUserPermissions(decodedId)
      ])
      
      // Also fetch application permissions from user's roles
      const rolePermissions: UserPermissionAssignment[] = []
      for (const role of roles) {
        try {
          // Get Auth0 permissions for the role
          const auth0RolePerms = await getRolePermissions(role.id)
          rolePermissions.push(...auth0RolePerms.map(perm => ({
            ...perm,
            id: perm.id || perm.permission_name || '',
            name: perm.name || perm.permission_name || '',
            assignment: 'Inherited' as const
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
              assignment: 'Inherited' as const
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
      console.error(`Error fetching roles and permissions for updated user ${decodedId}:`, error)
      // Continue with empty arrays
    }

    const updatedUser = {
      id: auth0User.user_id || "",
      email: auth0User.email || "",
      name: auth0User.name || "",
      status: auth0User.blocked ? "blocked" : "active",
      createdAt: auth0User.created_at || new Date().toISOString(),
      lastLogin: auth0User.last_login || undefined,
      picture: auth0User.picture || undefined,
      roles: roles,
      permissions: permissions,
    }

    return NextResponse.json({ user: updatedUser })
  } catch (error: any) {
    console.error("Error updating user:", error)
    if (error.message.includes("404") || error.message.includes("not found")) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authentication removed for user deletion - using Auth0 sessions only

    const { id } = await params
    const decodedId = decodeURIComponent(id)

    await deleteUser(decodedId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting user:", error)
    if (error.message.includes("404") || error.message.includes("not found")) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
