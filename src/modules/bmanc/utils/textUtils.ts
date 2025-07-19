/**
 * TEXT UTILITIES - Funções utilitárias para manipulação de texto
 */

/**
 * CLEAN TEXT - Remove caracteres especiais e normaliza o texto
 * @param {string} text - Texto a ser limpo
 * @returns {string} - Texto limpo e normalizado
 */
export const cleanText = (text: string): string => {
  if (!text) return '';
  
  return text
    .trim() // Remove espaços no início e fim
    .replace(/\s+/g, ' ') // Substitui múltiplos espaços por um único espaço
    .replace(/[\r\n]+/g, ' ') // Remove quebras de linha
    .replace(/[""]/g, '"') // Normaliza aspas
    .replace(/['']/g, "'") // Normaliza apostrofes
    .replace(/…/g, '...') // Normaliza reticências
    .replace(/–/g, '-') // Normaliza traços
    .replace(/—/g, '-'); // Normaliza traços longos
};

/**
 * EXTRACT PARAGRAPHS - Extrai parágrafos válidos de um texto
 * @param {string} text - Texto completo
 * @param {number} minLength - Comprimento mínimo do parágrafo (padrão: 50)
 * @returns {string[]} - Array de parágrafos válidos
 */
const extractParagraphs = (text: string, minLength: number = 50): string[] => {
  if (!text) return [];
  
  return text
    .split(/\n\s*\n/) // Divide por parágrafos (dupla quebra de linha)
    .map(paragraph => cleanText(paragraph))
    .filter(paragraph => paragraph.length >= minLength)
    .filter(paragraph => !paragraph.startsWith('#')) // Remove cabeçalhos markdown
    .filter(paragraph => !paragraph.startsWith('---')); // Remove separadores markdown
};

/**
 * TRUNCATE TEXT - Trunca texto mantendo palavras completas
 * @param {string} text - Texto a ser truncado
 * @param {number} maxLength - Comprimento máximo
 * @param {string} suffix - Sufixo a ser adicionado (padrão: '...')
 * @returns {string} - Texto truncado
 */
const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (!text || text.length <= maxLength) return text;
  
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + suffix;
  }
  
  return truncated + suffix;
};

/**
 * REMOVE MARKDOWN - Remove formatação markdown básica
 * @param {string} text - Texto com markdown
 * @returns {string} - Texto sem markdown
 */
const removeMarkdown = (text: string): string => {
  if (!text) return '';
  
  return text
    .replace(/#{1,6}\s+/g, '') // Remove cabeçalhos
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove negrito
    .replace(/\*(.*?)\*/g, '$1') // Remove itálico
    .replace(/`(.*?)`/g, '$1') // Remove código inline
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, mantém texto
    .replace(/^\s*[-*+]\s+/gm, '') // Remove listas
    .replace(/^\s*\d+\.\s+/gm, '') // Remove listas numeradas
    .replace(/^\s*>\s+/gm, '') // Remove citações
    .replace(/---+/g, '') // Remove separadores
    .replace(/\n\s*\n/g, '\n'); // Remove linhas vazias extras
};