import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Handle Auth0 routes
  if (pathname.startsWith('/auth/')) {
    // Let Auth0 handle these routes
    return NextResponse.next()
  }
  
  // For protected routes, check if user is authenticated
  if (pathname.startsWith('/dashboard/') || pathname.startsWith('/users/') || pathname.startsWith('/profile/')) {
    // For now, allow all requests - authentication will be handled by server components
    return NextResponse.next()
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/auth/:path*",
    "/dashboard/:path*", 
    "/users/:path*", 
    "/profile/:path*"
  ],
}
