/**
 * Custom error classes for the RBAC application
 */

import { ErrorCode } from '../types'

export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly details?: Record<string, any>
  public readonly timestamp: string
  public readonly path?: string

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    details?: Record<string, any>,
    path?: string
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.timestamp = new Date().toISOString()
    this.path = path

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      path: this.path,
      stack: this.stack
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>, path?: string) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, details, path)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', path?: string) {
    super(message, ErrorCode.AUTHENTICATION_ERROR, 401, undefined, path)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', path?: string) {
    super(message, ErrorCode.AUTHORIZATION_ERROR, 403, undefined, path)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string, path?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`
    super(message, ErrorCode.NOT_FOUND, 404, { resource, id }, path)
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>, path?: string) {
    super(message, ErrorCode.CONFLICT, 409, details, path)
  }
}

export class Auth0Error extends AppError {
  constructor(message: string, auth0Error?: any, path?: string) {
    super(message, ErrorCode.AUTH0_ERROR, 500, { auth0Error }, path)
  }
}

export class InternalError extends AppError {
  constructor(message: string, details?: Record<string, any>, path?: string) {
    super(message, ErrorCode.INTERNAL_ERROR, 500, details, path)
  }
}

// ===== ERROR HANDLING UTILITIES =====

export function isAppError(error: any): error is AppError {
  return error instanceof AppError
}

export function handleError(error: any, path?: string): AppError {
  if (isAppError(error)) {
    return error
  }

  // Handle Auth0 errors
  if (error.message?.includes('Auth0') || error.message?.includes('auth0')) {
    return new Auth0Error(error.message, error, path)
  }

  // Handle validation errors
  if (error.message?.includes('validation') || error.message?.includes('required')) {
    return new ValidationError(error.message, undefined, path)
  }

  // Handle not found errors
  if (error.message?.includes('not found') || error.message?.includes('404')) {
    return new NotFoundError('Resource', undefined, path)
  }

  // Handle conflict errors
  if (error.message?.includes('already exists') || error.message?.includes('conflict')) {
    return new ConflictError(error.message, undefined, path)
  }

  // Default to internal error
  return new InternalError(error.message || 'An unexpected error occurred', { originalError: error }, path)
}

export function createErrorResponse(error: AppError) {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp,
      path: error.path
    }
  }
}
