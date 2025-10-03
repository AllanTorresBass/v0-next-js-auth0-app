import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth0"
import { getAllPermissions, createPermission } from "@/lib/auth0-management"
// Mock functionality removed - using Auth0 sessions only
import { PERMISSION_METADATA } from "@/lib/rbac/permissions"

export async function GET(request: Request) {
  try {
    // Authentication removed for permission listing - using Auth0 sessions only

    // Get Auth0 permissions from resource servers
    const auth0Permissions = await getAllPermissions()
    
    // Convert our application permissions to Auth0 format for consistency
    const appPermissions = PERMISSION_METADATA.map(permission => ({
      id: permission.id,
      name: permission.id,
      description: permission.description,
      resource_server_identifier: 'app-permissions',
      resource_server_name: 'Application Permissions',
      category: permission.category
    }))
    
    // Combine Auth0 permissions and application permissions
    const allPermissions = [...auth0Permissions, ...appPermissions]
    
    return NextResponse.json({ permissions: allPermissions })
  } catch (error: any) {
    console.error("Error fetching permissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Get Auth0 session
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, resource_server_identifier } = body

    if (!name || !description || !resource_server_identifier) {
      return NextResponse.json({ error: "Name, description, and resource_server_identifier are required" }, { status: 400 })
    }

    const permission = await createPermission({ name, description, resource_server_identifier })
    return NextResponse.json({ permission }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating permission:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
