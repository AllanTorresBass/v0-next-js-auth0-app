"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import type { User } from "@/lib/types/user"
import { useCreateUser, useUpdateUser } from "@/hooks/use-users"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Shield } from "lucide-react"

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Create User"}</DialogTitle>
          <DialogDescription>
            {user ? "Update the user information below." : "Fill in the details to create a new user."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm whitespace-pre-line">{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">
              Password{" "}
              {user && <span className="text-muted-foreground text-sm">(leave blank to keep current)</span>}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!user}
              placeholder={user ? "Leave blank to keep current" : "Enter password"}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="picture">Profile Picture URL</Label>
            <Input
              id="picture"
              type="url"
              value={formData.picture}
              onChange={(e) => setFormData({ ...formData, picture: e.target.value })}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="emailVerified"
              checked={formData.emailVerified}
              onChange={(e) => setFormData({ ...formData, emailVerified: e.target.checked })}
              className="rounded border-gray-300"
            />
            <Label htmlFor="emailVerified">Email verified</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="blocked"
              checked={formData.blocked}
              onChange={(e) => setFormData({ ...formData, blocked: e.target.checked })}
              className="rounded border-gray-300"
            />
            <Label htmlFor="blocked">Block this user</Label>
          </div>

          {/* Role Selection */}
          <div className="grid gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <Label>Assign Roles</Label>
              {formData.roles.length > 0 && (
                <Badge variant="secondary">{formData.roles.length} selected</Badge>
              )}
            </div>
            
            {isLoadingRoles ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading roles...
              </div>
            ) : availableRoles.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No roles available. Create a role first.
              </div>
            ) : (
              <div className="grid gap-2 max-h-40 overflow-y-auto border rounded-lg p-4">
                {availableRoles.map((role) => {
                  const isSelected = formData.roles.includes(role.id)
                  return (
                    <div key={role.id} className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded">
                      <Checkbox
                        id={role.id}
                        checked={isSelected}
                        onCheckedChange={() => handleRoleToggle(role.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor={role.id}
                          className="font-medium cursor-pointer"
                        >
                          {role.name}
                        </label>
                        <p className="text-sm text-muted-foreground">
                          {role.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createUser.isPending || updateUser.isPending}>
              {user ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
