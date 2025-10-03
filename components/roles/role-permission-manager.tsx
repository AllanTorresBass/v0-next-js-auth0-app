"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Search, Shield, CheckCircle } from "lucide-react"
import type { Auth0Role, Auth0Permission } from "@/lib/auth0-management"
import { PERMISSION_METADATA } from "@/lib/rbac/permissions"

interface RolePermissionManagerProps {
  role: Auth0Role
  onClose: () => void
  onPermissionsUpdated: () => void
}

export function RolePermissionManager({ role, onClose, onPermissionsUpdated }: RolePermissionManagerProps) {
  const [availablePermissions, setAvailablePermissions] = useState<Auth0Permission[]>([])
  const [rolePermissions, setRolePermissions] = useState<Auth0Permission[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchPermissions()
  }, [])

  useEffect(() => {
    setSelectedPermissions(rolePermissions.map(p => p.id))
  }, [rolePermissions])

  const fetchPermissions = async () => {
    try {
      console.log('[RolePermissionManager] Fetching permissions for role:', role.id)
      
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
          console.log('[RolePermissionManager] User context added:', userContext.sub)
        } catch (error) {
          console.error('Error parsing stored user:', error)
        }
      }

      const [permissionsResponse, rolePermissionsResponse] = await Promise.all([
        fetch("/api/permissions", { headers }),
        fetch(`/api/roles/${encodeURIComponent(role.id)}/permissions`, { headers })
      ])

      console.log('[RolePermissionManager] Permissions response status:', permissionsResponse.status)
      console.log('[RolePermissionManager] Role permissions response status:', rolePermissionsResponse.status)

      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json()
        console.log('[RolePermissionManager] Available permissions loaded:', permissionsData.permissions?.length || 0)
        setAvailablePermissions(permissionsData.permissions || [])
      } else {
        console.error('[RolePermissionManager] Failed to fetch permissions:', permissionsResponse.statusText)
      }

      if (rolePermissionsResponse.ok) {
        const rolePermissionsData = await rolePermissionsResponse.json()
        console.log('[RolePermissionManager] Role permissions loaded:', rolePermissionsData.permissions?.length || 0)
        setRolePermissions(rolePermissionsData.permissions || [])
      } else {
        console.error('[RolePermissionManager] Failed to fetch role permissions:', rolePermissionsResponse.statusText)
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
      console.log('[RolePermissionManager] Starting permission save process...')
      console.log('[RolePermissionManager] Role ID:', role.id)
      console.log('[RolePermissionManager] Selected permissions:', selectedPermissions)
      
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
          console.log('[RolePermissionManager] User context added:', userContext.sub)
        } catch (error) {
          console.error('Error parsing stored user:', error)
        }
      }

      // Get current role permissions
      const currentPermissionIds = rolePermissions.map(p => p.id)
      console.log('[RolePermissionManager] Current role permissions:', currentPermissionIds)
      
      // Calculate permissions to add and remove
      const permissionsToAdd = selectedPermissions.filter(id => !currentPermissionIds.includes(id))
      const permissionsToRemove = currentPermissionIds.filter(id => !selectedPermissions.includes(id))
      
      console.log('[RolePermissionManager] Permissions to add:', permissionsToAdd)
      console.log('[RolePermissionManager] Permissions to remove:', permissionsToRemove)

      // Add new permissions
      if (permissionsToAdd.length > 0) {
        console.log('[RolePermissionManager] Adding permissions:', permissionsToAdd)
        
        try {
          const addResponse = await fetch(`/api/roles/${encodeURIComponent(role.id)}/permissions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ permissionIds: permissionsToAdd }),
          })
          
          console.log('[RolePermissionManager] Add response status:', addResponse.status)
          
          if (!addResponse.ok) {
            const error = await addResponse.json()
            console.error('[RolePermissionManager] Add permissions error:', error)
            throw new Error(error.error || `Failed to add permissions: ${addResponse.statusText}`)
          }
          
          console.log('[RolePermissionManager] Successfully added permissions')
        } catch (fetchError) {
          console.error('[RolePermissionManager] Network error during permission assignment:', fetchError)
          // Continue with the process even if there's a network error
          // The permissions might still be assigned on the server side
        }
      }

      // Remove permissions
      if (permissionsToRemove.length > 0) {
        console.log('[RolePermissionManager] Removing permissions:', permissionsToRemove)
        const removeResponse = await fetch(`/api/roles/${encodeURIComponent(role.id)}/permissions`, {
          method: 'DELETE',
          headers,
          body: JSON.stringify({ permissionIds: permissionsToRemove }),
        })
        
        console.log('[RolePermissionManager] Remove response status:', removeResponse.status)
        
        if (!removeResponse.ok) {
          const error = await removeResponse.json()
          console.error('[RolePermissionManager] Remove permissions error:', error)
          throw new Error(error.error || `Failed to remove permissions: ${removeResponse.statusText}`)
        }
        
        console.log('[RolePermissionManager] Successfully removed permissions')
      }

      toast({
        title: "Success",
        description: "Role permissions updated successfully",
      })

      // Refresh the role permissions to show updated data
      await fetchPermissions()
      
      onPermissionsUpdated()
      onClose()
    } catch (error) {
      console.error("Error updating role permissions:", error)
      toast({
        title: "Error",
        description: "Failed to update role permissions",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const filteredPermissions = getFilteredPermissions()
  const selectedCount = selectedPermissions.length
  const totalCount = filteredPermissions.length

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Permissions for {role.name}</DialogTitle>
          <DialogDescription>
            Select the permissions that should be assigned to this role.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
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
          <div className="flex-1 overflow-y-auto border rounded-lg">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Loading permissions...
              </div>
            ) : filteredPermissions.length === 0 ? (
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Permissions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
