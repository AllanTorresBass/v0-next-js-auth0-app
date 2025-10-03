/**
 * User repository for Auth0 user management
 */

import { BaseRepositoryImpl } from './base.repository'
import { User, CreateUserRequest, UpdateUserRequest, UserQuery, PaginationParams } from '../types'
import { Auth0User } from '../types'
import { getAllUsers, getUser, createUser, updateUser, deleteUser } from '../auth0-management'
import { NotFoundError, Auth0Error } from '../errors'

export class UserRepository extends BaseRepositoryImpl<User, CreateUserRequest, UpdateUserRequest, UserQuery> {
  protected entityName = 'User'

  async findById(id: string): Promise<User | null> {
    try {
      const auth0User = await getUser(id)
      return this.transformAuth0User(auth0User)
    } catch (error: any) {
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return null
      }
      this.handleError(error, 'findById')
    }
  }

  async findAll(params?: UserQuery): Promise<RepositoryResult<User[]>> {
    try {
      const auth0Users = await getAllUsers()
      let users = auth0Users.map(user => this.transformAuth0User(user))

      // Apply filters
      if (params) {
        users = this.applyFilters(users, params)
      }

      // Apply pagination
      const pagination = params ? this.createPaginationMeta(users, params, users.length) : undefined
      const paginatedUsers = this.applyPagination(users, params)

      return {
        data: paginatedUsers,
        pagination
      }
    } catch (error: any) {
      this.handleError(error, 'findAll')
    }
  }

  async create(data: CreateUserRequest): Promise<User> {
    try {
      const auth0User = await createUser({
        email: data.email,
        name: data.name,
        password: data.password,
        picture: data.picture,
        email_verified: data.emailVerified || false,
        connection: 'Username-Password-Authentication'
      })

      // TODO: Assign roles if provided
      // This would require additional Auth0 API calls

      return this.transformAuth0User(auth0User)
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        throw new ConflictError('User with this email already exists')
      }
      this.handleError(error, 'create')
    }
  }

  async update(id: string, data: UpdateUserRequest): Promise<User> {
    try {
      const auth0User = await updateUser(id, {
        name: data.name,
        picture: data.picture,
        email_verified: data.emailVerified,
        app_metadata: {
          status: data.status
        }
      })

      // TODO: Update roles if provided
      // This would require additional Auth0 API calls

      return this.transformAuth0User(auth0User)
    } catch (error: any) {
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        throw new NotFoundError('User', id)
      }
      this.handleError(error, 'update')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await deleteUser(id)
    } catch (error: any) {
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        throw new NotFoundError('User', id)
      }
      this.handleError(error, 'delete')
    }
  }

  private transformAuth0User(auth0User: Auth0User): User {
    return {
      id: auth0User.user_id,
      sub: auth0User.user_id,
      email: auth0User.email,
      name: auth0User.name,
      picture: auth0User.picture,
      emailVerified: auth0User.email_verified,
      status: (auth0User.app_metadata?.status as any) || 'active',
      createdAt: auth0User.created_at,
      updatedAt: auth0User.updated_at,
      lastLogin: auth0User.last_login,
      roles: [], // TODO: Fetch roles from Auth0
      permissions: [] // TODO: Fetch permissions from Auth0
    }
  }

  private applyFilters(users: User[], params: UserQuery): User[] {
    let filteredUsers = [...users]

    if (params.search) {
      const searchTerm = params.search.toLowerCase()
      filteredUsers = filteredUsers.filter(user =>
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
      )
    }

    if (params.status) {
      filteredUsers = filteredUsers.filter(user => user.status === params.status)
    }

    if (params.role) {
      filteredUsers = filteredUsers.filter(user =>
        user.roles.some(role => role.name.toLowerCase().includes(params.role!.toLowerCase()))
      )
    }

    if (!params.includeInactive) {
      filteredUsers = filteredUsers.filter(user => user.status === 'active')
    }

    return filteredUsers
  }

  private applyPagination(users: User[], params?: UserQuery): User[] {
    if (!params) return users

    const { page = 1, limit = 10 } = params
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit

    return users.slice(startIndex, endIndex)
  }
}
