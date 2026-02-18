'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bot, MessageSquare, Pencil, Trash2 } from 'lucide-react'

interface RoleNodeData {
  role: {
    id: string
    name: string
    description: string | null
    modelAssignment: {
      modelConfig: {
        displayName: string
        provider: string
      }
    } | null
  }
  onEdit: () => void
  onDelete: () => void
  onChat: () => void
}

export const RoleNode = memo(({ data }: NodeProps<RoleNodeData>) => {
  const { role, onEdit, onDelete, onChat } = data

  return (
    <Card className="min-w-[250px] max-w-[300px] p-4 border-2 hover:border-primary/50 transition-colors">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start gap-2">
          <Bot className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{role.name}</h3>
            {role.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {role.description}
              </p>
            )}
          </div>
        </div>

        {/* Model Badge */}
        {role.modelAssignment && (
          <Badge variant="secondary" className="text-xs">
            {role.modelAssignment.modelConfig.displayName}
          </Badge>
        )}

        {/* Actions */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation()
              onChat()
            }}
            title="Chat"
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </Card>
  )
})

RoleNode.displayName = 'RoleNode'
