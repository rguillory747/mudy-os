import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe, stripeWebhookSecret } from '@/lib/stripe'
import { prismadb } from '@/lib/prismadb'
import { PlanTier } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return new NextResponse('Webhook Error', { status: 400 })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const subscription = event.data.object as Stripe.Subscription

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        if (session.mode === 'subscription') {
          const orgId = session.metadata?.orgId
          const tier = session.metadata?.tier as PlanTier

          if (!orgId || !tier) {
            console.error('Missing orgId or tier in session metadata')
            return new NextResponse('Missing metadata', { status: 400 })
          }

          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          const periodEnd = new Date(sub.current_period_end * 1000)

          await prismadb.orgSubscription.upsert({
            where: { orgId },
            create: {
              orgId,
              plan: tier,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: sub.id,
              stripePriceId: sub.items.data[0]?.price.id || null,
              stripeCurrentPeriodEnd: periodEnd,
              tokenQuotaMonthly: getTokenQuotaForTier(tier),
              currentTokenUsage: 0,
              quotaResetDate: periodEnd
            },
            update: {
              plan: tier,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: sub.id,
              stripePriceId: sub.items.data[0]?.price.id || null,
              stripeCurrentPeriodEnd: periodEnd,
              tokenQuotaMonthly: getTokenQuotaForTier(tier),
              quotaResetDate: periodEnd
            }
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const orgSubscription = await prismadb.orgSubscription.findFirst({
          where: { stripeSubscriptionId: subscription.id }
        })

        if (orgSubscription) {
          await prismadb.orgSubscription.update({
            where: { id: orgSubscription.id },
            data: {
              stripePriceId: subscription.items.data[0].price.id,
              stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
              quotaResetDate: new Date(subscription.current_period_end * 1000)
            }
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const orgSubscription = await prismadb.orgSubscription.findFirst({
          where: { stripeSubscriptionId: subscription.id }
        })

        if (orgSubscription) {
          await prismadb.orgSubscription.update({
            where: { id: orgSubscription.id },
            data: {
              plan: 'free',
              stripeSubscriptionId: null,
              stripePriceId: null,
              stripeCurrentPeriodEnd: null,
              tokenQuotaMonthly: 100_000,
              currentTokenUsage: 0
            }
          })
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription) {
          const orgSubscription = await prismadb.orgSubscription.findFirst({
            where: { stripeSubscriptionId: invoice.subscription as string }
          })

          if (orgSubscription) {
            const sub = await stripe.subscriptions.retrieve(invoice.subscription as string)
            // Reset token usage at the start of new billing period using actual period end
            await prismadb.orgSubscription.update({
              where: { id: orgSubscription.id },
              data: {
                currentTokenUsage: 0,
                quotaResetDate: new Date(sub.current_period_end * 1000)
              }
            })
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new NextResponse('Webhook processed', { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new NextResponse('Webhook processing error', { status: 500 })
  }
}

function getTokenQuotaForTier(tier: PlanTier): number {
  const quotas: Record<PlanTier, number> = {
    free: 100_000,
    starter: 1_000_000,
    pro: 10_000_000,
    enterprise: 100_000_000
  }
  return quotas[tier] || 100_000
}
