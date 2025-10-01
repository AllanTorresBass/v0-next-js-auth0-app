import { requirePermission } from "@/lib/rbac/guards"
import { UserManagementClient } from "./user-management-client"

export default async function UsersPage() {
  await requirePermission("users:read")

  return <UserManagementClient />
}
