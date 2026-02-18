'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Network, MessageSquare, Settings, TrendingUp, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function QuickActionsCard() {
  const router = useRouter()

  const actions = [
    {
      label: 'View Org Chart',
      description: 'Manage your AI workforce',
      icon: Network,
      onClick: () => router.push('/org-chart'),
      color: 'text-blue-500'
    },
    {
      label: 'Chat with Agents',
      description: 'Start a conversation',
      icon: MessageSquare,
      onClick: () => router.push('/org-chart'),
      color: 'text-green-500'
    },
    {
      label: 'Upgrade Plan',
      description: 'Get more tokens & features',
      icon: TrendingUp,
      onClick: () => router.push('/settings'),
      color: 'text-purple-500'
    },
    {
      label: 'Settings',
      description: 'Configure your workspace',
      icon: Settings,
      onClick: () => router.push('/settings'),
      color: 'text-gray-500'
    }
  ]

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map(action => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="flex flex-col items-start p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors text-left"
          >
            <action.icon className={`h-5 w-5 mb-2 ${action.color}`} />
            <p className="font-medium text-sm">{action.label}</p>
            <p className="text-xs text-muted-foreground">{action.description}</p>
          </button>
        ))}
      </div>
    </Card>
  )
}
