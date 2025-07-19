/**
 * LEXICOLOGIA - Core Text Search and Processing Library
 * 
 * This module provides comprehensive text processing, search, and export functionalities
 * for lexical analysis and document processing.
 */

// ==================== TYPES ====================

export interface FileData {
  id: string;
  name: string;
  content: string;
  size: number;
  type: string;
}

export interface SearchResult {
  fileName: string;
  foundParagraphs: string[];
  totalParagraphs: number;
  occurrenceCount: number;
}

export interface DebugInfo {
  fileName: string;
  paragraphIndex: number;
  originalParagraph: string;
  processedParagraph: string;
  debugDetails: {
    fileName: string;
    paragraphIndex: number;
    originalParagraph: string;
    searchTerm: string;
    containsPipe: boolean;
    splitCount: number;
    sentences: string[];
    selectedSentences: string[];
    finalParagraph: string;
    splitInfo?: SplitInfo;
  };
}

interface SplitResult {
  paragraphs: string[];
  splitInfo: SplitInfo;
}

interface SplitInfo {
  originalLength: number;
  normalizedLength: number;
  hasCarriageReturns: boolean;
  hasWindowsLineEndings: boolean;
  doubleNewlineCount: number;
  singleNewlineCount: number;
  chosenMethod: string;
  splitMethods: Array<{
    name: string;
    paragraphCount: number;
    avgLength: number;
    sample: string[];
  }>;
}

// ==================== TEXT SPLITTING ====================

/**
 * Enhanced text splitting function that properly handles various text formats.
 * Based on analysis of actual markdown files, most content uses single newlines to separate paragraphs.
 */
