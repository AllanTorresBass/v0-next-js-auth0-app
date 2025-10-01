"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PERMISSION_METADATA, ROLE_PERMISSIONS, type Permission, type UserRole } from "@/lib/rbac/permissions"
import { Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PermissionSelectorProps {
  role: UserRole
  selectedPermissions: Permission[]
  onPermissionsChange: (permissions: Permission[]) => void
}

export function PermissionSelector({ role, selectedPermissions, onPermissionsChange }: PermissionSelectorProps) {
  const rolePermissions = ROLE_PERMISSIONS[role] || []
  const [useCustomPermissions, setUseCustomPermissions] = useState(selectedPermissions.length > 0)

  const categories = Array.from(new Set(PERMISSION_METADATA.map((p) => p.category)))

  const handlePermissionToggle = (permission: Permission) => {
    const newPermissions = selectedPermissions.includes(permission)
      ? selectedPermissions.filter((p) => p !== permission)
      : [...selectedPermissions, permission]

    onPermissionsChange(newPermissions)
  }

  const handleUseCustomToggle = (checked: boolean) => {
    setUseCustomPermissions(checked)
    if (checked) {
      // Initialize with role permissions
      onPermissionsChange(rolePermissions)
    } else {
      // Clear custom permissions
      onPermissionsChange([])
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox id="use-custom-permissions" checked={useCustomPermissions} onCheckedChange={handleUseCustomToggle} />
        <Label htmlFor="use-custom-permissions" className="text-sm font-medium">
          Override role permissions with custom permissions
        </Label>
      </div>

      {!useCustomPermissions && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            This user will inherit all permissions from the <Badge variant="secondary">{role}</Badge> role.
          </AlertDescription>
        </Alert>
      )}

      {useCustomPermissions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Custom Permissions</CardTitle>
            <CardDescription>Select specific permissions for this user</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={categories[0]} className="w-full">
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}>
                {categories.map((category) => (
                  <TabsTrigger key={category} value={category} className="capitalize">
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((category) => (
                <TabsContent key={category} value={category} className="space-y-4 mt-4">
                  {PERMISSION_METADATA.filter((p) => p.category === category).map((permission) => {
                    const isRolePermission = rolePermissions.includes(permission.id)
                    const isSelected = selectedPermissions.includes(permission.id)

                    return (
                      <div key={permission.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                        <Checkbox
                          id={permission.id}
                          checked={isSelected}
                          onCheckedChange={() => handlePermissionToggle(permission.id)}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={permission.id} className="text-sm font-medium cursor-pointer">
                              {permission.label}
                            </Label>
                            {isRolePermission && (
                              <Badge variant="outline" className="text-xs">
                                Role Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{permission.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
