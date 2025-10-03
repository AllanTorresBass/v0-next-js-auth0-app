import { NextResponse } from "next/server"
import { getRole, updateRole, deleteRole } from "@/lib/auth0-management"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const decodedId = decodeURIComponent(id)

    const role = await getRole(decodedId)
    return NextResponse.json({ role })
  } catch (error: any) {
    console.error("Error fetching role:", error)
    if (error.message.includes("404") || error.message.includes("not found")) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const decodedId = decodeURIComponent(id)
    const body = await request.json()

    const role = await updateRole(decodedId, body)
    return NextResponse.json({ role })
  } catch (error: any) {
    console.error("Error updating role:", error)
    if (error.message.includes("404") || error.message.includes("not found")) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const decodedId = decodeURIComponent(id)

    await deleteRole(decodedId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting role:", error)
    if (error.message.includes("404") || error.message.includes("not found")) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
