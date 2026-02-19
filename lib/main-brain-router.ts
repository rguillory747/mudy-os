import { prismadb } from './prismadb'
import { ModelRouter } from './model-router'
import type { ChatMessage } from './openrouter-client'
import { createModelClient } from './openrouter-client'

interface DelegationDecision {
  roleId: string
  roleName: string
  reasoning: string
  confidence: number
}

interface DelegationResult {
  delegations: Array<{
    role: string
    response: string
    tokens: number
    costCents: number
  }>
  finalResponse: string
  totalTokens: number
  totalCostCents: number
}

export class MainBrainRouter {
  /**
   * Main Brain orchestration: Analyze request and delegate to specialists
   */
  static async orchestrate(
    orgId: string,
    userMessage: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<DelegationResult> {
    // Step 1: Get all available roles
    const roles = await prismadb.orgRole.findMany({
      where: {
        orgId,
        isActive: true,
        modelAssignment: {
          isNot: null
        }
      },
      include: {
        modelAssignment: {
          include: {
            modelConfig: true
          }
        }
      }
    })

    // Find Main Brain role
    const mainBrain = roles.find(r =>
      r.name.toLowerCase().includes('main brain') ||
      r.name.toLowerCase().includes('coo') ||
      r.name.toLowerCase() === 'orchestrator'
    )

    if (!mainBrain) {
      throw new Error('Main Brain role not found. Please create a COO/Main Brain role.')
    }

    // Step 2: Use Main Brain to analyze and decide delegation
    const analysisPrompt = `You are the Main Brain (COO) with an always-delegate mandate. You NEVER do work directly - you only orchestrate and delegate.

Available specialist roles:
${roles.filter(r => r.id !== mainBrain.id).map(r =>
  `- ${r.name}: ${r.description || 'No description'}`
).join('\n')}

User request: "${userMessage}"

Analyze this request and decide:
1. Which specialist role(s) should handle this? (Select 1-3 roles)
2. What specific instructions should each role receive?
3. How confident are you in each assignment (0-100)?

Respond in JSON format:
{
  "delegations": [
    {
      "roleId": "role_id",
      "roleName": "Role Name",
      "instructions": "Specific task for this role",
      "confidence": 85,
      "reasoning": "Why this role"
    }
  ],
  "orchestrationStrategy": "How you'll combine responses"
}`

    const analysisClient = await createModelClient(
      mainBrain.modelAssignment!.modelConfig.provider,
      mainBrain.modelAssignment!.modelConfig.modelId
    )

    const analysisResponse = await analysisClient.chat([
      { role: 'system', content: mainBrain.persona || 'You are the Main Brain orchestrator.' },
      { role: 'user', content: analysisPrompt }
    ])

    let delegationPlan: any
    try {
      // Extract JSON from response
      const jsonMatch = analysisResponse.content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      delegationPlan = JSON.parse(jsonMatch[0])
    } catch (error) {
      // Fallback: Delegate to first available role
      const fallbackRole = roles.find(r => r.id !== mainBrain.id)
      if (!fallbackRole) {
        throw new Error('No specialist roles available')
      }

      delegationPlan = {
        delegations: [{
          roleId: fallbackRole.id,
          roleName: fallbackRole.name,
          instructions: userMessage,
          confidence: 50,
          reasoning: 'Fallback delegation'
        }],
        orchestrationStrategy: 'Direct delegation'
      }
    }

    // Step 3: Execute delegations in parallel
    const delegationResults = await Promise.all(
      delegationPlan.delegations.map(async (delegation: any) => {
        const role = roles.find(r => r.id === delegation.roleId)
        if (!role) {
          return {
            role: delegation.roleName,
            response: 'Error: Role not found',
            tokens: 0,
            costCents: 0
          }
        }

        try {
          const messages: ChatMessage[] = [
            ...conversationHistory,
            {
              role: 'system',
              content: `Task from Main Brain: ${delegation.instructions}`
            },
            {
              role: 'user',
              content: userMessage
            }
          ]

          const response = await ModelRouter.chatForRole(role.id, messages)

          return {
            role: role.name,
            response: response.content,
            tokens: response.totalTokens,
            costCents: response.costCents
          }
        } catch (error: any) {
          return {
            role: role.name,
            response: `Error: ${error.message}`,
            tokens: 0,
            costCents: 0
          }
        }
      })
    )

    // Step 4: Main Brain synthesizes final response
    const synthesisPrompt = `You delegated the user's request to specialists. Here are their responses:

${delegationResults.map(d => `**${d.role}**:\n${d.response}`).join('\n\n---\n\n')}

Original request: "${userMessage}"

Your orchestration strategy: ${delegationPlan.orchestrationStrategy}

Synthesize a final response for the user that:
1. Integrates all specialist insights
2. Maintains a cohesive narrative
3. Directly addresses the user's request
4. Credits specialists where appropriate

Provide your final response:`

    const synthesisResponse = await analysisClient.chat([
      { role: 'system', content: mainBrain.persona || 'You are the Main Brain orchestrator.' },
      { role: 'user', content: synthesisPrompt }
    ])

    const totalTokens = analysisResponse.totalTokens +
                       synthesisResponse.totalTokens +
                       delegationResults.reduce((sum, d) => sum + d.tokens, 0)

    const totalCostCents = analysisResponse.costCents +
                          synthesisResponse.costCents +
                          delegationResults.reduce((sum, d) => sum + d.costCents, 0)

    return {
      delegations: delegationResults,
      finalResponse: synthesisResponse.content,
      totalTokens,
      totalCostCents
    }
  }

  /**
   * Check if a role is the Main Brain
   */
  static isMainBrain(roleName: string): boolean {
    const normalized = roleName.toLowerCase()
    return (
      normalized.includes('main brain') ||
      normalized.includes('coo') ||
      normalized === 'orchestrator' ||
      normalized.includes('chief operating')
    )
  }
}
