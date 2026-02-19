import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function createCheckoutSession({
  orgId,
  tier,
  stripePriceId,
  successUrl,
  cancelUrl,
  trialDays
}: {
  orgId: string
  tier: string
  stripePriceId: string
  successUrl: string
  cancelUrl: string
  trialDays?: number
}): Promise<Stripe.Checkout.Session> {
  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: stripePriceId,
        quantity: 1
      }
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      orgId,
      tier
    }
  }

  // Add trial period if specified
  if (trialDays) {
    sessionConfig.subscription_data = {
      trial_period_days: trialDays
    }
  }

  const session = await stripe.checkout.sessions.create(sessionConfig)

  return session
}

export async function createPortalSession(stripeCustomerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl
  })

  return session
}

export async function cancelSubscription(stripeSubscriptionId: string): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.cancel(stripeSubscriptionId)
  return subscription
}

export async function updateSubscription(
  stripeSubscriptionId: string,
  newPriceId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)

  const updatedSubscription = await stripe.subscriptions.update(stripeSubscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId
      }
    ],
    proration_behavior: 'always_invoice'
  })

  return updatedSubscription
}
