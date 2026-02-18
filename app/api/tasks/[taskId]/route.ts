import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getCurrentOrg } from '@/lib/tenant'
import { prismadb } from '@/lib/prismadb'

// GET /api/tasks/[taskId] - Get task details
export async function GET(
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
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    })

    if (!task || task.orgId !== org.id) {
      return new NextResponse('Task not found', { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Task get error:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

// PATCH /api/tasks/[taskId] - Update task
export async function PATCH(
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
      where: { id: taskId }
    })

    if (!task || task.orgId !== org.id) {
      return new NextResponse('Task not found', { status: 404 })
    }

    const body = await req.json()
    const { status, roleId, output } = body

    const updatedTask = await prismadb.agentTask.update({
      where: { id: taskId },
      data: {
        ...(status && { status }),
        ...(roleId !== undefined && { roleId }),
        ...(output !== undefined && { output })
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

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Task update error:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

// DELETE /api/tasks/[taskId] - Delete task
export async function DELETE(
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
      where: { id: taskId }
    })

    if (!task || task.orgId !== org.id) {
      return new NextResponse('Task not found', { status: 404 })
    }

    await prismadb.agentTask.delete({
      where: { id: taskId }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Task delete error:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}
