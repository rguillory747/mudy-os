'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Role {
  id: string
  name: string
}

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskCreated: () => void
}

export function CreateTaskDialog({ open, onOpenChange, onTaskCreated }: CreateTaskDialogProps) {
  const [title, setTitle] = useState('')
  const [input, setInput] = useState('')
  const [roleId, setRoleId] = useState<string>('')
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingRoles, setLoadingRoles] = useState(true)

  useEffect(() => {
    if (open) {
      fetchRoles()
    }
  }, [open])

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true)
      const response = await fetch('/api/org-roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    } finally {
      setLoadingRoles(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !input.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          input,
          roleId: roleId || null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create task')
      }

      toast.success('Task created successfully')
      setTitle('')
      setInput('')
      setRoleId('')
      onTaskCreated()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Write a blog post about AI"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="input">Task Description *</Label>
            <Textarea
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Provide detailed instructions for the task..."
              rows={5}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Assign to Role (Optional)</Label>
            <Select value={roleId} onValueChange={setRoleId} disabled={loadingRoles}>
              <SelectTrigger>
                <SelectValue placeholder={loadingRoles ? "Loading roles..." : "Select a role"} />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Leave unassigned to manually assign later
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
