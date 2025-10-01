"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SetupStatusBannerProps {
  error: string
}

export function SetupStatusBanner({ error }: SetupStatusBannerProps) {
  // Check if this is the Management API access denied error
  const isManagementApiError = error.includes("Management API access denied")

  if (!isManagementApiError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const domain = error.match(/https:\/\/([^)]+)/)?.[1] || "your-domain.auth0.com"

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Auth0 Setup Required</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="font-medium">Your application needs to be authorized to access the Auth0 Management API.</p>
        <div className="text-sm space-y-2">
          <p className="font-semibold">To fix this:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Go to your Auth0 Dashboard</li>
            <li>Navigate to Applications → APIs</li>
            <li>Click on "Auth0 Management API"</li>
            <li>Go to the "Machine to Machine Applications" tab</li>
            <li>Find your application and toggle it to "Authorized"</li>
            <li>
              Expand the permissions and enable: <code className="text-xs">read:users</code>,{" "}
              <code className="text-xs">create:users</code>, <code className="text-xs">update:users</code>,{" "}
              <code className="text-xs">delete:users</code>
            </li>
            <li>Click "Update"</li>
          </ol>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" asChild>
            <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer">
              Open Auth0 Dashboard
              <ExternalLink className="w-3 h-3 ml-2" />
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/SETUP_GUIDE.md" target="_blank" rel="noopener noreferrer">
              View Setup Guide
              <ExternalLink className="w-3 h-3 ml-2" />
            </a>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
