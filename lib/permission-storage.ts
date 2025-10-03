// Simple in-memory storage for role and user permissions
// In production, this should be stored in a database

interface RolePermission {
  roleId: string
  permissionId: string
  assignedAt: Date
}

interface UserPermission {
  userId: string
  permissionId: string
  assignedAt: Date
}

const rolePermissions = new Map<string, RolePermission[]>()
const userPermissions = new Map<string, UserPermission[]>()

export function assignRolePermission(roleId: string, permissionId: string): void {
  const existing = rolePermissions.get(roleId) || []
  const exists = existing.some(p => p.permissionId === permissionId)
  
  if (!exists) {
    existing.push({
      roleId,
      permissionId,
      assignedAt: new Date()
    })
    rolePermissions.set(roleId, existing)
  }
}

export function removeRolePermission(roleId: string, permissionId: string): void {
  const existing = rolePermissions.get(roleId) || []
  const filtered = existing.filter(p => p.permissionId !== permissionId)
  rolePermissions.set(roleId, filtered)
}

export function getRolePermissions(roleId: string): string[] {
  const existing = rolePermissions.get(roleId) || []
  return existing.map(p => p.permissionId)
}

export function clearRolePermissions(roleId: string): void {
  rolePermissions.delete(roleId)
}

// User Permission Functions
export function assignUserPermission(userId: string, permissionId: string): void {
  const existing = userPermissions.get(userId) || []
  const exists = existing.some(p => p.permissionId === permissionId)
  
  if (!exists) {
    existing.push({
      userId,
      permissionId,
      assignedAt: new Date()
    })
    userPermissions.set(userId, existing)
  }
}

export function removeUserPermission(userId: string, permissionId: string): void {
  const existing = userPermissions.get(userId) || []
  const filtered = existing.filter(p => p.permissionId !== permissionId)
  userPermissions.set(userId, filtered)
}

export function getUserPermissions(userId: string): string[] {
  const existing = userPermissions.get(userId) || []
  return existing.map(p => p.permissionId)
}

export function clearUserPermissions(userId: string): void {
  userPermissions.delete(userId)
}
