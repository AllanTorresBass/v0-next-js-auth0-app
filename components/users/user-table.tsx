"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Pencil, Trash2, Shield, Key, User as UserIcon, CheckCircle, XCircle, Clock } from "lucide-react"
import type { User } from "@/lib/types/user"
import { UserDialog } from "./user-dialog"
import { DeleteUserDialog } from "./delete-user-dialog"
import { UserPermissionManager } from "./user-permission-manager"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useUsers } from "@/hooks/use-users"

interface UserTableProps {
  users?: User[]
  searchQuery?: string
}


// Helper function to get user initials
const getUserInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function UserTable({ users: propUsers, searchQuery = "" }: UserTableProps) {
  const { data: queryUsers, isLoading, error, refetch } = useUsers()
  const allUsers = propUsers || queryUsers || []
  
  // Filter users based on search query
  const users = allUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [managingPermissions, setManagingPermissions] = useState<User | null>(null)

  const handleRefresh = () => {
    refetch()
  }

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Loading Users</h3>
          <p className="text-sm text-muted-foreground">Fetching user data and permissions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border rounded-lg">
        <div className="flex flex-col items-center justify-center py-8 text-destructive">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Error Loading Users</h3>
            <p className="text-sm mb-4">{error.message}</p>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Email Verified</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center">
                    <UserIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? "No users match your search criteria." : "No users have been created yet."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
              const permissionCount = user.permissions ? user.permissions.length : 0

              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.picture} alt={user.name} />
                        <AvatarFallback className="text-xs">
                          {user.picture ? <UserIcon className="h-4 w-4" /> : getUserInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.emailVerified ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm">Unverified</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="gap-1">
                              <Shield className="w-3 h-3" />
                              {permissionCount}
                            </Badge>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-medium text-xs">Permissions:</p>
                            <ul className="text-xs space-y-0.5">
                              {user.permissions.slice(0, 5).map((p) => (
                                <li key={p.id}>• {p.name}</li>
                              ))}
                              {permissionCount > 5 && <li key="more-permissions">• ... and {permissionCount - 5} more</li>}
                            </ul>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === "active" ? "default" : "outline"}>
                      {user.status === "active" ? "Active" : "Blocked"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.lastLogin || user.lastLoginAt ? (
                      <div>
                        <div>{new Date(user.lastLogin || user.lastLoginAt!).toLocaleDateString()}</div>
                        <div className="text-xs">{new Date(user.lastLogin || user.lastLoginAt!).toLocaleTimeString()}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.updatedAt ? (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <div>
                          <div className="text-xs">{new Date(user.updatedAt).toLocaleDateString()}</div>
                          <div className="text-xs">{new Date(user.updatedAt).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setEditingUser(user)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setManagingPermissions(user)}>
                              <Key className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Manage Permissions</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingUser(user)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
            )}
          </TableBody>
        </Table>
      </div>

      {editingUser && (
        <UserDialog 
          user={editingUser} 
          open={!!editingUser} 
          onOpenChange={() => setEditingUser(null)}
          onUserUpdated={handleRefresh}
        />
      )}

      {deletingUser && (
        <DeleteUserDialog 
          user={deletingUser} 
          open={!!deletingUser} 
          onOpenChange={() => setDeletingUser(null)}
          onUserDeleted={handleRefresh}
        />
      )}

      {managingPermissions && (
        <UserPermissionManager 
          user={managingPermissions} 
          onClose={() => setManagingPermissions(null)}
          onPermissionsUpdated={handleRefresh}
        />
      )}
    </>
  )
}
