import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth0"
import { assignUserRoles, removeUserRoles, getUserRoles } from "@/lib/auth0-management"
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

    const roles = await getUserRoles(decodedId)
    return NextResponse.json({ roles })
  } catch (error: any) {
    console.error("Error fetching user roles:", error)
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
    const { roleIds } = body

    if (!Array.isArray(roleIds)) {
      return NextResponse.json({ error: "roleIds must be an array" }, { status: 400 })
    }

    await assignUserRoles(decodedId, roleIds)
    const updatedRoles = await getUserRoles(decodedId)

    return NextResponse.json({ roles: updatedRoles })
  } catch (error: any) {
    console.error("Error assigning user roles:", error)
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
    const { roleIds } = body

    if (!Array.isArray(roleIds)) {
      return NextResponse.json({ error: "roleIds must be an array" }, { status: 400 })
    }

    await removeUserRoles(decodedId, roleIds)
    const updatedRoles = await getUserRoles(decodedId)

    return NextResponse.json({ roles: updatedRoles })
  } catch (error: any) {
    console.error("Error removing user roles:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}