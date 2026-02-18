import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import prismadb from '@/lib/prismadb'
import { requireOrg } from '@/lib/tenant'
import { z } from 'zod'

const RoleUpdateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  persona: z.string().optional(),
  instructions: z.string().optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional()
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { roleId } = await params
    if (!roleId) {
      return new NextResponse("Role ID is required", { status: 400 })
    }

    const org = await requireOrg(user.id)
    
    // Validate that the role belongs to this org
    const existingRole = await prismadb.orgRole.findUnique({
      where: {
        id: roleId,
        orgId: org.id
      }
    })

    if (!existingRole) {
      return new NextResponse("Role not found", { status: 404 })
    }

    const body = await req.json()
    const validatedData = RoleUpdateSchema.parse(body)

    const updatedRole = await prismadb.orgRole.update({
      where: {
        id: roleId,
        orgId: org.id
      },
      data: validatedData
    })

    return NextResponse.json(updatedRole)
  } catch (error) {
    console.error('[ROLE_PATCH]', error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { roleId } = await params
    if (!roleId) {
      return new NextResponse("Role ID is required", { status: 400 })
    }

    const org = await requireOrg(user.id)
    
    // Validate that the role belongs to this org
    const existingRole = await prismadb.orgRole.findUnique({
      where: {
        id: roleId,
        orgId: org.id
      }
    })

    if (!existingRole) {
      return new NextResponse("Role not found", { status: 404 })
    }

    await prismadb.orgRole.delete({
      where: {
        id: roleId,
        orgId: org.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ROLE_DELETE]', error)
    return new NextResponse("Internal error", { status: 500 })
  }
}