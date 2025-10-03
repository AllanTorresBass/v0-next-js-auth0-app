/**
 * Request/Response logging middleware
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '../logging/logger'

export function withLogging(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now()
    const requestId = crypto.randomUUID()
    const method = request.method
    const url = request.url

    // Log request
    logger.logRequest(method, url, undefined, requestId, {
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      referer: request.headers.get('referer')
    })

    try {
      const response = await handler(request)
      const duration = Date.now() - startTime

      // Log response
      logger.logResponse(method, url, response.status, duration, undefined, requestId)

      // Add request ID to response headers
      response.headers.set('X-Request-ID', requestId)
      response.headers.set('X-Response-Time', `${duration}ms`)

      return response
    } catch (error: any) {
      const duration = Date.now() - startTime
      
      // Log error
      logger.error(`Request failed: ${method} ${url}`, error, 'HTTP_ERROR', {
        method,
        url,
        duration,
        requestId
      })

      // Return error response
      return NextResponse.json(
        { 
          success: false, 
          error: 'Internal server error',
          requestId 
        },
        { 
          status: 500,
          headers: {
            'X-Request-ID': requestId,
            'X-Response-Time': `${duration}ms`
          }
        }
      )
    }
  }
}

export function withPerformanceLogging(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now()
    const operation = `${request.method} ${request.url}`

    try {
      const response = await handler(request)
      const duration = Date.now() - startTime

      logger.logPerformance(operation, duration, {
        statusCode: response.status,
        url: request.url,
        method: request.method
      })

      return response
    } catch (error: any) {
      const duration = Date.now() - startTime
      
      logger.logPerformance(operation, duration, {
        error: error.message,
        url: request.url,
        method: request.method
      })

      throw error
    }
  }
}
