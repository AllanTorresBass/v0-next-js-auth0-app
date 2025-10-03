import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth0"
import { createUser, assignUserRoles } from "@/lib/auth0-management"
import type { UserRole, Permission } from "@/lib/rbac/permissions"
import { hasPermission } from "@/lib/rbac/permissions"

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role as UserRole | undefined
    const customPermissions = session.user.customPermissions as Permission[] | undefined

    if (!hasPermission(userRole, "users:create", customPermissions)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { users, options = {} } = body

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: "Users array is required" }, { status: 400 })
    }

    const {
      skipDuplicates = true,
      defaultRoles = [],
      sendWelcomeEmail = false,
      validateEmails = true
    } = options

    const results = []
    const errors = []
    const skipped = []

    // Validate email format if requested
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (validateEmails) {
      for (const user of users) {
        if (!emailRegex.test(user.email)) {
          errors.push({ 
            email: user.email, 
            error: "Invalid email format",
            row: users.indexOf(user) + 1
          })
        }
      }
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      return NextResponse.json({ 
        error: "Validation failed",
        errors,
        summary: {
          total: users.length,
          processed: 0,
          successful: 0,
          failed: errors.length,
          skipped: 0
        }
      }, { status: 400 })
    }

    for (const userData of users) {
      try {
        const { email, name, password, roles = defaultRoles } = userData

        if (!email || !name || !password) {
          errors.push({ 
            email: userData.email, 
            error: "Missing required fields (email, name, password)",
            row: users.indexOf(userData) + 1
          })
          continue
        }

        // Check for duplicates if skipDuplicates is enabled
        if (skipDuplicates) {
          // In a real implementation, you would check against existing users
          // For now, we'll proceed with creation
        }

        const auth0User = await createUser({
          email,
          name,
          password,
        })

        // Assign roles if provided
        if (roles && Array.isArray(roles) && roles.length > 0) {
          try {
            await assignUserRoles(auth0User.user_id, roles)
          } catch (error) {
            console.error(`Error assigning roles to user ${auth0User.user_id}:`, error)
            // Continue with user creation even if role assignment fails
          }
        }

        results.push({
          id: auth0User.user_id || "",
          email: auth0User.email || "",
          name: auth0User.name || "",
          status: auth0User.blocked ? "blocked" : "active",
          createdAt: auth0User.created_at || new Date().toISOString(),
          roles: roles,
          row: users.indexOf(userData) + 1
        })

        // TODO: Send welcome email if requested
        if (sendWelcomeEmail) {
          // Implement email sending logic here
          console.log(`Welcome email would be sent to ${email}`)
        }

      } catch (error: any) {
        if (error.message?.includes('already exists') && skipDuplicates) {
          skipped.push({
            email: userData.email,
            reason: "User already exists",
            row: users.indexOf(userData) + 1
          })
        } else {
          errors.push({ 
            email: userData.email, 
            error: error.message || "Unknown error",
            row: users.indexOf(userData) + 1
          })
        }
      }
    }

    return NextResponse.json({ 
      users: results, 
      errors,
      skipped,
      summary: {
        total: users.length,
        processed: results.length + errors.length + skipped.length,
        successful: results.length,
        failed: errors.length,
        skipped: skipped.length
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error("Error importing users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
