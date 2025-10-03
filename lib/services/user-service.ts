import type { User, CreateUserData, UpdateUserData } from "@/lib/types/user"
// User switcher functionality removed - using Auth0 sessions only

// Helper function to create headers
function createHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  }
}

export async function fetchUsers(): Promise<User[]> {
  const response = await fetch("/api/users", {
    headers: createHeaders()
  })
  if (!response.ok) {
    throw new Error("Failed to fetch users")
  }
  const data = await response.json()
  return data.users
}

export async function fetchUserById(id: string): Promise<User> {
  const response = await fetch(`/api/users/${encodeURIComponent(id)}`, {
    headers: createHeaders()
  })
  if (!response.ok) {
    throw new Error("Failed to fetch user")
  }
  const data = await response.json()
  return data.user
}

export async function createUser(userData: CreateUserData): Promise<User> {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: createHeaders(),
    body: JSON.stringify({
      action: 'create',
      ...userData
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to create user")
  }
  const data = await response.json()
  return data.user
}

export async function updateUser(id: string, userData: UpdateUserData): Promise<User> {
  const response = await fetch(`/api/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: createHeaders(),
    body: JSON.stringify(userData),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to update user")
  }
  const data = await response.json()
  return data.user
}

export async function deleteUser(id: string): Promise<void> {
  const response = await fetch(`/api/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: createHeaders()
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to delete user")
  }
}
