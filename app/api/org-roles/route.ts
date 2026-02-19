import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import prismadb from '@/lib/prismadb'
import { requireOrg } from '@/lib/tenant'
import { z } from 'zod'

const OrgRoleCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  persona: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().optional(),
})

const OrgRoleUpdateSchema = z.object({
  updates: z.array(z.object({
    id: z.string(),
    sortOrder: z.number().optional(),
    parentId: z.string().optional(),
  }))
})

export async function GET(
  request: Request
) {
  try {
    const user = await currentUser()
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const org = await requireOrg()
    if (!org) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const orgRoles = await prismadb.orgRole.findMany({
      where: {
        orgId: org.id
      },
      include: {
        modelAssignment: {
          include: {
            modelConfig: true
          }
        }
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })

    return NextResponse.json(orgRoles)
  } catch (error) {
    console.error('[ORG_ROLES_GET]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(
  request: Request
) {
  try {
    const user = await currentUser()
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const org = await requireOrg()
    if (!org) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      persona,
      parentId,
      sortOrder
    } = OrgRoleCreateSchema.parse(body)

    // Check subscription limit
    const roleCount = await prismadb.orgRole.count({
      where: { orgId: org.id }
    })

    // Get subscription to check role limit
    const subscription = await prismadb.orgSubscription.findUnique({
      where: { orgId: org.id }
    })

    const maxRoles = subscription?.maxRoles || 100
    if (roleCount >= maxRoles) {
      return new NextResponse("Role limit exceeded", { status: 400 })
    }

    const orgRole = await prismadb.orgRole.create({
      data: {
        name,
        description,
        persona,
        parentId,
        sortOrder,
        orgId: org.id
      }
    })

    return NextResponse.json(orgRole)
  } catch (error) {
    console.error('[ORG_ROLES_POST]', error)
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ errors: error.errors }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(
  request: Request
) {
  try {
    const user = await currentUser()
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const org = await requireOrg()
    if (!org) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await request.json()
    const { updates } = OrgRoleUpdateSchema.parse(body)

    // Verify all roles belong to this org
    const roleIds = updates.map(u => u.id)
    const ownedRoles = await prismadb.orgRole.findMany({
      where: { id: { in: roleIds }, orgId: org.id },
      select: { id: true }
    })
    if (ownedRoles.length !== roleIds.length) {
      return new NextResponse('One or more roles not found', { status: 404 })
    }

    await prismadb.$transaction(
      updates.map(update => 
        prismadb.orgRole.update({
          where: { id: update.id },
          data: {
            sortOrder: update.sortOrder,
            parentId: update.parentId
          }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ORG_ROLES_PATCH]', error)
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ errors: error.errors }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    return new NextResponse("Internal Error", { status: 500 })
  }
}