# Stripe Setup Guide - Quick Reference

## Overview
Set up 3 subscription products with 14-day trials for Starter and Pro plans.

## Step 1: Create Stripe Account
1. Go to https://stripe.com
2. Sign up or log in
3. **Toggle Test Mode OFF** (top right) for production, or keep ON for testing

## Step 2: Create Products

### Product 1: Starter Plan ($29/month + 14-day trial)

1. Go to **Products** → **Add Product**
2. Fill in:
   - **Name**: `Mudy OS - Starter`
   - **Description**: `14-day trial, then $29/month`
   - **Pricing Model**: Recurring
   - **Billing Period**: Monthly
   - **Price**: `$29.00`
   - **Trial period**: `14 days`
3. Click **Save**
4. **Copy the Price ID** (looks like `price_1ABC2DEF3GHI4JKL`)
5. Save it as: `STARTER_PRICE_ID`

### Product 2: Pro Plan ($99/month + 14-day trial)

1. Go to **Products** → **Add Product**
2. Fill in:
   - **Name**: `Mudy OS - Pro`
   - **Description**: `14-day trial, then $99/month`
   - **Pricing Model**: Recurring
   - **Billing Period**: Monthly
   - **Price**: `$99.00`
   - **Trial period**: `14 days`
3. Click **Save**
4. **Copy the Price ID**
5. Save it as: `PRO_PRICE_ID`

### Product 3: Enterprise Plan ($499/month, no trial)

1. Go to **Products** → **Add Product**
2. Fill in:
   - **Name**: `Mudy OS - Enterprise`
   - **Description**: `$499/month - Full enterprise features`
   - **Pricing Model**: Recurring
   - **Billing Period**: Monthly
   - **Price**: `$499.00`
   - **Trial period**: None
3. Click **Save**
4. **Copy the Price ID**
5. Save it as: `ENTERPRISE_PRICE_ID`

## Step 3: Update Code with Price IDs

Edit `lib/plans.ts` and add your Stripe price IDs:

```typescript
export const PLAN_CATALOG: Record<PlanTier, PlanFeatures> = {
  starter: {
    tier: 'starter',
    displayName: 'Starter',
    price: 29,
    trialDays: 14,
    maxRoles: 10,
    tokenQuotaMonthly: 1_000_000,
    features: [
      '14-day free trial',
      'Up to 10 AI agents',
      '1M tokens/month',
      'Basic role chat',
      'Standard task execution',
      'Email support'
    ],
    stripePriceId: 'price_YOUR_STARTER_PRICE_ID_HERE', // ← Add here
    isPopular: true
  },
  pro: {
    tier: 'pro',
    displayName: 'Pro',
    price: 99,
    trialDays: 14,
    maxRoles: 50,
    tokenQuotaMonthly: 10_000_000,
    features: [
      '14-day free trial',
      'Up to 50 AI agents',
      '10M tokens/month',
      'Advanced role chat',
      'Priority task execution',
      'Main Brain orchestration',
      'Autonomous standups',
      'Priority support'
    ],
    stripePriceId: 'price_YOUR_PRO_PRICE_ID_HERE', // ← Add here
    isPopular: false
  },
  enterprise: {
    tier: 'enterprise',
    displayName: 'Enterprise',
    price: 499,
    maxRoles: 999,
    tokenQuotaMonthly: 100_000_000,
    features: [
      'Unlimited AI agents',
      '100M tokens/month',
      'Everything in Pro',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantees',
      'Custom model routing'
    ],
    stripePriceId: 'price_YOUR_ENTERPRISE_PRICE_ID_HERE', // ← Add here
    isPopular: false
  }
}
```

## Step 4: Get API Keys

1. Go to **Developers** → **API Keys**
2. Copy the **Secret Key** (starts with `sk_live_...` or `sk_test_...`)
3. Add to Vercel environment variables as: `STRIPE_API_KEY`

## Step 5: Set Up Webhook (AFTER Vercel Deployment)

1. Deploy to Vercel first and get your app URL
2. Go to **Developers** → **Webhooks** in Stripe
3. Click **Add Endpoint**
4. Enter endpoint URL: `https://your-app.vercel.app/api/webhooks/stripe`
5. Select these events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
6. Click **Add Endpoint**
7. Click **Reveal** on the Signing Secret
8. Copy the webhook secret (starts with `whsec_...`)
9. Add to Vercel environment variables as: `STRIPE_WEBHOOK_SECRET`

## Step 6: Test with Test Cards (Test Mode Only)

If you're in **Test Mode**, use these test card numbers:

- **Successful payment**: `4242 4242 4242 4242`
- **Payment declined**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`

Any future expiry date, any 3-digit CVC, any ZIP code.

## Quick Checklist

- [ ] Created 3 products in Stripe
- [ ] Copied all 3 price IDs
- [ ] Updated `lib/plans.ts` with price IDs
- [ ] Got Stripe API secret key
- [ ] Added `STRIPE_API_KEY` to Vercel
- [ ] Deployed app to Vercel
- [ ] Created webhook endpoint in Stripe
- [ ] Added `STRIPE_WEBHOOK_SECRET` to Vercel
- [ ] Tested subscription flow

## Important Notes

- **Test Mode vs Live Mode**: Make sure you're in the correct mode. Test mode keys start with `sk_test_`, live mode with `sk_live_`.
- **Trial Periods**: Trials are configured in Stripe products. The app code already supports this via `trialDays` field.
- **Webhook is Critical**: Without the webhook, subscription updates won't sync to your database.
- **Price IDs are Immutable**: If you need to change a price, create a new product/price in Stripe and update the code.

## Troubleshooting

**Checkout fails with "Invalid price"**:
- Verify the price IDs in `lib/plans.ts` match exactly what's in Stripe
- Make sure you're using price IDs from the correct mode (test vs live)

**Webhook returns 400 error**:
- Check that `STRIPE_WEBHOOK_SECRET` is set in Vercel
- Verify the webhook is pointing to `/api/webhooks/stripe`

**Trial not showing in checkout**:
- Verify the trial period is set in the Stripe product
- Check that `trialDays` is set in `lib/plans.ts`
- The trial will show as "$0.00 today, then $X/month" in checkout

## Support

For Stripe-specific issues, check:
1. Stripe Dashboard → Developers → Logs
2. Stripe Dashboard → Webhooks → [Your endpoint] → Events
3. Vercel deployment logs for webhook errors
