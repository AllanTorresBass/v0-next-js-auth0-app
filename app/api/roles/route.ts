import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth0"
import { getAllRoles, createRole, assignRolePermissions, removeRolePermissions, getRolePermissions } from "@/lib/auth0-management"
import type { UserRole, Permission } from "@/lib/rbac/permissions"
import { hasPermission } from "@/lib/rbac/permissions"
// Mock functionality removed - using Auth0 sessions only
import { assignRolePermission, removeRolePermission, getRolePermissions as getStoredRolePermissions } from "@/lib/permission-storage"
import { PERMISSION_METADATA } from "@/lib/rbac/permissions"

export async function GET(request: Request) {
  try {
    // Authentication removed for role listing - using Auth0 sessions only

    const roles = await getAllRoles()
    return NextResponse.json({ roles })
  } catch (error: any) {
    console.error("Error fetching roles:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Authentication removed for role creation - using Auth0 sessions only

    const body = await request.json()
    const { name, description, permissions } = body

    if (!name || !description) {
      return NextResponse.json({ error: "Name and description are required" }, { status: 400 })
    }

    const role = await createRole({ name, description })
    
    // Assign permissions if provided
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      console.log('[API] Role creation - Assigning permissions:', permissions)
      
      // All permissions are application permissions (they have colons)
      // Store application permissions
      for (const permissionId of permissions) {
        console.log('[API] Assigning permission to role:', permissionId)
        assignRolePermission(role.id, permissionId)
      }
      
      console.log('[API] Successfully assigned permissions to new role')
    }
    
    return NextResponse.json({ role }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating role:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

// PUT /api/roles - Assign permissions to a role
export async function PUT(request: Request) {
  try {
    // Authentication removed for role permission assignment - using Auth0 sessions only

    const body = await request.json()
    const { roleId, permissionIds } = body

    if (!roleId || !Array.isArray(permissionIds)) {
      return NextResponse.json({ error: "roleId and permissionIds array are required" }, { status: 400 })
    }

    // Separate Auth0 permissions from application permissions
    const auth0PermissionIds = permissionIds.filter(id => !id.includes(':'))
    const appPermissionIds = permissionIds.filter(id => id.includes(':'))
    
    // Assign Auth0 permissions if there are any
    if (auth0PermissionIds.length > 0) {
      await assignRolePermissions(roleId, auth0PermissionIds)
    }
    
    // Store application permissions
    for (const permissionId of appPermissionIds) {
      assignRolePermission(roleId, permissionId)
    }
    
    // Get updated permissions
    const auth0Permissions = await getRolePermissions(roleId)
    const storedPermissionIds = getStoredRolePermissions(roleId)
    
    // Convert stored permission IDs to permission objects
    const storedPermissions = storedPermissionIds.map((permissionId: string) => {
      const metadata = PERMISSION_METADATA.find(p => p.id === permissionId)
      return {
        id: permissionId,
        name: permissionId,
        description: metadata?.description || `Application permission: ${permissionId}`,
        resource_server_identifier: 'app-permissions',
        resource_server_name: 'Application Permissions',
        category: metadata?.category
      }
    })
    
    // Combine Auth0 permissions and stored permissions
    const allPermissions = [...auth0Permissions, ...storedPermissions]

    return NextResponse.json({ 
      message: "Permissions assigned successfully",
      permissions: allPermissions 
    })
  } catch (error: any) {
    console.error("Error assigning role permissions:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/roles - Remove permissions from a role
export async function PATCH(request: Request) {
  try {
    // Authentication removed for role permission removal - using Auth0 sessions only

    const body = await request.json()
    const { roleId, permissionIds } = body

    if (!roleId || !Array.isArray(permissionIds)) {
      return NextResponse.json({ error: "roleId and permissionIds array are required" }, { status: 400 })
    }

    // Separate Auth0 permissions from application permissions
    const auth0PermissionIds = permissionIds.filter(id => !id.includes(':'))
    const appPermissionIds = permissionIds.filter(id => id.includes(':'))
    
    // Remove Auth0 permissions if there are any
    if (auth0PermissionIds.length > 0) {
      await removeRolePermissions(roleId, auth0PermissionIds)
    }
    
    // Remove application permissions
    for (const permissionId of appPermissionIds) {
      removeRolePermission(roleId, permissionId)
    }

    return NextResponse.json({ 
      message: "Permissions removed successfully"
    })
  } catch (error: any) {
    console.error("Error removing role permissions:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
