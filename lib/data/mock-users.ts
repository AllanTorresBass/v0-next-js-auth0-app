import type { UserRole } from "@/lib/rbac/permissions"
import type { Permission } from "@/lib/rbac/permissions"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  status: "active" | "inactive"
  createdAt: string
  lastLogin?: string
  picture?: string
  customPermissions?: Permission[]
}

export const mockUsers: User[] = [
  {
    id: "1",
    email: "admin@company.com",
    name: "Admin User",
    role: "admin",
    status: "active",
    createdAt: "2024-01-15T10:00:00Z",
    lastLogin: "2024-03-20T14:30:00Z",
  },
  {
    id: "2",
    email: "john.sales@company.com",
    name: "John Sales",
    role: "sales_senior",
    status: "active",
    createdAt: "2024-01-20T10:00:00Z",
    lastLogin: "2024-03-19T09:15:00Z",
  },
  {
    id: "3",
    email: "jane.sales@company.com",
    name: "Jane Sales",
    role: "sales_junior",
    status: "active",
    createdAt: "2024-02-01T10:00:00Z",
    lastLogin: "2024-03-18T16:45:00Z",
  },
  {
    id: "4",
    email: "mike.marketing@company.com",
    name: "Mike Marketing",
    role: "marketing_senior",
    status: "active",
    createdAt: "2024-01-25T10:00:00Z",
    lastLogin: "2024-03-20T11:20:00Z",
  },
  {
    id: "5",
    email: "sarah.marketing@company.com",
    name: "Sarah Marketing",
    role: "marketing_junior",
    status: "active",
    createdAt: "2024-02-10T10:00:00Z",
    lastLogin: "2024-03-17T13:00:00Z",
  },
  {
    id: "6",
    email: "client@example.com",
    name: "Client User",
    role: "client",
    status: "active",
    createdAt: "2024-02-15T10:00:00Z",
    lastLogin: "2024-03-15T10:30:00Z",
  },
  {
    id: "7",
    email: "inactive@company.com",
    name: "Inactive User",
    role: "sales_junior",
    status: "inactive",
    createdAt: "2024-01-10T10:00:00Z",
  },
]

let users = [...mockUsers]

export function getAllUsers(): User[] {
  return users
}

export function getUserById(id: string): User | undefined {
  return users.find((user) => user.id === id)
}

export function createUser(userData: Omit<User, "id" | "createdAt">): User {
  const newUser: User = {
    ...userData,
    id: String(users.length + 1),
    createdAt: new Date().toISOString(),
  }
  users.push(newUser)
  return newUser
}

export function updateUser(id: string, userData: Partial<User>): User | null {
  const index = users.findIndex((user) => user.id === id)
  if (index === -1) return null

  users[index] = { ...users[index], ...userData }
  return users[index]
}

export function deleteUser(id: string): boolean {
  const index = users.findIndex((user) => user.id === id)
  if (index === -1) return false

  users.splice(index, 1)
  return true
}

export function resetMockData() {
  users = [...mockUsers]
}
