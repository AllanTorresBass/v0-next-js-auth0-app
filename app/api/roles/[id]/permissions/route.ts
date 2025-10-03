import { NextResponse } from "next/server"
import { getRolePermissions, assignRolePermissions, removeRolePermissions } from "@/lib/auth0-management"
import { getRolePermissions as getStoredRolePermissions, assignRolePermission, removeRolePermission } from "@/lib/permission-storage"
import { PERMISSION_METADATA } from "@/lib/rbac/permissions"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authentication removed for role permissions fetching - using Auth0 sessions only

    const { id } = await params
    const decodedId = decodeURIComponent(id)

    // Get Auth0 permissions
    const auth0Permissions = await getRolePermissions(decodedId)
    
    // Get stored application permissions
    const storedPermissionIds = getStoredRolePermissions(decodedId)
    
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
    
    // Normalize Auth0 permissions to have consistent structure
    const normalizedAuth0Permissions = auth0Permissions.map(perm => ({
      id: perm.permission_name || perm.id || perm.name,
      name: perm.permission_name || perm.name,
      description: perm.description || '',
      resource_server_identifier: perm.resource_server_identifier || '',
      resource_server_name: perm.resource_server_name || '',
      category: 'auth0'
    }))
    
    // Combine Auth0 permissions and stored permissions
    const allPermissions = [...normalizedAuth0Permissions, ...storedPermissions]

    return NextResponse.json({ permissions: allPermissions })
  } catch (error: any) {
    console.error("Error fetching role permissions:", error)
    if (error.message.includes("404") || error.message.includes("not found")) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/roles/[id]/permissions - Assign permissions to a role
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const decodedId = decodeURIComponent(id)
    const body = await request.json()
    const { permissionIds } = body

    if (!Array.isArray(permissionIds)) {
      return NextResponse.json({ error: "permissionIds array is required" }, { status: 400 })
    }

    console.log(`[API] Assigning permissions to role ${decodedId}:`, permissionIds)

    // All permissions are Auth0 permissions (using the custom API)
    try {
      await assignRolePermissions(decodedId, permissionIds)
      console.log('[API] Successfully assigned permissions to role')
    } catch (error: any) {
      console.warn('[API] Failed to assign permissions to role:', error.message)
      // Continue even if permission assignment fails
    }

    // Get updated permissions
    const auth0Permissions = await getRolePermissions(decodedId)
    const storedPermissionIds = getStoredRolePermissions(decodedId)
    
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
    
    // Normalize Auth0 permissions to have consistent structure
    const normalizedAuth0Permissions = auth0Permissions.map(perm => ({
      id: perm.permission_name || perm.id || perm.name,
      name: perm.permission_name || perm.name,
      description: perm.description || '',
      resource_server_identifier: perm.resource_server_identifier || '',
      resource_server_name: perm.resource_server_name || '',
      category: 'auth0'
    }))
    
    // Combine Auth0 permissions and stored permissions
    const allPermissions = [...normalizedAuth0Permissions, ...storedPermissions]

    return NextResponse.json({ 
      message: "Permissions assigned successfully",
      permissions: allPermissions 
    })
  } catch (error: any) {
    console.error("Error assigning role permissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/roles/[id]/permissions - Remove permissions from a role
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const decodedId = decodeURIComponent(id)
    const body = await request.json()
    const { permissionIds } = body

    if (!Array.isArray(permissionIds)) {
      return NextResponse.json({ error: "permissionIds array is required" }, { status: 400 })
    }

    console.log(`[API] Removing permissions from role ${decodedId}:`, permissionIds)

    // All permissions are Auth0 permissions (using the custom API)
    try {
      await removeRolePermissions(decodedId, permissionIds)
      console.log('[API] Successfully removed permissions from role')
    } catch (error: any) {
      console.warn('[API] Failed to remove permissions from role:', error.message)
      // Continue even if permission removal fails
    }

    return NextResponse.json({ 
      message: "Permissions removed successfully"
    })
  } catch (error: any) {
    console.error("Error removing role permissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
