interface Auth0TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

let cachedToken: { token: string; expiresAt: number } | null = null

async function getManagementToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token
  }

  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")
  const clientId = process.env.AUTH0_CLIENT_ID!
  const clientSecret = process.env.AUTH0_CLIENT_SECRET!

  const response = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${domain}/api/v2/`,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))

    if (response.status === 403 && errorData.error === "access_denied") {
      throw new Error(
        `Auth0 Management API access denied. Your application needs to be authorized to access the Management API.\n\n` +
          `To fix this:\n` +
          `1. Go to your Auth0 Dashboard (https://${domain})\n` +
          `2. Navigate to Applications > APIs\n` +
          `3. Click on "Auth0 Management API"\n` +
          `4. Go to the "Machine to Machine Applications" tab\n` +
          `5. Find your application and toggle it to "Authorized"\n` +
          `6. Expand the permissions and enable: read:users, create:users, update:users, delete:users\n` +
          `7. Click "Update"\n\n` +
          `See SETUP_GUIDE.md for detailed instructions.`,
      )
    }

    throw new Error(`Failed to get management token: ${response.statusText}`)
  }

  const data: Auth0TokenResponse = await response.json()

  // Cache token (expires in 24 hours typically, we'll refresh 5 minutes early)
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  }

  return data.access_token
}

export interface Auth0User {
  user_id: string
  email: string
  name: string
  picture?: string
  created_at: string
  updated_at: string
  email_verified: boolean
  user_metadata?: {
    role?: string
    status?: string
    customPermissions?: string[]
  }
  app_metadata?: {
    role?: string
    status?: string
    customPermissions?: string[]
  }
}

export interface CreateUserData {
  email: string
  name: string
  password: string
  role: string
  status?: string
  customPermissions?: string[]
}

export interface UpdateUserData {
  email?: string
  name?: string
  password?: string
  role?: string
  status?: string
  customPermissions?: string[]
}

export async function getAllUsers(): Promise<Auth0User[]> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")

  const response = await fetch(`https://${domain}/api/v2/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get users: ${response.statusText}`)
  }

  return response.json()
}

export async function getUser(userId: string): Promise<Auth0User> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")

  const response = await fetch(`https://${domain}/api/v2/users/${encodeURIComponent(userId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get user: ${response.statusText}`)
  }

  return response.json()
}

export async function createUser(data: CreateUserData): Promise<Auth0User> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")

  const response = await fetch(`https://${domain}/api/v2/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: data.email,
      name: data.name,
      password: data.password,
      connection: "Username-Password-Authentication",
      email_verified: false,
      app_metadata: {
        role: data.role,
        status: data.status || "active",
        customPermissions: data.customPermissions || [],
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || `Failed to create user: ${response.statusText}`)
  }

  return response.json()
}

export async function updateUser(userId: string, data: UpdateUserData): Promise<Auth0User> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")

  const updatePayload: any = {}

  if (data.email) updatePayload.email = data.email
  if (data.name) updatePayload.name = data.name
  if (data.password) updatePayload.password = data.password

  if (data.role || data.status || data.customPermissions !== undefined) {
    updatePayload.app_metadata = {}
    if (data.role) updatePayload.app_metadata.role = data.role
    if (data.status) updatePayload.app_metadata.status = data.status
    if (data.customPermissions !== undefined) {
      updatePayload.app_metadata.customPermissions = data.customPermissions
    }
  }

  const response = await fetch(`https://${domain}/api/v2/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatePayload),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || `Failed to update user: ${response.statusText}`)
  }

  return response.json()
}

export async function deleteUser(userId: string): Promise<void> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")

  const response = await fetch(`https://${domain}/api/v2/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to delete user: ${response.statusText}`)
  }
}

// Role Management Functions
export interface Auth0Role {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

export interface CreateRoleData {
  name: string
  description: string
}

export interface UpdateRoleData {
  name?: string
  description?: string
}

export async function getAllRoles(): Promise<Auth0Role[]> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")

  const response = await fetch(`https://${domain}/api/v2/roles`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch roles: ${response.statusText}`)
  }

  return response.json()
}

export async function getRole(roleId: string): Promise<Auth0Role> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")

  const response = await fetch(`https://${domain}/api/v2/roles/${encodeURIComponent(roleId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch role: ${response.statusText}`)
  }

  return response.json()
}

export async function createRole(data: CreateRoleData): Promise<Auth0Role> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")

  const response = await fetch(`https://${domain}/api/v2/roles`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    if (error.message && error.message.includes("already exists")) {
      throw new Error("The role already exists.")
    }
    throw new Error(`Failed to create role: ${response.statusText}`)
  }

  return response.json()
}

export async function updateRole(roleId: string, data: UpdateRoleData): Promise<Auth0Role> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")

  const response = await fetch(`https://${domain}/api/v2/roles/${encodeURIComponent(roleId)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`Failed to update role: ${response.statusText}`)
  }

  return response.json()
}

export async function deleteRole(roleId: string): Promise<void> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")

  const response = await fetch(`https://${domain}/api/v2/roles/${encodeURIComponent(roleId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || `Failed to delete role: ${response.statusText}`)
  }
}

// Permission Management Functions
export interface Auth0Permission {
  id: string
  name: string
  description: string
  resource_server_identifier: string
  resource_server_name: string
}

export async function getAllPermissions(): Promise<Auth0Permission[]> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")

  const response = await fetch(`https://${domain}/api/v2/permissions`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch permissions: ${response.statusText}`)
  }

  return response.json()
}

export async function assignRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")

  // Try to assign permissions directly - Auth0 will return an error if they don't exist
  const response = await fetch(`https://${domain}/api/v2/roles/${encodeURIComponent(roleId)}/permissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      permissions: permissionIds.map(id => ({ 
        permission_name: id, 
        resource_server_identifier: "http://localhost:3000/" 
      }))
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    
    // If the error is about permissions not existing, log a warning but don't fail
    if (error.message && (
      error.message.includes("not found") || 
      error.message.includes("does not exist") ||
      error.message.includes("Permission") && error.message.includes("not found")
    )) {
      console.warn(`Some permissions don't exist in Auth0 for role ${roleId}:`, permissionIds)
      console.warn(`Auth0 error:`, error.message)
      return // Skip assignment gracefully
    }
    
    throw new Error(error.message || `Failed to assign permissions to role: ${response.statusText}`)
  }
}

export async function removeRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")

  const response = await fetch(`https://${domain}/api/v2/roles/${encodeURIComponent(roleId)}/permissions`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      permissions: permissionIds.map(id => ({ 
        permission_name: id, 
        resource_server_identifier: "http://localhost:3000/" 
      }))
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to remove permissions from role: ${response.statusText}`)
  }
}

export async function getRolePermissions(roleId: string): Promise<Auth0Permission[]> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")

  const response = await fetch(`https://${domain}/api/v2/roles/${encodeURIComponent(roleId)}/permissions`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch role permissions: ${response.statusText}`)
  }

  return response.json()
}
