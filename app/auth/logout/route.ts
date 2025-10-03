import { NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"

export async function GET(request: Request) {
  try {
    const result = await auth0.handleLogout(request)
    
    if (result.error) {
      console.error('Auth0 logout error:', result.error)
      return NextResponse.redirect(new URL('/auth/error', request.url))
    }
    
    // Redirect to home page after logout
    return NextResponse.redirect(new URL('/', request.url))
  } catch (error) {
    console.error('Auth0 logout error:', error)
    return NextResponse.redirect(new URL('/auth/error', request.url))
  }
}
