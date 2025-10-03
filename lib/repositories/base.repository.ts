/**
 * Base repository interface and abstract class
 */

import { PaginationParams, PaginationMeta } from '../types'

export interface RepositoryResult<T> {
  data: T
  pagination?: PaginationMeta
}

export interface BaseRepository<T, CreateData, UpdateData, QueryParams = any> {
  findById(id: string): Promise<T | null>
  findAll(params?: QueryParams): Promise<RepositoryResult<T[]>>
  create(data: CreateData): Promise<T>
  update(id: string, data: UpdateData): Promise<T>
  delete(id: string): Promise<void>
  exists(id: string): Promise<boolean>
}

export abstract class BaseRepositoryImpl<T, CreateData, UpdateData, QueryParams = any> 
  implements BaseRepository<T, CreateData, UpdateData, QueryParams> {
  
  protected abstract entityName: string

  abstract findById(id: string): Promise<T | null>
  abstract findAll(params?: QueryParams): Promise<RepositoryResult<T[]>>
  abstract create(data: CreateData): Promise<T>
  abstract update(id: string, data: UpdateData): Promise<T>
  abstract delete(id: string): Promise<void>

  async exists(id: string): Promise<boolean> {
    const entity = await this.findById(id)
    return entity !== null
  }

  protected createPaginationMeta(
    data: T[],
    params: PaginationParams,
    total: number
  ): PaginationMeta {
    const { page = 1, limit = 10 } = params
    const totalPages = Math.ceil(total / limit)
    
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }

  protected handleError(error: any, operation: string): never {
    console.error(`Repository error in ${this.entityName}.${operation}:`, error)
    throw error
  }
}
