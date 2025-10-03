"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Shield, Plus, Minus } from "lucide-react"
import type { User } from "@/lib/types/user"
import type { Auth0Role } from "@/lib/auth0-management"
import { useToast } from "@/hooks/use-toast"

interface UserRoleManagerProps {
  user: User
  onClose: () => void
  onRolesUpdated?: () => void
}

export function UserRoleManager({ user, onClose, onRolesUpdated }: UserRoleManagerProps) {
  const { toast } = useToast()
  const [availableRoles, setAvailableRoles] = useState<Auth0Role[]>([])
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchRoles()
  }, [])

  useEffect(() => {
    setUserRoles(user.roles.map(role => role.id))
    setSelectedRoles(user.roles.map(role => role.id))
  }, [user])

  const fetchRoles = async () => {
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

      const response = await fetch("/api/roles", { headers })
      if (response.ok) {
        const data = await response.json()
        setAvailableRoles(data.roles || [])
      } else {
        throw new Error(`Failed to fetch roles: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error)
      toast({
        title: "Error",
        description: "Failed to fetch available roles",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleToggle = (roleId: string, checked: boolean) => {
    if (checked) {
      setSelectedRoles(prev => [...prev, roleId])
    } else {
      setSelectedRoles(prev => prev.filter(id => id !== roleId))
    }
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

      const rolesToAdd = selectedRoles.filter(roleId => !userRoles.includes(roleId))
      const rolesToRemove = userRoles.filter(roleId => !selectedRoles.includes(roleId))

      // Add new roles
      if (rolesToAdd.length > 0) {
        const addResponse = await fetch(`/api/users/${encodeURIComponent(user.id)}/roles`, {
          method: "POST",
          headers,
          body: JSON.stringify({ roleIds: rolesToAdd }),
        })
        
        if (!addResponse.ok) {
          const error = await addResponse.json()
          throw new Error(error.error || `Failed to add roles: ${addResponse.statusText}`)
        }
      }

      // Remove roles
      if (rolesToRemove.length > 0) {
        const removeResponse = await fetch(`/api/users/${encodeURIComponent(user.id)}/roles`, {
          method: "DELETE",
          headers,
          body: JSON.stringify({ roleIds: rolesToRemove }),
        })
        
        if (!removeResponse.ok) {
          const error = await removeResponse.json()
          throw new Error(error.error || `Failed to remove roles: ${removeResponse.statusText}`)
        }
      }

      toast({
        title: "Success",
        description: "User roles updated successfully",
      })
      onRolesUpdated?.()
      onClose()
    } catch (error) {
      console.error("Failed to update roles:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user roles",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Roles
          </CardTitle>
          <CardDescription>Loading available roles...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Manage Roles for {user.name}
        </CardTitle>
        <CardDescription>Assign or remove roles for this user</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {availableRoles.map((role) => {
            const isAssigned = userRoles.includes(role.id)
            const isSelected = selectedRoles.includes(role.id)
            const isNew = !isAssigned && isSelected
            const isRemoved = isAssigned && !isSelected

            return (
              <div
                key={role.id}
                className={`flex items-center space-x-3 p-3 border rounded-lg ${
                  isNew ? "border-green-200 bg-green-50" : 
                  isRemoved ? "border-red-200 bg-red-50" : 
                  "border-gray-200"
                }`}
              >
                <Checkbox
                  id={role.id}
                  checked={isSelected}
                  onCheckedChange={(checked) => handleRoleToggle(role.id, checked as boolean)}
                />
                <div className="flex-1">
                  <label htmlFor={role.id} className="font-medium cursor-pointer">
                    {role.name}
                  </label>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isNew && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <Plus className="h-3 w-3 mr-1" />
                      Adding
                    </Badge>
                  )}
                  {isRemoved && (
                    <Badge variant="destructive" className="bg-red-100 text-red-800">
                      <Minus className="h-3 w-3 mr-1" />
                      Removing
                    </Badge>
                  )}
                  {isAssigned && !isRemoved && (
                    <Badge variant="secondary">Current</Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
