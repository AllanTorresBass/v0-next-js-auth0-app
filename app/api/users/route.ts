import { NextResponse } from "next/server"
import { getSession } from "@/lib/mock-auth/mock-session"
import { getAllUsers, createUser } from "@/lib/auth0-management"
import type { UserRole, Permission } from "@/lib/rbac/permissions"
import { hasPermission } from "@/lib/rbac/permissions"
import type { CreateUserData } from "@/lib/auth0-management"

export async function GET() {
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

    const auth0Users = await getAllUsers()

    // Transform Auth0 users to our app format
    const users = auth0Users.map((user) => ({
      id: user.user_id || "",
      email: user.email || "",
      name: user.name || "",
      role: user.app_metadata?.role || user.user_metadata?.role || "client",
      status: user.app_metadata?.status || user.user_metadata?.status || "active",
      customPermissions: user.app_metadata?.customPermissions || user.user_metadata?.customPermissions || [],
      createdAt: user.created_at || new Date().toISOString(),
    }))

    return NextResponse.json({ users })
  } catch (error) {
    console.error("[v0] Error fetching users:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role as UserRole | undefined
    const customPermissions = session.user.customPermissions as Permission[] | undefined

    if (!hasPermission(userRole, "users:create", customPermissions)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = (await request.json()) as CreateUserData
    const { email, name, role, password, status, customPermissions: userCustomPermissions } = body

    if (!email || !name || !role || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const auth0User = await createUser({
      email,
      name,
      role,
      password,
      status,
      customPermissions: userCustomPermissions,
    })

    // Transform to our app format
    const newUser = {
      id: auth0User.user_id || "",
      email: auth0User.email || "",
      name: auth0User.name || "",
      role,
      status: status || "active",
      customPermissions: userCustomPermissions || [],
      createdAt: auth0User.created_at || new Date().toISOString(),
    }

    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Error creating user:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
