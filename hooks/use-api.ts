/**
 * Custom hooks for API data fetching with proper error handling
 */

import { useState, useEffect, useCallback } from 'react'
import { UseApiResult, UsePaginationResult, PaginationMeta } from '@/lib/types'

// ===== BASE API HOOK =====

export function useApi<T>(
  apiCall: () => Promise<{ success: boolean; data?: T; error?: string }>,
  dependencies: any[] = []
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await apiCall()
      
      if (result.success) {
        setData(result.data || null)
      } else {
        setError(result.error || 'An error occurred')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, dependencies)

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData
  }
}

// ===== PAGINATED API HOOK =====

export function usePaginatedApi<T>(
  apiCall: (page: number, limit: number) => Promise<{ 
    success: boolean; 
    data?: T[]; 
    pagination?: PaginationMeta;
    error?: string 
  }>,
  initialPage: number = 1,
  initialLimit: number = 10
): UsePaginationResult<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [page, setPage] = useState(initialPage)
  const [limit] = useState(initialLimit)

  const fetchData = useCallback(async (pageNum: number = page) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await apiCall(pageNum, limit)
      
      if (result.success) {
        setData(result.data || [])
        setPagination(result.pagination || null)
        setPage(pageNum)
      } else {
        setError(result.error || 'An error occurred')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [apiCall, page, limit])

  const loadMore = useCallback(async () => {
    if (pagination?.hasNext) {
      await fetchData(page + 1)
    }
  }, [fetchData, page, pagination])

  useEffect(() => {
    fetchData(1)
  }, [apiCall])

  return {
    data,
    loading,
    error,
    pagination,
    refetch: () => fetchData(1),
    loadMore
  }
}

// ===== MUTATION HOOK =====

export function useMutation<T, P = any>(
  mutationFn: (params: P) => Promise<{ success: boolean; data?: T; error?: string }>
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<T | null>(null)

  const mutate = useCallback(async (params: P) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await mutationFn(params)
      
      if (result.success) {
        setData(result.data || null)
        return { success: true, data: result.data }
      } else {
        setError(result.error || 'An error occurred')
        return { success: false, error: result.error }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [mutationFn])

  return {
    mutate,
    loading,
    error,
    data
  }
}

// ===== DEBOUNCED SEARCH HOOK =====

export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<{ success: boolean; data?: T[]; error?: string }>,
  delay: number = 300
) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true)
        setError(null)
        
        const result = await searchFn(query)
        
        if (result.success) {
          setResults(result.data || [])
        } else {
          setError(result.error || 'Search failed')
        }
      } catch (err: any) {
        setError(err.message || 'Search failed')
      } finally {
        setLoading(false)
      }
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [query, searchFn, delay])

  return {
    query,
    setQuery,
    results,
    loading,
    error
  }
}
