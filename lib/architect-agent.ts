import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { MODEL_CATALOG, getRecommendedModels } from '@/lib/model-catalog'

type ProposedRole = {
  name: string
  description: string
  persona: string
  tier: 'executive' | 'department_head' | 'specialist'
  parentRole: string | null
  recommendedModelId: string
  recommendedProvider: string
  reasoning: string
}

type OrgChartProposal = {
  roles: ProposedRole[]
  summary: string
  estimatedMonthlyCost: number
  warnings: string[]
}

export async function generateOrgChartProposal(onboardingData: {
  companyName: string
  industry: string
  companySize: string
  description?: string
  useCases: string[]
  budgetSensitivity: 'low' | 'medium' | 'high'
  latencyPreference: string
  dataPrivacy: string
  preferredProviders?: string[]
}): Promise<OrgChartProposal> {
  try {
    // Filter models based on preferences
    const availableModels = getRecommendedModels({
      budgetSensitivity: onboardingData.budgetSensitivity,
      preferredProviders: onboardingData.preferredProviders
    })

    // Create system prompt
    const systemPrompt = `
You are an AI Solution Architect for Mudy OS. Given a company profile and use cases, design an optimal AI workforce org chart.

Guidelines:
1. ALWAYS include a COO/Main Brain role at the top (executive tier)
2. Map use cases to department heads and specialists
3. Assign models from the available catalog based on:
   - Task complexity (executive = most capable models)
   - Budget sensitivity (prefer cost-effective models for sensitive budgets)
   - Latency requirements (use faster models when needed)
   - Data privacy requirements (use privacy-compliant models when needed)
4. Structure the response as valid JSON with this exact format:
{
  "roles": [
    {
      "name": "Role Name",
      "description": "Role description",
      "persona": "Personality/soul description",
      "tier": "executive|department_head|specialist",
      "parentRole": "Parent Role Name or null",
      "recommendedModelId": "model_id_from_catalog",
      "recommendedProvider": "provider_name",
      "reasoning": "Why this model was chosen"
    }
  ],
  "summary": "High-level summary of the proposed org structure",
  "estimatedMonthlyCost": 0,
  "warnings": ["Any warnings or considerations"]
}
`

    // Create user prompt
    const userPrompt = `
Company Profile:
- Name: ${onboardingData.companyName}
- Industry: ${onboardingData.industry}
- Size: ${onboardingData.companySize}
- Description: ${onboardingData.description || 'N/A'}

Requirements:
- Use Cases: ${onboardingData.useCases.join(', ')}
- Budget Sensitivity: ${onboardingData.budgetSensitivity}
- Latency Preference: ${onboardingData.latencyPreference}
- Data Privacy: ${onboardingData.dataPrivacy}
- Preferred Providers: ${onboardingData.preferredProviders?.join(', ') || 'None specified'}

Available Models:
${JSON.stringify(availableModels, null, 2)}

Design an optimal AI workforce org chart following the guidelines.
`

    // Initialize LLM
    const llm = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4o',
      temperature: 0.3,
      responseFormat: { type: 'json_object' }
    })

    // Generate response
    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt)
    ]

    const response = await llm.invoke(messages)
    const content = response.content as string

    // Parse and validate response
    let parsedResponse: OrgChartProposal
    try {
      parsedResponse = JSON.parse(content)
    } catch (parseError) {
      throw new Error('Failed to parse LLM response as JSON')
    }

    // Validate required fields
    if (!parsedResponse.roles || !Array.isArray(parsedResponse.roles)) {
      throw new Error('Invalid response: roles array is missing or invalid')
    }

    if (typeof parsedResponse.summary !== 'string') {
      throw new Error('Invalid response: summary is missing or invalid')
    }

    if (typeof parsedResponse.estimatedMonthlyCost !== 'number') {
      throw new Error('Invalid response: estimatedMonthlyCost is missing or invalid')
    }

    if (!Array.isArray(parsedResponse.warnings)) {
      throw new Error('Invalid response: warnings array is missing or invalid')
    }

    // Validate each role
    for (const role of parsedResponse.roles) {
      if (!role.name || !role.description || !role.persona || 
          !role.tier || !['executive', 'department_head', 'specialist'].includes(role.tier) ||
          (role.parentRole !== null && typeof role.parentRole !== 'string') ||
          !role.recommendedModelId || !role.recommendedProvider || !role.reasoning) {
        throw new Error(`Invalid role structure: ${JSON.stringify(role)}`)
      }
    }

    return parsedResponse
  } catch (error) {
    console.error('Error generating org chart proposal:', error)
    throw new Error(`Failed to generate org chart proposal: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}