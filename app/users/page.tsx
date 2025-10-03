import { UserManagementClient } from "./user-management-client"

export default async function UsersPage() {
  // For now, redirect to user switcher since we're using the user switching approach
  // This will be handled by the client-side user switcher context
  return <UserManagementClient />
}
