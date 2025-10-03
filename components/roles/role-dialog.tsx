"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Search, Shield } from "lucide-react"
import type { Auth0Role, Auth0Permission } from "@/lib/auth0-management"
import { PERMISSION_METADATA } from "@/lib/rbac/permissions"

interface RoleDialogProps {
  role?: Auth0Role
  open: boolean
  onOpenChange: (open: boolean) => void
  onRoleUpdated: () => void
}

export function RoleDialog({ role, open, onOpenChange, onRoleUpdated }: RoleDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [availablePermissions, setAvailablePermissions] = useState<Auth0Permission[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false)
  const { toast } = useToast()

  const isEditing = !!role

  useEffect(() => {
    if (role) {
      setName(role.name)
      setDescription(role.description || "")
    } else {
      setName("")
      setDescription("")
    }
    setSelectedPermissions([])
    setSearchTerm("")
  }, [role])

  useEffect(() => {
    if (open && !isEditing) {
      fetchPermissions()
    }
  }, [open, isEditing])

  const fetchPermissions = async () => {
    try {
      setIsLoadingPermissions(true)
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

      const response = await fetch("/api/permissions", { headers })
      
      if (response.ok) {
        const data = await response.json()
        setAvailablePermissions(data.permissions || [])
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error)
    } finally {
      setIsLoadingPermissions(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Role name is required",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

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

      const url = isEditing ? `/api/roles/${encodeURIComponent(role!.id)}` : '/api/roles'
      const method = isEditing ? 'PATCH' : 'POST'

      const requestBody = { 
        name: name.trim(), 
        description: description.trim() 
      }

      // Add permissions for new roles
      if (!isEditing && selectedPermissions.length > 0) {
        requestBody.permissions = selectedPermissions
      }

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${isEditing ? 'update' : 'create'} role`)
      }

      toast({
        title: "Success",
        description: `Role ${isEditing ? 'updated' : 'created'} successfully`,
      })

      onRoleUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} role:`, error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'create'} role`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPermissions = getFilteredPermissions()
  const selectedCount = selectedPermissions.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Role' : 'Create Role'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the role information below.' : 'Create a new role and assign permissions.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="grid gap-4 py-4 flex-1 overflow-hidden flex flex-col">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter role name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter role description"
                rows={3}
              />
            </div>
            
            {/* Permission Selection - Only for new roles */}
            {!isEditing && (
              <div className="grid gap-2 flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <Label>Permissions</Label>
                  {selectedCount > 0 && (
                    <Badge variant="secondary">{selectedCount} selected</Badge>
                  )}
                </div>
                
                {/* Search and Controls */}
                <div className="flex items-center gap-2">
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
                    <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
                      Select All
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={handleSelectNone}>
                      Select None
                    </Button>
                  </div>
                </div>

                {/* Permissions List */}
                <div className="flex-1 overflow-y-auto border rounded-lg">
                  {isLoadingPermissions ? (
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
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (isEditing ? 'Update Role' : 'Create Role')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
