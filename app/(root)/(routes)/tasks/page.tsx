'use client'

import { useEffect, useState } from 'react'
import { CheckSquare, Plus } from "lucide-react"
import { Button } from '@/components/ui/button'
import { TaskList } from '@/components/tasks/task-list'
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'

export default function TasksPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleTaskCreated = () => {
    setShowCreateDialog(false)
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="h-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-3">
          <CheckSquare className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-primary">Tasks</h1>
            <p className="text-muted-foreground">
              Manage and execute agent tasks
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>

      <TaskList key={refreshTrigger} />

      <CreateTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  )
}
