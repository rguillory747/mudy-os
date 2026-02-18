'use client'

import { LayoutDashboard } from "lucide-react"
import { QuotaStatusCard } from "@/components/dashboard/quota-status-card"
import { UsageAnalyticsCard } from "@/components/dashboard/usage-analytics-card"
import { QuickActionsCard } from "@/components/dashboard/quick-actions-card"
import { StandupTriggerCard } from "@/components/dashboard/standup-trigger-card"

export default function DashboardPage() {
  return (
    <div className="h-full p-6 space-y-6">
      <div className="flex items-center gap-x-3">
        <LayoutDashboard className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QuotaStatusCard />
        <QuickActionsCard />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StandupTriggerCard />
        <UsageAnalyticsCard />
      </div>
    </div>
  )
}
