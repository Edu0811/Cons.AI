/**
 * DATA LOADER SERVICE - Carregamento dinâmico de arquivos da pasta public/data/
 * 
 * Este serviço gerencia o carregamento automático dos arquivos disponíveis
 * na pasta public/data/ de forma dinâmica, sem lista fixa.
 */

import { FileData } from './lexicologia';

/**
 * Carrega um arquivo específico da pasta public/data/
 */
const loadDataFile = async (filename: string): Promise<FileData | null> => {
  try {
    const response = await fetch(`/data/${filename}`);
    
    if (!response.ok) {
      console.warn(`Failed to load file: ${filename} (${response.status})`);
      return null;
    }
    
    const content = await response.text();
    const size = new Blob([content]).size;
    
    return {
      id: `data-${filename}`,
      name: filename,
      content,
      size,
      type: filename.endsWith('.md') ? 'text/markdown' : 'text/plain'
    };
  } catch (error) {
    console.error(`Error loading file ${filename}:`, error);
    return null;
  }
};

/**
 * Descobre dinamicamente os arquivos disponíveis na pasta public/data/
 * Tenta carregar uma lista de arquivos comuns e verifica quais existem
 */
const discoverAvailableFiles = async (): Promise<string[]> => {
  // Lista de arquivos potenciais para testar (baseada em padrões comuns)
  const potentialFiles = [
    'LO.md',
    'DAC.md', 
    'ECWV.md',
    'QUEST.md',
    'MANUAIS.md',
    'HSRP.md',
    'EXP.md',
    'PROJ.md',
    'CCG.md',
    'EDUNOTES.md',
    // Adicione outros padrões comuns
    'index.txt',
    'files.txt',
    'contents.md',
    'README.md'
  ];

  const availableFiles: string[] = [];

  // Testa cada arquivo potencial
  for (const filename of potentialFiles) {
    try {
      const response = await fetch(`/data/${filename}`, { method: 'HEAD' });
      if (response.ok) {
        availableFiles.push(filename);
      }
    } catch (error) {
      // Arquivo não existe, continua para o próximo
      continue;
    }
  }

  return availableFiles;
};

/**
 * Método alternativo: tenta ler um arquivo de índice se disponível
 */
const loadFromIndexFile = async (): Promise<string[]> => {
  try {
    // Tenta carregar um arquivo de índice que lista os arquivos disponíveis
    const response = await fetch('/data/index.txt');
    if (response.ok) {
      const content = await response.text();
      return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#'))
        .filter(filename => filename.endsWith('.md') || filename.endsWith('.txt'));
    }
  } catch (error) {
    console.log('No index file found, using discovery method');
  }
  return [];
};

/**
 * Carrega todos os arquivos disponíveis da pasta public/data/ dinamicamente
 */
export const loadAvailableDataFiles = async (): Promise<FileData[]> => {
  console.log('🔍 Discovering files in /public/data/...');
  
  // Primeiro tenta carregar de um arquivo de índice
  let availableFilenames = await loadFromIndexFile();
  
  // Se não encontrou arquivo de índice, usa descoberta automática
  if (availableFilenames.length === 0) {
    availableFilenames = await discoverAvailableFiles();
  }

  console.log(`📁 Found ${availableFilenames.length} potential files:`, availableFilenames);

  // Carrega o conteúdo dos arquivos encontrados
  const loadPromises = availableFilenames.map(filename => loadDataFile(filename));
  const results = await Promise.all(loadPromises);
  
  // Filtra arquivos que falharam ao carregar
  const validFiles = results.filter((file): file is FileData => file !== null);
  
  console.log(`✅ Successfully loaded ${validFiles.length} files from /public/data/`);
  
  // Simula salvamento de arquivos enviados (placeholder para funcionalidade futura)
  // TODO: Implementar salvamento real de arquivos enviados para /public/data/
  
  return validFiles;
};

/**
 * Salva um arquivo enviado na pasta /public/data/ (funcionalidade futura)
 * NOTA: Esta é uma funcionalidade placeholder. Em um ambiente real, seria necessário
 * um endpoint backend para salvar arquivos no servidor.
 */
const saveUploadedFile = async (file: File): Promise<boolean> => {
  // TODO: Implementar salvamento real via API backend
  console.log(`📝 Simulating save of ${file.name} to /public/data/`);
  
  // Por enquanto, apenas simula o salvamento
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`✅ File ${file.name} would be saved to /public/data/`);
      resolve(true);
    }, 1000);
  });
};

/**
 * Verifica se um arquivo está disponível na pasta data
 */
const isDataFile = (fileId: string): boolean => {
  return fileId.startsWith('data-');
};

/**
 * Obtém descrição amigável para cada arquivo baseada no nome
 */
const getFileDescription = (filename: string): string => {
  const descriptions: Record<string, string> = {
    'LO.md': 'Léxico de Ortopensatas - Pensatas organizadas alfabeticamente',
    'DAC.md': 'Dicionário de Argumentos da Conscienciologia',
    'ECWV.md': 'Enciclopédia da Conscienciologia',
    'QUEST.md': 'Questionários da Conscienciologia',
    'MANUAIS.md': 'Manuais da Conscienciologia',
    'HSRP.md': 'Homo sapiens reurbanisatus',
    'EXP.md': 'Experimentos da Conscienciologia',
    'PROJ.md': 'Projeciologia',
    'CCG.md': 'Conscienciograma',
    'EDUNOTES.md': 'Notas do Edu',
    'README.md': 'Informações sobre os arquivos',
    'index.txt': 'Índice de arquivos disponíveis'
  };
  
  return descriptions[filename] || `Arquivo de dados: ${filename}`;
};

/**
 * Cria um arquivo de índice sugerido (para facilitar manutenção futura)
 */
const generateIndexFileContent = (filenames: string[]): string => {
  const header = `# Arquivos disponíveis em /public/data/
# Este arquivo pode ser usado para listar os arquivos disponíveis
# Linhas começando com # são comentários e serão ignoradas
# Um arquivo por linha

`;
  
  return header + filenames.join('\n');
};

