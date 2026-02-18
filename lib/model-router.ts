import { prismadb } from './prismadb'
import { createModelClient, ChatMessage, ModelResponse } from './openrouter-client'
import { hasReachedTokenLimit, getPlanFeatures } from './plans'
import { getCurrentOrg } from './tenant'
import { QuotaManager } from './quota-manager'

export class ModelRouter {
  /**
   * Route a chat request to the appropriate model for a given role
   */
  static async chatForRole(
    roleId: string,
    messages: ChatMessage[],
    options?: {
      temperature?: number
      maxTokens?: number
    }
  ): Promise<ModelResponse> {
    // Get role with model assignment
    const role = await prismadb.orgRole.findUnique({
      where: { id: roleId },
      include: {
        org: {
          include: {
            orgSubscription: true
          }
        },
        modelAssignment: {
          include: {
            modelConfig: true
          }
        }
      }
    })

    if (!role) {
      throw new Error(`Role not found: ${roleId}`)
    }

    if (!role.modelAssignment?.modelConfig) {
      throw new Error(`No model assigned to role: ${role.name}`)
    }

    // Check and reset quota if needed
    await QuotaManager.checkAndResetIfNeeded(role.orgId)

    // Check token quota
    const subscription = role.org.orgSubscription
    if (subscription) {
      const quotaExceeded = hasReachedTokenLimit(
        subscription.currentTokenUsage,
        subscription.plan
      )

      if (quotaExceeded) {
        throw new Error('Token quota exceeded. Please upgrade your plan.')
      }
    }

    const modelConfig = role.modelAssignment.modelConfig

    // Create model client
    const client = await createModelClient(
      modelConfig.provider,
      modelConfig.modelId
    )

    // Execute chat
    const response = await client.chat(messages, options)

    // Record token usage
    await this.recordTokenUsage({
      orgId: role.orgId,
      roleId: role.id,
      modelConfigId: modelConfig.id,
      modelProvider: modelConfig.provider,
      modelId: modelConfig.modelId,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      totalTokens: response.totalTokens,
      costCents: response.costCents
    })

    // Update subscription usage
    if (subscription) {
      await prismadb.orgSubscription.update({
        where: { id: subscription.id },
        data: {
          currentTokenUsage: {
            increment: response.totalTokens
          }
        }
      })
    }

    return response
  }

  /**
   * Route a chat request to a specific model (for testing or custom use)
   */
  static async chatWithModel(
    orgId: string,
    modelId: string,
    messages: ChatMessage[],
    options?: {
      temperature?: number
      maxTokens?: number
    }
  ): Promise<ModelResponse> {
    // Get org with subscription
    const org = await prismadb.organization.findUnique({
      where: { id: orgId },
      include: {
        orgSubscription: true
      }
    })

    if (!org) {
      throw new Error(`Organization not found: ${orgId}`)
    }

    // Check and reset quota if needed
    await QuotaManager.checkAndResetIfNeeded(orgId)

    // Check token quota
    const subscription = org.orgSubscription
    if (subscription) {
      const quotaExceeded = hasReachedTokenLimit(
        subscription.currentTokenUsage,
        subscription.plan
      )

      if (quotaExceeded) {
        throw new Error('Token quota exceeded. Please upgrade your plan.')
      }
    }

    // Find model config
    const modelConfig = await prismadb.modelConfig.findFirst({
      where: {
        OR: [
          { orgId, modelId },
          { orgId: null, modelId } // Global config
        ]
      }
    })

    if (!modelConfig) {
      throw new Error(`Model config not found: ${modelId}`)
    }

    // Create model client
    const client = await createModelClient(
      modelConfig.provider,
      modelConfig.modelId
    )

    // Execute chat
    const response = await client.chat(messages, options)

    // Record token usage
    await this.recordTokenUsage({
      orgId,
      roleId: null,
      modelConfigId: modelConfig.id,
      modelProvider: modelConfig.provider,
      modelId: modelConfig.modelId,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      totalTokens: response.totalTokens,
      costCents: response.costCents
    })

    // Update subscription usage
    if (subscription) {
      await prismadb.orgSubscription.update({
        where: { id: subscription.id },
        data: {
          currentTokenUsage: {
            increment: response.totalTokens
          }
        }
      })
    }

    return response
  }

  /**
   * Record token usage for analytics and billing
   */
  private static async recordTokenUsage(data: {
    orgId: string
    roleId: string | null
    modelConfigId: string | null
    modelProvider: string
    modelId: string
    inputTokens: number
    outputTokens: number
    totalTokens: number
    costCents: number
  }) {
    await prismadb.tokenUsage.create({
      data: {
        orgId: data.orgId,
        roleId: data.roleId,
        modelConfigId: data.modelConfigId,
        modelProvider: data.modelProvider as any,
        modelId: data.modelId,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        totalTokens: data.totalTokens,
        costCents: data.costCents
      }
    })
  }

  /**
   * Get token usage analytics for an organization
   */
  static async getUsageAnalytics(orgId: string, options?: {
    startDate?: Date
    endDate?: Date
    roleId?: string
  }) {
    const where: any = { orgId }

    if (options?.startDate || options?.endDate) {
      where.createdAt = {}
      if (options.startDate) where.createdAt.gte = options.startDate
      if (options.endDate) where.createdAt.lte = options.endDate
    }

    if (options?.roleId) {
      where.roleId = options.roleId
    }

    const usage = await prismadb.tokenUsage.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    const totalInputTokens = usage.reduce((sum, u) => sum + u.inputTokens, 0)
    const totalOutputTokens = usage.reduce((sum, u) => sum + u.outputTokens, 0)
    const totalTokens = usage.reduce((sum, u) => sum + u.totalTokens, 0)
    const totalCostCents = usage.reduce((sum, u) => sum + u.costCents, 0)

    return {
      records: usage,
      totals: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        totalTokens,
        costCents: totalCostCents,
        costDollars: totalCostCents / 100
      }
    }
  }
}
