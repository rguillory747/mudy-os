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

    const parsedStart = startDate ? new Date(startDate) : undefined
    const parsedEnd = endDate ? new Date(endDate) : undefined

    if (parsedStart && isNaN(parsedStart.getTime())) {
      return new NextResponse('Invalid startDate', { status: 400 })
    }
    if (parsedEnd && isNaN(parsedEnd.getTime())) {
      return new NextResponse('Invalid endDate', { status: 400 })
    }

    const analytics = await ModelRouter.getUsageAnalytics(org.id, {
      startDate: parsedStart,
      endDate: parsedEnd,
      roleId: roleId || undefined
    })

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Analytics error:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}
