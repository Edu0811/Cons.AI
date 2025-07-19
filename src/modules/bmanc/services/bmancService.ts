/**
 * BMANC SERVICE - Serviços modulares para funcionalidades da Bibliomancia Digital
 * Este arquivo centraliza todas as funções especiais do sistema BManc
 */

import { openAIRAGService, OpenAIRAGRequest } from "@/services/openai-rag";
import { cleanText } from "../utils/textUtils";

/*--------------------------------------------------------------------------------------------*/
/*
 * GET RANDOM PARAGRAPH FROM MARKDOWN FILE - Lê arquivo markdown e retorna parágrafo aleatório
 * @param {string} filename - Nome do arquivo markdown (ex: 'LO.md')
 * @returns {Promise<Object>} - Objeto contendo paragraph (string) e number (integer)
 */
const getRandomParagraph = async (filename: string) => {
  try {
    // CONSTRUCT FILE PATH - Monta o caminho para o arquivo na pasta data
    const filePath = `/data/${filename}`;
    
    // FETCH FILE CONTENT - Busca o conteúdo do arquivo
    const response = await fetch(filePath);
    
    if (!response.ok) {
      throw new Error(`Failed to load file: ${filename}`);
    }
    
    const content = await response.text();
    
    // SPLIT BY LINE BREAKS - Divide o conteúdo por quebras de linha simples (\n)
    const sections = content.split(/\n/);
    
    // EXTRACT PARAGRAPHS - Extrai parágrafos válidos
    const paragraphs = sections
      .map(section => section.trim()) // Remove espaços em branco
      .filter(section => section.length > 0); // Remove seções vazias
    
    // CALCULATE TOTAL PARAGRAPHS - Calcula o número total de parágrafos
    const totalParagraphs = paragraphs.length;
    
    if (totalParagraphs === 0) {
      throw new Error(`No valid paragraphs found in file: ${filename}`);
    }
    
    // GENERATE RANDOM NUMBER - Gera número aleatório dentro do range
    const randomIndex = Math.floor(Math.random() * totalParagraphs);
    const paragraphNumber = randomIndex + 1; // Número baseado em 1, não 0
    
    // REMOVE LEADING NUMBER, DOT, AND SPACE (e.g., '1. ') FROM PARAGRAPH
    let rawParagraph = paragraphs[randomIndex];
    rawParagraph = rawParagraph.replace(/^\d+\.\s*/, '');
    const selectedParagraph = cleanText(rawParagraph);
    
    return {
      paragraph: selectedParagraph,
      number: paragraphNumber,
      totalParagraphs: totalParagraphs,
      filename: filename
    };
    
  } catch (error) {
    console.error('Error reading markdown file:', error);
    
    // FALLBACK PARAGRAPH - Retorna parágrafo de fallback em caso de erro
    return {
      paragraph: "A consciência é a base de toda evolução pessoal e coletiva.",
      number: 1,
      totalParagraphs: 1,
      filename: filename,
      error: (error as Error).message
    };
  }
};

/*--------------------------------------------------------------------------------------------*/
/**
 * BIBLIOMANCIA DIGITAL ROUTINE - Executa a rotina da Bibliomancia Digital
 * @param {Object} params - Parâmetros da função
 * @param {string} params.conversationId - ID da conversa atual
 * @param {string} params.selectedVectorStore - Vector store selecionado pelo usuário
 * @param {Object} [params.parameters] - Parâmetros do sistema (temperature, topK, model)
 * @param {Function} [params.onDebugUpdate] - Callback para debug updates
 * @param {Function} [params.onStart] - Callback executado no início
 * @param {Function} [params.onComplete] - Callback executado ao completar
 * @param {Function} [params.onError] - Callback executado em caso de erro
 * @param {Function} [params.onMessageUpdate] - Callback para enviar mensagens intermediárias
 * @param {Function} [params.onClearMessages] - Callback para limpar mensagens
 * @returns {Promise<string>} - Resposta da Bibliomancia Digital
 */
