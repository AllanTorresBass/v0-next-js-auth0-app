/**
 * Custom hooks for user management
 */

import { useApi, usePaginatedApi, useMutation, useDebouncedSearch } from './use-api'
import { User, CreateUserRequest, UpdateUserRequest, UserQuery } from '@/lib/types'

// ===== USER LIST HOOK =====

export function useUsers(query?: UserQuery) {
  return usePaginatedApi<User>(
    async (page, limit) => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(query?.search && { search: query.search }),
        ...(query?.status && { status: query.status }),
        ...(query?.role && { role: query.role }),
        ...(query?.sortBy && { sortBy: query.sortBy }),
        ...(query?.sortOrder && { sortOrder: query.sortOrder }),
        ...(query?.includeInactive && { includeInactive: query.includeInactive.toString() })
      })

      const response = await fetch(`/api/v2/users?${params}`)
      return await response.json()
    },
    query?.page || 1,
    query?.limit || 10
  )
}

// ===== USER BY ID HOOK =====

export function useUser(id: string) {
  return useApi<User>(
    async () => {
      const response = await fetch(`/api/v2/users/${encodeURIComponent(id)}`)
      return await response.json()
    },
    [id]
  )
}

// ===== USER STATS HOOK =====

export function useUserStats() {
  return useApi<{
    total: number
    active: number
    inactive: number
    byRole: Record<string, number>
  }>(
    async () => {
      const response = await fetch('/api/v2/users/stats')
      return await response.json()
    }
  )
}

// ===== USER MUTATIONS =====

export function useCreateUser() {
  return useMutation<User, CreateUserRequest>(
    async (userData) => {
      const response = await fetch('/api/v2/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      return await response.json()
    }
  )
}

export function useUpdateUser() {
  return useMutation<User, { id: string; data: UpdateUserRequest }>(
    async ({ id, data }) => {
      const response = await fetch(`/api/v2/users/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      return await response.json()
    }
  )
}

export function useDeleteUser() {
  return useMutation<void, string>(
    async (id) => {
      const response = await fetch(`/api/v2/users/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      })
      return await response.json()
    }
  )
}

// ===== BULK OPERATIONS =====

export function useBulkCreateUsers() {
  return useMutation<User[], CreateUserRequest[]>(
    async (users) => {
      const response = await fetch('/api/v2/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk-create',
          data: { users }
        })
      })
      return await response.json()
    }
  )
}

export function useBulkUpdateUsers() {
  return useMutation<User[], { userIds: string[]; data: UpdateUserRequest }>(
    async ({ userIds, data }) => {
      const response = await fetch('/api/v2/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk-update',
          userIds,
          data
        })
      })
      return await response.json()
    }
  )
}

export function useBulkDeleteUsers() {
  return useMutation<void, string[]>(
    async (userIds) => {
      const response = await fetch('/api/v2/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk-delete',
          userIds
        })
      })
      return await response.json()
    }
  )
}

// ===== USER SEARCH =====

export function useUserSearch() {
  return useDebouncedSearch<User>(
    async (query) => {
      const response = await fetch(`/api/v2/users/search?q=${encodeURIComponent(query)}`)
      return await response.json()
    }
  )
}