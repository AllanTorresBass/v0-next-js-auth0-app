import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
  // For now, redirect to user switcher since we're using the user switching approach
  // This will be handled by the client-side user switcher context
  return <DashboardClient userRole={undefined} userName={undefined} />
}
