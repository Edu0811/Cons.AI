import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, User, Settings, Loader2, RefreshCw, BookOpen } from "lucide-react";
import { ModuleProps } from "../shared/types";
import { useModuleSettings } from "../shared/hooks/useModuleSettings";
import { SettingsDialog } from "../shared/components/SettingsDialog";
import { manciaRoutine } from "./services/bmancService";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant' | 'pensata';
  timestamp: Date;
}

export function BMancModule({ onBack }: ModuleProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [conversationId] = useState(() => `bmanc-${Date.now()}`);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { settings, updateSettings, isConfigured } = useModuleSettings('bmanc');

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  const handleClearMessages = () => {
    setMessages([]);
  };

  const handleMessageUpdate = (messageData: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content: messageData.content,
      type: messageData.type,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleBibliomancia = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await manciaRoutine({
        conversationId,
        selectedVectorStore: 'ALLWV',
        parameters: {
          temperature: settings.temperature || 0.2,
          topK: settings.topK || 20,
          model: settings.model || 'gpt-4.1-nano-2025-04-14'
        },
        onStart: () => {
          toast({
            title: "Bibliomancia Digital",
            description: "Iniciando consulta matinal...",
          });
        },
        onComplete: (response) => {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: response,
            type: 'assistant',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
        },
        onError: (error) => {
          toast({
            title: "Erro",
            description: error.message || "Falha ao executar Bibliomancia Digital",
            variant: "destructive"
          });
        },
        onMessageUpdate: handleMessageUpdate,
        onClearMessages: handleClearMessages
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao executar Bibliomancia Digital",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
  };

  if (showSettings) {
    return (
      <SettingsDialog
        title="BManc"
        settings={settings}
        onSettingsChange={updateSettings}
        onClose={() => setShowSettings(false)}
        isRAGModule={true}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <Card className="rounded-b-none border-b-0">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={onBack}>
                ← Back
              </Button>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <CardTitle>Bibliomancia Digital</CardTitle>
                <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Bibliomancia
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Bibliomancia Digital - Consulta matinal com pensatas aleatórias do Léxico de Ortopensatas para reflexão conscienciológica.
          </p>
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card className="flex-1 rounded-none border-b-0 border-t-0">
        <CardContent className="p-0 h-full">
          <ScrollArea className="h-full p-6" ref={scrollAreaRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <Sparkles className="h-12 w-12 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-medium">Bibliomancia Digital</h3>
                  <p className="text-muted-foreground">Clique no botão abaixo para receber sua pensata matinal</p>
                </div>
                <Button onClick={handleBibliomancia} disabled={isLoading}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Consultar Bibliomancia
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <div className="flex-shrink-0">
                      {message.type === 'user' ? (
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      ) : message.type === 'pensata' ? (
                        <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-accent-foreground" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-secondary-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          {message.type === 'user' ? 'Você' : 
                           message.type === 'pensata' ? 'Pensata' : 'Análise'}
                        </span>
                        <span>{message.timestamp.toLocaleTimeString()}</span>
                        {message.type === 'pensata' && (
                          <Badge variant="outline" className="text-xs">
                            <BookOpen className="h-3 w-3 mr-1" />
                            Léxico de Ortopensatas
                          </Badge>
                        )}
                      </div>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            // Customize link styling
                            a: ({ node, ...props }) => (
                              <a {...props} className="text-primary hover:text-primary/80 underline" target="_blank" rel="noopener noreferrer" />
                            ),
                            // Customize code block styling
                            code: ({ node, inline, ...props }) => (
                              inline ? 
                                <code {...props} className="bg-muted px-1 py-0.5 rounded text-sm font-mono" /> :
                                <code {...props} className="block bg-muted p-3 rounded-md text-sm font-mono overflow-x-auto" />
                            ),
                            // Customize blockquote styling
                            blockquote: ({ node, ...props }) => (
                              <blockquote {...props} className="border-l-4 border-primary pl-4 italic text-muted-foreground" />
                            ),
                            // Customize heading styling
                            h1: ({ node, ...props }) => <h1 {...props} className="text-xl font-bold mt-4 mb-2" />,
                            h2: ({ node, ...props }) => <h2 {...props} className="text-lg font-semibold mt-3 mb-2" />,
                            h3: ({ node, ...props }) => <h3 {...props} className="text-base font-medium mt-2 mb-1" />,
                            // Customize list styling
                            ul: ({ node, ...props }) => <ul {...props} className="list-disc list-inside space-y-1" />,
                            ol: ({ node, ...props }) => <ol {...props} className="list-decimal list-inside space-y-1" />,
                            li: ({ node, ...props }) => <li {...props} className="ml-2" />,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-secondary-foreground" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="text-sm text-muted-foreground">Análise</div>
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Analisando pensata...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Action Button */}
      <Card className="rounded-t-none">
        <CardContent className="p-4">
          <div className="flex justify-center">
            <Button
              onClick={handleBibliomancia}
              disabled={isLoading}
              size="lg"
              className="px-8"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {isLoading ? "Consultando..." : "Nova Consulta"}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2 text-center">
            Bibliomancia Digital • Léxico de Ortopensatas • Base ALLWV
          </div>
        </CardContent>
      </Card>
    </div>
  );
}