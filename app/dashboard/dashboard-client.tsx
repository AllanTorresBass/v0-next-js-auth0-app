"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/dashboard/stat-card"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Users, TrendingUp, FileText, Activity, ShoppingCart, Target } from "lucide-react"
import type { UserRole } from "@/lib/rbac/permissions"
import { RoleGate } from "@/components/rbac/role-gate"
import { PermissionGate } from "@/components/rbac/permission-gate"
// User switcher functionality removed - using Auth0 sessions only
import { Button } from "@/components/ui/button"

interface DashboardClientProps {
  userRole?: UserRole
  userName?: string
}

export function DashboardClient({ userRole, userName }: DashboardClientProps) {
  // Using Auth0 sessions - user authentication is handled by middleware

  // Dashboard loads immediately with Auth0 sessions

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">Welcome back, {userName || "User"}</h1>
          <p className="text-muted-foreground mt-1">
            {userRole ? `Role: ${userRole.replace("_", " ").toUpperCase()}` : ""}
          </p>
        </div>

        <PermissionGate permission="dashboard:view_all">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard
              title="Total Users"
              value="2,543"
              description="Active users in system"
              icon={Users}
              trend={{ value: "12% from last month", positive: true }}
            />
            <StatCard
              title="Revenue"
              value="$45,231"
              description="Total revenue this month"
              icon={TrendingUp}
              trend={{ value: "8% from last month", positive: true }}
            />
            <StatCard
              title="Reports"
              value="127"
              description="Generated this month"
              icon={FileText}
              trend={{ value: "3% from last month", positive: false }}
            />
            <StatCard
              title="Active Sessions"
              value="573"
              description="Current active sessions"
              icon={Activity}
              trend={{ value: "5% from last hour", positive: true }}
            />
          </div>
        </PermissionGate>

        <PermissionGate permission="dashboard:view_own">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <StatCard title="My Tasks" value="12" description="Tasks assigned to you" icon={FileText} />
            <StatCard title="Completed" value="45" description="Tasks completed this month" icon={Activity} />
            <StatCard title="In Progress" value="8" description="Currently working on" icon={TrendingUp} />
          </div>
        </PermissionGate>

        <div className="grid gap-6 lg:grid-cols-2">
          <RoleGate allowedRoles={["admin", "sales_senior", "sales_junior"]}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Sales Overview
                </CardTitle>
                <CardDescription>Recent sales activity and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">This Week</span>
                    <span className="font-semibold">$12,450</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">This Month</span>
                    <span className="font-semibold">$45,231</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">This Quarter</span>
                    <span className="font-semibold">$128,900</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </RoleGate>

          <RoleGate allowedRoles={["admin", "marketing_senior", "marketing_junior"]}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Marketing Campaigns
                </CardTitle>
                <CardDescription>Active campaigns and their performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Email Campaign</span>
                    <span className="font-semibold">24.5% CTR</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Social Media</span>
                    <span className="font-semibold">12.3K Reach</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Content Marketing</span>
                    <span className="font-semibold">8.7K Views</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </RoleGate>

          <RoleGate allowedRoles={["admin"]}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Activity
                </CardTitle>
                <CardDescription>Recent user registrations and activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">New Users Today</span>
                    <span className="font-semibold">23</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Sessions</span>
                    <span className="font-semibold">573</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avg. Session Duration</span>
                    <span className="font-semibold">12m 34s</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </RoleGate>

          <RoleGate allowedRoles={["client"]}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Your Activity
                </CardTitle>
                <CardDescription>Your recent activity and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Projects</span>
                    <span className="font-semibold">3 Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Messages</span>
                    <span className="font-semibold">12 Unread</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Login</span>
                    <span className="font-semibold">2 hours ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </RoleGate>
        </div>
      </div>
    </div>
  )
}
