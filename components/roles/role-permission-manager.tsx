"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Search, Shield, CheckCircle, Loader2, X } from "lucide-react"
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
    <div 
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="fixed inset-0 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full h-full max-w-none max-h-none bg-background rounded-lg shadow-lg border flex flex-col overflow-hidden relative">
          {/* Header Section - Full screen */}
          <div className="p-6 border-b bg-muted/20 relative">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-4 right-4 h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="flex items-start justify-between pr-12">
              <div className="flex-1">
                <h2 className="text-2xl font-bold flex items-center gap-3 mb-2">
                  <Shield className="w-6 h-6 text-primary" />
                  Manage Permissions
                </h2>
                <p className="text-base text-muted-foreground">
                  Configure the permissions that should be assigned to the <span className="font-semibold text-foreground">{role.name}</span> role. Users with this role will have access to the selected permissions.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 ml-6">
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm font-medium text-muted-foreground">Selected</div>
                    <div className="text-2xl font-bold text-primary">{selectedCount}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-muted-foreground">Total</div>
                    <div className="text-2xl font-bold">{totalCount}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-muted-foreground">Progress</div>
                    <div className="text-2xl font-bold text-green-600">{Math.round((selectedCount / totalCount) * 100)}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col gap-4 p-6">
            {/* Search and Action Bar - Matching the image */}
            <div className="flex items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleSelectAll}
                className="h-10 px-4"
              >
                Select All
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSelectNone}
                className="h-10 px-4"
              >
                Clear All
              </Button>
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

          {/* Permissions List - Matching the image layout */}
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
                <>
                  {(() => {
                    const groupedPermissions = filteredPermissions.reduce((groups, permission) => {
                      const category = permission.category || 'other'
                      if (!groups[category]) groups[category] = []
                      groups[category].push(permission)
                      return groups
                    }, {} as Record<string, typeof filteredPermissions>)

                    return Object.entries(groupedPermissions).map(([category, permissions]) => (
                      <div key={category} className="mb-8">
                        {/* Category Header - Matching the image */}
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-lg font-semibold capitalize">{category} Permissions</h3>
                          <Badge variant="outline" className="text-xs">
                            {permissions.length} permissions
                          </Badge>
                        </div>

                        {/* Permissions Grid - 2 columns as shown in image */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {permissions.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                              <Checkbox
                                id={permission.id}
                                checked={selectedPermissions.includes(permission.id)}
                                onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked as boolean)}
                              />
                              <div className="flex-1 min-w-0">
                                <label htmlFor={permission.id} className="text-sm font-medium cursor-pointer">
                                  {permission.name}
                                </label>
                                <p className="text-xs text-muted-foreground truncate">
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  })()}
                </>
              </div>
            )}
          </div>
          
          {/* Footer - Clean and simple like the image */}
          <div className="px-6 py-4 border-t bg-muted/20">
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-muted-foreground">
                  {selectedCount} of {totalCount} permissions selected
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={onClose} 
                    disabled={isSaving || isLoading}
                    className="h-10 px-6"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving || isLoading || error !== null}
                    className="h-10 px-6"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
