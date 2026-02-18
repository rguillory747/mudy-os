import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { MainBrainRouter } from '@/lib/main-brain-router'
import { getCurrentOrg } from '@/lib/tenant'
import { prismadb } from '@/lib/prismadb'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { roleId } = await params
    const body = await request.json()
    const { message, conversationHistory } = body

    if (!message) {
      return new NextResponse('Message required', { status: 400 })
    }

    // Rate limiting
    const identifier = request.url + '-' + userId
    const { success } = await rateLimit(identifier)

    if (!success) {
      return new NextResponse('Rate limit exceeded', { status: 429 })
    }

    // Verify org access
    const org = await getCurrentOrg()
    if (!org) {
      return new NextResponse('Organization not found', { status: 404 })
    }

    // Verify role belongs to org and is Main Brain
    const role = await prismadb.orgRole.findUnique({
      where: { id: roleId }
    })

    if (!role || role.orgId !== org.id) {
      return new NextResponse('Role not found or access denied', { status: 404 })
    }

    if (!MainBrainRouter.isMainBrain(role.name)) {
      return new NextResponse('This endpoint is only for Main Brain roles. Use /chat for regular roles.', { status: 400 })
    }

    // Execute Main Brain orchestration
    try {
      const result = await MainBrainRouter.orchestrate(
        org.id,
        message,
        conversationHistory || []
      )

      return NextResponse.json({
        content: result.finalResponse,
        delegations: result.delegations,
        usage: {
          totalTokens: result.totalTokens,
          costCents: result.totalCostCents
        },
        orchestrated: true
      })
    } catch (error: any) {
      if (error.message?.includes('Token quota exceeded')) {
        return new NextResponse(error.message, { status: 402 })
      }
      throw error
    }
  } catch (error: any) {
    console.error('Orchestrated chat error:', error)
    return new NextResponse(error.message || 'Internal error', { status: 500 })
  }
}
