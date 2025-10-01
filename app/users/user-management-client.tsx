"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus, Search, ArrowLeft } from "lucide-react"
import { UserTable } from "@/components/users/user-table"
import { UserDialog } from "@/components/users/user-dialog"
import { PermissionGate } from "@/components/rbac/permission-gate"
import { useUsers } from "@/hooks/use-users"
import { SetupStatusBanner } from "@/components/auth0/setup-status-banner"
import Link from "next/link"

export function UserManagementClient() {
  const { data: users, isLoading, error } = useUsers()
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const filteredUsers =
    users?.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || []

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-3xl">User Management</CardTitle>
                <CardDescription>Manage users and their roles across the organization</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" asChild>
                  <Link href="/dashboard">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
                <PermissionGate permission="users:create">
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </PermissionGate>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && <SetupStatusBanner error={error instanceof Error ? error.message : String(error)} />}

            <div className="flex items-center gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No users found</div>
            ) : (
              <UserTable users={filteredUsers} />
            )}
          </CardContent>
        </Card>
      </div>

      <UserDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </div>
  )
}
