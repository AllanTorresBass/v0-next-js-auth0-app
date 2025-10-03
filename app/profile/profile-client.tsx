"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
// User switcher functionality removed - using Auth0 sessions only

interface ProfileClientProps {
  user?: {
    name?: string
    email?: string
    picture?: string
    role?: string
  }
}

export function ProfileClient({ user }: ProfileClientProps) {
  // Using Auth0 sessions - user authentication is handled by middleware

  const getInitials = (name: string | undefined): string => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information and settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.picture || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
              </Avatar>

              <div className="text-center">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-muted-foreground">{user.email}</p>
                {user.role && (
                  <Badge className="mt-2" variant="secondary">
                    {user.role.replace("_", " ").toUpperCase()}
                  </Badge>
                )}
              </div>

              <div className="w-full space-y-4 mt-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="font-mono text-sm">{user.sub}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-mono text-sm">{user.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Role</span>
                  <span>{user.role || "No role assigned"}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Roles Count</span>
                  <span>{user.roles?.length || 0}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Permissions Count</span>
                  <span>{user.permissions?.length || 0}</span>
                </div>
              </div>

              {/* Roles and Permissions Display */}
              {user.roles && user.roles.length > 0 && (
                <div className="w-full space-y-4 mt-6">
                  <h3 className="text-lg font-semibold">Roles</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.roles.map((role, index) => (
                      <Badge key={index} variant="outline">
                        {role.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {user.permissions && user.permissions.length > 0 && (
                <div className="w-full space-y-4 mt-6">
                  <h3 className="text-lg font-semibold">Permissions</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.permissions.map((permission, index) => (
                      <Badge key={index} variant="secondary">
                        {permission.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button asChild variant="outline">
                  <a href="/auth/user-switcher">
                    Switch User
                  </a>
                </Button>
                <Button asChild>
                  <a href="/dashboard">
                    Back to Dashboard
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
