'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Organization, OrgSubscription } from '@prisma/client'
import { BillingTab } from './billing-tab'
import { OrganizationTab } from './organization-tab'
import { UsageTab } from './usage-tab'

interface SettingsTabsProps {
  organization: Organization
  subscription: OrgSubscription | null
}

export function SettingsTabs({ organization, subscription }: SettingsTabsProps) {
  return (
    <Tabs defaultValue="billing" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="billing">Billing & Plan</TabsTrigger>
        <TabsTrigger value="usage">Usage & Analytics</TabsTrigger>
        <TabsTrigger value="organization">Organization</TabsTrigger>
      </TabsList>

      <TabsContent value="billing" className="mt-6">
        <BillingTab organization={organization} subscription={subscription} />
      </TabsContent>

      <TabsContent value="usage" className="mt-6">
        <UsageTab organization={organization} />
      </TabsContent>

      <TabsContent value="organization" className="mt-6">
        <OrganizationTab organization={organization} />
      </TabsContent>
    </Tabs>
  )
}
