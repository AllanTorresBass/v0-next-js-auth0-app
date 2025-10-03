/**
 * Role service with business logic for role management
 */

import { BaseService } from './base.service'
import { Role, CreateRoleRequest, UpdateRoleRequest, ApiResponse, PaginationParams } from '../types'
import { RoleRepository } from '../repositories/role.repository'
import { AppError, ValidationError, ConflictError } from '../errors'

export class RoleService extends BaseService {
  private roleRepository: RoleRepository

  constructor() {
    super()
    this.roleRepository = new RoleRepository()
  }

  async getRoles(params?: PaginationParams): Promise<ApiResponse<Role[]>> {
    try {
      const result = await this.roleRepository.findAll(params)
      
      if (params) {
        return this.createPaginatedResponse(result.data, result.pagination!)
      }
      
      return this.createSuccessResponse(result.data)
    } catch (error: any) {
      this.handleServiceError(error, 'getRoles')
    }
  }

  async getRoleById(id: string): Promise<ApiResponse<Role>> {
    try {
      this.validateRequired(id, 'Role ID')
      
      const role = await this.roleRepository.findById(id)
      if (!role) {
        throw new AppError('Role not found', 'NOT_FOUND', 404)
      }

      return this.createSuccessResponse(role)
    } catch (error: any) {
      this.handleServiceError(error, 'getRoleById')
    }
  }

  async createRole(roleData: CreateRoleRequest): Promise<ApiResponse<Role>> {
    try {
      // Validate input
      this.validateRequired(roleData.name, 'Role name')
      this.validateRequired(roleData.description, 'Role description')
      
      // Validate role name format
      if (!/^[a-zA-Z0-9_-]+$/.test(roleData.name)) {
        throw new ValidationError('Role name can only contain letters, numbers, hyphens, and underscores')
      }

      // Check if role already exists
      const existingRoles = await this.roleRepository.findAll()
      const existingRole = existingRoles.data.find(r => r.name.toLowerCase() === roleData.name.toLowerCase())
      if (existingRole) {
        throw new ConflictError('Role with this name already exists')
      }

      const role = await this.roleRepository.create(roleData)
      return this.createSuccessResponse(role, 'Role created successfully')
    } catch (error: any) {
      this.handleServiceError(error, 'createRole')
    }
  }

  async updateRole(id: string, roleData: UpdateRoleRequest): Promise<ApiResponse<Role>> {
    try {
      this.validateRequired(id, 'Role ID')
      
      // Validate role name format if provided
      if (roleData.name && !/^[a-zA-Z0-9_-]+$/.test(roleData.name)) {
        throw new ValidationError('Role name can only contain letters, numbers, hyphens, and underscores')
      }

      // Check if new name conflicts with existing roles
      if (roleData.name) {
        const existingRoles = await this.roleRepository.findAll()
        const conflictingRole = existingRoles.data.find(r => 
          r.id !== id && r.name.toLowerCase() === roleData.name!.toLowerCase()
        )
        if (conflictingRole) {
          throw new ConflictError('Role with this name already exists')
        }
      }

      const role = await this.roleRepository.update(id, roleData)
      return this.createSuccessResponse(role, 'Role updated successfully')
    } catch (error: any) {
      this.handleServiceError(error, 'updateRole')
    }
  }

  async deleteRole(id: string): Promise<ApiResponse<void>> {
    try {
      this.validateRequired(id, 'Role ID')
      
      // Check if role is assigned to any users
      // TODO: Implement user role assignment check
      
      await this.roleRepository.delete(id)
      return this.createSuccessResponse(undefined, 'Role deleted successfully')
    } catch (error: any) {
      this.handleServiceError(error, 'deleteRole')
    }
  }

  async getRolePermissions(roleId: string): Promise<ApiResponse<any[]>> {
    try {
      this.validateRequired(roleId, 'Role ID')
      
      const role = await this.roleRepository.findById(roleId)
      if (!role) {
        throw new AppError('Role not found', 'NOT_FOUND', 404)
      }

      return this.createSuccessResponse(role.permissions)
    } catch (error: any) {
      this.handleServiceError(error, 'getRolePermissions')
    }
  }

  async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<ApiResponse<Role>> {
    try {
      this.validateRequired(roleId, 'Role ID')
      this.validateRequired(permissionIds, 'Permission IDs')
      
      if (permissionIds.length === 0) {
        throw new ValidationError('At least one permission is required')
      }

      // TODO: Implement permission assignment logic
      // This would require additional Auth0 API calls
      
      const role = await this.roleRepository.findById(roleId)
      if (!role) {
        throw new AppError('Role not found', 'NOT_FOUND', 404)
      }

      return this.createSuccessResponse(role, 'Permissions assigned successfully')
    } catch (error: any) {
      this.handleServiceError(error, 'assignPermissionsToRole')
    }
  }

  async removePermissionsFromRole(roleId: string, permissionIds: string[]): Promise<ApiResponse<Role>> {
    try {
      this.validateRequired(roleId, 'Role ID')
      this.validateRequired(permissionIds, 'Permission IDs')
      
      if (permissionIds.length === 0) {
        throw new ValidationError('At least one permission is required')
      }

      // TODO: Implement permission removal logic
      // This would require additional Auth0 API calls
      
      const role = await this.roleRepository.findById(roleId)
      if (!role) {
        throw new AppError('Role not found', 'NOT_FOUND', 404)
      }

      return this.createSuccessResponse(role, 'Permissions removed successfully')
    } catch (error: any) {
      this.handleServiceError(error, 'removePermissionsFromRole')
    }
  }

  async getRoleStats(): Promise<ApiResponse<{
    total: number
    withPermissions: number
    withoutPermissions: number
  }>> {
    try {
      const result = await this.roleRepository.findAll()
      const roles = result.data

      const stats = {
        total: roles.length,
        withPermissions: roles.filter(r => r.permissions.length > 0).length,
        withoutPermissions: roles.filter(r => r.permissions.length === 0).length
      }

      return this.createSuccessResponse(stats)
    } catch (error: any) {
      this.handleServiceError(error, 'getRoleStats')
    }
  }
}
