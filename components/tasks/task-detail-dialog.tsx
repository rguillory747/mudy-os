'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock, Zap, DollarSign, Calendar, User, Trash2, Play, RefreshCw, UserPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Role {
  id: string
  name: string
}

interface Task {
  id: string
  title: string
  input: string
  output: string | null
  status: 'pending' | 'running' | 'completed' | 'failed'
  executionTimeMs: number | null
  tokenCount: number | null
  costCents: number | null
  createdAt: string
  role: {
    id: string
    name: string
  } | null
}

interface TaskDetailDialogProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated: () => void
}

export function TaskDetailDialog({ task, open, onOpenChange, onTaskUpdated }: TaskDetailDialogProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<string>(task.role?.id || '')
  const [reassigning, setReassigning] = useState(false)
  const [executing, setExecuting] = useState(false)

  useEffect(() => {
    if (open) {
      fetchRoles()
      setSelectedRoleId(task.role?.id || '')
    }
  }, [open, task])

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/org-roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    }
  }

  const handleReassign = async () => {
    if (!selectedRoleId) {
      toast.error('Please select a role')
      return
    }

    try {
      setReassigning(true)
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: selectedRoleId })
      })

      if (!response.ok) {
        throw new Error('Failed to reassign task')
      }

      toast.success('Task reassigned successfully')
      onTaskUpdated()
    } catch (error: any) {
      toast.error(error.message || 'Failed to reassign task')
    } finally {
      setReassigning(false)
    }
  }

  const handleRetry = async () => {
    try {
      setExecuting(true)
      const response = await fetch(`/api/tasks/${task.id}/execute`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      toast.success('Task executed successfully')
      onTaskUpdated()
    } catch (error: any) {
      toast.error(error.message || 'Failed to execute task')
    } finally {
      setExecuting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete task')
      }

      toast.success('Task deleted successfully')
      onOpenChange(false)
      onTaskUpdated()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete task')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created:</span>
              <span>{new Date(task.createdAt).toLocaleString()}</span>
            </div>

            {task.role && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Role:</span>
                <span>{task.role.name}</span>
              </div>
            )}

            {task.executionTimeMs !== null && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Duration:</span>
                <span>{(task.executionTimeMs / 1000).toFixed(2)}s</span>
              </div>
            )}

            {task.tokenCount !== null && (
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Tokens:</span>
                <span>{task.tokenCount.toLocaleString()}</span>
              </div>
            )}

            {task.costCents !== null && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Cost:</span>
                <span>${(task.costCents / 100).toFixed(4)}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={
                task.status === 'completed' ? 'default' :
                task.status === 'failed' ? 'destructive' :
                'secondary'
              }>
                {task.status}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Input */}
          <div>
            <h3 className="font-semibold mb-2">Task Input</h3>
            <div className="p-3 bg-secondary/30 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{task.input}</p>
            </div>
          </div>

          {/* Output */}
          {task.output && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">
                  {task.status === 'failed' ? 'Error Details' : 'Task Output'}
                </h3>
                <div className={`p-3 rounded-lg ${
                  task.status === 'failed' ? 'bg-red-50 border border-red-200' : 'bg-secondary/30'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{task.output}</p>
                </div>
              </div>
            </>
          )}

          {/* Reassignment */}
          {(task.status === 'pending' || task.status === 'failed') && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Reassign Task
                </h3>
                <div className="flex gap-2">
                  <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleReassign}
                    disabled={reassigning || selectedRoleId === task.role?.id}
                  >
                    {reassigning && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Assign
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex justify-between gap-2">
            <div className="flex gap-2">
              {(task.status === 'pending' || task.status === 'failed') && task.role && (
                <Button
                  onClick={handleRetry}
                  disabled={executing}
                >
                  {executing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : task.status === 'failed' ? (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {task.status === 'failed' ? 'Retry Task' : 'Execute Task'}
                </Button>
              )}
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
