"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Search, Shield, CheckCircle, Loader2 } from "lucide-react"
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
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchPermissions()
  }, [role.id])

  // Update selected permissions when role permissions are loaded
  useEffect(() => {
    if (rolePermissions.length > 0) {
      const currentPermissionIds = rolePermissions.map(p => p.id)
      setSelectedPermissions(currentPermissionIds)
      console.log('[RolePermissionManager] Loaded role permissions:', currentPermissionIds)
    }
  }, [rolePermissions])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'a':
            event.preventDefault()
            handleSelectAll()
            break
          case 'd':
            event.preventDefault()
            handleSelectNone()
            break
          case 's':
            event.preventDefault()
            if (!isSaving && !isLoading && error === null) {
              handleSave()
            }
            break
        }
      }
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSaving, isLoading, error])

  const fetchPermissions = async () => {
    try {
      setIsLoading(true)
      setError(null)
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

      // Handle available permissions
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json()
        console.log('[RolePermissionManager] Available permissions loaded:', permissionsData.permissions?.length || 0)
        setAvailablePermissions(permissionsData.permissions || [])
      } else {
        const errorText = await permissionsResponse.text()
        console.error('[RolePermissionManager] Failed to fetch permissions:', permissionsResponse.status, errorText)
        setError(`Failed to load available permissions: ${permissionsResponse.statusText}`)
      }

      // Handle role permissions
      if (rolePermissionsResponse.ok) {
        const rolePermissionsData = await rolePermissionsResponse.json()
        console.log('[RolePermissionManager] Role permissions loaded:', rolePermissionsData.permissions?.length || 0)
        setRolePermissions(rolePermissionsData.permissions || [])
      } else {
        const errorText = await rolePermissionsResponse.text()
        console.error('[RolePermissionManager] Failed to fetch role permissions:', rolePermissionsResponse.status, errorText)
        // Don't set error for role permissions as it might be empty initially
        setRolePermissions([])
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error)
      setError("Failed to fetch permissions. Please try again.")
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
    return availablePermissions.filter(permission => {
      const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.description.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = selectedCategory === "all" || 
        permission.category === selectedCategory ||
        (permission.category === undefined && selectedCategory === "other")
      
      return matchesSearch && matchesCategory
    })
  }

  const getAvailableCategories = () => {
    const categories = new Set(availablePermissions.map(p => p.category || 'other'))
    return Array.from(categories).sort()
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
      <DialogContent className="max-w-7xl max-h-[90vh] w-[95vw] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                Manage Permissions for <span className="text-primary">{role.name}</span>
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                Configure the permissions that should be assigned to this role. Users with this role will have access to the selected permissions.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {selectedCount} of {totalCount} selected
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-6">
          {/* Enhanced Search and Controls */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search permissions by name, description, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-11 text-base"
                />
              </div>
              
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-muted-foreground">Category:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-11 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="all">All Categories</option>
                  {getAvailableCategories().map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleSelectAll}
                  className="h-11 px-4"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Select All
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleSelectNone}
                  className="h-11 px-4"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>
            
            {/* Enhanced Selection Summary */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Total Permissions:</span>
                  <Badge variant="secondary">{totalCount}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Selected:</span>
                  <Badge variant="default" className="bg-green-600">{selectedCount}</Badge>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedCount > 0 ? (
                  <span>{Math.round((selectedCount / totalCount) * 100)}% of permissions selected</span>
                ) : (
                  <span>Use Ctrl+A to select all, Ctrl+D to clear all</span>
                )}
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 text-destructive">
                <Shield className="w-4 h-4" />
                <span className="font-medium">Error loading permissions</span>
              </div>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchPermissions}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Enhanced Permissions List */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-lg font-medium">Loading permissions...</p>
                  <p className="text-sm text-muted-foreground">Please wait while we fetch the available permissions</p>
                </div>
              </div>
            ) : filteredPermissions.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">
                    {searchTerm ? "No permissions found" : "No permissions available"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm 
                      ? "Try adjusting your search terms" 
                      : "There are no permissions configured for this system"
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full overflow-y-auto">
                {/* Group permissions by category */}
                {(() => {
                  const groupedPermissions = filteredPermissions.reduce((groups, permission) => {
                    const category = permission.category || 'other'
                    if (!groups[category]) groups[category] = []
                    groups[category].push(permission)
                    return groups
                  }, {} as Record<string, typeof filteredPermissions>)

                  return Object.entries(groupedPermissions).map(([category, permissions]) => (
                    <div key={category} className="mb-6">
                      {/* Category Header */}
                      <div className="sticky top-0 bg-background border-b pb-2 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Shield className="w-4 h-4 text-primary" />
                          </div>
                          <h3 className="text-lg font-semibold capitalize">{category} Permissions</h3>
                          <Badge variant="outline" className="text-xs">
                            {permissions.length} permission{permissions.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>

                      {/* Permissions Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {permissions.map((permission) => {
                          const isSelected = selectedPermissions.includes(permission.id)
                          const permissionMetadata = PERMISSION_METADATA.find(p => p.id === permission.name)
                          
                          return (
                            <div 
                              key={permission.id} 
                              className={`group relative p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                                isSelected 
                                  ? 'bg-primary/5 border-primary/20 shadow-sm' 
                                  : 'bg-card hover:bg-muted/50 border-border'
                              }`}
                              onClick={() => handlePermissionToggle(permission.id, !isSelected)}
                            >
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  id={permission.id}
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked as boolean)}
                                  className="mt-1"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <label
                                      htmlFor={permission.id}
                                      className="font-medium cursor-pointer text-sm leading-tight"
                                    >
                                      {permissionMetadata?.label || permission.name}
                                    </label>
                                    {isSelected && (
                                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                                    {permission.description || permissionMetadata?.description || 'No description available'}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs px-2 py-1"
                                    >
                                      {permission.resource_server_identifier}
                                    </Badge>
                                    {permissionMetadata?.category && (
                                      <Badge 
                                        variant="secondary" 
                                        className="text-xs px-2 py-1"
                                      >
                                        {permissionMetadata.category}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Selection indicator */}
                              {isSelected && (
                                <div className="absolute top-2 right-2">
                                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="bg-muted/30 px-6 py-4 -mx-6 -mb-6">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Role: <span className="font-medium text-foreground">{role.name}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>{selectedCount} permission{selectedCount !== 1 ? 's' : ''} selected</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={isSaving || isLoading}
                className="h-11 px-6"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving || isLoading || error !== null}
                className="h-11 px-8"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save Permissions
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
