import { NextResponse } from "next/server"
import { getRolePermissions } from "@/lib/auth0-management"
import { getRolePermissions as getStoredRolePermissions } from "@/lib/permission-storage"
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
    
    // Combine Auth0 permissions and stored permissions
    const allPermissions = [...auth0Permissions, ...storedPermissions]

    return NextResponse.json({ permissions: allPermissions })
  } catch (error: any) {
    console.error("Error fetching role permissions:", error)
    if (error.message.includes("404") || error.message.includes("not found")) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
