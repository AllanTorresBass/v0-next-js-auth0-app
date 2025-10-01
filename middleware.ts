import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Using server-side guards in pages instead for authentication checks
export function middleware(request: NextRequest) {
  // Allow all requests to pass through
  // Authentication is handled by server-side guards in each protected page
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/users/:path*", "/profile/:path*"],
}
