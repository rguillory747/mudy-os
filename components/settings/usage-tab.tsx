'use client'

import { Organization } from '@prisma/client'
import { QuotaStatusCard } from '@/components/dashboard/quota-status-card'
import { UsageAnalyticsCard } from '@/components/dashboard/usage-analytics-card'

interface UsageTabProps {
  organization: Organization
}

export function UsageTab({ organization }: UsageTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Usage & Analytics</h2>
        <p className="text-muted-foreground">
          Monitor your token usage and costs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuotaStatusCard />
        <UsageAnalyticsCard />
      </div>
    </div>
  )
}
