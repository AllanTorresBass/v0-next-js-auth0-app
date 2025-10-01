import { NextResponse } from "next/server"
import { getSession } from "@/lib/mock-auth/mock-session"
import { getUser, updateUser, deleteUser } from "@/lib/auth0-management"
import type { UserRole, Permission } from "@/lib/rbac/permissions"
import { hasPermission } from "@/lib/rbac/permissions"
import type { UpdateUserData } from "@/lib/auth0-management"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role as UserRole | undefined
    const customPermissions = session.user.customPermissions as Permission[] | undefined

    if (!hasPermission(userRole, "users:read", customPermissions)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const id = decodeURIComponent(params.id)

    const auth0User = await getUser(id)

    const user = {
      id: auth0User.user_id || "",
      email: auth0User.email || "",
      name: auth0User.name || "",
      role: auth0User.app_metadata?.role || auth0User.user_metadata?.role || "client",
      status: auth0User.app_metadata?.status || auth0User.user_metadata?.status || "active",
      customPermissions: auth0User.app_metadata?.customPermissions || auth0User.user_metadata?.customPermissions || [],
      createdAt: auth0User.created_at || new Date().toISOString(),
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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role as UserRole | undefined
    const customPermissions = session.user.customPermissions as Permission[] | undefined

    if (!hasPermission(userRole, "users:update", customPermissions)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const id = decodeURIComponent(params.id)

    const body = (await request.json()) as UpdateUserData

    const auth0User = await updateUser(id, body)

    const updatedUser = {
      id: auth0User.user_id || "",
      email: auth0User.email || "",
      name: auth0User.name || "",
      role: auth0User.app_metadata?.role || body.role || "client",
      status: auth0User.app_metadata?.status || body.status || "active",
      customPermissions: auth0User.app_metadata?.customPermissions || body.customPermissions || [],
      createdAt: auth0User.created_at || new Date().toISOString(),
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

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role as UserRole | undefined
    const customPermissions = session.user.customPermissions as Permission[] | undefined

    if (!hasPermission(userRole, "users:delete", customPermissions)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const id = decodeURIComponent(params.id)

    await deleteUser(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting user:", error)
    if (error.message.includes("404") || error.message.includes("not found")) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
