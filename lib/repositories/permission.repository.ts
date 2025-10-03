/**
 * Permission repository for Auth0 permission management
 */

import { BaseRepositoryImpl } from './base.repository'
import { Permission, CreatePermissionRequest, PaginationParams } from '../types'
import { Auth0Permission } from '../types'
import { getAllPermissions, createPermission } from '../auth0-management'
import { PERMISSION_METADATA } from '../rbac/permissions'
import { NotFoundError, ConflictError } from '../errors'

export class PermissionRepository extends BaseRepositoryImpl<Permission, CreatePermissionRequest, Partial<CreatePermissionRequest>> {
  protected entityName = 'Permission'

  async findById(id: string): Promise<Permission | null> {
    try {
      // First try to find in Auth0 permissions
      const auth0Permissions = await this.getAllPermissions()
      const auth0Permission = auth0Permissions.find(p => p.id === id)
      
      if (auth0Permission) {
        return this.transformAuth0Permission(auth0Permission)
      }

      // Then try to find in application permissions
      const appPermission = PERMISSION_METADATA.find(p => p.id === id)
      if (appPermission) {
        return this.transformAppPermission(appPermission)
      }

      return null
    } catch (error: any) {
      this.handleError(error, 'findById')
    }
  }

  async findAll(params?: PaginationParams): Promise<RepositoryResult<Permission[]>> {
    try {
      const auth0Permissions = await this.getAllPermissions()
      const appPermissions = PERMISSION_METADATA.map(perm => this.transformAppPermission(perm))
      
      const allPermissions = [
        ...auth0Permissions.map(perm => this.transformAuth0Permission(perm)),
        ...appPermissions
      ]

      const pagination = params ? this.createPaginationMeta(allPermissions, params, allPermissions.length) : undefined
      const paginatedPermissions = this.applyPagination(allPermissions, params)

      return {
        data: paginatedPermissions,
        pagination
      }
    } catch (error: any) {
      this.handleError(error, 'findAll')
    }
  }

  async create(data: CreatePermissionRequest): Promise<Permission> {
    try {
      const auth0Permission = await createPermission({
        name: data.name,
        description: data.description,
        resource_server_identifier: data.resourceServerIdentifier
      })

      return this.transformAuth0Permission(auth0Permission)
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        throw new ConflictError('Permission with this name already exists')
      }
      this.handleError(error, 'create')
    }
  }

  async update(id: string, data: Partial<CreatePermissionRequest>): Promise<Permission> {
    // Auth0 doesn't support updating permissions directly
    // This would require deleting and recreating
    throw new Error('Permission updates are not supported')
  }

  async delete(id: string): Promise<void> {
    // Auth0 doesn't support deleting permissions directly
    throw new Error('Permission deletion is not supported')
  }

  private async getAllPermissions(): Promise<Auth0Permission[]> {
    try {
      return await getAllPermissions()
    } catch (error: any) {
      // If Auth0 permissions can't be fetched, return empty array
      console.warn('Could not fetch Auth0 permissions:', error.message)
      return []
    }
  }

  private transformAuth0Permission(auth0Permission: Auth0Permission): Permission {
    return {
      id: auth0Permission.id,
      name: auth0Permission.name,
      description: auth0Permission.description,
      category: this.mapCategoryFromName(auth0Permission.name),
      resourceServerIdentifier: auth0Permission.resource_server_identifier,
      resourceServerName: auth0Permission.resource_server_name,
      createdAt: auth0Permission.created_at,
      updatedAt: auth0Permission.updated_at
    }
  }

  private transformAppPermission(appPermission: any): Permission {
    return {
      id: appPermission.id,
      name: appPermission.id,
      description: appPermission.description,
      category: appPermission.category,
      resourceServerIdentifier: 'app-permissions',
      resourceServerName: 'Application Permissions'
    }
  }

  private mapCategoryFromName(permissionName: string): any {
    if (permissionName.startsWith('users:')) return 'users'
    if (permissionName.startsWith('dashboard:')) return 'dashboard'
    if (permissionName.startsWith('reports:')) return 'reports'
    if (permissionName.startsWith('settings:')) return 'settings'
    if (permissionName.startsWith('roles:')) return 'roles'
    return 'users' // default
  }

  private applyPagination(permissions: Permission[], params?: PaginationParams): Permission[] {
    if (!params) return permissions

    const { page = 1, limit = 10 } = params
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit

    return permissions.slice(startIndex, endIndex)
  }
}
