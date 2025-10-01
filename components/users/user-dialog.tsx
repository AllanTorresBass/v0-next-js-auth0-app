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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { User } from "@/lib/data/mock-users"
import type { UserRole, Permission } from "@/lib/rbac/permissions"
import { useCreateUser, useUpdateUser } from "@/hooks/use-users"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { PermissionSelector } from "./permission-selector"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface UserDialogProps {
  user?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "sales_senior", label: "Sales Senior" },
  { value: "sales_junior", label: "Sales Junior" },
  { value: "marketing_senior", label: "Marketing Senior" },
  { value: "marketing_junior", label: "Marketing Junior" },
  { value: "client", label: "Client" },
]

export function UserDialog({ user, open, onOpenChange }: UserDialogProps) {
  const { toast } = useToast()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "client" as UserRole,
    status: "active" as "active" | "inactive",
    customPermissions: [] as Permission[],
  })

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: "",
        role: user.role,
        status: user.status,
        customPermissions: user.customPermissions || [],
      })
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "client",
        status: "active",
        customPermissions: [],
      })
    }
    setErrorMessage(null)
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    try {
      if (user) {
        await updateUser.mutateAsync({ id: user.id, data: formData })
      } else {
        await createUser.mutateAsync(formData)
      }
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
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
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
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value as UserRole, customPermissions: [] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as "active" | "inactive" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="mt-4">
              <PermissionSelector
                role={formData.role}
                selectedPermissions={formData.customPermissions}
                onPermissionsChange={(permissions) => setFormData({ ...formData, customPermissions: permissions })}
              />
            </TabsContent>
          </Tabs>

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
