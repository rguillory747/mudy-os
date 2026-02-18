import { z } from 'zod'

export const businessProfileSchema = z.object({
  companyName: z.string().min(2),
  industry: z.enum([
    'technology',
    'marketing',
    'finance',
    'healthcare',
    'ecommerce',
    'education',
    'consulting',
    'media',
    'real_estate',
    'other'
  ]),
  companySize: z.enum([
    'solo',
    '2-10',
    '11-50',
    '51-200',
    '201-1000',
    '1000+'
  ]),
  description: z.string().max(500).optional()
})

export const useCasesSchema = z.object({
  useCases: z.array(z.enum([
    'lead_generation',
    'customer_support',
    'content_creation',
    'operations',
    'software_development',
    'research',
    'sales',
    'marketing_automation',
    'data_analysis',
    'community_management'
  ]))
})

export const preferencesSchema = z.object({
  budgetSensitivity: z.enum(['low', 'medium', 'high']),
  latencyPreference: z.enum(['realtime', 'standard', 'batch']),
  dataPrivacy: z.enum(['standard', 'sensitive', 'regulated']),
  preferredProviders: z.array(z.enum(['openai', 'anthropic', 'openrouter'])).optional()
})

export const reviewSchema = z.object({})

export const onboardingSchema = businessProfileSchema
  .merge(useCasesSchema)
  .merge(preferencesSchema)
  .merge(reviewSchema)

export type BusinessProfile = z.infer<typeof businessProfileSchema>
export type UseCases = z.infer<typeof useCasesSchema>
export type Preferences = z.infer<typeof preferencesSchema>
export type OnboardingData = z.infer<typeof onboardingSchema>