import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth0"
// Mock functionality removed - using Auth0 sessions only

export async function GET(request: Request) {
  try {
    // Get Auth0 session
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    return NextResponse.json(session.user)
  } catch (error) {
    console.error('Auth0 profile error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