export const manciaRoutine = async ({
  conversationId,
  selectedVectorStore,
  parameters = { temperature: 0.2, topK: 20, model: 'gpt-4.1-nano-2025-04-14' },
  onDebugUpdate = null,
  onStart = null,
  onComplete = null,
  onError = null,
  onMessageUpdate = null,
  onClearMessages = null
}: {
  conversationId: string;
  selectedVectorStore: string;
  parameters?: { temperature?: number; topK?: number; model?: string };
  onDebugUpdate?: ((debug: any) => void) | null;
  onStart?: (() => void) | null;
  onComplete?: ((response: string) => void) | null;
  onError?: ((error: Error) => void) | null;
  onMessageUpdate?: ((message: any) => void) | null;
  onClearMessages?: (() => void) | null;
}): Promise<string> => {
  try {
    if (onClearMessages) onClearMessages(); // limpa a tela de mensagens
    if (onStart) onStart();

    // GET RANDOM PARAGRAPH FROM LO.md FILE - Busca parágrafo aleatório do arquivo LO.md
    const { paragraph, number, totalParagraphs, filename, error } = await getRandomParagraph('LO.md');
    
    if (error) {
      console.warn(`Warning loading ${filename}: ${error}`);
    }

    // SELECTION MESSAGE - Mensagem de seleção com informações da pensata
    const selectionMessage = `🔮 **Pensata Selecionada:**\n\n${paragraph}\n&nbsp;\n\n*Analisando a pensata...*`;
    
    // SEND PENSATA MESSAGE FIRST - Envia a mensagem da pensata antes da chamada à IA
    if (onMessageUpdate) {
      onMessageUpdate({
        type: 'pensata',
        content: selectionMessage,
        timestamp: new Date().toISOString()
      });
    }

    // Initialize conversation if needed
    if (!openAIRAGService.isConversationInitialized(conversationId)) {
      await openAIRAGService.initializeConversation(conversationId, {
        vectorStore: 'ALLWV',
        instructions: 'Você é um especialista em Conscienciologia. Analise e interprete pensatas de forma breve, objetiva e profunda.',
        model: parameters.model,
        temperature: parameters.temperature,
        maxTokens: 2000,
        topK: parameters.topK
      });
    }

    // CONSTRUCT AI MESSAGE - Monta a mensagem para a IA
    const aiMessage = `Analise e interprete a seguinte pensata, de maneira breve e objetiva, porém profunda, no contexto da Conscienciologia:

${paragraph}`;

    // CALL OPENAI WITH ALLWV VECTOR STORE - Chama OpenAI sempre com vector store ALLWV
    const request: OpenAIRAGRequest = {
      message: aiMessage,
      vectorStore: 'ALLWV', // SEMPRE usa ALLWV para Bibliomancia Digital
      conversationId: conversationId,
      temperature: parameters.temperature || 0.2,
      maxTokens: 2000,
      model: parameters.model || 'gpt-4.1-nano-2025-04-14',
      topK: parameters.topK || 20,
      instructions: 'Você é um especialista em Conscienciologia. Analise e interprete pensatas de forma breve, objetiva e profunda.'
    };

    const aiResponse = await openAIRAGService.OpenAI_Call(request);

    if (onComplete) onComplete(aiResponse.content);
    return aiResponse.content;
  } catch (error) {
    console.error('Bibliomancia Digital Error:', error);
    if (onError) onError(error as Error);
    throw new Error('Falha ao executar Bibliomancia Digital');
  }
};

/*--------------------------------------------------------------------------------------------*/

/**
 * TEMPLATE PARA FUTURAS FUNÇÕES - Estrutura padrão para novas funcionalidades
 * @param {Object} params - Parâmetros da função
 * @returns {Promise<string>} - Resposta da função
 */
const templateFunction = async ({
  conversationId,
  selectedVectorStore = 'ALLWV',
  parameters = { temperature: 0.2, topK: 20, model: 'gpt-4.1-nano-2025-04-14' },
  message = 'Mensagem padrão',
  onDebugUpdate = null,
  onStart = null,
  onComplete = null,
  onError = null
}: {
  conversationId: string;
  selectedVectorStore?: string;
  parameters?: { temperature?: number; topK?: number; model?: string };
  message?: string;
  onDebugUpdate?: ((debug: any) => void) | null;
  onStart?: (() => void) | null;
  onComplete?: ((response: string) => void) | null;
  onError?: ((error: Error) => void) | null;
}): Promise<string> => {
  try {
    if (onStart) onStart();

    // Initialize conversation if needed
    if (!openAIRAGService.isConversationInitialized(conversationId)) {
      await openAIRAGService.initializeConversation(conversationId, {
        vectorStore: selectedVectorStore,
        model: parameters.model,
        temperature: parameters.temperature,
        maxTokens: 2000,
        topK: parameters.topK
      });
    }

    const request: OpenAIRAGRequest = {
      message: message,
      vectorStore: selectedVectorStore,
      conversationId: conversationId,
      temperature: parameters.temperature || 0.2,
      maxTokens: 2000,
      model: parameters.model || 'gpt-4.1-nano-2025-04-14',
      topK: parameters.topK || 20
    };

    const response = await openAIRAGService.OpenAI_Call(request);

    if (onComplete) onComplete(response.content);
    return response.content;
  } catch (error) {
    console.error('Template Function Error:', error);
    if (onError) onError(error as Error);
    throw error;
  }
};

/**
 * GET AVAILABLE FUNCTIONS - Retorna lista de funções disponíveis
 * @returns {Array} - Lista de funções com metadados
 */
const getAvailableFunctions = () => {
  return [
    {
      id: 'bibliomancia',
      name: 'Bibliomancia Digital',
      description: 'Executa consulta matinal da Bibliomancia Digital',
      function: manciaRoutine,
      icon: '🔮',
      color: '#8b5cf6'
    }
    // Futuras funções serão adicionadas aqui
  ];
};