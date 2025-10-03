import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth0"
import { getUserPermissions, assignUserPermissions, removeUserPermissions } from "@/lib/auth0-management"
import type { UserRole, Permission } from "@/lib/rbac/permissions"
import { hasPermission } from "@/lib/rbac/permissions"
// Mock functionality removed - using Auth0 sessions only

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Get Auth0 session
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const decodedId = decodeURIComponent(id)

    const auth0Permissions = await getUserPermissions(decodedId)
    
    // Only return Auth0 permissions for consistency
    return NextResponse.json({ permissions: auth0Permissions })
  } catch (error: any) {
    console.error("Error fetching user permissions:", error)
    if (error.message.includes("404") || error.message.includes("not found")) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    // Only handle Auth0 permissions for consistency
    await assignUserPermissions(decodedId, permissionIds)
    
    // Get updated permissions
    const auth0Permissions = await getUserPermissions(decodedId)

    return NextResponse.json({ permissions: auth0Permissions })
  } catch (error: any) {
    console.error("Error assigning user permissions:", error)
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

    // Only handle Auth0 permissions for consistency
    await removeUserPermissions(decodedId, permissionIds)
    
    // Get updated permissions
    const auth0Permissions = await getUserPermissions(decodedId)

    return NextResponse.json({ permissions: auth0Permissions })
  } catch (error: any) {
    console.error("Error removing user permissions:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}