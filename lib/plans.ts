export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise'

export interface PlanFeatures {
  tier: PlanTier
  displayName: string
  price: number // USD per month
  trialDays?: number // Optional trial period
  maxRoles: number
  tokenQuotaMonthly: number // tokens per month
  features: string[]
  stripePriceId?: string // To be filled with actual Stripe price IDs
  isPopular?: boolean
}

export const PLAN_CATALOG: Record<PlanTier, PlanFeatures> = {
  free: {
    tier: 'free',
    displayName: 'Free',
    price: 0,
    maxRoles: 3,
    tokenQuotaMonthly: 100_000, // 100K tokens/month (~$0.03 with cheap models)
    features: [
      'Up to 3 AI agents',
      '100K tokens/month',
      'OpenRouter access (budget models)',
      'Basic org chart',
      'Community support'
    ]
  },
  starter: {
    tier: 'starter',
    displayName: 'Starter',
    price: 29,
    trialDays: 14,
    maxRoles: 10,
    tokenQuotaMonthly: 1_000_000, // 1M tokens/month (~$0.30-3 depending on models)
    features: [
      '14-day free trial',
      'Up to 10 AI agents',
      '1M tokens/month',
      'All OpenRouter models',
      'Custom personas',
      'Email support',
      'Basic analytics'
    ],
    isPopular: true
  },
  pro: {
    tier: 'pro',
    displayName: 'Pro',
    price: 99,
    trialDays: 14,
    maxRoles: 50,
    tokenQuotaMonthly: 10_000_000, // 10M tokens/month
    features: [
      '14-day free trial',
      'Up to 50 AI agents',
      '10M tokens/month',
      'All OpenRouter models',
      'Advanced analytics',
      'Priority support',
      'Custom integrations',
      'Team collaboration'
    ]
  },
  enterprise: {
    tier: 'enterprise',
    displayName: 'Enterprise',
    price: 499,
    maxRoles: -1, // Unlimited
    tokenQuotaMonthly: 100_000_000, // 100M tokens/month
    features: [
      'Unlimited AI agents',
      '100M+ tokens/month',
      'All models + custom deployments',
      'Dedicated support',
      'SLA guarantees',
      'Custom integrations',
      'Advanced security',
      'Multi-workspace'
    ]
  }
}

export function getPlanFeatures(tier: PlanTier): PlanFeatures {
  return PLAN_CATALOG[tier]
}

export function canUpgradeTo(currentTier: PlanTier, targetTier: PlanTier): boolean {
  const tierOrder: PlanTier[] = ['free', 'starter', 'pro', 'enterprise']
  const currentIndex = tierOrder.indexOf(currentTier)
  const targetIndex = tierOrder.indexOf(targetTier)
  return targetIndex > currentIndex
}

export function hasReachedRoleLimit(currentRoleCount: number, tier: PlanTier): boolean {
  const plan = PLAN_CATALOG[tier]
  if (plan.maxRoles === -1) return false // Unlimited
  return currentRoleCount >= plan.maxRoles
}

export function hasReachedTokenLimit(currentUsage: number, tier: PlanTier): boolean {
  const plan = PLAN_CATALOG[tier]
  return currentUsage >= plan.tokenQuotaMonthly
}

export function getTokenUsagePercentage(currentUsage: number, tier: PlanTier): number {
  const plan = PLAN_CATALOG[tier]
  return Math.min((currentUsage / plan.tokenQuotaMonthly) * 100, 100)
}
