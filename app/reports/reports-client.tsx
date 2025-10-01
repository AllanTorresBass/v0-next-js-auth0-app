"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import {
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  Download,
  Plus,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
} from "lucide-react"
import type { UserRole } from "@/lib/rbac/permissions"
import { PermissionGate } from "@/components/rbac/permission-gate"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface ReportsClientProps {
  userRole?: UserRole
  userName: string
}

const SAMPLE_REPORTS = [
  {
    id: 1,
    title: "Monthly Sales Report",
    description: "Comprehensive sales analysis for the current month",
    type: "Sales",
    date: "2025-01-15",
    status: "completed",
    icon: DollarSign,
  },
  {
    id: 2,
    title: "User Growth Analysis",
    description: "User acquisition and retention metrics",
    type: "Analytics",
    date: "2025-01-14",
    status: "completed",
    icon: Users,
  },
  {
    id: 3,
    title: "Marketing Campaign Performance",
    description: "ROI and engagement metrics for Q1 campaigns",
    type: "Marketing",
    date: "2025-01-13",
    status: "completed",
    icon: TrendingUp,
  },
  {
    id: 4,
    title: "Financial Summary Q1",
    description: "Quarterly financial overview and projections",
    type: "Finance",
    date: "2025-01-12",
    status: "completed",
    icon: BarChart3,
  },
]

export function ReportsClient({ userRole, userName }: ReportsClientProps) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8">
        <PermissionGate
          permission="reports:view"
          fallback={
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                You do not have permission to view reports. Please contact your administrator.
              </AlertDescription>
            </Alert>
          }
        >
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-balance">Reports</h1>
              <p className="text-muted-foreground mt-1">View and manage system reports</p>
            </div>
            <PermissionGate permission="reports:create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Report
              </Button>
            </PermissionGate>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">127</div>
                <p className="text-xs text-muted-foreground">Generated this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Reports</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">In the last 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Report Types</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">Different categories</p>
              </CardContent>
            </Card>
          </div>

          <PermissionGate
            permission="reports:create"
            fallback={
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Limited Access</AlertTitle>
                <AlertDescription>
                  You can view reports but cannot create new ones. Contact your administrator for elevated permissions.
                </AlertDescription>
              </Alert>
            }
          >
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Create and manage reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <BarChart3 className="h-4 w-4" />
                    Sales Report
                  </Button>
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <Users className="h-4 w-4" />
                    User Analytics
                  </Button>
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <TrendingUp className="h-4 w-4" />
                    Performance Report
                  </Button>
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <DollarSign className="h-4 w-4" />
                    Financial Summary
                  </Button>
                </div>
              </CardContent>
            </Card>
          </PermissionGate>

          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Your most recent generated reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {SAMPLE_REPORTS.map((report) => {
                  const Icon = report.icon
                  return (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{report.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {report.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{report.date}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </PermissionGate>
      </div>
    </div>
  )
}
