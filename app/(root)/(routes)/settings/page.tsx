import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getCurrentOrg } from '@/lib/tenant'
import { prismadb } from '@/lib/prismadb'
import { SettingsTabs } from '@/components/settings/settings-tabs'

const SettingsPage = async () => {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const org = await getCurrentOrg()

  if (!org) {
    redirect('/')
  }

  const subscription = await prismadb.orgSubscription.findUnique({
    where: { orgId: org.id }
  })

  return (
    <div className="h-full p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your organization and subscription
        </p>
      </div>

      <SettingsTabs organization={org} subscription={subscription} />
    </div>
  )
}

export default SettingsPage
