import { currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import prismadb from '@/lib/prismadb'
import { requireOrg } from '@/lib/tenant'
import { generateOrgChartProposal } from '@/lib/architect-agent'
import { Role } from '@prisma/client'

interface OnboardingRequestBody {
  companyName: string
  industry: string
  companySize: string
  description: string
  useCases: string[]
  budgetSensitivity: string
  latencyPreference: string
  dataPrivacy: string
  preferredProviders: string[]
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
        name: companyName,
        description,
        useCases,
        budgetSensitivity,
        latencyPreference,
        dataPrivacy,
        preferredProviders
      }
    })

    // Generate org chart proposal
    const proposal = await generateOrgChartProposal(body)

    // Track created roles for parent lookup
    const createdRoles = new Map<string, Role>()

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
      if (role.recommendedModel) {
        // Find or create ModelConfig
        let modelConfig = await prismadb.modelConfig.findFirst({
          where: {
            provider: role.recommendedModel.provider,
            model: role.recommendedModel.model
          }
        })

        if (!modelConfig) {
          modelConfig = await prismadb.modelConfig.create({
            data: {
              provider: role.recommendedModel.provider,
              model: role.recommendedModel.model,
              capabilities: role.recommendedModel.capabilities || []
            }
          })
        }

        // Create RoleModelAssignment
        await prismadb.roleModelAssignment.create({
          data: {
            roleId: createdRole.id,
            modelConfigId: modelConfig.id,
            configuration: role.recommendedModel.configuration || {}
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