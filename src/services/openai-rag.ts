// OpenAI RAG Service with Response API
// CRITICAL: This service uses ONLY the OpenAI Response API - NEVER use Chat Completions API
// The Response API provides better context management and vector store integration

import { OpenAI } from 'openai';

// ================================================================================================
// TYPES AND INTERFACES
// ================================================================================================

export interface OpenAIRAGRequest {
  message: string;
  vectorStore?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  instructions?: string;
  prePrompt?: string;
  conversationId?: string;
  topK?: number;
}

export interface OpenAIRAGResponse {
  content: string;
  sources?: string[];
  usage?: TokenUsage;
  model: string;
  conversationId?: string;
  responseId?: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface ConversationData {
  previousResponseId: string;
  isFirstAccess: boolean;
}

interface VectorStoreTool {
  type: "file_search";
  vector_store_ids: string[];
  max_num_results?: number;
}

interface ResponseAPIParams {
  model: string;
  input: string;
  instructions: string;
  temperature: number;
  store: boolean;
  previous_response_id?: string;
  tools?: VectorStoreTool[];
}

// ================================================================================================
// CONSTANTS AND CONFIGURATION
// ================================================================================================



// Vector Store IDs mapping - Maps friendly names to actual OpenAI vector store IDs
const VECTOR_STORE_IDS: Record<string, string> = {
  'ALLWV': 'vs_6870595f39dc8191b364854cf46ffc74',
  'DAC': 'vs_683f352912848191a17ca98ab24a19a5',
  'LO': 'vs_686735d972cc81919ceec7a4ccf63a57',
  'QUEST': 'vs_683f356d9e908191bf83ae7e5ed6a8c9',
  'MANUAIS': 'vs_683f36046a0481919b601070311b8991',
  'ECWV': 'vs_683f35b84fac8191b8a36918eb7997f2',
  'HSRP': 'vs_683f3686f9548191a1769c1fffdf674e',
  'EXP': 'vs_683f3759628c819187618a217d0c5464',
  'PROJ': 'vs_683f36bbcb688191883d43d948673df6',
  'CCG': 'vs_683f36f2daa88191a1055950845e221b',
  'EDUNOTES': 'vs_68726a6993fc8191ba63b14a9243076a'
};


const DEFAULT_MODEL = 'gpt-4.1-nano-2025-04-14';
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_MAX_TOKENS = 2000;
const DEFAULT_TOP_K = 50;
const DEFAULT_INSTRUCTION_PROMPT = 'Você é um assistente especialista em Conscienciologia. Responda de forma objetiva e precisa baseado nas fontes fornecidas.';
const DEFAULT_PRE_PROMPT = '';
const VECT_SELECTED = 'ALLWV';

// Valid OpenAI models
const VALID_MODELS = [
  'gpt-4.1-nano-2025-04-14',
  'gpt-4.1-mini-2025-04-14', 
  'gpt-4.1-2025-04-14'
];

/**
 * Validates and returns a valid model name
 */
function validateModel(model?: string): string {
  if (!model || !VALID_MODELS.includes(model)) {
    console.warn(`Invalid model '${model}', using default: ${DEFAULT_MODEL}`);
    return DEFAULT_MODEL;
  }
  return model;
}

// ================================================================================================
// CONVERSATION STORAGE MANAGEMENT
// ================================================================================================

class ConversationStorage {
  private storage = new Map<string, ConversationData>();

  get(conversationId: string): ConversationData | null {
    return this.storage.get(conversationId) || null;
  }

  set(conversationId: string, data: ConversationData): void {
    this.storage.set(conversationId, data);
  }

  isFirstAccess(conversationId: string): boolean {
    const data = this.get(conversationId);
    return !data || data.isFirstAccess;
  }

  reset(conversationId: string): void {
    this.storage.delete(conversationId);
  }
}

// ================================================================================================
// OPENAI RAG SERVICE CLASS
// ================================================================================================

class OpenAIRAGService {
  private static instance: OpenAIRAGService;
  private openai: OpenAI;
  private conversationStorage: ConversationStorage;

  private constructor() {
    // CRITICAL: Initialize OpenAI client for Response API usage ONLY
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    
    if (!apiKey) {
      console.error('❌ No OpenAI API key found in environment variables');
      throw new Error('OpenAI API key is required');
    }

    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Required for browser usage
    });

