/**
 * Base service class with common functionality
 */

import { ApiResponse, PaginationMeta } from '../types'
import { AppError, handleError } from '../errors'

export abstract class BaseService {
  protected createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message
    }
  }

  protected createErrorResponse(error: AppError): ApiResponse {
    return {
      success: false,
      error: error.message
    }
  }

  protected createPaginatedResponse<T>(
    data: T[],
    pagination: PaginationMeta,
    message?: string
  ): ApiResponse<T[]> {
    return {
      success: true,
      data,
      pagination,
      message
    }
  }

  protected handleServiceError(error: any, operation: string, context?: string): never {
    const errorContext = context ? `${context}.${operation}` : operation
    const appError = handleError(error, errorContext)
    console.error(`Service error in ${errorContext}:`, appError)
    throw appError
  }

  protected validateRequired<T>(value: T | undefined, fieldName: string): T {
    if (value === undefined || value === null) {
      throw new AppError(`${fieldName} is required`, 'VALIDATION_ERROR', 400)
    }
    return value
  }

  protected validateEmail(email: string): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new AppError('Invalid email format', 'VALIDATION_ERROR', 400)
    }
    return email
  }

  protected validatePassword(password: string): string {
    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 'VALIDATION_ERROR', 400)
    }
    return password
  }
}
