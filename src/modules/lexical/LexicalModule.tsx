import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  FileText, 
  Upload, 
  Download, 
  Settings,
  Loader2,
  BookOpen,
  File,
  RefreshCw,
  ArrowLeft
} from "lucide-react";
import { ModuleProps } from "../shared/types";
import { FileConfigurationTab } from "./components/FileConfigurationTab";
import { SearchResultsDisplay } from "./components/SearchResultsDisplay";
import { loadAvailableDataFiles } from "./services/dataLoader";
import { 
  FileData, 
  SearchResult, 
  DebugInfo,
  searchInFiles,
  createFileData
} from "./services/lexicologia";

export function LexicalModule({ onBack }: ModuleProps) {
  // Estados principais
  const [searchTerm, setSearchTerm] = useState("");
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [debugInfo, setDebugInfo] = useState<DebugInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingDataFiles, setIsLoadingDataFiles] = useState(false);
  
  // Estados para nova interface
  const [showConfiguration, setShowConfiguration] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileData[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Carrega arquivos da pasta public/data/ na inicialização
  useEffect(() => {
    loadDataFiles();
  }, []);

  // Atualiza selectedFiles quando selectedFileIds muda
  useEffect(() => {
    const selected = files.filter(file => selectedFileIds.includes(file.id));
    setSelectedFiles(selected);
  }, [files, selectedFileIds]);

  // Função para carregar arquivos de dados
  const loadDataFiles = async () => {
    setIsLoadingDataFiles(true);
    try {
      console.log('🔄 Starting dynamic file discovery...');
      const dataFiles = await loadAvailableDataFiles();
      console.log(`📊 Discovered ${dataFiles.length} files:`, dataFiles.map(f => f.name));
      
      setFiles(prev => {
        // Remove arquivos de dados existentes e adiciona os novos
        const uploadedFiles = prev.filter(f => !f.id.startsWith('data-'));
        return [...dataFiles, ...uploadedFiles];
      });
      
      // Auto-seleciona LO.md como padrão, ou todos se LO.md não existir
      const loFile = dataFiles.find(f => f.name === 'LO.md');
      if (loFile) {
        setSelectedFileIds([loFile.id]);
      } else {
        // Se LO.md não existir, seleciona todos os arquivos de dados
        const dataFileIds = dataFiles.map(f => f.id);
        setSelectedFileIds(dataFileIds);
      }
      
      toast({
        title: "Arquivos carregados",
        description: dataFiles.length > 0 
          ? `${dataFiles.length} arquivo(s) descobertos em /public/data/`
          : "Nenhum arquivo encontrado em /public/data/. Verifique se existem arquivos .md ou .txt na pasta.",
      });
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Falha ao descobrir arquivos em /public/data/. Verifique se a pasta existe e contém arquivos.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingDataFiles(false);
    }
  };

  // Handlers para upload de arquivos
  const handleFileUpload = async (uploadedFiles: FileList) => {
    try {
      const newFiles: FileData[] = [];
      
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        
        // Validar tipo de arquivo
        if (!file.type.includes('text') && !file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
          toast({
            title: "Arquivo não suportado",
            description: `${file.name} não é um arquivo de texto válido.`,
            variant: "destructive"
          });
          continue;
        }
        
        const fileData = await createFileData(file);
        newFiles.push(fileData);
      }
      
      setFiles(prev => [...prev, ...newFiles]);
      
      // Auto-seleciona os novos arquivos
      const newFileIds = newFiles.map(f => f.id);
      setSelectedFileIds(prev => [...prev, ...newFileIds]);
      
      toast({
        title: "Arquivos carregados",
        description: `${newFiles.length} arquivo(s) adicionado(s) com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Falha ao processar os arquivos.",
        variant: "destructive"
      });
    }
  };

  // Handler para busca
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Termo de busca necessário",
        description: "Digite um termo para pesquisar.",
        variant: "destructive"
      });
      return;
    }

    if (selectedFileIds.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Configure os arquivos para pesquisar.",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    
    try {
      const { results, debugInfo: debug } = searchInFiles(files, selectedFileIds, searchTerm);
      setSearchResults(results);
      setDebugInfo(debug);
      
      const totalOccurrences = results.reduce((sum, result) => sum + result.occurrenceCount, 0);
      
      toast({
        title: "Busca concluída",
        description: `${totalOccurrences} ocorrência(s) encontrada(s) em ${results.length} arquivo(s).`,
      });
    } catch (error) {
      toast({
        title: "Erro na busca",
        description: "Falha ao executar a pesquisa.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handlers para exportação
  const handleExportDocx = async () => {
    if (searchResults.length === 0) return;
    
    setIsExporting(true);
    try {
      const { exportToDocx } = await import('./services/lexicologia');
      await exportToDocx(searchResults, searchTerm);
      toast({
        title: "Exportação concluída",
        description: "Arquivo DOCX baixado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Falha ao gerar arquivo DOCX.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };


  // Handler para configuração de arquivos
  const handleFileConfiguration = (fileIds: string[]) => {
    setSelectedFileIds(fileIds);
    
    const selectedCount = fileIds.length;
    toast({
      title: "Seleção atualizada",
      description: `${selectedCount} arquivo(s) selecionado(s) para busca.`,
    });
  };

  // Handler para remoção de arquivos
  const handleRemoveFile = (fileId: string) => {
    // Não permite remover arquivos de dados (apenas uploaded files)
    if (fileId.startsWith('data-')) {
      toast({
        title: "Ação não permitida",
        description: "Arquivos da base de dados não podem ser removidos.",
        variant: "destructive"
      });
      return;
    }
    
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setSelectedFileIds(prev => prev.filter(id => id !== fileId));
    
    toast({
      title: "Arquivo removido",
      description: "Arquivo removido com sucesso.",
    });
  };

  // Renderizar estatísticas
  const renderStats = () => {
    if (searchResults.length === 0) return null;
    
    const totalOccurrences = searchResults.reduce((sum, result) => sum + result.occurrenceCount, 0);
    const totalParagraphs = searchResults.reduce((sum, result) => sum + result.foundParagraphs.length, 0);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        
        <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{totalParagraphs}</div>
          <div className="text-sm text-muted-foreground">Parágrafos</div>
        </CardContent>

        </Card>          
        <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-500">{totalOccurrences}</div>
          <div className="text-sm text-muted-foreground">Ocorrências</div>
        </CardContent>
            
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">{searchResults.length}</div>
            <div className="text-sm text-muted-foreground">Arquivos</div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Se está na tela de configuração, renderiza o componente de configuração
  if (showConfiguration) {
    return (
      <FileConfigurationTab
        files={files}
        selectedFileIds={selectedFileIds}
        onConfigurationChange={handleFileConfiguration}
        onBack={() => setShowConfiguration(false)}
        onFileUpload={handleFileUpload}
        onRemoveFile={handleRemoveFile}
        onReloadFiles={loadDataFiles}
        isLoadingDataFiles={isLoadingDataFiles}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={onBack}>
                ← Back
              </Button>
              <div className="flex items-center space-x-2">
                <Search className="h-6 w-6 text-primary " />
                <CardTitle>Lexical Search</CardTitle>
                <Badge variant="secondary" className="bg-green-500 text-white">
                  <FileText className="h-3 w-3 mr-1" />
                  Text Analysis
                </Badge>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground">
            Sistema de busca léxica (literal). Escolha os livros desejados e realize buscas precisas.
          </p>
        </CardHeader>
      </Card>

      {/* Enhanced Search Box */}
      <Card className="shadow-elegant border-primary/20 bg-gradient-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <Search className="h-5 w-5 mr-2 text-primary" />
              Busca Lexical
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfiguration(true)}
              className="flex items-center"
            >
              <Settings className="h-4 w-4 mr-2" />
              Selecionar Livros
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Termo de Busca</label>
            <div className="flex gap-2">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite o termo que deseja pesquisar..."
                className="flex-1 bg-white"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                disabled={selectedFileIds.length === 0}
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchTerm.trim() || selectedFileIds.length === 0}
                className="px-6"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                {isSearching ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          </div>

          {/* Selected Files Display */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Livros Selecionados para Busca</label>
            {selectedFiles.length === 0 ? (
              <div className="text-sm text-muted-foreground italic">
                Nenhum livro selecionado. Clique em "Selecionar Livros" para escolher e selecionar.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file) => (
                  <Badge key={file.id} variant="outline" className="bg-primary/10 text-primary">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {file.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Export Buttons - Only visible after search */}
          {searchResults.length > 0 && (
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                onClick={handleExportDocx}
                disabled={isExporting}
                size="sm"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Exportar DOCX
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      {renderStats()}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card className="shadow-card max-h-[70vh] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Resultados para "{searchTerm}"
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <SearchResultsDisplay 
                results={searchResults}
                searchTerm={searchTerm}
              />
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
    </div>
  );
}