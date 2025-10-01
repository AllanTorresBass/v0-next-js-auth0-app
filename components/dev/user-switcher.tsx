"use client"

import { useUser, MOCK_USERS } from "@/lib/mock-auth/mock-auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, ChevronDown, User, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  sales_senior: "Sales Senior",
  sales_junior: "Sales Junior",
  marketing_senior: "Marketing Senior",
  marketing_junior: "Marketing Junior",
  client: "Client",
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  sales_senior: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  sales_junior: "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20",
  marketing_senior: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  marketing_junior: "bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20",
  client: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
}

export function UserSwitcher() {
  const { user, switchUser, isLoading } = useUser()

  if (isLoading || !user) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
        <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
        <div className="flex flex-col gap-1">
          <div className="w-24 h-3 bg-muted animate-pulse rounded" />
          <div className="w-16 h-2 bg-muted animate-pulse rounded" />
        </div>
      </div>
    )
  }

  const currentUserId = Object.keys(MOCK_USERS).find((key) => MOCK_USERS[key].sub === user.sub) || "admin"

  const getUserInitials = (name: string | undefined): string => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between gap-2 h-auto py-2 px-3 hover:bg-accent/50 bg-transparent"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-8 w-8 border-2 border-primary/20">
              <AvatarImage src={user.picture || "/placeholder.svg"} alt={user.name || "User"} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {getUserInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-medium truncate max-w-[150px]">{user.name || "Unknown User"}</span>
              <Badge
                variant="outline"
                className={cn("text-xs font-normal h-5 px-1.5", ROLE_COLORS[user.role || "client"])}
              >
                {ROLE_LABELS[user.role || "client"]}
              </Badge>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="start">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Switch Test User
            </CardTitle>
            <CardDescription className="text-xs">Select a user to test different roles and permissions</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto">
              {Object.entries(MOCK_USERS).map(([userId, mockUser]) => {
                const isActive = currentUserId === userId
                const permissionCount = mockUser.customPermissions?.length || 0

                return (
                  <button
                    key={userId}
                    onClick={() => switchUser(userId)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 hover:bg-accent/50 transition-colors text-left",
                      isActive && "bg-accent/30",
                    )}
                  >
                    <Avatar className="h-10 w-10 border-2 border-primary/20 shrink-0">
                      <AvatarImage src={mockUser.picture || "/placeholder.svg"} alt={mockUser.name} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {getUserInitials(mockUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium truncate">{mockUser.name}</span>
                        {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mb-2">{mockUser.email}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn("text-xs h-5 px-1.5", ROLE_COLORS[mockUser.role || "client"])}
                        >
                          {ROLE_LABELS[mockUser.role || "client"]}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Shield className="h-3 w-3" />
                          <span>{permissionCount} permissions</span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
