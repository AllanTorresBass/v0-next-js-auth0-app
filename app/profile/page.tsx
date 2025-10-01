import { requireAuth } from "@/lib/rbac/guards"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default async function ProfilePage() {
  const session = await requireAuth()
  const user = session.user

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
                <AvatarFallback className="text-2xl">{user.name?.[0] || "U"}</AvatarFallback>
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
                  <span className="text-muted-foreground">Email Verified</span>
                  <span>{user.email_verified ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{user.updated_at ? new Date(user.updated_at).toLocaleDateString() : "N/A"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
