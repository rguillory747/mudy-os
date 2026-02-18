'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Loader2, CheckCircle, XCircle, Clock, Eye, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { TaskDetailDialog } from './task-detail-dialog'

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

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'running' | 'completed' | 'failed'>('all')
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [bulkExecuting, setBulkExecuting] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [filter])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const response = await fetch(`/api/tasks${params}`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const executeTask = async (taskId: string) => {
    try {
      setExecuting(taskId)
      const response = await fetch(`/api/tasks/${taskId}/execute`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      toast.success('Task executed successfully')
      fetchTasks()
    } catch (error: any) {
      toast.error(error.message || 'Task execution failed')
    } finally {
      setExecuting(null)
    }
  }

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedTaskIds.size === tasks.length) {
      setSelectedTaskIds(new Set())
    } else {
      setSelectedTaskIds(new Set(tasks.map(t => t.id)))
    }
  }

  const handleBulkExecute = async () => {
    const executableTasks = tasks.filter(
      t => selectedTaskIds.has(t.id) &&
      (t.status === 'pending' || t.status === 'failed') &&
      t.role
    )

    if (executableTasks.length === 0) {
      toast.error('No executable tasks selected')
      return
    }

    try {
      setBulkExecuting(true)
      let successCount = 0
      let failCount = 0

      for (const task of executableTasks) {
        try {
          const response = await fetch(`/api/tasks/${task.id}/execute`, {
            method: 'POST'
          })
          if (response.ok) {
            successCount++
          } else {
            failCount++
          }
        } catch {
          failCount++
        }
      }

      toast.success(`Executed ${successCount} tasks${failCount > 0 ? `, ${failCount} failed` : ''}`)
      setSelectedTaskIds(new Set())
      fetchTasks()
    } catch (error) {
      toast.error('Bulk execution failed')
    } finally {
      setBulkExecuting(false)
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedTaskIds.size} selected tasks?`)) return

    try {
      let successCount = 0

      for (const taskId of selectedTaskIds) {
        try {
          const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE'
          })
          if (response.ok) successCount++
        } catch {}
      }

      toast.success(`Deleted ${successCount} tasks`)
      setSelectedTaskIds(new Set())
      fetchTasks()
    } catch (error) {
      toast.error('Bulk delete failed')
    }
  }

  const getStatusBadge = (status: Task['status']) => {
    const variants: Record<Task['status'], { label: string; variant: any; icon: any }> = {
      pending: { label: 'Pending', variant: 'secondary', icon: Clock },
      running: { label: 'Running', variant: 'default', icon: Loader2 },
      completed: { label: 'Completed', variant: 'default', icon: CheckCircle },
      failed: { label: 'Failed', variant: 'destructive', icon: XCircle }
    }

    const config = variants[status]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${status === 'running' ? 'animate-spin' : ''}`} />
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {selectedTaskIds.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
          <span className="text-sm font-medium">{selectedTaskIds.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              onClick={handleBulkExecute}
              disabled={bulkExecuting}
            >
              {bulkExecuting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Execute Selected
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {tasks.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSelectAll}
          >
            <Checkbox
              checked={selectedTaskIds.size === tasks.length}
              className="mr-2"
            />
            Select All
          </Button>
        )}
        {(['all', 'pending', 'running', 'completed', 'failed'] as const).map(status => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No tasks found</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <Card key={task.id} className="p-4">
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={selectedTaskIds.has(task.id)}
                  onCheckedChange={() => toggleTaskSelection(task.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold truncate">{task.title}</h3>
                    {getStatusBadge(task.status)}
                  </div>

                  {task.role && (
                    <p className="text-sm text-muted-foreground mb-1">
                      Assigned to: <span className="font-medium">{task.role.name}</span>
                    </p>
                  )}

                  <p className="text-sm text-muted-foreground line-clamp-2">{task.input}</p>

                  {task.status === 'completed' && (
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {task.executionTimeMs && (
                        <span>{(task.executionTimeMs / 1000).toFixed(2)}s</span>
                      )}
                      {task.tokenCount && <span>{task.tokenCount} tokens</span>}
                      {task.costCents !== null && <span>${(task.costCents / 100).toFixed(4)}</span>}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedTask(task)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  {(task.status === 'pending' || task.status === 'failed') && task.role && (
                    <Button
                      size="sm"
                      onClick={() => executeTask(task.id)}
                      disabled={executing === task.id}
                    >
                      {executing === task.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          onTaskUpdated={fetchTasks}
        />
      )}
    </div>
  )
}
