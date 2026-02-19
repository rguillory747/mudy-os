import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages'
import { ModelProvider } from '@prisma/client'
import { MODEL_CATALOG } from './model-catalog'

export interface ModelConfig {
  provider: ModelProvider
  modelId: string
  apiKey: string
  temperature?: number
  maxTokens?: number
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ModelResponse {
  content: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costCents: number
  modelId: string
  provider: ModelProvider
}

export class UnifiedModelClient {
  private config: ModelConfig

  constructor(config: ModelConfig) {
    this.config = config
  }

  async chat(messages: ChatMessage[], options?: {
    temperature?: number
    maxTokens?: number
  }): Promise<ModelResponse> {
    const { provider, modelId, apiKey } = this.config

    switch (provider) {
      case 'openrouter':
        return this.chatOpenRouter(messages, options)
      case 'openai':
        return this.chatOpenAI(messages, options)
      case 'anthropic':
        return this.chatAnthropic(messages, options)
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }
  }

  private async chatOpenRouter(messages: ChatMessage[], options?: {
    temperature?: number
    maxTokens?: number
  }): Promise<ModelResponse> {
    const llm = new ChatOpenAI({
      apiKey: this.config.apiKey,
      model: this.config.modelId,
      temperature: options?.temperature ?? this.config.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? this.config.maxTokens,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1'
      }
    })

    const langchainMessages = messages.map(msg => {
      switch (msg.role) {
        case 'system':
          return new SystemMessage(msg.content)
        case 'user':
          return new HumanMessage(msg.content)
        case 'assistant':
          return new AIMessage(msg.content)
      }
    })

    const response = await llm.invoke(langchainMessages)
    const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content)

    const usage = response.response_metadata?.usage || {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    }

    const inputTokens = usage.prompt_tokens || 0
    const outputTokens = usage.completion_tokens || 0
    const totalTokens = usage.total_tokens || inputTokens + outputTokens

    const costCents = this.calculateCost(inputTokens, outputTokens)

    return {
      content,
      inputTokens,
      outputTokens,
      totalTokens,
      costCents,
      modelId: this.config.modelId,
      provider: 'openrouter'
    }
  }

  private async chatOpenAI(messages: ChatMessage[], options?: {
    temperature?: number
    maxTokens?: number
  }): Promise<ModelResponse> {
    const llm = new ChatOpenAI({
      apiKey: this.config.apiKey,
      model: this.config.modelId,
      temperature: options?.temperature ?? this.config.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? this.config.maxTokens
    })

    const langchainMessages = messages.map(msg => {
      switch (msg.role) {
        case 'system':
          return new SystemMessage(msg.content)
        case 'user':
          return new HumanMessage(msg.content)
        case 'assistant':
          return new AIMessage(msg.content)
      }
    })

    const response = await llm.invoke(langchainMessages)
    const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content)

    const usage = response.response_metadata?.usage || {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    }

    const inputTokens = usage.prompt_tokens || 0
    const outputTokens = usage.completion_tokens || 0
    const totalTokens = usage.total_tokens || inputTokens + outputTokens

    const costCents = this.calculateCost(inputTokens, outputTokens)

    return {
      content,
      inputTokens,
      outputTokens,
      totalTokens,
      costCents,
      modelId: this.config.modelId,
      provider: 'openai'
    }
  }

  private async chatAnthropic(messages: ChatMessage[], options?: {
    temperature?: number
    maxTokens?: number
  }): Promise<ModelResponse> {
    // Use OpenRouter for Anthropic models to avoid needing separate API key
    return this.chatOpenRouter(messages, options)
  }

  private calculateCost(inputTokens: number, outputTokens: number): number {
    const catalogEntry = MODEL_CATALOG.find(
      m => m.provider === this.config.provider && m.modelId === this.config.modelId
    )

    if (!catalogEntry) {
      console.warn(`Model not found in catalog: ${this.config.provider}/${this.config.modelId}`)
      return 0
    }

    const costPer1k = catalogEntry.costPer1kTokens
    const totalCost = ((inputTokens + outputTokens) / 1000) * costPer1k
    return Math.round(totalCost * 100) // Convert to cents
  }
}

export async function createModelClient(
  provider: ModelProvider,
  modelId: string,
  apiKey?: string
): Promise<UnifiedModelClient> {
  const effectiveApiKey = apiKey || getDefaultApiKey(provider)

  if (!effectiveApiKey) {
    throw new Error(`No API key configured for provider: ${provider}`)
  }

  return new UnifiedModelClient({
    provider,
    modelId,
    apiKey: effectiveApiKey
  })
}

function getDefaultApiKey(provider: ModelProvider): string | undefined {
  switch (provider) {
    case 'openrouter':
      return process.env.OPENROUTER_API_KEY
    case 'openai':
      return process.env.OPENAI_API_KEY
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY || process.env.OPENROUTER_API_KEY // Fallback to OpenRouter
    default:
      return undefined
  }
}
