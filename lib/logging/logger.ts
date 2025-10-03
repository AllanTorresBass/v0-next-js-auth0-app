/**
 * Centralized logging system
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: string
  userId?: string
  requestId?: string
  metadata?: Record<string, any>
  error?: Error
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private formatLogEntry(entry: LogEntry): string {
    const baseInfo = {
      level: entry.level,
      message: entry.message,
      timestamp: entry.timestamp,
      ...(entry.context && { context: entry.context }),
      ...(entry.userId && { userId: entry.userId }),
      ...(entry.requestId && { requestId: entry.requestId }),
      ...(entry.metadata && { metadata: entry.metadata })
    }

    if (entry.error) {
      return JSON.stringify({
        ...baseInfo,
        error: {
          name: entry.error.name,
          message: entry.error.message,
          stack: entry.error.stack
        }
      })
    }

    return JSON.stringify(baseInfo)
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true
    
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG]
    const currentLevelIndex = levels.indexOf(level)
    const minLevelIndex = this.isProduction ? levels.indexOf(LogLevel.INFO) : 0
    
    return currentLevelIndex >= minLevelIndex
  }

  private log(level: LogLevel, message: string, context?: string, metadata?: Record<string, any>, error?: Error) {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      metadata,
      error
    }

    const formattedLog = this.formatLogEntry(entry)

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedLog)
        break
      case LogLevel.INFO:
        console.info(formattedLog)
        break
      case LogLevel.WARN:
        console.warn(formattedLog)
        break
      case LogLevel.ERROR:
        console.error(formattedLog)
        break
    }

    // In production, you might want to send logs to an external service
    if (this.isProduction) {
      this.sendToExternalService(entry)
    }
  }

  private sendToExternalService(entry: LogEntry) {
    // TODO: Implement external logging service (e.g., DataDog, LogRocket, etc.)
    // This is where you would send logs to your monitoring service
  }

  debug(message: string, context?: string, metadata?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context, metadata)
  }

  info(message: string, context?: string, metadata?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context, metadata)
  }

  warn(message: string, context?: string, metadata?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context, metadata)
  }

  error(message: string, error?: Error, context?: string, metadata?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, context, metadata, error)
  }

  // Request logging
  logRequest(method: string, url: string, userId?: string, requestId?: string, metadata?: Record<string, any>) {
    this.info(`${method} ${url}`, 'HTTP_REQUEST', {
      method,
      url,
      userId,
      requestId,
      ...metadata
    })
  }

  // Response logging
  logResponse(method: string, url: string, statusCode: number, duration: number, userId?: string, requestId?: string) {
    const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO
    this.log(level, `${method} ${url} - ${statusCode}`, 'HTTP_RESPONSE', {
      method,
      url,
      statusCode,
      duration,
      userId,
      requestId
    })
  }

  // Auth logging
  logAuth(action: string, userId?: string, success: boolean = true, metadata?: Record<string, any>) {
    const level = success ? LogLevel.INFO : LogLevel.WARN
    this.log(level, `Auth ${action}`, 'AUTH', {
      action,
      userId,
      success,
      ...metadata
    })
  }

  // Database logging
  logDatabase(operation: string, table: string, duration?: number, metadata?: Record<string, any>) {
    this.debug(`Database ${operation} on ${table}`, 'DATABASE', {
      operation,
      table,
      duration,
      ...metadata
    })
  }

  // Performance logging
  logPerformance(operation: string, duration: number, metadata?: Record<string, any>) {
    const level = duration > 1000 ? LogLevel.WARN : LogLevel.DEBUG
    this.log(level, `Performance: ${operation} took ${duration}ms`, 'PERFORMANCE', {
      operation,
      duration,
      ...metadata
    })
  }
}

export const logger = new Logger()
