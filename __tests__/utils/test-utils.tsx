/**
 * Test utilities and helpers
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock providers for testing
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Mock API responses
export const mockApiResponse = <T>(data: T, success: boolean = true) => ({
  success,
  data: success ? data : undefined,
  error: success ? undefined : 'Test error',
})

// Mock fetch responses
export const mockFetch = (response: any, ok: boolean = true) => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    json: jest.fn().mockResolvedValueOnce(response),
  })
}

// Mock Auth0 user
export const mockUser = {
  sub: 'auth0|test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  roles: ['admin'],
  permissions: ['users:read', 'users:create', 'users:update', 'users:delete'],
}

// Mock users data
export const mockUsers = [
  {
    id: '1',
    sub: 'auth0|user-1',
    email: 'user1@example.com',
    name: 'User One',
    status: 'active',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    roles: [],
    permissions: [],
  },
  {
    id: '2',
    sub: 'auth0|user-2',
    email: 'user2@example.com',
    name: 'User Two',
    status: 'active',
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
    roles: [],
    permissions: [],
  },
]

// Mock roles data
export const mockRoles = [
  {
    id: 'role-1',
    name: 'admin',
    description: 'Administrator role',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    permissions: [],
  },
  {
    id: 'role-2',
    name: 'user',
    description: 'Regular user role',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    permissions: [],
  },
]

// Mock permissions data
export const mockPermissions = [
  {
    id: 'users:read',
    name: 'users:read',
    description: 'Read user information',
    category: 'users',
    resourceServerIdentifier: 'http://localhost:3000/',
    resourceServerName: 'Next.js RBAC App',
  },
  {
    id: 'users:create',
    name: 'users:create',
    description: 'Create new users',
    category: 'users',
    resourceServerIdentifier: 'http://localhost:3000/',
    resourceServerName: 'Next.js RBAC App',
  },
]

// Test helpers
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const createMockRequest = (overrides: Partial<Request> = {}): Request => ({
  url: 'http://localhost:3000/api/test',
  method: 'GET',
  headers: new Headers(),
  ...overrides,
} as Request)

export const createMockResponse = (data: any, status: number = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: jest.fn().mockResolvedValue(data),
})

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
