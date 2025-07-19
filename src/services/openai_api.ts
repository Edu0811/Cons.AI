/**
 * OpenAI API Service
 * 
 * This module provides a centralized interface for interacting with the OpenAI API,
 * specifically using the Response API (not Chat Completions).
 * 
 * Key Features:
 * - Centralized API calls with consistent error handling
 * - Support for all Response API parameters
 * - Conversation management
 * - Vector store integration
 * - Token usage tracking
 * 
 * IMPORTANT: This service uses ONLY the new Response API - NEVER use Chat Completions API
 * 
 * Usage Example:
 * 
 * // Initialize a conversation
 * const response = await openAIService.initializeConversation('unique-conversation-id', {
 *   model: 'gpt-4.1-nano-2025-04-14',
 *   temperature: 0.7,
 *   instructions: 'You are a helpful assistant.',
 *   vectorStore: 'ALLWV'
 * });
 * 
 * // Send a message in an existing conversation
 * const response = await openAIService.openaiCall({
 *   message: 'Your question here',
 *   conversationId: 'unique-conversation-id',
 *   model: 'gpt-4.1-nano-2025-04-14',
 *   temperature: 0.7,
 *   vectorStore: 'ALLWV',
 *   topK: 50,
 *   maxTokens: 1000,
 *   instructions: 'Additional instructions',
 *   prePrompt: 'Context for the model'
 * });
 */

import { OpenAI } from 'openai';

// ================================================================================================
// TYPES AND INTERFACES
// ================================================================================================

export interface OpenAICallOptions {
  // Required parameters
  message: string;
  
  // Conversation management
  conversationId?: string;
  
  // Model parameters
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  
  // Context and instructions
  instructions?: string;
  prePrompt?: string;
  
  // Vector store
  vectorStore?: string;
  topK?: number;
  
  // Other
  store?: boolean;
  metadata?: Record<string, any>;
  user?: string;
}

export interface OpenAICallResponse {
  // Response content
  content: string;
  
  // Source information (for RAG)
  sources?: Array<{
    id: string;
    title?: string;
    url?: string;
    content?: string;
  }>;
  
  // Token usage information
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  
  // Model information
  model: string;
  
  // Conversation tracking
  conversationId?: string;
  responseId?: string;
  
  // Raw response from OpenAI
  rawResponse?: any;
}

interface VectorStoreTool {
  type: 'file_search';
  vector_store_ids: string[];
  max_num_results?: number;
}

interface ResponseAPIParams {
  model: string;
  input: string;
  instructions: string;
  temperature: number;
  store: boolean;
  max_output_tokens?: number;
  top_p?: number;
  previous_response_id?: string;
  tools?: VectorStoreTool[];
  metadata?: Record<string, any>;
  user?: string;
}

// ================================================================================================
// CONSTANTS AND DEFAULTS
// ================================================================================================

// Default configuration
const DEFAULTS = {
  MODEL: 'gpt-4.1-nano-2025-04-14',
  TEMPERATURE: 0.7,
  MAX_TOKENS: 2000,
  TOP_K: 50,
  INSTRUCTIONS: 'Você é um especialista em Conscienciologia. Responda com base nos arquivos da base de dados fornecida. Quando possível, inclua as fontes das informações fornecidas.',
  PRE_PROMPT: 'Quando possível, responda na forma de listagem numerada.',
  VECTOR_STORE: 'ALLWV',
  STORE_CONVERSATION: true
};

// Valid OpenAI models
const VALID_MODELS = [
  'gpt-4.1-nano-2025-04-14',
  'gpt-4.1-mini-2025-04-14',
  'gpt-4.1-2025-04-14'
];

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

// ================================================================================================
// CONVERSATION STORAGE
// ================================================================================================

class ConversationStorage {
  private storage = new Map<string, string>();
  
  get(conversationId: string): string | null {
    return this.storage.get(conversationId) || null;
  }
  
