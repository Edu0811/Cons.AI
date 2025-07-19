import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { openAIRAGService, OpenAIRAGRequest } from "@/services/openai-rag";
import { useToast } from "@/hooks/use-toast";
import { Send, Brain, User, Settings, Loader2, Database, RefreshCw } from "lucide-react";
import { ModuleProps } from "../shared/types";
import { useModuleSettings } from "../shared/hooks/useModuleSettings";
import { SettingsDialog } from "../shared/components/SettingsDialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";



interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  sources?: string[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export function RAGModule({ onBack }: ModuleProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [conversationId] = useState(() => `rag-${Date.now()}`);
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { settings, updateSettings, isConfigured } = useModuleSettings('rag');

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isConfigured && !isInitialized) {
      initializeConversation();
    }
  }, [isConfigured, isInitialized]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  const initializeConversation = async () => {
    setIsLoading(true);
    try {
      const response = await openAIRAGService.initializeConversation(conversationId, {
        vectorStore: settings.vectorStore,
        instructions: settings.instructions,
        model: settings.model,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        topK: settings.topK
      });
      
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        content: response.content,
        role: 'assistant',
        timestamp: new Date(),
        sources: response.sources
      };

      setMessages([welcomeMessage]);
      setIsInitialized(true);
      
      toast({
        title: "RAG Bot Inicializado",
        description: `Conversa iniciada com sucesso usando a base ${settings.vectorStore || 'ALLWV'}.`,
      });
    } catch (error) {
      toast({
        title: "Erro na Inicialização",
        description: error instanceof Error ? error.message : "Falha ao inicializar conversa",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    if (!isInitialized) {
      toast({
        title: "Inicializando...",
        description: "Aguarde a inicialização da conversa.",
        variant: "destructive"
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const request: OpenAIRAGRequest = {
        message: input.trim(),
        vectorStore: settings.vectorStore,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        model: settings.model,
        conversationId,
        instructions: settings.instructions,
        topK: settings.topK
      };

      const response = await openAIRAGService.OpenAI_Call(request);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        role: 'assistant',
        timestamp: new Date(),
        sources: response.sources,
        usage: response.usage
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReset = () => {
    openAIRAGService.resetConversation(conversationId);
    setMessages([]);
    setIsInitialized(false);
    if (isConfigured) {
      initializeConversation();
    }
  };

  if (showSettings) {
    return (
      <SettingsDialog
        title="RAG Bot"
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
                <Brain className="h-6 w-6 text-primary" />
                <CardTitle>RAG Bot</CardTitle>
                <Badge variant="secondary" className="bg-green-500 text-white">
                  <Database className="h-3 w-3 mr-1" />
                  RAG
                </Badge>
                {isInitialized && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Online
                  </Badge>
                )}
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
            Chatbot RAG especializado em Conscienciologia, usando base {settings.vectorStore || 'ALLWV'} via OpenAI Response API.
          </p>
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card className="flex-1 rounded-none border-b-0 border-t-0">
        <CardContent className="p-0 h-full">
          <ScrollArea className="h-full p-6" ref={scrollAreaRef}>
            {!isInitialized && !isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <Brain className="h-12 w-12 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-medium">RAG Bot</h3>
                  <p className="text-muted-foreground">Configure sua API key para começar</p>
                </div>
                <Button onClick={() => setShowSettings(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              </div>
            ) : messages.length === 0 && isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div>
                  <h3 className="text-lg font-medium">Inicializando RAG Bot</h3>
                  <p className="text-muted-foreground">Conectando com a base {settings.vectorStore || 'ALLWV'}...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <div className="flex-shrink-0">
                      {message.role === 'user' ? (
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                          <Brain className="h-4 w-4 text-accent-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{message.role === 'user' ? 'Você' : 'RAG Bot'}</span>
                        <span>{message.timestamp.toLocaleTimeString()}</span>
                        {message.role === 'assistant' && (
                          <Badge variant="outline" className="text-xs">
                            <Database className="h-3 w-3 mr-1" />
                            {settings.vectorStore || 'ALLWV'}
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
                            code: ({ node, ...props }) => (
                              <code {...props} className="block bg-muted p-3 rounded-md text-sm font-mono overflow-x-auto" />
                            ),
                            // Customize blockquote styling
                            blockquote: ({ node, ...props }) => (
                              <blockquote {...props} className="border-l-4 border-primary pl-4 italic text-muted-foreground" />
                            ),
                            // Customize table styling
                            table: ({ node, ...props }) => (
                              <div className="overflow-x-auto">
                                <table {...props} className="min-w-full border-collapse border border-border" />
                              </div>
                            ),
                            th: ({ node, ...props }) => (
                              <th {...props} className="border border-border px-3 py-2 bg-muted font-semibold text-left" />
                            ),
                            td: ({ node, ...props }) => (
                              <td {...props} className="border border-border px-3 py-2" />
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
                      {message.sources && message.sources.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <strong>Fontes:</strong> {message.sources.join(', ')}
                        </div>
                      )}
                      {message.usage && (
                        <div className="text-xs text-muted-foreground">
                          Tokens: {message.usage.totalTokens}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                      <Brain className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="text-sm text-muted-foreground">RAG Bot</div>
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Consultando base {settings.vectorStore || 'ALLWV'}...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Input */}
      <Card className="rounded-t-none">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Faça sua pergunta sobre Conscienciologia..."
              disabled={isLoading || !isInitialized}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim() || !isInitialized}
              size="sm"
              className="px-4"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {isInitialized && (
            <div className="text-xs text-muted-foreground mt-2 text-center">
              Conectado à base {settings.vectorStore || 'ALLWV'} • Response API • RAG habilitado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}