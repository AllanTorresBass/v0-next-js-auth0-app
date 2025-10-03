import { SettingsClient } from "./settings-client"

export default async function SettingsPage() {
  // For now, redirect to user switcher since we're using the user switching approach
  // This will be handled by the client-side user switcher context
  return <SettingsClient userRole={undefined} userName={undefined} />
}
