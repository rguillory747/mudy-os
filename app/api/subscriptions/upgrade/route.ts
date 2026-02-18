import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe'
import { getCurrentOrg } from '@/lib/tenant'
import { PLAN_CATALOG } from '@/lib/plans'
import { PlanTier } from '@prisma/client'

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

    const body = await req.json()
    const { tier } = body as { tier: PlanTier }

    if (!tier || !['starter', 'pro', 'enterprise'].includes(tier)) {
      return new NextResponse('Invalid tier', { status: 400 })
    }

    const plan = PLAN_CATALOG[tier]

    if (!plan.stripePriceId) {
      return new NextResponse('Stripe price ID not configured', { status: 500 })
    }

    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings?upgrade=success`
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings?upgrade=cancelled`

    const session = await createCheckoutSession({
      orgId: org.id,
      tier,
      stripePriceId: plan.stripePriceId,
      successUrl,
      cancelUrl,
      trialDays: plan.trialDays
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}
