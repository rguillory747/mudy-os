'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { AlertCircle, TrendingUp } from 'lucide-react'

interface QuotaStatus {
  currentUsage: number
  monthlyQuota: number
  remainingTokens: number
  percentageUsed: number
  isExceeded: boolean
  resetDate: string | null
  orgName: string
}

export function QuotaStatusCard() {
  const [status, setStatus] = useState<QuotaStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuotaStatus()
  }, [])

  const fetchQuotaStatus = async () => {
    try {
      const response = await fetch('/api/quota')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch quota status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-8 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </div>
      </Card>
    )
  }

  if (!status) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Unable to load quota status</p>
      </Card>
    )
  }

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
    return num.toString()
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const formatResetDate = (date: string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Token Quota</h3>
          {status.percentageUsed >= 80 && (
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold">
              {formatNumber(status.currentUsage)}
            </span>
            <span className="text-sm text-muted-foreground">
              of {formatNumber(status.monthlyQuota)} tokens
            </span>
          </div>

          <Progress
            value={Math.min(status.percentageUsed, 100)}
            className="h-2"
          />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{status.percentageUsed.toFixed(1)}% used</span>
            <span>{formatNumber(status.remainingTokens)} remaining</span>
          </div>
        </div>

        {status.isExceeded && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600 font-medium">
              Quota exceeded. Upgrade your plan to continue.
            </p>
            <Button size="sm" className="mt-2" variant="destructive">
              Upgrade Plan
            </Button>
          </div>
        )}

        {status.percentageUsed >= 80 && !status.isExceeded && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-700">
              You&apos;re approaching your monthly limit.
            </p>
          </div>
        )}

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Resets on:</span>
            <span className="font-medium">{formatResetDate(status.resetDate)}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
