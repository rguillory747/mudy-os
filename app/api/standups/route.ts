import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getCurrentOrg } from '@/lib/tenant'
import { StandupOrchestrator } from '@/lib/standup-orchestrator'

// POST /api/standups - Run daily standup
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

    // Run autonomous standup
    const result = await StandupOrchestrator.runDailyStandup(org.id)

    return NextResponse.json({
      success: true,
      summary: {
        reportsGenerated: result.reports.length,
        actionItemsCreated: result.actionItems.length,
        tasksCreated: result.createdTasks.length,
        totalTokens: result.totalTokens,
        totalCostCents: result.totalCostCents
      },
      reports: result.reports,
      aggregation: result.aggregation,
      actionItems: result.actionItems,
      taskIds: result.createdTasks
    })
  } catch (error: any) {
    console.error('Standup error:', error)
    return new NextResponse(error.message || 'Internal error', { status: 500 })
  }
}

// GET /api/standups - Get standup history (placeholder)
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

    const history = await StandupOrchestrator.getStandupHistory(org.id)

    return NextResponse.json(history)
  } catch (error) {
    console.error('Get standup history error:', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}
