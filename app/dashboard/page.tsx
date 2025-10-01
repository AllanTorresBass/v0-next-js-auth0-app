import { requireAuth, getUserRole } from "@/lib/rbac/guards"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
  const session = await requireAuth()
  const userRole = getUserRole(session)

  return <DashboardClient userRole={userRole} userName={session.user.name} />
}
