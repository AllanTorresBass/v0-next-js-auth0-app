import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    domain: process.env.AUTH0_ISSUER_BASE_URL?.replace('https://', ''),
    clientId: process.env.AUTH0_CLIENT_ID,
    baseUrl: process.env.AUTH0_BASE_URL,
    hasSecret: !!process.env.AUTH0_SECRET,
    hasClientSecret: !!process.env.AUTH0_CLIENT_SECRET
  })
}
