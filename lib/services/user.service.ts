/**
 * User service with business logic for user management
 */

import { BaseService } from './base.service'
import { User, CreateUserRequest, UpdateUserRequest, UserQuery, ApiResponse, PaginationMeta } from '../types'
import { UserRepository } from '../repositories/user.repository'
import { AppError, ValidationError, ConflictError } from '../errors'

export class UserService extends BaseService {
  private userRepository: UserRepository

  constructor() {
    super()
    this.userRepository = new UserRepository()
  }

  async getUsers(query?: UserQuery): Promise<ApiResponse<User[]>> {
    try {
      const result = await this.userRepository.findAll(query)
      
      if (query) {
        return this.createPaginatedResponse(result.data, result.pagination!)
      }
      
      return this.createSuccessResponse(result.data)
    } catch (error: any) {
      this.handleServiceError(error, 'getUsers')
    }
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    try {
      this.validateRequired(id, 'User ID')
      
      const user = await this.userRepository.findById(id)
      if (!user) {
        throw new AppError('User not found', 'NOT_FOUND', 404)
      }

      return this.createSuccessResponse(user)
    } catch (error: any) {
      this.handleServiceError(error, 'getUserById')
    }
  }

  async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    try {
      // Validate input
      this.validateRequired(userData.email, 'Email')
      this.validateRequired(userData.name, 'Name')
      this.validateRequired(userData.password, 'Password')
      
      this.validateEmail(userData.email)
      this.validatePassword(userData.password)

      // Check if user already exists
      const existingUser = await this.userRepository.findById(userData.email)
      if (existingUser) {
        throw new ConflictError('User with this email already exists')
      }

      const user = await this.userRepository.create(userData)
      return this.createSuccessResponse(user, 'User created successfully')
    } catch (error: any) {
      this.handleServiceError(error, 'createUser')
    }
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<ApiResponse<User>> {
    try {
      this.validateRequired(id, 'User ID')
      
      // Validate email if provided
      if (userData.email) {
        this.validateEmail(userData.email)
      }

      const user = await this.userRepository.update(id, userData)
      return this.createSuccessResponse(user, 'User updated successfully')
    } catch (error: any) {
      this.handleServiceError(error, 'updateUser')
    }
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    try {
      this.validateRequired(id, 'User ID')
      
      await this.userRepository.delete(id)
      return this.createSuccessResponse(undefined, 'User deleted successfully')
    } catch (error: any) {
      this.handleServiceError(error, 'deleteUser')
    }
  }

  async getUserStats(): Promise<ApiResponse<{
    total: number
    active: number
    inactive: number
    byRole: Record<string, number>
  }>> {
    try {
      const result = await this.userRepository.findAll()
      const users = result.data

      const stats = {
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        inactive: users.filter(u => u.status === 'inactive').length,
        byRole: users.reduce((acc, user) => {
          user.roles.forEach(role => {
            acc[role.name] = (acc[role.name] || 0) + 1
          })
          return acc
        }, {} as Record<string, number>)
      }

      return this.createSuccessResponse(stats)
    } catch (error: any) {
      this.handleServiceError(error, 'getUserStats')
    }
  }

  async searchUsers(searchTerm: string, limit: number = 10): Promise<ApiResponse<User[]>> {
    try {
      this.validateRequired(searchTerm, 'Search term')
      
      const result = await this.userRepository.findAll({
        search: searchTerm,
        limit,
        page: 1
      })

      return this.createSuccessResponse(result.data)
    } catch (error: any) {
      this.handleServiceError(error, 'searchUsers')
    }
  }

  async bulkCreateUsers(users: CreateUserRequest[]): Promise<ApiResponse<User[]>> {
    try {
      if (!users || users.length === 0) {
        throw new ValidationError('At least one user is required')
      }

      if (users.length > 100) {
        throw new ValidationError('Cannot create more than 100 users at once')
      }

      const createdUsers: User[] = []
      const errors: string[] = []

      for (const userData of users) {
        try {
          const user = await this.createUser(userData)
          createdUsers.push(user.data!)
        } catch (error: any) {
          errors.push(`Failed to create user ${userData.email}: ${error.message}`)
        }
      }

      if (errors.length > 0) {
        console.warn('Some users failed to create:', errors)
      }

      return this.createSuccessResponse(createdUsers, `Created ${createdUsers.length} users successfully`)
    } catch (error: any) {
      this.handleServiceError(error, 'bulkCreateUsers')
    }
  }

  async bulkUpdateUsers(userIds: string[], updateData: UpdateUserRequest): Promise<ApiResponse<User[]>> {
    try {
      if (!userIds || userIds.length === 0) {
        throw new ValidationError('At least one user ID is required')
      }

      const updatedUsers: User[] = []
      const errors: string[] = []

      for (const userId of userIds) {
        try {
          const user = await this.updateUser(userId, updateData)
          updatedUsers.push(user.data!)
        } catch (error: any) {
          errors.push(`Failed to update user ${userId}: ${error.message}`)
        }
      }

      if (errors.length > 0) {
        console.warn('Some users failed to update:', errors)
      }

      return this.createSuccessResponse(updatedUsers, `Updated ${updatedUsers.length} users successfully`)
    } catch (error: any) {
      this.handleServiceError(error, 'bulkUpdateUsers')
    }
  }

  async bulkDeleteUsers(userIds: string[]): Promise<ApiResponse<void>> {
    try {
      if (!userIds || userIds.length === 0) {
        throw new ValidationError('At least one user ID is required')
      }

      const errors: string[] = []

      for (const userId of userIds) {
        try {
          await this.deleteUser(userId)
        } catch (error: any) {
          errors.push(`Failed to delete user ${userId}: ${error.message}`)
        }
      }

      if (errors.length > 0) {
        console.warn('Some users failed to delete:', errors)
      }

      return this.createSuccessResponse(undefined, `Deleted ${userIds.length - errors.length} users successfully`)
    } catch (error: any) {
      this.handleServiceError(error, 'bulkDeleteUsers')
    }
  }
}
