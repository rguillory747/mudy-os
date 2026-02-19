import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import prismadb from '@/lib/prismadb'
import { requireOrg } from '@/lib/tenant'
import { generateOrgChartProposal } from '@/lib/architect-agent'
import { OrgRole } from '@prisma/client'

interface OnboardingRequestBody {
  companyName: string
  industry: string
  companySize: string
  description?: string
  useCases: string[]
  budgetSensitivity: 'low' | 'medium' | 'high'
  latencyPreference: string
  dataPrivacy: string
  preferredProviders?: string[]
}

export async function POST(req: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const org = await requireOrg()

    const body: OnboardingRequestBody = await req.json()

    const { 
      companyName, 
      industry, 
      companySize, 
      description, 
      useCases, 
      budgetSensitivity, 
      latencyPreference, 
      dataPrivacy, 
      preferredProviders 
    } = body

    // Update organization with onboarding data
    await prismadb.organization.update({
      where: { id: org.id },
      data: {
        industry,
        companySize,
        onboardingStatus: 'in_progress',
        name: companyName
      }
    })

    // Generate org chart proposal
    const proposal = await generateOrgChartProposal(body)

    // Track created roles for parent lookup
    const createdRoles = new Map<string, OrgRole>()

    // Create roles from proposal
    for (let index = 0; index < proposal.roles.length; index++) {
      const role = proposal.roles[index]
      
      // Find parent role ID if parentRole exists
      let parentId: string | null = null
      if (role.parentRole && createdRoles.has(role.parentRole)) {
        parentId = createdRoles.get(role.parentRole)!.id
      }

      // Create the OrgRole
      const createdRole = await prismadb.orgRole.create({
        data: {
          orgId: org.id,
          name: role.name,
          description: role.description,
          persona: role.persona,
          parentId,
          sortOrder: index
        }
      })

      // Store for potential child role references
      createdRoles.set(role.name, createdRole)

      // Handle model configuration
      if (role.recommendedModelId && role.recommendedProvider) {
        // Find or create ModelConfig
        let modelConfig = await prismadb.modelConfig.findFirst({
          where: {
            orgId: org.id,
            provider: role.recommendedProvider as any,
            modelId: role.recommendedModelId
          }
        })

        if (!modelConfig) {
          modelConfig = await prismadb.modelConfig.create({
            data: {
              orgId: org.id,
              provider: role.recommendedProvider as any,
              modelId: role.recommendedModelId,
              displayName: role.recommendedModelId
            }
          })
        }

        // Create RoleModelAssignment
        await prismadb.roleModelAssignment.create({
          data: {
            roleId: createdRole.id,
            modelConfigId: modelConfig.id
          }
        })
      }
    }

    // Update org onboarding status to completed
    await prismadb.organization.update({
      where: { id: org.id },
      data: { onboardingStatus: 'completed' }
    })

    return NextResponse.json({ proposal, orgId: org.id })
  } catch (error) {
    console.error('[ONBOARDING_ERROR]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}