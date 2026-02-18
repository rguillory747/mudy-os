import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { QuotaManager } from '@/lib/quota-manager'
import { getCurrentOrg } from '@/lib/tenant'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const org = await getCurrentOrg()
    if (!org) {
      return new NextResponse('Organization not found', { status: 404 })
    }

    // Check if quota needs reset
    await QuotaManager.checkAndResetIfNeeded(org.id)

    // Get current status
    const status = await QuotaManager.getQuotaStatus(org.id)

    return NextResponse.json({
      ...status,
      orgId: org.id,
      orgName: org.name
    })
  } catch (error) {
    console.error('Quota status error:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}
