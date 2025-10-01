"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Shield } from "lucide-react"
import type { User } from "@/lib/data/mock-users"
import { PermissionGate } from "@/components/rbac/permission-gate"
import { UserDialog } from "./user-dialog"
import { DeleteUserDialog } from "./delete-user-dialog"
import { getUserPermissions } from "@/lib/rbac/permissions"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface UserTableProps {
  users: User[]
}

const roleLabels: Record<string, string> = {
  admin: "Admin",
  sales_senior: "Sales Senior",
  sales_junior: "Sales Junior",
  marketing_senior: "Marketing Senior",
  marketing_junior: "Marketing Junior",
  client: "Client",
}

export function UserTable({ users }: UserTableProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const permissions = getUserPermissions(user.role, user.customPermissions)
              const hasCustomPermissions = user.customPermissions && user.customPermissions.length > 0

              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{roleLabels[user.role]}</Badge>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <Badge variant={hasCustomPermissions ? "default" : "outline"} className="gap-1">
                              <Shield className="w-3 h-3" />
                              {permissions.length}
                            </Badge>
                            {hasCustomPermissions && (
                              <Badge variant="secondary" className="text-xs">
                                Custom
                              </Badge>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-medium text-xs">
                              {hasCustomPermissions ? "Custom Permissions:" : "Role Permissions:"}
                            </p>
                            <ul className="text-xs space-y-0.5">
                              {permissions.slice(0, 5).map((p) => (
                                <li key={p}>• {p}</li>
                              ))}
                              {permissions.length > 5 && <li>• ... and {permissions.length - 5} more</li>}
                            </ul>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === "active" ? "default" : "outline"}>
                      {user.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <PermissionGate permission="users:update">
                        <Button variant="ghost" size="icon" onClick={() => setEditingUser(user)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission="users:delete">
                        <Button variant="ghost" size="icon" onClick={() => setDeletingUser(user)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </PermissionGate>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {editingUser && <UserDialog user={editingUser} open={!!editingUser} onOpenChange={() => setEditingUser(null)} />}

      {deletingUser && (
        <DeleteUserDialog user={deletingUser} open={!!deletingUser} onOpenChange={() => setDeletingUser(null)} />
      )}
    </>
  )
}
