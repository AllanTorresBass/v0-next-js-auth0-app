interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  retryAfterMs: number
}

interface RequestQueue {
  resolve: (value: any) => void
  reject: (error: any) => void
  request: () => Promise<any>
  retryCount: number
}

class RateLimiter {
  private config: RateLimitConfig
  private requestCount = 0
  private windowStart = Date.now()
  private queue: RequestQueue[] = []
  private isProcessing = false

  constructor(config: RateLimitConfig = {
    maxRequests: 10, // Auth0 allows 10 requests per second
    windowMs: 1000, // 1 second window
    retryAfterMs: 1000 // Wait 1 second before retry
  }) {
    this.config = config
  }

  async execute<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        resolve,
        reject,
        request,
        retryCount: 0
      })
      
      this.processQueue()
    })
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return
    }

    this.isProcessing = true

    while (this.queue.length > 0) {
      // Reset window if needed
      if (Date.now() - this.windowStart >= this.config.windowMs) {
        this.requestCount = 0
        this.windowStart = Date.now()
      }

      // Check if we can make a request
      if (this.requestCount >= this.config.maxRequests) {
        const waitTime = this.config.windowMs - (Date.now() - this.windowStart)
        if (waitTime > 0) {
          await this.delay(waitTime)
          continue
        }
      }

      const requestItem = this.queue.shift()!
      this.requestCount++

      try {
        const result = await this.executeWithRetry(requestItem)
        requestItem.resolve(result)
      } catch (error) {
        requestItem.reject(error)
      }
    }

    this.isProcessing = false
  }

  private async executeWithRetry<T>(requestItem: RequestQueue): Promise<T> {
    const maxRetries = 3
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestItem.request()
      } catch (error: any) {
        lastError = error

        // Check if it's a rate limit error
        if (this.isRateLimitError(error)) {
          if (attempt < maxRetries) {
            const retryDelay = this.calculateRetryDelay(attempt, error)
            console.warn(`Rate limit hit, retrying in ${retryDelay}ms (attempt ${attempt + 1}/${maxRetries + 1})`)
            await this.delay(retryDelay)
            continue
          }
        }

        // For non-rate-limit errors or max retries reached, throw immediately
        throw error
      }
    }

    throw lastError!
  }

  private isRateLimitError(error: any): boolean {
    if (!error) return false
    
    const message = error.message?.toLowerCase() || ''
    const statusText = error.statusText?.toLowerCase() || ''
    
    return (
      message.includes('too many requests') ||
      message.includes('rate limit') ||
      message.includes('429') ||
      statusText.includes('too many requests') ||
      statusText.includes('429')
    )
  }

  private calculateRetryDelay(attempt: number, error: any): number {
    // Check for Retry-After header
    const retryAfter = error.retryAfter || error.headers?.['retry-after']
    if (retryAfter) {
      return parseInt(retryAfter) * 1000
    }

    // Exponential backoff with jitter
    const baseDelay = this.config.retryAfterMs
    const exponentialDelay = baseDelay * Math.pow(2, attempt)
    const jitter = Math.random() * 1000 // Add up to 1 second of jitter
    return Math.min(exponentialDelay + jitter, 30000) // Cap at 30 seconds
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Global rate limiter instance
export const auth0RateLimiter = new RateLimiter({
  maxRequests: 8, // Conservative limit (Auth0 allows 10/sec)
  windowMs: 1000,
  retryAfterMs: 1000
})

// Utility function for making rate-limited requests
export async function withRateLimit<T>(request: () => Promise<T>): Promise<T> {
  return auth0RateLimiter.execute(request)
}
