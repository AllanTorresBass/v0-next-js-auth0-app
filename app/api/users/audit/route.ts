import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth0"
import type { UserRole, Permission } from "@/lib/rbac/permissions"
import { hasPermission } from "@/lib/rbac/permissions"

// In a real application, this would be stored in a database
// For now, we'll return empty audit logs
const auditLogs: any[] = []

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role as UserRole | undefined
    const customPermissions = session.user.customPermissions as Permission[] | undefined

    if (!hasPermission(userRole, "users:read", customPermissions)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const action = searchParams.get('action') || ''
    const userId = searchParams.get('userId') || ''
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''

    let filteredLogs = [...auditLogs]

    // Apply filters
    if (action) {
      filteredLogs = filteredLogs.filter(log => log.action.includes(action))
    }

    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === userId)
    }

    if (startDate) {
      const start = new Date(startDate)
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= start)
    }

    if (endDate) {
      const end = new Date(endDate)
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= end)
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Apply pagination
    const total = filteredLogs.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex)

    // Calculate statistics
    const stats = {
      total,
      byAction: filteredLogs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byUser: filteredLogs.reduce((acc, log) => {
        acc[log.userEmail] = (acc[log.userEmail] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      recentActivity: {
        last24Hours: filteredLogs.filter(log => {
          const logTime = new Date(log.timestamp)
          const now = new Date()
          const diffHours = (now.getTime() - logTime.getTime()) / (1000 * 60 * 60)
          return diffHours <= 24
        }).length,
        last7Days: filteredLogs.filter(log => {
          const logTime = new Date(log.timestamp)
          const now = new Date()
          const diffDays = (now.getTime() - logTime.getTime()) / (1000 * 60 * 60 * 24)
          return diffDays <= 7
        }).length
      }
    }

    return NextResponse.json({ 
      logs: paginatedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      stats,
      message: total === 0 ? "No audit logs available. Audit logs will appear here when user actions are performed." : undefined
    })
  } catch (error: any) {
    console.error("Error fetching audit logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role as UserRole | undefined
    const customPermissions = session.user.customPermissions as Permission[] | undefined

    if (!hasPermission(userRole, "users:read", customPermissions)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { action, details, targetUserId, targetUserEmail } = body

    if (!action || !details) {
      return NextResponse.json({ error: "Action and details are required" }, { status: 400 })
    }

    // In a real application, this would be stored in a database
    const newLog = {
      id: Date.now().toString(),
      userId: session.user.sub,
      userEmail: session.user.email || "unknown@auth0.com",
      action,
      details,
      targetUserId,
      targetUserEmail,
      timestamp: new Date().toISOString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    }

    // Add to audit logs (in memory for demo)
    auditLogs.unshift(newLog)

    return NextResponse.json({ log: newLog }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating audit log:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