    this.conversationStorage = new ConversationStorage();
  }

  static getInstance(): OpenAIRAGService {
    if (!OpenAIRAGService.instance) {
      OpenAIRAGService.instance = new OpenAIRAGService();
    }
    return OpenAIRAGService.instance;
  }

  // ================================================================================================
  // UTILITY METHODS
  // ================================================================================================

  /**
   * Maps friendly vector store names to actual OpenAI vector store IDs
   */
  private getVectorStoreId(vectorStore: string = VECT_SELECTED): string {
    const storeId = VECTOR_STORE_IDS[vectorStore];
    if (!storeId) {
      throw new Error(`Unknown vector store: ${vectorStore}`);
    }
    return storeId;
  }

  /**
   * Creates vector store tools configuration for file search
   */
  private createVectorStoreTools(vectorStore: string, topK: number): VectorStoreTool[] {
    if (vectorStore === 'None') {
      return [];
    }

    const vectorStoreId = this.getVectorStoreId(vectorStore);
    return [{
      type: "file_search",
      vector_store_ids: [vectorStoreId],
      max_num_results: topK
    }];
  }

  /**
   * Formats the final message with pre-prompt if provided
   */
  private formatMessage(message: string, prePrompt?: string): string {
    if (!prePrompt || !prePrompt.trim()) {
      return message;
    }
    return `${prePrompt}\n\nQuery do usuário: ${message}`;
  }

  /**
   * Builds request parameters for the Response API
   */
  private buildRequestParams(
    message: string,
    options: Partial<OpenAIRAGRequest>,
    previousResponseId?: string
  ): ResponseAPIParams {
    const {
      model,
      temperature = DEFAULT_TEMPERATURE,
      instructions = DEFAULT_INSTRUCTION_PROMPT,
      prePrompt = DEFAULT_PRE_PROMPT,
      vectorStore = VECT_SELECTED,
      topK = DEFAULT_TOP_K
    } = options;

    const validatedModel = validateModel(model);
    const finalMessage = this.formatMessage(message, prePrompt);
    const tools = this.createVectorStoreTools(vectorStore, topK);

    const params: ResponseAPIParams = {
      model: validatedModel,
      input: finalMessage,
      instructions,
      temperature,
      store: true // Always store for conversation continuity
    };

    // Add previous response ID for conversation continuity
    if (previousResponseId) {
      params.previous_response_id = previousResponseId;
    }

    // Add tools only if vector store is specified
    if (tools.length > 0) {
      params.tools = tools;
    }

    return params;
  }

  /**
   * Processes the Response API response and extracts relevant data
   */
  private processResponse(response: any, conversationId: string): OpenAIRAGResponse {
    // CRITICAL: Use response.output_text from Response API - NOT chat completions format
    const content = response.output_text || '';
    
    // Extract sources from response if available
    const sources: string[] = [];
    // Note: Sources extraction logic may need adjustment based on actual Response API format
    
    // Extract usage information
    const usage: TokenUsage | undefined = response.usage ? {
      promptTokens: response.usage.prompt_tokens || 0,
      completionTokens: response.usage.completion_tokens || 0,
      totalTokens: response.usage.total_tokens || 0
    } : undefined;

    return {
      content,
      sources,
      usage,
      model: response.model || DEFAULT_MODEL,
      conversationId,
      responseId: response.id
    };
  }

  // ================================================================================================
  // PUBLIC API METHODS
  // ================================================================================================

  /**
   * Initializes a new conversation with a welcome message
   * CRITICAL: Must be called before any other conversation methods
   */
  async initializeConversation(conversationId: string, options?: Partial<OpenAIRAGRequest>): Promise<OpenAIRAGResponse> {
    try {
      const welcomeMessage = 'Olá! Sou seu assistente especializado em Conscienciologia. Como posso ajudá-lo hoje?';
      
      const requestParams = this.buildRequestParams(welcomeMessage, {
        model: options?.model,
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
        instructions: options?.instructions,
        vectorStore: options?.vectorStore,
        topK: options?.topK
      });

      // CRITICAL: Use Response API - NEVER chat completions
      const response = await this.openai.responses.create(requestParams);

      // Store conversation data for continuity
      this.conversationStorage.set(conversationId, {
        previousResponseId: response.id,
        isFirstAccess: false
      });

      return this.processResponse(response, conversationId);
    } catch (error) {
      console.error('❌ Conversation initialization error:', error);
      throw new Error('Failed to initialize conversation');
    }
  }

  /**
   * Main method for RAG-enabled conversations using Response API
   * CRITICAL: Uses ONLY Response API with vector store integration
   */
  async OpenAI_Call(request: OpenAIRAGRequest): Promise<OpenAIRAGResponse> {
    const { message, conversationId } = request;

    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }

    // Check if conversation is initialized
    if (this.conversationStorage.isFirstAccess(conversationId)) {
      throw new Error('Conversation not initialized. Call initializeConversation first.');
    }

    try {
      // Get conversation data for continuity
      const conversationData = this.conversationStorage.get(conversationId);
      if (!conversationData) {
        throw new Error('Conversation data not found');
      }

      // Build request parameters with previous response ID
      const requestParams = this.buildRequestParams(
        message,
        request,
        conversationData.previousResponseId
      );

      // CRITICAL: Use Response API - NEVER chat completions
      const response = await this.openai.responses.create(requestParams);

      // Update conversation storage with new response ID
      this.conversationStorage.set(conversationId, {
        previousResponseId: response.id,
        isFirstAccess: false
      });

      return this.processResponse(response, conversationId);
    } catch (error) {
      console.error('❌ RAG call error:', error);
      throw new Error('Failed to generate RAG response');
    }
  }

  /**
   * Resets a conversation, clearing all stored context
   */
  resetConversation(conversationId: string): void {
    this.conversationStorage.reset(conversationId);
  }

  /**
   * Checks if a conversation exists and is initialized
   */
  isConversationInitialized(conversationId: string): boolean {
    return !this.conversationStorage.isFirstAccess(conversationId);
  }

  /**
   * Gets available vector stores
   */
  getAvailableVectorStores(): string[] {
    return Object.keys(VECTOR_STORE_IDS);
  }
}

// ================================================================================================
// EXPORTS
// ================================================================================================

// Export singleton instance
export const openAIRAGService = OpenAIRAGService.getInstance();

// Types are already exported at their declaration