const splitTextIntoParagraphs = (text: string): SplitResult => {
  // Normalize line endings first (convert all to \n)
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  const splitInfo: SplitInfo = {
    originalLength: text.length,
    normalizedLength: normalizedText.length,
    hasCarriageReturns: text.includes('\r'),
    hasWindowsLineEndings: text.includes('\r\n'),
    doubleNewlineCount: (normalizedText.match(/\n\n/g) || []).length,
    singleNewlineCount: (normalizedText.match(/\n/g) || []).length,
    splitMethods: [],
    chosenMethod: ''
  };

  // Try different splitting methods
  const methods = [
    {
      name: 'Single newline (\\n) - Standard',
      splitter: '\n',
      result: normalizedText.split('\n').filter(p => {
        const trimmed = p.trim();
        return trimmed.length > 0 && trimmed.length >= 3;
      })
    },
    {
      name: 'Double newline (\\n\\n) - Spaced paragraphs',
      splitter: '\n\n',
      result: normalizedText.split('\n\n').filter(p => p.trim().length > 0)
    },
    {
      name: 'Meaningful lines (length > 10)',
      splitter: '\n',
      result: normalizedText.split('\n').filter(p => {
        const trimmed = p.trim();
        return trimmed.length > 10 && 
               !trimmed.match(/^#+\s*$/) &&
               !trimmed.match(/^[-*+]\s*$/) &&
               !trimmed.match(/^\s*$/) &&
               !trimmed.match(/^```\s*$/) &&
               !trimmed.match(/^---+\s*$/);
      })
    },
    {
      name: 'Paragraph blocks (empty line separated)',
      splitter: /\n\s*\n/,
      result: normalizedText.split(/\n\s*\n/).filter(p => p.trim().length > 0)
    }
  ];

  splitInfo.splitMethods = methods.map(method => ({
    name: method.name,
    paragraphCount: method.result.length,
    avgLength: method.result.length > 0 ? 
      Math.round(method.result.reduce((sum, p) => sum + p.length, 0) / method.result.length) : 0,
    sample: method.result.slice(0, 3).map(p => p.substring(0, 100) + (p.length > 100 ? '...' : ''))
  }));

  // Choose the best method based on content analysis
  let chosenMethod = methods[0]; // Default to single newline
  const meaningfulLinesCount = methods[2].result.length;
  const singleNewlineCount = methods[0].result.length;
  const doubleNewlineCount = methods[1].result.length;
  const paragraphBlocksCount = methods[3].result.length;
  
  if (meaningfulLinesCount > 5 && meaningfulLinesCount < singleNewlineCount * 0.8) {
    chosenMethod = methods[2];
  } else if (singleNewlineCount > doubleNewlineCount && singleNewlineCount > 3) {
    chosenMethod = methods[0];
  } else if (doubleNewlineCount > 3) {
    chosenMethod = methods[1];
  } else if (paragraphBlocksCount > doubleNewlineCount) {
    chosenMethod = methods[3];
  }
  
  // Safety checks for extreme cases
  if (chosenMethod.result.length > 500) {
    if (doubleNewlineCount > 0 && doubleNewlineCount < chosenMethod.result.length / 5) {
      chosenMethod = methods[1];
    } else if (meaningfulLinesCount > 0 && meaningfulLinesCount < chosenMethod.result.length / 3) {
      chosenMethod = methods[2];
    }
  }
  
  if (chosenMethod.result.length < 5 && normalizedText.length > 1000) {
    if (singleNewlineCount > chosenMethod.result.length * 2) {
      chosenMethod = methods[0];
    }
  }

  splitInfo.chosenMethod = chosenMethod.name;
  
  return {
    paragraphs: chosenMethod.result,
    splitInfo
  };
};

// ==================== SEARCH FUNCTIONALITY ====================

/**
 * Processes a found paragraph to restructure it based on the presence of "|" characters and the search term.
 */
const processFoundParagraph = (
  paragraph: string, 
  searchTerm: string, 
  fileName: string, 
  paragraphIndex: number
): { processed: string; debug: any } => {
  const processedSearchTerm = searchTerm.trim().toLowerCase();
  
  const debugData = {
    fileName,
    paragraphIndex,
    originalParagraph: paragraph,
    searchTerm: processedSearchTerm,
    containsPipe: paragraph.includes('|'),
    splitCount: paragraph.split('|').length,
    sentences: [] as string[],
    selectedSentences: [] as string[],
    finalParagraph: ''
  };
  
  if (paragraph.includes('|') && paragraph.split('|').length >= 3) {
    const sentences = paragraph.split('|').map(s => s.trim());
    debugData.sentences = sentences;
    
    const finalParagraphParts = [sentences[0]];
    debugData.selectedSentences.push(`[BASE] ${sentences[0]}`);

    for (let i = 1; i < sentences.length; i++) {
      const sentence = sentences[i];
      const containsTerm = sentence.toLowerCase().includes(processedSearchTerm);
      
      if (containsTerm) {
        finalParagraphParts.push(sentence);
        debugData.selectedSentences.push(`[MATCH] ${sentence}`);
      } else {
        debugData.selectedSentences.push(`[SKIP] ${sentence}`);
      }
    }

    const result = finalParagraphParts.join(' ');
    debugData.finalParagraph = result;
    return { processed: result, debug: debugData };
  }
  
  debugData.finalParagraph = paragraph;
  return { processed: paragraph, debug: debugData };
};

/**
 * Performs a search across multiple files for the given search term.
 */
export const searchInFiles = (
  files: FileData[], 
  selectedFileIds: string[], 
  searchTerm: string
): { results: SearchResult[]; debugInfo: DebugInfo[] } => {
  if (!searchTerm.trim() || selectedFileIds.length === 0) {
    return { results: [], debugInfo: [] };
  }

  const results: SearchResult[] = [];
  const allDebugInfo: DebugInfo[] = [];
  const processedTerm = searchTerm.trim().toLowerCase();

  for (const fileId of selectedFileIds) {
    const file = files.find(f => f.id === fileId);
    if (!file) continue;

    const { paragraphs: allParagraphs } = splitTextIntoParagraphs(file.content);
    const foundParagraphs: string[] = [];
    let occurrenceCount = 0;
    const fileDebugInfo: DebugInfo[] = [];

    allParagraphs.forEach((paragraph, index) => {
      const lowerParagraph = paragraph.toLowerCase();
      if (lowerParagraph.includes(processedTerm)) {
        occurrenceCount += (lowerParagraph.match(new RegExp(processedTerm, 'g')) || []).length;
        
        const { processed, debug } = processFoundParagraph(
          paragraph,
          searchTerm,
          file.name,
          index
        );
        
        foundParagraphs.push(processed);
        fileDebugInfo.push({
          fileName: file.name,
          paragraphIndex: index,
          originalParagraph: paragraph,
          processedParagraph: processed,
          debugDetails: debug
        });
      }
    });

    if (foundParagraphs.length > 0) {
      results.push({
        fileName: file.name,
        foundParagraphs,
        totalParagraphs: allParagraphs.length,
        occurrenceCount
      });
      allDebugInfo.push(...fileDebugInfo);
    }
  }

  return { results, debugInfo: allDebugInfo };
};

// ==================== EXPORT FUNCTIONALITY ====================

interface MarkdownElement {
  type: 'text' | 'bold' | 'italic' | 'code' | 'header';
  content: string;
  level?: number;
}

// Interface para segmentos de texto com formatação e destaque
interface ParsedMarkdownSegment {
  text: string;
  isBold: boolean;
  isItalic: boolean;
  isCode: boolean;
  isStrikethrough: boolean;
  isHighlighted: boolean;
}

/**
 * Divide uma string de texto em segmentos baseados na sintaxe Markdown
 */
const splitByMarkdown = (text: string): ParsedMarkdownSegment[] => {
  const segments: ParsedMarkdownSegment[] = [];
  
  // Regex para capturar formatação Markdown
  const markdownRegex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|~~.*?~~)/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = markdownRegex.exec(text)) !== null) {
    // Adiciona texto antes da formatação
    if (match.index > lastIndex) {
      const plainText = text.substring(lastIndex, match.index);
      if (plainText) {
        segments.push({
          text: plainText,
          isBold: false,
          isItalic: false,
          isCode: false,
          isStrikethrough: false,
          isHighlighted: false
        });
      }
    }
    
    const matchedText = match[0];
    let cleanText = matchedText;
    let isBold = false;
    let isItalic = false;
    let isCode = false;
    let isStrikethrough = false;
    
    // Identifica o tipo de formatação e remove a sintaxe
    if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
      isBold = true;
      cleanText = matchedText.slice(2, -2);
    } else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
      isItalic = true;
      cleanText = matchedText.slice(1, -1);
    } else if (matchedText.startsWith('`') && matchedText.endsWith('`')) {
      isCode = true;
      cleanText = matchedText.slice(1, -1);
    } else if (matchedText.startsWith('~~') && matchedText.endsWith('~~')) {
      isStrikethrough = true;
      cleanText = matchedText.slice(2, -2);
    }
    
    segments.push({
      text: cleanText,
      isBold,
      isItalic,
      isCode,
      isStrikethrough,
      isHighlighted: false
    });
    
    lastIndex = match.index + matchedText.length;
  }
  
  // Adiciona texto restante
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      segments.push({
        text: remainingText,
        isBold: false,
        isItalic: false,
        isCode: false,
        isStrikethrough: false,
        isHighlighted: false
      });
    }
  }
  
  return segments;
};

/**
 * Aplica destaque do termo de busca aos segmentos
 */
const applyHighlightToSegments = (segments: ParsedMarkdownSegment[], searchTerm: string): ParsedMarkdownSegment[] => {
  if (!searchTerm.trim()) return segments;
  
  const processedTerm = searchTerm.trim().toLowerCase();
  const result: ParsedMarkdownSegment[] = [];
  
  segments.forEach(segment => {
    const lowerText = segment.text.toLowerCase();
    if (lowerText.includes(processedTerm)) {
      // Divide o texto em partes destacadas e não destacadas
      const regex = new RegExp(`(${processedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = segment.text.split(regex);
      
      parts.forEach(part => {
        if (part) {
          const isHighlighted = part.toLowerCase() === processedTerm;
          result.push({
            ...segment,
            text: part,
            isHighlighted
          });
        }
      });
    } else {
      result.push(segment);
    }
  });
  
  return result;
};

/**
 * Obtém segmentos de texto formatados e com destaque
 */
const getFormattedTextSegments = (text: string, searchTerm: string): ParsedMarkdownSegment[] => {
  const markdownSegments = splitByMarkdown(text);
  return applyHighlightToSegments(markdownSegments, searchTerm);
};

/**
 * Remove sintaxe Markdown de uma string (para PDF)
 */
const removeMarkdownSyntax = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove negrito
    .replace(/\*(.*?)\*/g, '$1') // Remove itálico
    .replace(/`(.*?)`/g, '$1') // Remove código
    .replace(/~~(.*?)~~/g, '$1'); // Remove riscado
};

/**
 * Exports search results to a DOCX file.
 */
export const exportToDocx = async (results: SearchResult[], searchTerm: string): Promise<void> => {
  try {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
    const { saveAs } = await import('file-saver');

    // Contador global de parágrafos para numeração sequencial
    let paragraphCounter = 0;

    const children = [
      new Paragraph({
        text: `Search Results for "${searchTerm}"`,
        heading: HeadingLevel.TITLE,
        spacing: { after: 400 }
      }),
      new Paragraph({
        text: `Generated on: ${new Date().toLocaleDateString()}`,
        spacing: { after: 600 }
      })
    ];

    // Add results for each file
    results.forEach((result) => {
      children.push(
        new Paragraph({
          text: `File: ${result.fileName}`,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
          text: `Found ${result.foundParagraphs.length} paragraphs with ${result.occurrenceCount} occurrences`,
          spacing: { after: 200 }
        })
      );

      result.foundParagraphs.forEach((paragraph) => {
        // Incrementa contador global - COMENTÁRIO: Esta numeração pode ser removida no futuro se necessário
        paragraphCounter++;
        const numberPrefix = paragraphCounter.toString().padStart(2, '0') + '. ';
        
        // Obtém segmentos formatados com destaque
        const segments = getFormattedTextSegments(paragraph, searchTerm);
        
        // Cria TextRuns para cada segmento
        const textRuns: TextRun[] = [
          new TextRun({
            text: numberPrefix,
            bold: true
          })
        ];
        
        segments.forEach(segment => {
          textRuns.push(new TextRun({
            text: segment.text,
            bold: segment.isBold,
            italics: segment.isItalic,
            strike: segment.isStrikethrough,
            highlight: segment.isHighlighted ? 'yellow' : undefined,
            font: segment.isCode ? 'Courier New' : undefined
          }));
        });
        
        children.push(
          new Paragraph({
            children: textRuns,
            spacing: { after: 200 }
          })
        );
      });
    });

    // Adiciona linha horizontal de separação ao final
    children.push(
      new Paragraph({
        text: '',
        spacing: { before: 400 },
        border: {
          bottom: {
            color: '000000',
            space: 1,
            style: 'single',
            size: 6
          }
        }
      })
    );

    const doc = new Document({
      sections: [{
        properties: {},
        children
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `search_results_${searchTerm.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.docx`);
  } catch (error) {
    console.error('Error exporting to DOCX:', error);
    throw error;
  }
};

/**
 * Exports search results to a PDF file.
 */
export const exportToPdf = async (results: SearchResult[], searchTerm: string): Promise<void> => {
  // PDF export functionality has been removed
  throw new Error('PDF export functionality has been removed. Please use DOCX export instead.');
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Counts the number of paragraphs in the given text.
 */
export const countParagraphs = (text: string): number => {
  const { paragraphs } = splitTextIntoParagraphs(text);
  return paragraphs.length;
};

/**
 * Creates a new FileData object from a File object.
 */
export const createFileData = async (file: File): Promise<FileData> => {
  const content = await file.text();
  return {
    id: crypto.randomUUID(),
    name: file.name,
    content,
    size: file.size,
    type: file.type || 'text/plain'
  };
};

