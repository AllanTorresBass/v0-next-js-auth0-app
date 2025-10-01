import type { User } from "@/lib/data/mock-users"

export async function fetchUsers(): Promise<User[]> {
  const response = await fetch("/api/users")
  if (!response.ok) {
    throw new Error("Failed to fetch users")
  }
  const data = await response.json()
  return data.users
}

export async function fetchUserById(id: string): Promise<User> {
  const response = await fetch(`/api/users/${encodeURIComponent(id)}`)
  if (!response.ok) {
    throw new Error("Failed to fetch user")
  }
  const data = await response.json()
  return data.user
}

export async function createUser(userData: Omit<User, "id" | "createdAt"> & { password: string }): Promise<User> {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to create user")
  }
  const data = await response.json()
  return data.user
}

export async function updateUser(id: string, userData: Partial<User> & { password?: string }): Promise<User> {
  const response = await fetch(`/api/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
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
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to delete user")
  }
}
