interface Auth0TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

let cachedToken: { token: string; expiresAt: number } | null = null

// Cache for user roles and permissions to avoid rate limiting
const userRolesCache = new Map<string, { data: any; expiresAt: number }>()
const userPermissionsCache = new Map<string, { data: any; expiresAt: number }>()

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

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
  last_login?: string
  last_login_at?: string
  email_verified: boolean
  blocked: boolean
}

export interface CreateUserData {
  email: string
  name: string
  password: string
  picture?: string
  email_verified?: boolean
}

export interface UpdateUserData {
  email?: string
  name?: string
  password?: string
  picture?: string
  email_verified?: boolean
  blocked?: boolean
}

export interface Auth0Role {
  id: string
  name: string
  description: string
}

export interface UserRoleAssignment {
  id: string
  name: string
  description: string
  assignment: 'Direct' | 'Inherited'
}

export interface Auth0Permission {
  id?: string
  name?: string
  permission_name?: string
  scope?: string
  description: string
  resource_server_identifier: string
  resource_server_name: string
}

export interface UserPermissionAssignment {
  id: string
  name: string
  description: string
  resource_server_identifier: string
  resource_server_name: string
  assignment: 'Direct' | 'Inherited'
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
      email_verified: data.email_verified || false,
      picture: data.picture || undefined,
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
  if (data.picture !== undefined) updatePayload.picture = data.picture
  if (data.email_verified !== undefined) updatePayload.email_verified = data.email_verified
  if (data.blocked !== undefined) updatePayload.blocked = data.blocked

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

export async function getUserRoles(userId: string): Promise<UserRoleAssignment[]> {
  // Check cache first
  const cached = userRolesCache.get(userId)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }

  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")

  const response = await fetch(`https://${domain}/api/v2/users/${encodeURIComponent(userId)}/roles`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })


  if (!response.ok) {
    if (response.status === 429) {
      // Rate limited - return empty array and cache it briefly
      const emptyResult: UserRoleAssignment[] = []
      userRolesCache.set(userId, { data: emptyResult, expiresAt: Date.now() + 30000 }) // 30 seconds
      return emptyResult
    }
    
    // Return empty array instead of throwing error to prevent breaking the UI
    const emptyResult: UserRoleAssignment[] = []
    userRolesCache.set(userId, { data: emptyResult, expiresAt: Date.now() + 30000 })
    return emptyResult
  }

  const roles: Auth0Role[] = await response.json()
  
  // Transform to our format with assignment type
  const result = roles.map((role) => {
    // Validate role data
    if (!role.id || !role.name) {
      return null
    }
    
    return {
      id: role.id,
      name: role.name,
      description: role.description || '',
      assignment: 'Direct' as const, // Auth0 roles are always direct assignments
    }
  }).filter(Boolean) as UserRoleAssignment[]

  // Cache the result
  userRolesCache.set(userId, { data: result, expiresAt: Date.now() + CACHE_DURATION })
  
  return result
}

export async function getAllRoles(): Promise<Auth0Role[]> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")

  const response = await fetch(`https://${domain}/api/v2/roles`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get roles: ${response.statusText}`)
  }

  return response.json()
}

export async function getUserPermissions(userId: string): Promise<UserPermissionAssignment[]> {
  // Check cache first
  const cached = userPermissionsCache.get(userId)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }

  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")

  const response = await fetch(`https://${domain}/api/v2/users/${encodeURIComponent(userId)}/permissions`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    if (response.status === 429) {
      // Rate limited - return empty array and cache it briefly
      const emptyResult: UserPermissionAssignment[] = []
      userPermissionsCache.set(userId, { data: emptyResult, expiresAt: Date.now() + 30000 }) // 30 seconds
      return emptyResult
    }
    throw new Error(`Failed to get user permissions: ${response.statusText}`)
  }

  const permissions: Auth0Permission[] = await response.json()
  
  // Transform to our format with assignment type
  const result = permissions.map((permission) => ({
    id: permission.id || permission.permission_name || permission.scope || 'unknown',
    name: permission.name || permission.permission_name || permission.scope || 'unknown',
    description: permission.description,
    resource_server_identifier: permission.resource_server_identifier,
    resource_server_name: permission.resource_server_name,
    assignment: 'Direct' as const, // Auth0 permissions are always direct assignments
  }))

  // Cache the result
  userPermissionsCache.set(userId, { data: result, expiresAt: Date.now() + CACHE_DURATION })
  
  return result
}

export async function getAllPermissions(): Promise<Auth0Permission[]> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")

  try {
    // First, get all resource servers
    const resourceServersResponse = await fetch(`https://${domain}/api/v2/resource-servers`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!resourceServersResponse.ok) {
      throw new Error(`Failed to get resource servers: ${resourceServersResponse.statusText}`)
    }

    const resourceServers = await resourceServersResponse.json()
    
    // Get permissions from each resource server
    const allPermissions: Auth0Permission[] = []
    
    for (const server of resourceServers) {
      try {
        const permissionsResponse = await fetch(`https://${domain}/api/v2/resource-servers/${encodeURIComponent(server.identifier)}/permissions`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (permissionsResponse.ok) {
          const permissions = await permissionsResponse.json()
          // Add resource server info to each permission
          const permissionsWithServer = permissions.map((permission: any) => ({
            ...permission,
            resource_server_identifier: server.identifier,
            resource_server_name: server.name,
          }))
          allPermissions.push(...permissionsWithServer)
        }
      } catch (error) {
        console.warn(`Failed to get permissions for resource server ${server.identifier}:`, error)
        // Continue with other resource servers
      }
    }

    return allPermissions
  } catch (error) {
    console.error("Error fetching permissions:", error)
    // Return empty array if we can't fetch permissions
    return []
  }
}

