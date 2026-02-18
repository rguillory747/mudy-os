import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getCurrentOrg } from '@/lib/tenant'
import { prismadb } from '@/lib/prismadb'

export async function PATCH(req: Request) {
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
    const { name, logoUrl } = body

    const updatedOrg = await prismadb.organization.update({
      where: { id: org.id },
      data: {
        ...(name && { name }),
        ...(logoUrl && { logoUrl })
      }
    })

    return NextResponse.json(updatedOrg)
  } catch (error) {
    console.error('Organization update error:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}
