import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth0"
import { getRolePermissions, assignRolePermissions, removeRolePermissions } from "@/lib/auth0-management"
// Mock functionality removed - using Auth0 sessions only
import { assignRolePermission, removeRolePermission, getRolePermissions as getStoredRolePermissions } from "@/lib/permission-storage"
import { PERMISSION_METADATA } from "@/lib/rbac/permissions"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authentication removed for role permissions - using Auth0 sessions only

    const { id } = await params
    const decodedId = decodeURIComponent(id)

    const auth0Permissions = await getRolePermissions(decodedId)
    const storedPermissionIds = getStoredRolePermissions(decodedId)
    
    // Convert stored permission IDs to permission objects
    const storedPermissions = storedPermissionIds.map(permissionId => {
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
    
    return NextResponse.json({ permissions: allPermissions })
  } catch (error: any) {
    console.error("Error fetching role permissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authentication removed for role permission assignment - using Auth0 sessions only

    const { id } = await params
    const decodedId = decodeURIComponent(id)
    const body = await request.json()
    const { permissionIds } = body

    console.log('[API] Role permissions POST - Role ID:', decodedId)
    console.log('[API] Permission IDs received:', permissionIds)

    if (!Array.isArray(permissionIds)) {
      return NextResponse.json({ error: "permissionIds must be an array" }, { status: 400 })
    }

    // Separate Auth0 permissions from application permissions
    const auth0PermissionIds = permissionIds.filter(id => !id.includes(':'))
    const appPermissionIds = permissionIds.filter(id => id.includes(':'))
    
    console.log('[API] Auth0 permission IDs:', auth0PermissionIds)
    console.log('[API] App permission IDs:', appPermissionIds)
    
    // Assign Auth0 permissions if there are any
    if (auth0PermissionIds.length > 0) {
      console.log('[API] Assigning Auth0 permissions...')
      await assignRolePermissions(decodedId, auth0PermissionIds)
      console.log('[API] Auth0 permissions assigned successfully')
    }
    
    // Store application permissions
    if (appPermissionIds.length > 0) {
      console.log('[API] Storing application permissions...')
      for (const permissionId of appPermissionIds) {
        assignRolePermission(decodedId, permissionId)
      }
      console.log('[API] Application permissions stored successfully')
    }
    
    // Get updated permissions
    const auth0Permissions = await getRolePermissions(decodedId)
    const storedPermissionIds = getStoredRolePermissions(decodedId)
    
    console.log('[API] Auth0 permissions after assignment:', auth0Permissions.length)
    console.log('[API] Stored permission IDs after assignment:', storedPermissionIds)
    
    // Convert stored permission IDs to permission objects
    const storedPermissions = storedPermissionIds.map(permissionId => {
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
    
    console.log('[API] Total permissions being returned:', allPermissions.length)
    console.log('[API] Final permissions:', allPermissions.map(p => ({ id: p.id, name: p.name })))

    return NextResponse.json({ permissions: allPermissions })
  } catch (error: any) {
    console.error("Error assigning role permissions:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get Auth0 session
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const decodedId = decodeURIComponent(id)
    const body = await request.json()
    const { permissionIds } = body

    if (!Array.isArray(permissionIds)) {
      return NextResponse.json({ error: "permissionIds must be an array" }, { status: 400 })
    }

    // Separate Auth0 permissions from application permissions
    const auth0PermissionIds = permissionIds.filter(id => !id.includes(':'))
    const appPermissionIds = permissionIds.filter(id => id.includes(':'))
    
    // Remove Auth0 permissions if there are any
    if (auth0PermissionIds.length > 0) {
      await removeRolePermissions(decodedId, auth0PermissionIds)
    }
    
    // Remove application permissions
    for (const permissionId of appPermissionIds) {
      removeRolePermission(decodedId, permissionId)
    }
    
    // Get updated permissions
    const auth0Permissions = await getRolePermissions(decodedId)
    const storedPermissionIds = getStoredRolePermissions(decodedId)
    
    // Convert stored permission IDs to permission objects
    const storedPermissions = storedPermissionIds.map(permissionId => {
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

    return NextResponse.json({ permissions: allPermissions })
  } catch (error: any) {
    console.error("Error removing role permissions:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
