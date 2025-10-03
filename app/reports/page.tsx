import { ReportsClient } from "./reports-client"

export default async function ReportsPage() {
  // For now, redirect to user switcher since we're using the user switching approach
  // This will be handled by the client-side user switcher context
  return <ReportsClient userRole={undefined} userName={undefined} />
}
