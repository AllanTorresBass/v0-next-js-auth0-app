/**
 * Role repository for Auth0 role management
 */

import { BaseRepositoryImpl } from './base.repository'
import { Role, CreateRoleRequest, UpdateRoleRequest, PaginationParams } from '../types'
import { Auth0Role } from '../types'
import { getAllRoles, getRole, createRole, updateRole, deleteRole, getRolePermissions } from '../auth0-management'
import { NotFoundError, ConflictError } from '../errors'

export class RoleRepository extends BaseRepositoryImpl<Role, CreateRoleRequest, UpdateRoleRequest> {
  protected entityName = 'Role'

  async findById(id: string): Promise<Role | null> {
    try {
      const auth0Role = await getRole(id)
      const permissions = await this.getRolePermissions(id)
      return this.transformAuth0Role(auth0Role, permissions)
    } catch (error: any) {
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return null
      }
      this.handleError(error, 'findById')
    }
  }

  async findAll(params?: PaginationParams): Promise<RepositoryResult<Role[]>> {
    try {
      const auth0Roles = await getAllRoles()
      const roles = await Promise.all(
        auth0Roles.map(async (role) => {
          const permissions = await this.getRolePermissions(role.id)
          return this.transformAuth0Role(role, permissions)
        })
      )

      const pagination = params ? this.createPaginationMeta(roles, params, roles.length) : undefined
      const paginatedRoles = this.applyPagination(roles, params)

      return {
        data: paginatedRoles,
        pagination
      }
    } catch (error: any) {
      this.handleError(error, 'findAll')
    }
  }

  async create(data: CreateRoleRequest): Promise<Role> {
    try {
      const auth0Role = await createRole({
        name: data.name,
        description: data.description
      })

      // TODO: Assign permissions if provided
      // This would require additional Auth0 API calls

      return this.transformAuth0Role(auth0Role, [])
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        throw new ConflictError('Role with this name already exists')
      }
      this.handleError(error, 'create')
    }
  }

  async update(id: string, data: UpdateRoleRequest): Promise<Role> {
    try {
      const auth0Role = await updateRole(id, {
        name: data.name,
        description: data.description
      })

      // TODO: Update permissions if provided
      // This would require additional Auth0 API calls

      const permissions = await this.getRolePermissions(id)
      return this.transformAuth0Role(auth0Role, permissions)
    } catch (error: any) {
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        throw new NotFoundError('Role', id)
      }
      this.handleError(error, 'update')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await deleteRole(id)
    } catch (error: any) {
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        throw new NotFoundError('Role', id)
      }
      this.handleError(error, 'delete')
    }
  }

  private async getRolePermissions(roleId: string) {
    try {
      return await getRolePermissions(roleId)
    } catch (error: any) {
      // If permissions can't be fetched, return empty array
      console.warn(`Could not fetch permissions for role ${roleId}:`, error.message)
      return []
    }
  }

  private transformAuth0Role(auth0Role: Auth0Role, permissions: any[]): Role {
    return {
      id: auth0Role.id,
      name: auth0Role.name,
      description: auth0Role.description,
      createdAt: auth0Role.created_at,
      updatedAt: auth0Role.updated_at,
      permissions: permissions.map(perm => ({
        id: perm.id || perm.name,
        name: perm.name,
        description: perm.description || '',
        category: 'users' as any, // TODO: Map from permission metadata
        resourceServerIdentifier: perm.resource_server_identifier || '',
        resourceServerName: perm.resource_server_name || ''
      }))
    }
  }

  private applyPagination(roles: Role[], params?: PaginationParams): Role[] {
    if (!params) return roles

    const { page = 1, limit = 10 } = params
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit

    return roles.slice(startIndex, endIndex)
  }
}
