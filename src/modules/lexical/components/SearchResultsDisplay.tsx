import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChevronDown, 
  ChevronRight, 
  FileText,
  Search
} from "lucide-react";
import { SearchResult } from "../services/lexicologia";

interface SearchResultsDisplayProps {
  results: SearchResult[];
  searchTerm: string;
}

interface ExpandedFiles {
  [fileName: string]: boolean;
}

export function SearchResultsDisplay({ results, searchTerm }: SearchResultsDisplayProps) {
  const [expandedFiles, setExpandedFiles] = useState<ExpandedFiles>({});

  // Handler para expandir/colapsar arquivo
  const toggleFileExpansion = (fileName: string) => {
    setExpandedFiles(prev => ({
      ...prev,
      [fileName]: !prev[fileName]
    }));
  };

  // Função para destacar termo de busca no texto e renderizar markdown
  const processTextWithHighlight = (text: string, term: string): JSX.Element => {
    if (!term.trim()) return text;
    
    // Escape special regex characters
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    
    // Split text by search term while preserving the term
    const parts = text.split(regex);
    
    return (
      <span>
        {parts.map((part, index) => {
          const isHighlight = regex.test(part);
          const processedPart = processMarkdown(part);
          
          if (isHighlight) {
            return (
              <mark 
                key={index}
                style={{ 
                  backgroundColor: '#fef08a', 
                  padding: '2px 4px', 
                  borderRadius: '3px',
                  fontWeight: '600'
                }}
              >
                {processedPart}
              </mark>
            );
          }
          
          return <span key={index}>{processedPart}</span>;
        })}
      </span>
    );
  };

  // Função para processar markdown básico
  const processMarkdown = (text: string): JSX.Element => {
    if (!text) return <></>;
    
    // Process markdown formatting
    let processedText = text;
    const elements: JSX.Element[] = [];
    
    // Split by markdown patterns while preserving them
    const markdownRegex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|~~.*?~~)/g;
    const parts = processedText.split(markdownRegex);
    
    return (
      <>
        {parts.map((part, index) => {
          if (!part) return null;
          
          // Bold text **text**
          if (part.startsWith('**') && part.endsWith('**')) {
            const content = part.slice(2, -2);
            return <strong key={index} className="font-semibold text-foreground">{content}</strong>;
          }
          
          // Italic text *text*
          if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
            const content = part.slice(1, -1);
            return <em key={index} className="italic text-foreground/90">{content}</em>;
          }
          
          // Code `text`
          if (part.startsWith('`') && part.endsWith('`')) {
            const content = part.slice(1, -1);
            return (
              <code key={index} className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
                {content}
              </code>
            );
          }
          
          // Strikethrough ~~text~~
          if (part.startsWith('~~') && part.endsWith('~~')) {
            const content = part.slice(2, -2);
            return <del key={index} className="line-through text-muted-foreground">{content}</del>;
          }
          
          // Regular text
          return <span key={index}>{part}</span>;
        })}
      </>
    );
  };

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum resultado encontrado para "{searchTerm}"</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result, index) => {
        const isExpanded = expandedFiles[result.fileName];
        
        return (
          <Card key={`${result.fileName}-${index}`} className="overflow-hidden">
            {/* Banner clicável do arquivo */}
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors p-4"
              onClick={() => toggleFileExpansion(result.fileName)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg">{result.fileName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {result.foundParagraphs.length} parágrafo(s) encontrado(s) • 
                      {result.occurrenceCount} ocorrência(s)
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-green-500 text-white border-green-500">
                    {result.foundParagraphs.length}
                  </Badge>
                  {/*<Badge variant="outline" className="bg-green-300 text-white border-green-300">
                    {result.occurrenceCount} hits
                  </Badge>*/}
                </div>
              </div>
            </CardHeader>

            {/* Conteúdo expandido com parágrafos */}
            {isExpanded && (
              <CardContent className="border-t bg-muted/20">
                <div className="max-h-[400px] overflow-y-auto">
                  <div className="space-y-4 p-4 pr-2">
                    {result.foundParagraphs.map((paragraph, paragraphIndex) => (
                      <div 
                        key={paragraphIndex}
                        className="bg-background p-4 rounded-lg border border-border/50 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <div className="leading-relaxed text-foreground">
                            {processTextWithHighlight(paragraph, searchTerm)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}