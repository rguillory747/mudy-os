type ModelCatalogEntry = {
  provider: 'openai' | 'anthropic' | 'runpod' | 'openrouter';
  modelId: string;
  displayName: string;
  description: string;
  costPer1kTokens: number;
  maxTokens: number;
  tier: 'reasoning' | 'balanced' | 'efficient' | 'coding';
  bestFor: string[];
};

const MODEL_CATALOG: ModelCatalogEntry[] = [
  // OpenAI Models
  {
    provider: 'openai',
    modelId: 'gpt-4o',
    displayName: 'GPT-4o',
    description: 'OpenAI\'s balanced model for general-purpose tasks',
    costPer1kTokens: 0.005,
    maxTokens: 128000,
    tier: 'balanced',
    bestFor: ['general tasks', 'content creation', 'analysis']
  },
  {
    provider: 'openai',
    modelId: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    description: 'Efficient model optimized for high-volume tasks',
    costPer1kTokens: 0.00015,
    maxTokens: 128000,
    tier: 'efficient',
    bestFor: ['high-volume', 'classification', 'summarization']
  },
  {
    provider: 'openai',
    modelId: 'o1',
    displayName: 'O1',
    description: 'Advanced reasoning model for complex analytical tasks',
    costPer1kTokens: 0.015,
    maxTokens: 200000,
    tier: 'reasoning',
    bestFor: ['complex reasoning', 'research', 'strategic planning']
  },

  // Anthropic Models
  {
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-5-20250929',
    displayName: 'Claude Sonnet 4',
    description: 'Balanced model with strong coding and implementation capabilities',
    costPer1kTokens: 0.003,
    maxTokens: 200000,
    tier: 'balanced',
    bestFor: ['implementation', 'coding', 'technical writing']
  },
  {
    provider: 'anthropic',
    modelId: 'claude-opus-4-6',
    displayName: 'Claude Opus 4',
    description: 'Top-tier reasoning model for complex architecture and planning',
    costPer1kTokens: 0.015,
    maxTokens: 200000,
    tier: 'reasoning',
    bestFor: ['architecture', 'complex reasoning', 'strategic analysis']
  },
  {
    provider: 'anthropic',
    modelId: 'claude-haiku-4-5-20251001',
    displayName: 'Claude Haiku 4',
    description: 'Efficient model optimized for speed and high-volume tasks',
    costPer1kTokens: 0.0008,
    maxTokens: 200000,
    tier: 'efficient',
    bestFor: ['high-volume', 'classification', 'quick responses']
  },

  // OpenRouter Models
  {
    provider: 'openrouter',
    modelId: 'qwen/qwen3-coder',
    displayName: 'Qwen 3 Coder',
    description: 'Specialized coding model for code generation',
    costPer1kTokens: 0.0003,
    maxTokens: 65536,
    tier: 'coding',
    bestFor: ['code generation', 'implementation', 'debugging']
  },
  {
    provider: 'openrouter',
    modelId: 'qwen/qwen3-coder:free',
    displayName: 'Qwen 3 Coder (Free)',
    description: 'Free-tier coding model for code generation',
    costPer1kTokens: 0,
    maxTokens: 65536,
    tier: 'coding',
    bestFor: ['code generation', 'prototyping']
  },
  {
    provider: 'openrouter',
    modelId: 'google/gemini-2.5-flash-preview',
    displayName: 'Gemini 2.5 Flash',
    description: 'Ultra-efficient model for fast, high-volume tasks',
    costPer1kTokens: 0.00015,
    maxTokens: 1000000,
    tier: 'efficient',
    bestFor: ['high-volume', 'fast tasks', 'real-time processing']
  },
  {
    provider: 'openrouter',
    modelId: 'google/gemini-2.5-pro-preview',
    displayName: 'Gemini 2.5 Pro',
    description: 'Balanced model for general-purpose tasks with extended context',
    costPer1kTokens: 0.00125,
    maxTokens: 1000000,
    tier: 'balanced',
    bestFor: ['general tasks', 'content creation', 'multi-step reasoning']
  },
  {
    provider: 'openrouter',
    modelId: 'deepseek/deepseek-r1',
    displayName: 'DeepSeek R1',
    description: 'Reasoning-focused model with strong math capabilities',
    costPer1kTokens: 0.003,
    maxTokens: 65536,
    tier: 'reasoning',
    bestFor: ['reasoning', 'math', 'scientific analysis']
  },
  {
    provider: 'openrouter',
    modelId: 'meta-llama/llama-4-maverick',
    displayName: 'Llama 4 Maverick',
    description: 'Balanced general-purpose model with extended context',
    costPer1kTokens: 0.0005,
    maxTokens: 524288,
    tier: 'balanced',
    bestFor: ['general tasks', 'content creation', 'conversational AI']
  }
];

function getModelsByProvider(provider: string): ModelCatalogEntry[] {
  return MODEL_CATALOG.filter(model => model.provider === provider);
}

function getModelsByTier(tier: string): ModelCatalogEntry[] {
  return MODEL_CATALOG.filter(model => model.tier === tier);
}

function getModelById(modelId: string): ModelCatalogEntry | undefined {
  return MODEL_CATALOG.find(model => model.modelId === modelId);
}

function getRecommendedModels(budgetSensitivity: 'low' | 'medium' | 'high'): ModelCatalogEntry[] {
  const budgetMultipliers = {
    low: 1,
    medium: 0.01,
    high: 0.001
  };
  
  const maxCost = budgetMultipliers[budgetSensitivity];
  return MODEL_CATALOG.filter(model => model.costPer1kTokens <= maxCost);
}

export {
  type ModelCatalogEntry,
  MODEL_CATALOG,
  getModelsByProvider,
  getModelsByTier,
  getModelById,
  getRecommendedModels
};