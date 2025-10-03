/**
 * Permission service with business logic for permission management
 */

import { BaseService } from './base.service'
import { Permission, CreatePermissionRequest, ApiResponse, PaginationParams } from '../types'
import { PermissionRepository } from '../repositories/permission.repository'
import { AppError, ValidationError, ConflictError } from '../errors'

export class PermissionService extends BaseService {
  private permissionRepository: PermissionRepository

  constructor() {
    super()
    this.permissionRepository = new PermissionRepository()
  }

  async getPermissions(params?: PaginationParams): Promise<ApiResponse<Permission[]>> {
    try {
      const result = await this.permissionRepository.findAll(params)
      
      if (params) {
        return this.createPaginatedResponse(result.data, result.pagination!)
      }
      
      return this.createSuccessResponse(result.data)
    } catch (error: any) {
      this.handleServiceError(error, 'getPermissions')
    }
  }

  async getPermissionById(id: string): Promise<ApiResponse<Permission>> {
    try {
      this.validateRequired(id, 'Permission ID')
      
      const permission = await this.permissionRepository.findById(id)
      if (!permission) {
        throw new AppError('Permission not found', 'NOT_FOUND', 404)
      }

      return this.createSuccessResponse(permission)
    } catch (error: any) {
      this.handleServiceError(error, 'getPermissionById')
    }
  }

  async createPermission(permissionData: CreatePermissionRequest): Promise<ApiResponse<Permission>> {
    try {
      // Validate input
      this.validateRequired(permissionData.name, 'Permission name')
      this.validateRequired(permissionData.description, 'Permission description')
      this.validateRequired(permissionData.resourceServerIdentifier, 'Resource server identifier')
      
      // Validate permission name format
      if (!/^[a-zA-Z0-9:_-]+$/.test(permissionData.name)) {
        throw new ValidationError('Permission name can only contain letters, numbers, colons, hyphens, and underscores')
      }

      // Check if permission already exists
      const existingPermissions = await this.permissionRepository.findAll()
      const existingPermission = existingPermissions.data.find(p => 
        p.name.toLowerCase() === permissionData.name.toLowerCase() &&
        p.resourceServerIdentifier === permissionData.resourceServerIdentifier
      )
      if (existingPermission) {
        throw new ConflictError('Permission with this name already exists for this resource server')
      }

      const permission = await this.permissionRepository.create(permissionData)
      return this.createSuccessResponse(permission, 'Permission created successfully')
    } catch (error: any) {
      this.handleServiceError(error, 'createPermission')
    }
  }

  async getPermissionsByCategory(category: string): Promise<ApiResponse<Permission[]>> {
    try {
      this.validateRequired(category, 'Category')
      
      const result = await this.permissionRepository.findAll()
      const permissions = result.data.filter(p => p.category === category)

      return this.createSuccessResponse(permissions)
    } catch (error: any) {
      this.handleServiceError(error, 'getPermissionsByCategory')
    }
  }

  async getPermissionsByResourceServer(resourceServerIdentifier: string): Promise<ApiResponse<Permission[]>> {
    try {
      this.validateRequired(resourceServerIdentifier, 'Resource server identifier')
      
      const result = await this.permissionRepository.findAll()
      const permissions = result.data.filter(p => p.resourceServerIdentifier === resourceServerIdentifier)

      return this.createSuccessResponse(permissions)
    } catch (error: any) {
      this.handleServiceError(error, 'getPermissionsByResourceServer')
    }
  }

  async searchPermissions(searchTerm: string, limit: number = 10): Promise<ApiResponse<Permission[]>> {
    try {
      this.validateRequired(searchTerm, 'Search term')
      
      const result = await this.permissionRepository.findAll({
        page: 1,
        limit
      })
      
      const permissions = result.data.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      )

      return this.createSuccessResponse(permissions)
    } catch (error: any) {
      this.handleServiceError(error, 'searchPermissions')
    }
  }

  async getPermissionStats(): Promise<ApiResponse<{
    total: number
    byCategory: Record<string, number>
    byResourceServer: Record<string, number>
  }>> {
    try {
      const result = await this.permissionRepository.findAll()
      const permissions = result.data

      const stats = {
        total: permissions.length,
        byCategory: permissions.reduce((acc, perm) => {
          acc[perm.category] = (acc[perm.category] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        byResourceServer: permissions.reduce((acc, perm) => {
          acc[perm.resourceServerIdentifier] = (acc[perm.resourceServerIdentifier] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }

      return this.createSuccessResponse(stats)
    } catch (error: any) {
      this.handleServiceError(error, 'getPermissionStats')
    }
  }

  async getAvailablePermissions(): Promise<ApiResponse<Permission[]>> {
    try {
      // Get all permissions (both Auth0 and application permissions)
      const result = await this.permissionRepository.findAll()
      
      // Sort by category and name
      const sortedPermissions = result.data.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category)
        }
        return a.name.localeCompare(b.name)
      })

      return this.createSuccessResponse(sortedPermissions)
    } catch (error: any) {
      this.handleServiceError(error, 'getAvailablePermissions')
    }
  }
}
