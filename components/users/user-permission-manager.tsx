"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Search, Shield, CheckCircle, X } from "lucide-react"
import type { User } from "@/lib/types/user"
import { PERMISSION_METADATA } from "@/lib/rbac/permissions"

interface UserPermissionManagerProps {
  user: User
  onClose: () => void
  onPermissionsUpdated: () => void
}

export function UserPermissionManager({ user, onClose, onPermissionsUpdated }: UserPermissionManagerProps) {
  const [availablePermissions, setAvailablePermissions] = useState<any[]>([])
  const [userPermissions, setUserPermissions] = useState<any[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchPermissions()
  }, [])

  useEffect(() => {
    setSelectedPermissions(userPermissions.map(p => p.id))
  }, [userPermissions])

  const fetchPermissions = async () => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      // Add user context if available
      const storedUser = localStorage.getItem('currentUser')
      if (storedUser) {
        try {
          const userContext = JSON.parse(storedUser)
          headers['x-user-id'] = userContext.sub || userContext.id
          headers['x-user-role'] = userContext.role || ''
          headers['x-user-permissions'] = JSON.stringify(userContext.customPermissions || [])
        } catch (error) {
          console.error('Error parsing stored user:', error)
        }
      }

      const [permissionsResponse, userPermissionsResponse] = await Promise.all([
        fetch("/api/permissions", { headers }),
        fetch(`/api/users/${encodeURIComponent(user.id)}/permissions`, { headers })
      ])

      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json()
        setAvailablePermissions(permissionsData.permissions || [])
      }

      if (userPermissionsResponse.ok) {
        const userPermissionsData = await userPermissionsResponse.json()
        setUserPermissions(userPermissionsData.permissions || [])
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error)
      toast({
        title: "Error",
        description: "Failed to fetch permissions",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId])
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== permissionId))
    }
  }

  const handleSelectAll = () => {
    const filteredPermissions = getFilteredPermissions()
    setSelectedPermissions(filteredPermissions.map(p => p.id))
  }

  const handleSelectNone = () => {
    setSelectedPermissions([])
  }

  const getFilteredPermissions = () => {
    return availablePermissions.filter(permission =>
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      // Add user context if available
      const storedUser = localStorage.getItem('currentUser')
      if (storedUser) {
        try {
          const userContext = JSON.parse(storedUser)
          headers['x-user-id'] = userContext.sub || userContext.id
          headers['x-user-role'] = userContext.role || ''
          headers['x-user-permissions'] = JSON.stringify(userContext.customPermissions || [])
        } catch (error) {
          console.error('Error parsing stored user:', error)
        }
      }

      // Get current user permissions
      const currentPermissionIds = userPermissions.map(p => p.id)
      
      // Calculate permissions to add and remove
      const permissionsToAdd = selectedPermissions.filter(id => !currentPermissionIds.includes(id))
      const permissionsToRemove = currentPermissionIds.filter(id => !selectedPermissions.includes(id))

      // Add new permissions
      if (permissionsToAdd.length > 0) {
        await fetch(`/api/users/${encodeURIComponent(user.id)}/permissions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ permissionIds: permissionsToAdd }),
        })
      }

      // Remove permissions
      if (permissionsToRemove.length > 0) {
        await fetch(`/api/users/${encodeURIComponent(user.id)}/permissions`, {
          method: 'DELETE',
          headers,
          body: JSON.stringify({ permissionIds: permissionsToRemove }),
        })
      }

      toast({
        title: "Success",
        description: "User permissions updated successfully",
      })

      onPermissionsUpdated()
      onClose()
    } catch (error) {
      console.error("Error updating user permissions:", error)
      toast({
        title: "Error",
        description: "Failed to update user permissions",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const filteredPermissions = getFilteredPermissions()
  const selectedCount = selectedPermissions.length
  const totalCount = filteredPermissions.length

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Permissions for {user.name}
          </CardTitle>
          <CardDescription>Loading available permissions...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Manage Permissions for {user.name}
            </CardTitle>
            <CardDescription>
              Select the permissions that should be assigned to this user.
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Controls */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleSelectNone}>
              Select None
            </Button>
          </div>
        </div>

        {/* Selection Summary */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="w-4 h-4" />
          <span>{selectedCount} of {totalCount} permissions selected</span>
          {selectedCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedCount} selected
            </Badge>
          )}
        </div>

        {/* Permissions List */}
        <div className="max-h-96 overflow-y-auto border rounded-lg">
          {filteredPermissions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No permissions found
            </div>
          ) : (
            <div className="divide-y">
              {filteredPermissions.map((permission) => {
                const isSelected = selectedPermissions.includes(permission.id)
                const permissionMetadata = PERMISSION_METADATA.find(p => p.id === permission.name)
                
                return (
                  <div key={permission.id} className="p-4 hover:bg-muted/50">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={permission.id}
                        checked={isSelected}
                        onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked as boolean)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={permission.id}
                            className="font-medium cursor-pointer"
                          >
                            {permissionMetadata?.label || permission.name}
                          </label>
                          {isSelected && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {permission.description || permissionMetadata?.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {permission.resource_server_identifier}
                          </Badge>
                          {permissionMetadata?.category && (
                            <Badge variant="secondary" className="text-xs">
                              {permissionMetadata.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Permissions'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
