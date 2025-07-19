import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  FileText, 
  Upload, 
  CheckSquare, 
  Square,
  Trash2,
  Database,
  RefreshCw,
  Loader2,
  Settings,
  Save
} from "lucide-react";
import { FileData, countParagraphs } from "../services/lexicologia";

interface FileConfigurationTabProps {
  files: FileData[];
  selectedFileIds: string[];
  onConfigurationChange: (fileIds: string[]) => void;
  onBack: () => void;
  onFileUpload: (files: FileList) => void;
  onRemoveFile: (fileId: string) => void;
  onReloadFiles: () => void;
  isLoadingDataFiles: boolean;
}

export function FileConfigurationTab({
  files,
  selectedFileIds,
  onConfigurationChange,
  onBack,
  onFileUpload,
  onRemoveFile,
  onReloadFiles,
  isLoadingDataFiles
}: FileConfigurationTabProps) {
  const [localSelection, setLocalSelection] = useState<string[]>(selectedFileIds);
  const { toast } = useToast();

  // Handler para seleção individual
  const handleFileToggle = (fileId: string) => {
    const newSelection = localSelection.includes(fileId) 
      ? localSelection.filter(id => id !== fileId)
      : [...localSelection, fileId];
    
    setLocalSelection(newSelection);
    onConfigurationChange(newSelection);
  };

  // Handler para selecionar todos
  const handleSelectAll = () => {
    const allFileIds = files.map(f => f.id);
    setLocalSelection(allFileIds);
    onConfigurationChange(allFileIds);
  };

  // Handler para desselecionar todos
  const handleDeselectAll = () => {
    setLocalSelection([]);
    onConfigurationChange([]);
  };

  // Handler para upload de arquivos
  const handleFileUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.txt,.md,text/*';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        onFileUpload(files);
      }
    };
    input.click();
  };

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Separar arquivos por tipo
  const dataFiles = files.filter(f => f.id.startsWith('data-'));
  const uploadedFiles = files.filter(f => !f.id.startsWith('data-'));

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar à Busca
              </Button>
              <div className="flex items-center space-x-2">
                <Settings className="h-6 w-6 text-primary" />
                <CardTitle>Seleção de Livros</CardTitle>
                <Badge variant="outline">
                  {localSelection.length} de {files.length} selecionados
                </Badge>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground">
            Selecione os livros que deseja incluir na busca.
          </p>
        </CardHeader>
      </Card>

      {/* File List */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="space-y-4">
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Lista de Arquivos
            </CardTitle>
            
            {/* Selection Controls */}
            <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
              <div className="flex gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={localSelection.length === files.length}
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Selecionar Todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                  disabled={localSelection.length === 0}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Desselecionar Todos
                </Button>

{/*
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReloadFiles}
                  disabled={isLoadingDataFiles}
                >

                  {isLoadingDataFiles ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Redescobrir Arquivos
                </Button>

*/}

                
              </div>

              
              <Button
                variant="outline"
                onClick={handleFileUploadClick}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Arquivo
              </Button>
            </div>

          </div>
        </CardHeader>
        <CardContent className="p-0">
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center space-y-4 p-6">
              <FileText className="h-16 w-16 text-muted-foreground opacity-50" />
              <div>
                <h3 className="text-lg font-medium">Nenhum arquivo encontrado</h3>
                <p className="text-muted-foreground">
                  {isLoadingDataFiles 
                    ? "Descobrindo arquivos em /public/data/..."
                    : "Arquivos serão descobertos automaticamente em /public/data/. Você também pode fazer upload de arquivos adicionais."
                  }
                </p>
              </div>
              {!isLoadingDataFiles && (
                <div className="flex gap-2">
                  <Button onClick={onReloadFiles} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Redescobrir
                  </Button>
                  <Button onClick={handleFileUploadClick} variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Arquivo
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-1 p-6">
                {/* Seção de arquivos da base de dados */}
                {dataFiles.length > 0 && (
                  <>
  {/*               <div className="flex items-center space-x-2 py-3 border-b bg-green-50/50 dark:bg-green-950/20 px-4 -mx-6 mb-3">
                       <Database className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-sm text-green-600">Arquivos de /public/data/</span>
                      <Badge variant="outline" className="text-green-600 border-green-600 ml-auto">
                        {dataFiles.length} arquivo(s)
                      </Badge>
                    </div>
*/}
                    {dataFiles.map((file) => {
                      const isSelected = localSelection.includes(file.id);
                      const paragraphCount = countParagraphs(file.content);
                      
                      return (
                        <div
                          key={file.id}
                          className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${
                            isSelected 
                              ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                              : 'bg-card border-border hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleFileToggle(file.id)}
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <Database className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <span className="font-medium truncate">{file.name}</span>
                              <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                /data/
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                              <span>{formatFileSize(file.size)}</span>
                              <span>•</span>
                              <span>{paragraphCount} parágrafos</span>
                              <span>•</span>
                              <span>{file.type || 'text/plain'}</span>
                            </div>
                          </div>
                          
                          {/* Arquivos da base não podem ser removidos */}
                          <div className="w-16 flex justify-center">
                            <Badge variant="outline" className="text-xs text-green-600">
                              Sistema
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                
                {/* Seção de arquivos enviados */}
                {uploadedFiles.length > 0 && (
                  <>
                    {dataFiles.length > 0 && <div className="py-2" />}
                    <div className="flex items-center space-x-2 py-3 border-b bg-blue-50/50 dark:bg-blue-950/20 px-4 -mx-6 mb-3">
                      <Upload className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm text-blue-600">Arquivos Enviados</span>
                      <Badge variant="outline" className="text-blue-600 border-blue-600 ml-auto">
                        {uploadedFiles.length} arquivo(s)
                      </Badge>
                    </div>
                    {uploadedFiles.map((file) => {
                      const isSelected = localSelection.includes(file.id);
                      const paragraphCount = countParagraphs(file.content);
                      
                      return (
                        <div
                          key={file.id}
                          className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' 
                              : 'bg-card border-border hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleFileToggle(file.id)}
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <span className="font-medium truncate">{file.name}</span>
                              <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
                                Upload
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                              <span>{formatFileSize(file.size)}</span>
                              <span>•</span>
                              <span>{paragraphCount} parágrafos</span>
                              <span>•</span>
                              <span>{file.type || 'text/plain'}</span>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveFile(file.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}