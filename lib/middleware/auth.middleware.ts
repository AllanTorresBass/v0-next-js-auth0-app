/**
 * Authentication and authorization middleware
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '../auth0'
import { AuthenticationError, AuthorizationError } from '../errors'
import { UserContext } from '../types'
import { hasPermission, Permission } from '../rbac/permissions'

export interface AuthenticatedRequest extends NextRequest {
  user?: UserContext
}

export async function requireAuth(request: NextRequest): Promise<UserContext> {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      throw new AuthenticationError('Authentication required')
    }

    // Transform Auth0 user to our UserContext
    const userContext: UserContext = {
      id: session.user.sub,
      email: session.user.email || '',
      name: session.user.name || '',
      roles: session.user.roles || [],
      permissions: session.user.permissions || [],
      isAuthenticated: true
    }

    return userContext
  } catch (error: any) {
    if (error instanceof AuthenticationError) {
      throw error
    }
    throw new AuthenticationError('Invalid authentication')
  }
}

export async function requirePermission(permission: Permission) {
  return async (request: NextRequest): Promise<UserContext> => {
    const user = await requireAuth(request)
    
    if (!hasPermission(user.roles as any, permission, user.permissions)) {
      throw new AuthorizationError(`Permission '${permission}' required`)
    }

    return user
  }
}

export async function requireRole(role: string) {
  return async (request: NextRequest): Promise<UserContext> => {
    const user = await requireAuth(request)
    
    if (!user.roles.includes(role)) {
      throw new AuthorizationError(`Role '${role}' required`)
    }

    return user
  }
}

export async function requireAnyRole(roles: string[]) {
  return async (request: NextRequest): Promise<UserContext> => {
    const user = await requireAuth(request)
    
    const hasAnyRole = roles.some(role => user.roles.includes(role))
    if (!hasAnyRole) {
      throw new AuthorizationError(`One of these roles required: ${roles.join(', ')}`)
    }

    return user
  }
}

export function withAuth(handler: (request: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const user = await requireAuth(request)
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = user
      
      return await handler(authenticatedRequest)
    } catch (error: any) {
      if (error instanceof AuthenticationError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      )
    }
  }
}

export function withPermission(permission: Permission) {
  return (handler: (request: AuthenticatedRequest, context?: any) => Promise<NextResponse>) => {
    return async (request: NextRequest, context?: any): Promise<NextResponse> => {
      try {
        const user = await requirePermission(permission)(request)
        const authenticatedRequest = request as AuthenticatedRequest
        authenticatedRequest.user = user
        
        return await handler(authenticatedRequest, context)
      } catch (error: any) {
        if (error instanceof AuthenticationError) {
          return NextResponse.json(
            { success: false, error: error.message },
            { status: 401 }
          )
        }
        
        if (error instanceof AuthorizationError) {
          return NextResponse.json(
            { success: false, error: error.message },
            { status: 403 }
          )
        }
        
        return NextResponse.json(
          { success: false, error: 'Authorization failed' },
          { status: 403 }
        )
      }
    }
  }
}

export function withRole(role: string) {
  return (handler: (request: AuthenticatedRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest): Promise<NextResponse> => {
      try {
        const user = await requireRole(role)(request)
        const authenticatedRequest = request as AuthenticatedRequest
        authenticatedRequest.user = user
        
        return await handler(authenticatedRequest)
      } catch (error: any) {
        if (error instanceof AuthenticationError) {
          return NextResponse.json(
            { success: false, error: error.message },
            { status: 401 }
          )
        }
        
        if (error instanceof AuthorizationError) {
          return NextResponse.json(
            { success: false, error: error.message },
            { status: 403 }
          )
        }
        
        return NextResponse.json(
          { success: false, error: 'Authorization failed' },
          { status: 403 }
        )
      }
    }
  }
}

export function withAnyRole(roles: string[]) {
  return (handler: (request: AuthenticatedRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest): Promise<NextResponse> => {
      try {
        const user = await requireAnyRole(roles)(request)
        const authenticatedRequest = request as AuthenticatedRequest
        authenticatedRequest.user = user
        
        return await handler(authenticatedRequest)
      } catch (error: any) {
        if (error instanceof AuthenticationError) {
          return NextResponse.json(
            { success: false, error: error.message },
            { status: 401 }
          )
        }
        
        if (error instanceof AuthorizationError) {
          return NextResponse.json(
            { success: false, error: error.message },
            { status: 403 }
          )
        }
        
        return NextResponse.json(
          { success: false, error: 'Authorization failed' },
          { status: 403 }
        )
      }
    }
  }
}
