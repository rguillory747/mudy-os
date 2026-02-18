#!/usr/bin/env tsx
/**
 * Scheduled job to reset token quotas for organizations
 * Run this daily via cron or a scheduler service
 *
 * Usage:
 *   npx tsx scripts/reset-quotas.ts
 *
 * Cron example (daily at midnight):
 *   0 0 * * * cd /path/to/app && npx tsx scripts/reset-quotas.ts
 */

import { QuotaManager } from '../lib/quota-manager'

async function main() {
  console.log('Starting quota reset job...')
  console.log('Timestamp:', new Date().toISOString())

  try {
    const resetCount = await QuotaManager.resetAllDueQuotas()
    console.log(`✓ Successfully reset ${resetCount} quotas`)

    // Check for organizations approaching limits
    const approaching = await QuotaManager.getOrganizationsApproachingLimit(80)

    if (approaching.length > 0) {
      console.log('\n⚠️  Organizations approaching quota limits (>80%):')
      approaching.forEach(org => {
        console.log(`  - ${org.orgName} (${org.plan}): ${org.percentageUsed.toFixed(1)}% used`)
      })
      console.log('\nConsider sending notification emails to these organizations.')
    }

    console.log('\nQuota reset job completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('Error in quota reset job:', error)
    process.exit(1)
  }
}

main()
