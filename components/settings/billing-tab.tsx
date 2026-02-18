'use client'

import { useState } from 'react'
import { Organization, OrgSubscription } from '@prisma/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PLAN_CATALOG, PlanTier } from '@/lib/plans'
import { Check, Loader2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface BillingTabProps {
  organization: Organization
  subscription: OrgSubscription | null
}

export function BillingTab({ organization, subscription }: BillingTabProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const currentPlan = subscription?.plan || 'free'

  const handleUpgrade = async (tier: PlanTier) => {
    try {
      setLoading(tier)
      const response = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier })
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error: any) {
      toast.error(error.message || 'Failed to start upgrade')
      setLoading(null)
    }
  }

  const handleManageBilling = async () => {
    try {
      setLoading('portal')
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to open billing portal')
      }

      const { url } = await response.json()
      window.open(url, '_blank')
    } catch (error: any) {
      toast.error(error.message || 'Failed to open billing portal')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Current Plan</h2>
          <p className="text-muted-foreground">
            You are on the <span className="font-medium capitalize">{currentPlan}</span> plan
          </p>
        </div>
        {subscription?.stripeCustomerId && (
          <Button
            variant="outline"
            onClick={handleManageBilling}
            disabled={loading === 'portal'}
          >
            {loading === 'portal' ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            Manage Billing
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(PLAN_CATALOG).map(([key, plan]) => {
          const tier = key as PlanTier
          const isCurrentPlan = tier === currentPlan
          const isLoading = loading === tier

          return (
            <Card
              key={tier}
              className={cn(
                'p-6 relative',
                isCurrentPlan && 'border-primary border-2',
                plan.isPopular && 'shadow-lg'
              )}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                  Popular
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold">{plan.displayName}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={isCurrentPlan ? 'outline' : 'default'}
                  disabled={isCurrentPlan || isLoading}
                  onClick={() => handleUpgrade(tier)}
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {isCurrentPlan ? 'Current Plan' : tier === 'free' ? 'Downgrade' : 'Upgrade'}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {subscription?.stripeCurrentPeriodEnd && (
        <Card className="p-4 bg-muted/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Next billing date:</span>
            <span className="font-medium">
              {new Date(subscription.stripeCurrentPeriodEnd).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
        </Card>
      )}
    </div>
  )
}
