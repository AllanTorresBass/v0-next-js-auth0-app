/**
 * Refactored User by ID API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/user.service'
import { withAuth, withPermission, AuthenticatedRequest } from '@/lib/middleware/auth.middleware'
import { validateRequest, updateUserSchema } from '@/lib/validation/schemas'
import { createErrorResponse, handleError } from '@/lib/errors'

const userService = new UserService()

// GET /api/v2/users/[id] - Get user by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await userService.getUserById(id)
    return NextResponse.json(result)
  } catch (error: any) {
    const appError = handleError(error, request.url)
    return NextResponse.json(createErrorResponse(appError), { status: appError.statusCode })
  }
}

// PATCH /api/v2/users/[id] - Update user
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const userData = validateRequest(updateUserSchema, body)
    
    const result = await userService.updateUser(id, userData)
    return NextResponse.json(result)
  } catch (error: any) {
    const appError = handleError(error, request.url)
    return NextResponse.json(createErrorResponse(appError), { status: appError.statusCode })
  }
}

// DELETE /api/v2/users/[id] - Delete user
export const DELETE = withPermission('users:delete')(async (request: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params
    const result = await userService.deleteUser(id)
    return NextResponse.json(result)
  } catch (error: any) {
    const appError = handleError(error, request.url)
    return NextResponse.json(createErrorResponse(appError), { status: appError.statusCode })
  }
}
