/**
 * UserService tests
 */

import { UserService } from '@/lib/services/user.service'
import { UserRepository } from '@/lib/repositories/user.repository'
import { ValidationError, ConflictError, NotFoundError } from '@/lib/errors'

// Mock the repository
jest.mock('@/lib/repositories/user.repository')
const MockedUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>

describe('UserService', () => {
  let userService: UserService
  let mockRepository: jest.Mocked<UserRepository>

  beforeEach(() => {
    jest.clearAllMocks()
    mockRepository = new MockedUserRepository() as jest.Mocked<UserRepository>
    userService = new UserService()
    // Replace the repository instance
    ;(userService as any).userRepository = mockRepository
  })

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        emailVerified: false
      }

      const mockUser = {
        id: '1',
        sub: 'auth0|1',
        email: 'test@example.com',
        name: 'Test User',
        status: 'active',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        roles: [],
        permissions: []
      }

      mockRepository.create.mockResolvedValue(mockUser)

      const result = await userService.createUser(userData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUser)
      expect(mockRepository.create).toHaveBeenCalledWith(userData)
    })

    it('should throw validation error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        name: 'Test User',
        password: 'password123'
      }

      await expect(userService.createUser(userData)).rejects.toThrow(ValidationError)
    })

    it('should throw validation error for short password', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: '123'
      }

      await expect(userService.createUser(userData)).rejects.toThrow(ValidationError)
    })

    it('should throw conflict error if user already exists', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      }

      mockRepository.findById.mockResolvedValue({
        id: '1',
        sub: 'auth0|1',
        email: 'test@example.com',
        name: 'Test User',
        status: 'active',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        roles: [],
        permissions: []
      })

      await expect(userService.createUser(userData)).rejects.toThrow(ConflictError)
    })
  })

  describe('getUserById', () => {
    it('should return user if found', async () => {
      const mockUser = {
        id: '1',
        sub: 'auth0|1',
        email: 'test@example.com',
        name: 'Test User',
        status: 'active',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        roles: [],
        permissions: []
      }

      mockRepository.findById.mockResolvedValue(mockUser)

      const result = await userService.getUserById('1')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUser)
    })

    it('should throw error if user not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(userService.getUserById('1')).rejects.toThrow('User not found')
    })
  })

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        status: 'inactive' as const
      }

      const mockUser = {
        id: '1',
        sub: 'auth0|1',
        email: 'test@example.com',
        name: 'Updated Name',
        status: 'inactive',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        roles: [],
        permissions: []
      }

      mockRepository.update.mockResolvedValue(mockUser)

      const result = await userService.updateUser('1', updateData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUser)
      expect(mockRepository.update).toHaveBeenCalledWith('1', updateData)
    })
  })

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockRepository.delete.mockResolvedValue()

      const result = await userService.deleteUser('1')

      expect(result.success).toBe(true)
      expect(mockRepository.delete).toHaveBeenCalledWith('1')
    })
  })

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const mockUsers = [
        {
          id: '1',
          sub: 'auth0|1',
          email: 'user1@example.com',
          name: 'User One',
          status: 'active',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          roles: [{ id: 'role-1', name: 'admin', description: 'Admin', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z', permissions: [] }],
          permissions: []
        },
        {
          id: '2',
          sub: 'auth0|2',
          email: 'user2@example.com',
          name: 'User Two',
          status: 'inactive',
          createdAt: '2023-01-02T00:00:00Z',
          updatedAt: '2023-01-02T00:00:00Z',
          roles: [{ id: 'role-2', name: 'user', description: 'User', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z', permissions: [] }],
          permissions: []
        }
      ]

      mockRepository.findAll.mockResolvedValue({
        data: mockUsers,
        pagination: undefined
      })

      const result = await userService.getUserStats()

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        total: 2,
        active: 1,
        inactive: 1,
        byRole: { admin: 1, user: 1 }
      })
    })
  })
})
