import { prismadb } from './prismadb'
import { getPlanFeatures } from './plans'
import { PlanTier } from '@prisma/client'

export interface QuotaStatus {
  currentUsage: number
  monthlyQuota: number
  remainingTokens: number
  percentageUsed: number
  isExceeded: boolean
  resetDate: Date | null
}

export class QuotaManager {
  /**
   * Check if quota reset is needed for a subscription
   */
  static async checkAndResetIfNeeded(orgId: string): Promise<boolean> {
    const subscription = await prismadb.orgSubscription.findUnique({
      where: { orgId }
    })

    if (!subscription || !subscription.quotaResetDate) {
      return false
    }

    const now = new Date()
    if (now >= subscription.quotaResetDate) {
      await this.resetQuota(orgId)
      return true
    }

    return false
  }

  /**
   * Reset quota for an organization
   */
  static async resetQuota(orgId: string): Promise<void> {
    const subscription = await prismadb.orgSubscription.findUnique({
      where: { orgId }
    })

    if (!subscription) {
      throw new Error(`Subscription not found for org: ${orgId}`)
    }

    const nextResetDate = new Date()
    nextResetDate.setMonth(nextResetDate.getMonth() + 1)

    await prismadb.orgSubscription.update({
      where: { id: subscription.id },
      data: {
        currentTokenUsage: 0,
        quotaResetDate: nextResetDate
      }
    })

    console.log(`Quota reset for org ${orgId}. Next reset: ${nextResetDate}`)
  }

  /**
   * Get current quota status for an organization
   */
  static async getQuotaStatus(orgId: string): Promise<QuotaStatus> {
    const subscription = await prismadb.orgSubscription.findUnique({
      where: { orgId }
    })

    if (!subscription) {
      // Default to free tier if no subscription
      return {
        currentUsage: 0,
        monthlyQuota: 100_000,
        remainingTokens: 100_000,
        percentageUsed: 0,
        isExceeded: false,
        resetDate: null
      }
    }

    const plan = getPlanFeatures(subscription.plan)
    const currentUsage = subscription.currentTokenUsage
    const monthlyQuota = subscription.tokenQuotaMonthly || plan.tokenQuotaMonthly
    const remainingTokens = Math.max(0, monthlyQuota - currentUsage)
    const percentageUsed = (currentUsage / monthlyQuota) * 100
    const isExceeded = currentUsage >= monthlyQuota

    return {
      currentUsage,
      monthlyQuota,
      remainingTokens,
      percentageUsed,
      isExceeded,
      resetDate: subscription.quotaResetDate
    }
  }

  /**
   * Check if usage is approaching limit (e.g., >80%)
   */
  static async isApproachingLimit(orgId: string, threshold: number = 80): Promise<boolean> {
    const status = await this.getQuotaStatus(orgId)
    return status.percentageUsed >= threshold
  }

  /**
   * Batch reset all quotas (for scheduled job)
   */
  static async resetAllDueQuotas(): Promise<number> {
    const now = new Date()

    const dueSubscriptions = await prismadb.orgSubscription.findMany({
      where: {
        quotaResetDate: {
          lte: now
        }
      }
    })

    let resetCount = 0
    for (const sub of dueSubscriptions) {
      try {
        await this.resetQuota(sub.orgId)
        resetCount++
      } catch (error) {
        console.error(`Failed to reset quota for org ${sub.orgId}:`, error)
      }
    }

    console.log(`Reset ${resetCount} quotas`)
    return resetCount
  }

  /**
   * Initialize quota reset date for new subscriptions
   */
  static async initializeQuota(orgId: string, tier: PlanTier): Promise<void> {
    const plan = getPlanFeatures(tier)
    const resetDate = new Date()
    resetDate.setMonth(resetDate.getMonth() + 1)

    await prismadb.orgSubscription.update({
      where: { orgId },
      data: {
        tokenQuotaMonthly: plan.tokenQuotaMonthly,
        currentTokenUsage: 0,
        quotaResetDate: resetDate
      }
    })
  }

  /**
   * Get organizations approaching quota limits (for notifications)
   */
  static async getOrganizationsApproachingLimit(threshold: number = 80): Promise<Array<{
    orgId: string
    orgName: string
    percentageUsed: number
    plan: PlanTier
  }>> {
    const subscriptions = await prismadb.orgSubscription.findMany({
      include: {
        org: true
      }
    })

    const approaching: Array<{
      orgId: string
      orgName: string
      percentageUsed: number
      plan: PlanTier
    }> = []

    for (const sub of subscriptions) {
      const plan = getPlanFeatures(sub.plan)
      const percentageUsed = (sub.currentTokenUsage / sub.tokenQuotaMonthly) * 100

      if (percentageUsed >= threshold && percentageUsed < 100) {
        approaching.push({
          orgId: sub.orgId,
          orgName: sub.org.name,
          percentageUsed,
          plan: sub.plan
        })
      }
    }

    return approaching
  }
}
