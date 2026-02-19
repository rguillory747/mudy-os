import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createPortalSession } from '@/lib/stripe'
import { getCurrentOrg } from '@/lib/tenant'
import { prismadb } from '@/lib/prismadb'

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const org = await getCurrentOrg()

    if (!org) {
      return new NextResponse('Organization not found', { status: 404 })
    }

    const subscription = await prismadb.orgSubscription.findUnique({
      where: { orgId: org.id }
    })

    if (!subscription?.stripeCustomerId) {
      return new NextResponse('No active subscription', { status: 400 })
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings`

    const portalSession = await createPortalSession(subscription.stripeCustomerId, returnUrl)

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}
