// User switcher functionality removed - using Auth0 sessions only

/**
 * Create headers for API requests
 */
export function createApiHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  }
}

/**
 * Enhanced fetch function for API requests
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = {
    ...createApiHeaders(),
    ...options.headers,
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

/**
 * API service functions
 */
export class ApiService {
  async get(url: string, options: RequestInit = {}) {
    return apiFetch(url, { ...options, method: 'GET' })
  }

  async post(url: string, data: any, options: RequestInit = {}) {
    return apiFetch(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async patch(url: string, data: any, options: RequestInit = {}) {
    return apiFetch(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async delete(url: string, options: RequestInit = {}) {
    return apiFetch(url, { ...options, method: 'DELETE' })
  }
}
