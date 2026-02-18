'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Activity, TrendingUp, DollarSign, Zap } from 'lucide-react'

interface UsageAnalytics {
  totals: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    costCents: number
    costDollars: number
  }
  records: Array<{
    id: string
    modelId: string
    modelProvider: string
    totalTokens: number
    costCents: number
    createdAt: string
  }>
}

export function UsageAnalyticsCard() {
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      const now = new Date()
      let startDate: Date

      if (timeRange === 'today') {
        startDate = new Date(now.setHours(0, 0, 0, 0))
      } else if (timeRange === 'week') {
        startDate = new Date(now.setDate(now.getDate() - 7))
      } else {
        startDate = new Date(now.setDate(now.getDate() - 30))
      }

      const params = new URLSearchParams({
        startDate: startDate.toISOString()
      })

      const response = await fetch(`/api/analytics/usage?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  if (!analytics) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">No usage data available</p>
      </Card>
    )
  }

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
    return num.toString()
  }

  const stats = [
    {
      label: 'Total Tokens',
      value: formatNumber(analytics.totals.totalTokens),
      icon: Zap,
      color: 'text-blue-500'
    },
    {
      label: 'Input Tokens',
      value: formatNumber(analytics.totals.inputTokens),
      icon: TrendingUp,
      color: 'text-green-500'
    },
    {
      label: 'Output Tokens',
      value: formatNumber(analytics.totals.outputTokens),
      icon: Activity,
      color: 'text-purple-500'
    },
    {
      label: 'Total Cost',
      value: `$${analytics.totals.costDollars.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-yellow-500'
    }
  ]

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Usage Analytics</h3>
          <div className="flex gap-1">
            {(['today', 'week', 'month'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {range === 'today' ? 'Today' : range === 'week' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {stats.map(stat => (
            <div
              key={stat.label}
              className="bg-secondary/50 rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {analytics.records.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Recent Activity</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {analytics.records.slice(0, 5).map(record => (
                <div
                  key={record.id}
                  className="flex items-center justify-between text-xs p-2 rounded-md bg-secondary/30"
                >
                  <div className="flex-1">
                    <p className="font-medium">{record.modelId}</p>
                    <p className="text-muted-foreground">
                      {new Date(record.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatNumber(record.totalTokens)} tokens</p>
                    <p className="text-muted-foreground">${(record.costCents / 100).toFixed(4)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