  set(conversationId: string, responseId: string): void {
    this.storage.set(conversationId, responseId);
  }
  
  delete(conversationId: string): void {
    this.storage.delete(conversationId);
  }
  
  has(conversationId: string): boolean {
    return this.storage.has(conversationId);
  }
}

// ================================================================================================
// OPENAI SERVICE IMPLEMENTATION
// ================================================================================================

class OpenAIService {
  private static instance: OpenAIService;
  private openai: OpenAI;
  private conversationStorage: ConversationStorage;
  
  private constructor() {
    // Log environment variables for debugging (don't log the actual key in production)
    console.log('Environment variables:', Object.keys(import.meta.env));
    
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    // Log whether we found the API key (without logging the actual key)
    console.log('API key found:', !!apiKey);
    
    if (!apiKey) {
      console.error('❌ OpenAI API key not found in environment variables');
      console.log('Make sure your .env file is in the root directory and contains VITE_OPENAI_API_KEY');
      console.log('Also ensure the development server was restarted after adding the .env file');
      throw new Error('OpenAI API key not found in environment variables');
    }
    
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Required for browser usage
    });
    
    this.conversationStorage = new ConversationStorage();
  }
  

  
  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }
  
  // ============================================================================================
  // PRIVATE UTILITY METHODS
  // ============================================================================================
  
  /**
   * Validates and returns a valid model name
   */
  private validateModel(model?: string): string {
    if (!model || !VALID_MODELS.includes(model)) {
      console.warn(`Invalid model '${model}', using default: ${DEFAULTS.MODEL}`);
      return DEFAULTS.MODEL;
    }
    return model;
  }
  
  /**
   * Gets the vector store ID from a friendly name
   */
  private getVectorStoreId(vectorStore?: string): string | undefined {
    if (!vectorStore) return undefined;
    return VECTOR_STORE_IDS[vectorStore];
  }
  
  /**
   * Creates vector store tools if a valid vector store is provided
   */
  private createVectorStoreTools(vectorStore?: string, topK: number = DEFAULTS.TOP_K): VectorStoreTool[] {
    if (!vectorStore) return [];
    
    const vectorStoreId = this.getVectorStoreId(vectorStore);
    if (!vectorStoreId) {
      console.warn(`Vector store '${vectorStore}' not found`);
      return [];
    }
    
    return [{
      type: 'file_search',
      vector_store_ids: [vectorStoreId],
      max_num_results: topK
    }];
  }
  
  /**
   * Builds the parameters for the OpenAI API call
   */
  private buildRequestParams(
    options: OpenAICallOptions,
    isInitialMessage: boolean = false
  ): ResponseAPIParams {
    const {
      model,
      temperature = DEFAULTS.TEMPERATURE,
      maxTokens = DEFAULTS.MAX_TOKENS,
      topP,
      instructions = DEFAULTS.INSTRUCTIONS,
      prePrompt = DEFAULTS.PRE_PROMPT,
      vectorStore,
      topK = DEFAULTS.TOP_K,
      store = DEFAULTS.STORE_CONVERSATION,
      metadata,
      user
    } = options;
    
    // Format the message with pre-prompt if provided
    const input = prePrompt ? `${prePrompt}\n\n${options.message}` : options.message;
    
    // Get conversation context if available
    const previousResponseId = options.conversationId && !isInitialMessage
      ? this.conversationStorage.get(options.conversationId) || undefined
      : undefined;
    
    // Create the base parameters
    const params: ResponseAPIParams = {
      model: this.validateModel(model),
      input,
      instructions,
      temperature: Math.max(0, Math.min(2, temperature)), // Clamp between 0 and 2
      store
    };
    
    // Add optional parameters if provided
    if (maxTokens) params.max_output_tokens = maxTokens;
    if (topP !== undefined) params.top_p = topP;
    if (previousResponseId) params.previous_response_id = previousResponseId;
    if (metadata) params.metadata = metadata;
    if (user) params.user = user;
    
    // Add vector store tools if a vector store is specified
    if (vectorStore) {
      params.tools = this.createVectorStoreTools(vectorStore, topK);
    }
    
    return params;
  }
  
  /**
   * Processes the raw response from the OpenAI API
   */
  private processResponse(
    response: any,
    conversationId?: string
  ): OpenAICallResponse {
    // Store the response ID for conversation continuity
    if (conversationId && response.id) {
      this.conversationStorage.set(conversationId, response.id);
    }
    
    // Extract sources if available
    const sources = response.sources?.map((source: any) => ({
      id: source.id,
      title: source.title,
      url: source.url,
      content: source.content
    }));
    
    // Extract usage information
    const usage = response.usage ? {
      promptTokens: response.usage.prompt_tokens || 0,
      completionTokens: response.usage.completion_tokens || 0,
      totalTokens: response.usage.total_tokens || 0
    } : undefined;
    
    return {
      content: response.output_text || '',
      sources,
      usage,
      model: response.model || DEFAULTS.MODEL,
      conversationId,
      responseId: response.id,
      rawResponse: response
    };
  }
  
  // ============================================================================================
  // PUBLIC API METHODS
  // ============================================================================================
  
  /**
   * Initializes a new conversation with a welcome message
   */
  public async initializeConversation(
    conversationId: string, 
    options: Omit<OpenAICallOptions, 'message' | 'conversationId'> = {}
  ): Promise<OpenAICallResponse> {
    if (!conversationId) {
      throw new Error('conversationId is required');
    }
    
    // Check if conversation already exists
    if (this.conversationStorage.has(conversationId)) {
      throw new Error(`Conversation '${conversationId}' already exists`);
    }
    
    try {
      const params = this.buildRequestParams({
        ...options,
        message: 'Hello!', // Welcome message will be generated by the model
        conversationId
      }, true);
      
      const response = await this.openai.responses.create(params);
      return this.processResponse(response, conversationId);
    } catch (error) {
      console.error('Error initializing conversation:', error);
      throw new Error(`Failed to initialize conversation: ${error.message}`);
    }
  }
  
  /**
   * Main method for making calls to the OpenAI API
   */
  public async openaiCall(options: OpenAICallOptions): Promise<OpenAICallResponse> {
    const { conversationId } = options;
    
    if (!options.message?.trim()) {
      throw new Error('Message is required');
    }
    
    try {
      // If no conversation ID is provided or conversation doesn't exist, initialize a new one
      if (!conversationId || !this.conversationStorage.has(conversationId)) {
        console.log(`Initializing new conversation with ID: ${conversationId || 'new'}`);
        await this.initializeConversation(conversationId || `conv-${Date.now()}`, {
          model: options.model,
          temperature: options.temperature,
          instructions: options.instructions,
          vectorStore: options.vectorStore,
        });
      }
      
      const params = this.buildRequestParams(options);
      const response = await this.openai.responses.create(params);
      return this.processResponse(response, conversationId);
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw new Error(`API call failed: ${error.message}`);
    }
  }
  
  /**
   * Resets a conversation, clearing its history
   */
  public resetConversation(conversationId: string): void {
    if (!conversationId) {
      throw new Error('conversationId is required');
    }
    this.conversationStorage.delete(conversationId);
  }
  
  /**
   * Checks if a conversation exists
   */
  public hasConversation(conversationId: string): boolean {
    return this.conversationStorage.has(conversationId);
  }
  
  /**
   * Gets the list of available vector stores
   */
  public getAvailableVectorStores(): string[] {
    return Object.keys(VECTOR_STORE_IDS);
  }
  
  /**
   * Gets the default configuration
   */
  public getDefaults() {
    return { ...DEFAULTS };
  }
}

// ================================================================================================
// EXPORTS
// ================================================================================================

// Export the singleton instance
export const openAIService = OpenAIService.getInstance();