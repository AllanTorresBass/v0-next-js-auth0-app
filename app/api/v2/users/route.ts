/**
 * Refactored Users API Route with proper architecture
 */

import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/user.service'
import { withAuth, withPermission, AuthenticatedRequest } from '@/lib/middleware/auth.middleware'
import { validateRequest, userQuerySchema, createUserSchema, bulkUserOperationSchema } from '@/lib/validation/schemas'
import { createErrorResponse, handleError } from '@/lib/errors'
import { Permission } from '@/lib/rbac/permissions'

const userService = new UserService()

// GET /api/v2/users - Get users with pagination and filtering
export const GET = withPermission('users:read')(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const query = validateRequest(userQuerySchema, Object.fromEntries(searchParams.entries()))
    
    const result = await userService.getUsers(query)
    return NextResponse.json(result)
  } catch (error: any) {
    const appError = handleError(error, request.url)
    return NextResponse.json(createErrorResponse(appError), { status: appError.statusCode })
  }
})

// POST /api/v2/users - Create user or perform bulk operations
export const POST = withPermission('users:create')(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json()
    
    // Check if it's a bulk operation
    if (body.action) {
      const operation = validateRequest(bulkUserOperationSchema, body)
      
      switch (operation.action) {
        case 'bulk-create':
          const createData = validateRequest(bulkCreateUsersSchema, operation.data)
          const createResult = await userService.bulkCreateUsers(createData.users)
          return NextResponse.json(createResult)
          
        case 'bulk-update':
          const updateData = validateRequest(bulkUpdateUsersSchema, operation)
          const updateResult = await userService.bulkUpdateUsers(updateData.userIds, updateData.data)
          return NextResponse.json(updateResult)
          
        case 'bulk-delete':
          const deleteData = validateRequest(bulkDeleteUsersSchema, operation)
          const deleteResult = await userService.bulkDeleteUsers(deleteData.userIds)
          return NextResponse.json(deleteResult)
          
        case 'export':
          // TODO: Implement export functionality
          return NextResponse.json({ success: false, error: 'Export not implemented' }, { status: 501 })
          
        default:
          return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
      }
    }
    
    // Single user creation
    const userData = validateRequest(createUserSchema, body)
    const result = await userService.createUser(userData)
    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    const appError = handleError(error, request.url)
    return NextResponse.json(createErrorResponse(appError), { status: appError.statusCode })
  }
})
