import { NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"

export async function GET(request: Request) {
  try {
    const result = await auth0.handleCallback(request)
    
    if (result.error) {
      console.error('Auth0 callback error:', result.error)
      return NextResponse.redirect(new URL('/auth/error', request.url))
    }
    
    // Redirect to dashboard after successful authentication
    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (error) {
    console.error('Auth0 callback error:', error)
    return NextResponse.redirect(new URL('/auth/error', request.url))
  }
}
