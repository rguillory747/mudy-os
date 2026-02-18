# Mudy OS - Deployment Guide

## Quick Deploy to Vercel

### 1. Prerequisites
- GitHub account
- Vercel account (connect with GitHub)
- Neon account (PostgreSQL database)
- Clerk account (Authentication)
- OpenRouter account (AI models)
- Stripe account (Payments)

### 2. Database Setup (Neon.tech)

1. Go to https://neon.tech
2. Sign in with GitHub
3. Click "Create Project"
4. Name: `mudy-os`
5. Region: Choose closest to you
6. Click "Create Project"
7. **Copy the connection string** (starts with `postgresql://`)
8. Save as `DATABASE_URL`

### 3. Authentication Setup (Clerk.com)

1. Go to https://clerk.com
2. Sign in with GitHub
3. Click "Add Application"
4. Name: `Mudy OS`
5. Enable "Organizations" feature
6. Go to "API Keys"
7. Copy:
   - **Publishable Key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret Key** → `CLERK_SECRET_KEY`
8. Go to "Paths"
9. Set:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in URL: `/`
   - After sign-up URL: `/onboarding`

### 4. AI Models Setup (OpenRouter.ai)

1. Go to https://openrouter.ai
2. Sign in with Google/GitHub
3. Go to "Keys" → "Create Key"
4. Name: `Mudy OS Production`
5. Copy key → `OPENROUTER_API_KEY`
6. Go to "Credits" → Add $10-20 to start

### 5. Payments Setup (Stripe.com)

#### Create Account
1. Go to https://stripe.com
2. Create account
3. **Toggle "Test Mode" OFF** (top right) for production
4. Or keep ON for testing

#### Create Products
1. Go to "Products" → "Add Product"

**Product 1: Starter Plan**
- Name: `Mudy OS - Starter`
- Description: `14-day trial, then $29/month`
- Pricing: Recurring, Monthly, $29
- Trial: 14 days
- Click "Save"
- **Copy Price ID** (starts with `price_...`)

**Product 2: Pro Plan**
- Name: `Mudy OS - Pro`
- Description: `14-day trial, then $99/month`
- Pricing: Recurring, Monthly, $99
- Trial: 14 days
- Click "Save"
- **Copy Price ID**

**Product 3: Enterprise Plan**
- Name: `Mudy OS - Enterprise`
- Description: `$499/month`
- Pricing: Recurring, Monthly, $499
- Click "Save"
- **Copy Price ID**

#### Update Code with Price IDs
Edit `lib/plans.ts` and add the price IDs:
```typescript
starter: {
  stripePriceId: 'price_YOUR_STARTER_ID', // ← Add here
  // ...
},
pro: {
  stripePriceId: 'price_YOUR_PRO_ID', // ← Add here
  // ...
},
enterprise: {
  stripePriceId: 'price_YOUR_ENTERPRISE_ID', // ← Add here
  // ...
}
```

#### Get API Keys
1. Go to "Developers" → "API Keys"
2. Copy **Secret Key** → `STRIPE_API_KEY`

#### Set Up Webhook (AFTER Vercel Deploy)
1. Go to "Developers" → "Webhooks"
2. Click "Add Endpoint"
3. Endpoint URL: `https://your-app.vercel.app/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
5. Click "Add Endpoint"
6. Click "Reveal" on Signing Secret
7. Copy → `STRIPE_WEBHOOK_SECRET`

### 6. Deploy to Vercel

#### Option A: Via GitHub (Recommended)

1. **Push to GitHub** (already done if you ran the script)

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select your `mudy-os` repo
   - Click "Import"

3. **Configure Environment Variables**
   In Vercel dashboard, add these:

   ```
   DATABASE_URL = postgresql://... (from Neon)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_live_... (from Clerk)
   CLERK_SECRET_KEY = sk_live_... (from Clerk)
   NEXT_PUBLIC_CLERK_SIGN_IN_URL = /sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL = /sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL = /
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL = /onboarding
   OPENROUTER_API_KEY = sk-or-v1-... (from OpenRouter)
   OPENAI_API_KEY = sk-... (optional, from OpenAI)
   STRIPE_API_KEY = sk_live_... (from Stripe)
   STRIPE_WEBHOOK_SECRET = whsec_... (from Stripe webhook)
   NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Get your URL: `https://mudy-os-xyz.vercel.app`

5. **Update URLs**
   - Copy your Vercel URL
   - Update in Clerk: Add to "Allowed Origins"
   - Update in Stripe webhook (if not done)
   - Update `NEXT_PUBLIC_APP_URL` in Vercel env vars

#### Option B: Via Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

### 7. Post-Deployment

1. **Run Database Migration**
   - Vercel will run `prisma generate` automatically
   - Migrations run on first DB connection

2. **Test the App**
   - Visit your Vercel URL
   - Sign up with Clerk
   - Complete onboarding
   - Test chat, tasks, standup
   - Try upgrading plan (use Stripe test cards if in test mode)

3. **Stripe Test Cards** (if using Test Mode)
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Any future date, any CVC

### 8. Custom Domain (Optional)

1. Go to Vercel project → "Settings" → "Domains"
2. Add your domain: `app.yourcompany.com`
3. Update DNS records as instructed
4. Update all URLs in Clerk and Stripe

## Troubleshooting

**Build fails with Prisma error:**
- Check DATABASE_URL is set
- Ensure it's a valid PostgreSQL connection string

**Clerk redirect loop:**
- Verify all Clerk URLs are configured
- Check NEXT_PUBLIC_CLERK_* env vars are set

**Stripe webhook fails:**
- Ensure webhook URL is correct
- Check STRIPE_WEBHOOK_SECRET is set
- Verify endpoint is listening for correct events

**OpenRouter API errors:**
- Verify API key is correct
- Check you have credits in account
- Ensure key has proper permissions

## Monitoring

- **Vercel Logs**: Vercel Dashboard → Your Project → Logs
- **Database**: Neon Dashboard → Your Project → Monitoring
- **Stripe**: Stripe Dashboard → Developers → Logs
- **Usage**: Mudy OS Dashboard (built-in analytics)

## Cost Estimates

- **Vercel**: Free tier (hobby) or $20/month (pro)
- **Neon**: Free tier (0.5 GB) or $19/month (pro)
- **Clerk**: Free (10,000 MAU) or $25/month (pro)
- **OpenRouter**: Pay-as-you-go (~$0.001-0.05 per 1K tokens)
- **Stripe**: 2.9% + $0.30 per transaction

**Total minimum**: $0/month (all free tiers)
**Recommended for production**: ~$70/month + token usage

## Security Checklist

- [ ] All API keys are in environment variables
- [ ] Stripe is in live mode (or test for testing)
- [ ] Clerk production instance configured
- [ ] Database has SSL enabled
- [ ] NEXT_PUBLIC_APP_URL matches actual domain
- [ ] Webhook secrets are secure
- [ ] No .env files committed to git

## Support

For issues, check:
1. Vercel deployment logs
2. Browser console errors
3. Stripe webhook logs
4. Clerk dashboard logs

Need help? Contact: rguillory747@gmail.com
