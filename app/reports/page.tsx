import { requireAuth, getUserRole } from "@/lib/rbac/guards"
import { ReportsClient } from "./reports-client"

export default async function ReportsPage() {
  const session = await requireAuth()
  const userRole = getUserRole(session)

  return <ReportsClient userRole={userRole} userName={session.user.name} />
}
