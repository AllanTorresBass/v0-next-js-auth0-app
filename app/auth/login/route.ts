import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // Redirect to user switcher instead of Auth0 login
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
