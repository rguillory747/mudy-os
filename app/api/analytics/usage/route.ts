import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { ModelRouter } from '@/lib/model-router'
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

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const roleId = searchParams.get('roleId')

    const analytics = await ModelRouter.getUsageAnalytics(org.id, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      roleId: roleId || undefined
    })

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Analytics error:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}
