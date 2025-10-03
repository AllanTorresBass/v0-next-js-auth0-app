"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import type { Auth0Role } from "@/lib/auth0-management"

interface DeleteRoleDialogProps {
  role: Auth0Role
  open: boolean
  onOpenChange: (open: boolean) => void
  onRoleDeleted: () => void
}

export function DeleteRoleDialog({ role, open, onOpenChange, onRoleDeleted }: DeleteRoleDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/roles/${encodeURIComponent(role.id)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        let errorMessage = 'Failed to delete role'
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      toast({
        title: "Success",
        description: "Role deleted successfully",
      })

      onRoleDeleted()
      onOpenChange(false)
    } catch (error) {
      console.error('Error deleting role:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete role',
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Role</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the role <strong>"{role.name}"</strong>? This action cannot be undone.
            <br />
            <br />
            <span className="text-destructive font-medium">
              Warning: This will remove the role from all users who currently have it assigned.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete Role'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