export async function assignUserRoles(userId: string, roleIds: string[]): Promise<void> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")


  const response = await fetch(`https://${domain}/api/v2/users/${encodeURIComponent(userId)}/roles`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ roles: roleIds }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || `Failed to assign roles: ${response.statusText}`)
  }

  // Clear cache for this user to ensure fresh data on next fetch
  userRolesCache.delete(userId)
}

export async function removeUserRoles(userId: string, roleIds: string[]): Promise<void> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")


  const response = await fetch(`https://${domain}/api/v2/users/${encodeURIComponent(userId)}/roles`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ roles: roleIds }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || `Failed to remove roles: ${response.statusText}`)
  }

  // Clear cache for this user to ensure fresh data on next fetch
  userRolesCache.delete(userId)
}

// Role Management Functions
export interface CreateRoleData {
  name: string
  description: string
}

export interface UpdateRoleData {
  name?: string
  description?: string
}

export async function createRole(roleData: CreateRoleData): Promise<Auth0Role> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")

  const response = await fetch(`https://${domain}/api/v2/roles`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(roleData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || `Failed to create role: ${response.statusText}`)
  }

  return response.json()
}

export async function updateRole(roleId: string, roleData: UpdateRoleData): Promise<Auth0Role> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")

  const response = await fetch(`https://${domain}/api/v2/roles/${encodeURIComponent(roleId)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(roleData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || `Failed to update role: ${response.statusText}`)
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

export async function getRole(roleId: string): Promise<Auth0Role> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")

  const response = await fetch(`https://${domain}/api/v2/roles/${encodeURIComponent(roleId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get role: ${response.statusText}`)
  }

  return response.json()
}

// Permission Management Functions
export interface CreatePermissionData {
  name: string
  description: string
  resource_server_identifier: string
}

export interface UpdatePermissionData {
  name?: string
  description?: string
}

export async function createPermission(permissionData: CreatePermissionData): Promise<Auth0Permission> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")

  const response = await fetch(`https://${domain}/api/v2/resource-servers/${encodeURIComponent(permissionData.resource_server_identifier)}/permissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: permissionData.name,
      description: permissionData.description,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || `Failed to create permission: ${response.statusText}`)
  }

  return response.json()
}

export async function updatePermission(permissionId: string, permissionData: UpdatePermissionData, resourceServerIdentifier: string): Promise<Auth0Permission> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")

  const response = await fetch(`https://${domain}/api/v2/resource-servers/${encodeURIComponent(resourceServerIdentifier)}/permissions/${encodeURIComponent(permissionId)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(permissionData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || `Failed to update permission: ${response.statusText}`)
  }

  return response.json()
}

export async function deletePermission(permissionId: string, resourceServerIdentifier: string): Promise<void> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")

  const response = await fetch(`https://${domain}/api/v2/resource-servers/${encodeURIComponent(resourceServerIdentifier)}/permissions/${encodeURIComponent(permissionId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || `Failed to delete permission: ${response.statusText}`)
  }
}

// Role-Permission Assignment Functions
export async function assignRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")


  const response = await fetch(`https://${domain}/api/v2/roles/${encodeURIComponent(roleId)}/permissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ permissions: permissionIds }),
  })

  if (!response.ok) {
    const error = await response.json()
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
    body: JSON.stringify({ permissions: permissionIds }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || `Failed to remove permissions from role: ${response.statusText}`)
  }
}

export async function getRolePermissions(roleId: string): Promise<Auth0Permission[]> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")


  const response = await fetch(`https://${domain}/api/v2/roles/${encodeURIComponent(roleId)}/permissions`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get role permissions: ${response.statusText}`)
  }

  const permissions = await response.json()
  return permissions
}

// User Permission Management Functions
export async function assignUserPermissions(userId: string, permissionIds: string[]): Promise<void> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")


  const response = await fetch(`https://${domain}/api/v2/users/${encodeURIComponent(userId)}/permissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ permissions: permissionIds }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || `Failed to assign permissions to user: ${response.statusText}`)
  }

  // Clear cache for this user to ensure fresh data on next fetch
  userPermissionsCache.delete(userId)
}

export async function removeUserPermissions(userId: string, permissionIds: string[]): Promise<void> {
  const token = await getManagementToken()
  const domain = process.env.AUTH0_ISSUER_BASE_URL!.replace("https://", "")


  const response = await fetch(`https://${domain}/api/v2/users/${encodeURIComponent(userId)}/permissions`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ permissions: permissionIds }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || `Failed to remove permissions from user: ${response.statusText}`)
  }

  // Clear cache for this user to ensure fresh data on next fetch
  userPermissionsCache.delete(userId)
}
