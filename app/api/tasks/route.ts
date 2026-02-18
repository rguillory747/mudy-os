import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getCurrentOrg } from '@/lib/tenant'
import { prismadb } from '@/lib/prismadb'

// GET /api/tasks - List all tasks for the organization
export async function GET(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const org = await getCurrentOrg()
    if (!org) {
      return new NextResponse('Organization not found', { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const roleId = searchParams.get('roleId')

    const tasks = await prismadb.agentTask.findMany({
      where: {
        orgId: org.id,
        ...(status && { status: status as any }),
        ...(roleId && { roleId })
      },
      include: {
        role: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Tasks list error:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}

// POST /api/tasks - Create a new task
export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const org = await getCurrentOrg()
    if (!org) {
      return new NextResponse('Organization not found', { status: 404 })
    }

    const body = await req.json()
    const { title, input, roleId } = body

    if (!title || !input) {
      return new NextResponse('Title and input are required', { status: 400 })
    }

    const task = await prismadb.agentTask.create({
      data: {
        orgId: org.id,
        roleId: roleId || null,
        title,
        input,
        status: 'pending'
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

    return NextResponse.json(task)
  } catch (error) {
    console.error('Task creation error:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}
