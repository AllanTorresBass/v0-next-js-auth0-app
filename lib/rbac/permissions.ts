export type Permission =
  | "users:read"
  | "users:create"
  | "users:update"
  | "users:delete"
  | "users:manage_roles"
  | "dashboard:view_all"
  | "dashboard:view_own"
  | "reports:view"
  | "reports:create"
  | "settings:manage"

export type UserRole = "admin" | "sales_senior" | "sales_junior" | "marketing_senior" | "marketing_junior" | "client"

export interface PermissionMetadata {
  id: Permission
  label: string
  description: string
  category: "users" | "dashboard" | "reports" | "settings"
}

export const PERMISSION_METADATA: PermissionMetadata[] = [
  {
    id: "users:read",
    label: "Read Users",
    description: "View user information and list",
    category: "users",
  },
  {
    id: "users:create",
    label: "Create Users",
    description: "Create new users in the system",
    category: "users",
  },
  {
    id: "users:update",
    label: "Update Users",
    description: "Edit existing user information",
    category: "users",
  },
  {
    id: "users:delete",
    label: "Delete Users",
    description: "Remove users from the system",
    category: "users",
  },
  {
    id: "users:manage_roles",
    label: "Manage Roles",
    description: "Assign and modify user roles",
    category: "users",
  },
  {
    id: "dashboard:view_all",
    label: "View All Dashboards",
    description: "Access all dashboard data",
    category: "dashboard",
  },
  {
    id: "dashboard:view_own",
    label: "View Own Dashboard",
    description: "Access personal dashboard only",
    category: "dashboard",
  },
  {
    id: "reports:view",
    label: "View Reports",
    description: "Access and view reports",
    category: "reports",
  },
  {
    id: "reports:create",
    label: "Create Reports",
    description: "Generate new reports",
    category: "reports",
  },
  {
    id: "settings:manage",
    label: "Manage Settings",
    description: "Configure system settings",
    category: "settings",
  },
]

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "users:read",
    "users:create",
    "users:update",
    "users:delete",
    "users:manage_roles",
    "dashboard:view_all",
    "reports:view",
    "reports:create",
    "settings:manage",
  ],
  sales_senior: ["users:read", "users:create", "users:update", "dashboard:view_all", "reports:view", "reports:create"],
  sales_junior: ["users:read", "dashboard:view_own", "reports:view"],
  marketing_senior: [
    "users:read",
    "users:create",
    "users:update",
    "dashboard:view_all",
    "reports:view",
    "reports:create",
  ],
  marketing_junior: ["users:read", "dashboard:view_own", "reports:view"],
  client: ["dashboard:view_own"],
}

export function hasPermission(
  role: UserRole | undefined,
  permission: Permission,
  customPermissions?: Permission[],
): boolean {
  if (!role) return false

  // Check custom permissions first (they override role permissions)
  if (customPermissions) {
    return customPermissions.includes(permission)
  }

  // Fall back to role-based permissions
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function hasAnyPermission(
  role: UserRole | undefined,
  permissions: Permission[],
  customPermissions?: Permission[],
): boolean {
  if (!role) return false
  return permissions.some((permission) => hasPermission(role, permission, customPermissions))
}

export function hasAllPermissions(
  role: UserRole | undefined,
  permissions: Permission[],
  customPermissions?: Permission[],
): boolean {
  if (!role) return false
  return permissions.every((permission) => hasPermission(role, permission, customPermissions))
}

export function getUserPermissions(role: UserRole, customPermissions?: Permission[]): Permission[] {
  if (customPermissions && customPermissions.length > 0) {
    return customPermissions
  }
  return ROLE_PERMISSIONS[role] || []
}

export function getPermissionsByCategory(category: string): PermissionMetadata[] {
  return PERMISSION_METADATA.filter((p) => p.category === category)
}
