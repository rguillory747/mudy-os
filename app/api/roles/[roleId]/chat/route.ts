import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { ModelRouter } from '@/lib/model-router'
import { ChatMessage } from '@/lib/openrouter-client'
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
    const { messages } = body as { messages: ChatMessage[] }

    if (!messages || !Array.isArray(messages)) {
      return new NextResponse('Invalid request: messages array required', { status: 400 })
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

    // Verify role belongs to org
    const role = await prismadb.orgRole.findUnique({
      where: { id: roleId }
    })

    if (!role || role.orgId !== org.id) {
      return new NextResponse('Role not found or access denied', { status: 404 })
    }

    // Execute chat via ModelRouter
    try {
      const response = await ModelRouter.chatForRole(roleId, messages, {
        temperature: body.temperature,
        maxTokens: body.maxTokens
      })

      return NextResponse.json({
        content: response.content,
        usage: {
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
          costCents: response.costCents
        },
        model: {
          modelId: response.modelId,
          provider: response.provider
        }
      })
    } catch (error: any) {
      if (error.message?.includes('Token quota exceeded')) {
        return new NextResponse(error.message, { status: 402 }) // Payment Required
      }
      throw error
    }
  } catch (error) {
    console.error('Role chat error:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}
