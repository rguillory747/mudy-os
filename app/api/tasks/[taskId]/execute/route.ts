import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getCurrentOrg } from '@/lib/tenant'
import { prismadb } from '@/lib/prismadb'
import { ModelRouter } from '@/lib/model-router'

// POST /api/tasks/[taskId]/execute - Execute a task
export async function POST(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { taskId } = await params
    const org = await getCurrentOrg()

    if (!org) {
      return new NextResponse('Organization not found', { status: 404 })
    }

    const task = await prismadb.agentTask.findUnique({
      where: { id: taskId },
      include: {
        role: {
          include: {
            modelAssignment: {
              include: {
                modelConfig: true
              }
            }
          }
        }
      }
    })

    if (!task || task.orgId !== org.id) {
      return new NextResponse('Task not found', { status: 404 })
    }

    if (!task.roleId) {
      return new NextResponse('Task has no assigned role', { status: 400 })
    }

    // Atomically claim the task - prevents race condition on concurrent requests
    const claimed = await prismadb.agentTask.updateMany({
      where: { id: taskId, status: { not: 'running' } },
      data: { status: 'running' }
    })

    if (claimed.count === 0) {
      return new NextResponse('Task is already running', { status: 400 })
    }

    const startTime = Date.now()

    try {
      // Build system message from role persona
      const messages: Array<{ role: 'system' | 'user'; content: string }> = []

      if (task.role?.persona) {
        messages.push({
          role: 'system',
          content: task.role.persona
        })
      }

      // Add task instructions
      messages.push({
        role: 'system',
        content: `Task: ${task.title}\n\nYou are assigned to complete the following task. Provide a comprehensive response.`
      })

      // Add task input
      messages.push({
        role: 'user',
        content: task.input
      })

      // Execute via ModelRouter
      const response = await ModelRouter.chatForRole(task.roleId, messages)

      const executionTimeMs = Date.now() - startTime

      // Update task with results
      const updatedTask = await prismadb.agentTask.update({
        where: { id: taskId },
        data: {
          status: 'completed',
          output: response.content,
          executionTimeMs,
          tokenCount: response.totalTokens,
          costCents: response.costCents
        },
        include: {
          role: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      return NextResponse.json({
        task: updatedTask,
        execution: {
          executionTimeMs,
          tokens: response.totalTokens,
          costCents: response.costCents,
          model: response.modelId
        }
      })
    } catch (error: any) {
      // Mark task as failed
      await prismadb.agentTask.update({
        where: { id: taskId },
        data: {
          status: 'failed',
          output: `Error: ${error.message || 'Unknown error'}`
        }
      })

      throw error
    }
  } catch (error: any) {
    console.error('Task execution error:', error)
    return new NextResponse('Task execution failed', { status: 500 })
  }
}
