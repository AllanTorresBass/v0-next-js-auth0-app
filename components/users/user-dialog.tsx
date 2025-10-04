"use client"

import type React from "react"

import { useState, useEffect } from "react"
// Removed Dialog imports - using custom full-screen modal
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import type { User } from "@/lib/types/user"
import { useCreateUser, useUpdateUser } from "@/hooks/use-users"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Shield, X } from "lucide-react"

interface UserDialogProps {
  user?: User
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserUpdated?: () => void
}

export function UserDialog({ user, open, onOpenChange, onUserUpdated }: UserDialogProps) {
  const { toast } = useToast()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    blocked: false,
    picture: "",
    emailVerified: false,
    roles: [] as string[],
  })

  const [availableRoles, setAvailableRoles] = useState<Array<{id: string, name: string, description: string}>>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)

  // Fetch available roles
  const fetchRoles = async () => {
    setIsLoadingRoles(true)
    try {
      const response = await fetch('/api/roles')
      if (response.ok) {
        const data = await response.json()
        setAvailableRoles(data.roles || [])
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    } finally {
      setIsLoadingRoles(false)
    }
  }

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: "",
        blocked: user.status === "blocked",
        picture: user.picture || "",
        emailVerified: user.emailVerified || false,
        roles: user.roles?.map(role => role.id) || [],
      })
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        blocked: false,
        picture: "",
        emailVerified: false,
        roles: [],
      })
    }
    setErrorMessage(null)
  }, [user, open])

  // Fetch roles when dialog opens
  useEffect(() => {
    if (open) {
      fetchRoles()
    }
  }, [open])

  // Handle role selection
  const handleRoleToggle = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(roleId)
        ? prev.roles.filter(id => id !== roleId)
        : [...prev.roles, roleId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    try {
      if (user) {
        await updateUser.mutateAsync({ id: user.id, data: formData })
      } else {
        await createUser.mutateAsync(formData)
      }
      onUserUpdated?.()
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again."
      setErrorMessage(message)

      // Only show toast for non-Auth0 setup errors
      if (!message.includes("Management API access denied")) {
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        })
      }
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Full-screen modal */}
      <div className="relative w-full h-full bg-background flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {user ? "Edit User" : "Create User"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {user ? "Update the user information below." : "Fill in the details to create a new user."}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl mx-auto">
            {errorMessage && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm whitespace-pre-line">{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Basic Information Section */}
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-xl font-semibold">Basic Information</h3>
                <p className="text-sm text-muted-foreground">User's personal details and contact information</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    required
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    {user ? "New Password (leave blank to keep current)" : "Password"}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={user ? "Leave blank to keep current" : "Enter password"}
                    required={!user}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="picture" className="text-sm font-medium">Profile Picture URL</Label>
                  <Input
                    id="picture"
                    type="url"
                    value={formData.picture}
                    onChange={(e) => setFormData({ ...formData, picture: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            {/* Account Status Section */}
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-xl font-semibold">Account Status</h3>
                <p className="text-sm text-muted-foreground">Manage user account settings and verification status</p>
              </div>
              
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="emailVerified"
                    checked={formData.emailVerified}
                    onCheckedChange={(checked) => setFormData({ ...formData, emailVerified: !!checked })}
                  />
                  <Label htmlFor="emailVerified" className="text-sm font-medium cursor-pointer">Email Verified</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="blocked"
                    checked={formData.blocked}
                    onCheckedChange={(checked) => setFormData({ ...formData, blocked: !!checked })}
                  />
                  <Label htmlFor="blocked" className="text-sm font-medium cursor-pointer">Blocked Account</Label>
                </div>
              </div>
            </div>

            {/* Roles Section */}
            <div className="space-y-6">
              <div className="border-b pb-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <h3 className="text-xl font-semibold">User Roles</h3>
                </div>
                <p className="text-sm text-muted-foreground">Assign roles to define user permissions and access levels</p>
                {formData.roles.length > 0 && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {formData.roles.length} role{formData.roles.length !== 1 ? 's' : ''} selected
                    </Badge>
                  </div>
                )}
              </div>
              
              {isLoadingRoles ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-sm text-muted-foreground">Loading available roles...</div>
                </div>
              ) : availableRoles.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No roles available</p>
                    <p className="text-xs text-muted-foreground">Create a role first to assign to users</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableRoles.map((role) => {
                    const isSelected = formData.roles.includes(role.id)
                    return (
                      <div 
                        key={role.id} 
                        className={`flex items-start space-x-3 p-4 border rounded-lg transition-all cursor-pointer ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-accent/50'
                        }`}
                        onClick={() => handleRoleToggle(role.id)}
                      >
                        <Checkbox
                          id={role.id}
                          checked={isSelected}
                          onCheckedChange={() => handleRoleToggle(role.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <Label htmlFor={role.id} className="text-sm font-medium cursor-pointer">
                            {role.name}
                          </Label>
                          {role.description && (
                            <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </form>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 px-8"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createUser.isPending || updateUser.isPending}
            onClick={handleSubmit}
            className="h-11 px-8"
          >
            {createUser.isPending || updateUser.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {user ? "Updating..." : "Creating..."}
              </>
            ) : (
              user ? "Update User" : "Create User"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
