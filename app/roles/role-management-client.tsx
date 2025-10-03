"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldPlus, Search, ArrowLeft, RefreshCw } from "lucide-react"
import { RoleTable } from "@/components/roles/role-table"
import { RoleDialog } from "@/components/roles/role-dialog"
import { SetupStatusBanner } from "@/components/auth0/setup-status-banner"
import Link from "next/link"
import type { Auth0Role } from "@/lib/auth0-management"

export function RoleManagementClient() {
  const [roles, setRoles] = useState<Auth0Role[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchRoles = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch("/api/roles")
      
      if (!response.ok) {
        throw new Error(`Failed to fetch roles: ${response.statusText}`)
      }
      
      const data = await response.json()
      setRoles(data.roles || [])
    } catch (err) {
      console.error("Error fetching roles:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch roles")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchRoles()
    setIsRefreshing(false)
  }

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <ShieldPlus className="w-8 h-8" />
                  Role Management
                </CardTitle>
                <CardDescription>
                  Create and manage roles, assign permissions to control access across the organization
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" asChild>
                  <Link href="/dashboard">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
                <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <ShieldPlus className="w-4 h-4 mr-2" />
                  Create Role
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && <SetupStatusBanner error={error} />}

            <div className="flex items-center gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search roles by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading roles...</div>
            ) : filteredRoles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No roles found matching your search" : "No roles found"}
              </div>
            ) : (
              <RoleTable roles={filteredRoles} onRoleUpdated={fetchRoles} />
            )}
          </CardContent>
        </Card>
      </div>

      <RoleDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
        onRoleUpdated={fetchRoles}
      />
    </div>
  )
}
