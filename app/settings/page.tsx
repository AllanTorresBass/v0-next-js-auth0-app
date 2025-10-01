import { requireAuth, getUserRole } from "@/lib/rbac/guards"
import { SettingsClient } from "./settings-client"

export default async function SettingsPage() {
  const session = await requireAuth()
  const userRole = getUserRole(session)

  return <SettingsClient userRole={userRole} userName={session.user.name} />
}
