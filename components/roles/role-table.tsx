"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Shield, Settings } from "lucide-react"
import type { Auth0Role } from "@/lib/auth0-management"
import { RoleDialog } from "./role-dialog"
import { DeleteRoleDialog } from "./delete-role-dialog"
import { RolePermissionManager } from "./role-permission-manager"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface RoleTableProps {
  roles: Auth0Role[]
  onRoleUpdated: () => void
}

export function RoleTable({ roles, onRoleUpdated }: RoleTableProps) {
  const [editingRole, setEditingRole] = useState<Auth0Role | null>(null)
  const [deletingRole, setDeletingRole] = useState<Auth0Role | null>(null)
  const [managingPermissions, setManagingPermissions] = useState<Auth0Role | null>(null)

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{role.name}</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {role.description || "No description"}
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="gap-1">
                            <Shield className="w-3 h-3" />
                            Manage
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to manage permissions for this role</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {role.created_at ? new Date(role.created_at).toLocaleDateString() : "Unknown"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setEditingRole(role)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setManagingPermissions(role)}>
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingRole(role)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingRole && (
        <RoleDialog 
          role={editingRole} 
          open={!!editingRole} 
          onOpenChange={() => setEditingRole(null)}
          onRoleUpdated={onRoleUpdated}
        />
      )}

      {deletingRole && (
        <DeleteRoleDialog 
          role={deletingRole} 
          open={!!deletingRole} 
          onOpenChange={() => setDeletingRole(null)}
          onRoleDeleted={onRoleUpdated}
        />
      )}

      {managingPermissions && (
        <RolePermissionManager 
          role={managingPermissions} 
          onClose={() => setManagingPermissions(null)}
          onPermissionsUpdated={onRoleUpdated}
        />
      )}
    </>
  )
}
