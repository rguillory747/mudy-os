import { prismadb } from './prismadb'
import { ModelRouter } from './model-router'
import { createModelClient } from './openrouter-client'

interface StandupReport {
  roleId: string
  roleName: string
  completedWork: string
  blockers: string
  nextPriorities: string
  timestamp: Date
}

interface ActionItem {
  title: string
  description: string
  assignedRoleId: string | null
  priority: 'low' | 'medium' | 'high'
  reasoning: string
}

interface StandupOrchestrationResult {
  reports: StandupReport[]
  aggregation: string
  actionItems: ActionItem[]
  createdTasks: string[] // Task IDs
  totalTokens: number
  totalCostCents: number
}

export class StandupOrchestrator {
  /**
   * Run autonomous standups for all active roles in an organization
   */
  static async runDailyStandup(orgId: string): Promise<StandupOrchestrationResult> {
    let totalTokens = 0
    let totalCostCents = 0

    // Step 1: Get all active roles with recent task history
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
        },
        agentTasks: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    })

    // Step 2: Generate standup report for each role
    const reports: StandupReport[] = []

    for (const role of roles) {
      try {
        const standupPrompt = `You are ${role.name}. Generate your daily standup report.

Recent tasks:
${role.agentTasks.map(t =>
  `- [${t.status}] ${t.title} (${t.createdAt.toLocaleDateString()})`
).join('\n') || 'No recent tasks'}

Provide a brief standup report in this format:

**Completed Work:**
[What you accomplished recently]

**Blockers:**
[Any obstacles or issues, or "None"]

**Next Priorities:**
[What you plan to focus on next]

Keep it concise (2-3 sentences per section).`

        const messages = [
          {
            role: 'system' as const,
            content: role.persona || `You are ${role.name}.`
          },
          {
            role: 'user' as const,
            content: standupPrompt
          }
        ]

        const response = await ModelRouter.chatForRole(role.id, messages)

        totalTokens += response.totalTokens
        totalCostCents += response.costCents

        // Parse the report
        const completed = this.extractSection(response.content, 'Completed Work')
        const blockers = this.extractSection(response.content, 'Blockers')
        const priorities = this.extractSection(response.content, 'Next Priorities')

        reports.push({
          roleId: role.id,
          roleName: role.name,
          completedWork: completed || 'No updates',
          blockers: blockers || 'None',
          nextPriorities: priorities || 'Continuing current work',
          timestamp: new Date()
        })
      } catch (error) {
        console.error(`Failed to generate standup for ${role.name}:`, error)
        // Continue with other roles
      }
    }

    // Step 3: Main Brain aggregates all standups
    const mainBrain = roles.find(r =>
      r.name.toLowerCase().includes('main brain') ||
      r.name.toLowerCase().includes('coo')
    )

    let aggregation = ''
    let actionItems: ActionItem[] = []

    if (mainBrain) {
      const aggregationPrompt = `As the Main Brain (COO), review all team standup reports and provide:

1. **Executive Summary**: High-level overview of team progress
2. **Key Insights**: Notable achievements or concerns
3. **Action Items**: Specific tasks to create (3-5 items)

Team Standups:
${reports.map(r => `
**${r.roleName}:**
- Completed: ${r.completedWork}
- Blockers: ${r.blockers}
- Next: ${r.nextPriorities}
`).join('\n')}

For action items, use this JSON format:
{
  "actionItems": [
    {
      "title": "Task title",
      "description": "Detailed description",
      "assignedRole": "Role Name or null",
      "priority": "high|medium|low",
      "reasoning": "Why this is important"
    }
  ]
}`

      const client = await createModelClient(
        mainBrain.modelAssignment!.modelConfig.provider,
        mainBrain.modelAssignment!.modelConfig.modelId
      )

      const response = await client.chat([
        {
          role: 'system',
          content: mainBrain.persona || 'You are the Main Brain (COO).'
        },
        {
          role: 'user',
          content: aggregationPrompt
        }
      ])

      totalTokens += response.totalTokens
      totalCostCents += response.costCents

      aggregation = response.content

      // Extract action items from JSON
      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          if (parsed.actionItems && Array.isArray(parsed.actionItems)) {
            actionItems = parsed.actionItems.map((item: any) => ({
              title: item.title,
              description: item.description,
              assignedRoleId: item.assignedRole
                ? roles.find(r => r.name === item.assignedRole)?.id || null
                : null,
              priority: item.priority || 'medium',
              reasoning: item.reasoning || ''
            }))
          }
        }
      } catch (error) {
        console.error('Failed to parse action items:', error)
      }
    }

    // Step 4: Create tasks from action items
    const createdTasks: string[] = []

    for (const actionItem of actionItems) {
      try {
        const task = await prismadb.agentTask.create({
          data: {
            orgId,
            roleId: actionItem.assignedRoleId,
            title: actionItem.title,
            input: `${actionItem.description}\n\nReasoning: ${actionItem.reasoning}\nPriority: ${actionItem.priority}`,
            status: 'pending'
          }
        })

        createdTasks.push(task.id)
      } catch (error) {
        console.error(`Failed to create task: ${actionItem.title}`, error)
      }
    }

    return {
      reports,
      aggregation,
      actionItems,
      createdTasks,
      totalTokens,
      totalCostCents
    }
  }

  /**
   * Extract a section from markdown-formatted standup
   */
  private static extractSection(text: string, sectionName: string): string | null {
    const regex = new RegExp(`\\*\\*${sectionName}:?\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*|$)`, 'i')
    const match = text.match(regex)
    return match ? match[1].trim() : null
  }

  /**
   * Get recent standup history for an organization
   */
  static async getStandupHistory(orgId: string, limit: number = 10): Promise<any[]> {
    // This would query a StandupRun table if we had one
    // For now, return empty array
    return []
  }
}
