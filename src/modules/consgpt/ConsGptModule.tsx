import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, ExternalLink } from "lucide-react";
import { ModuleProps } from "../shared/types";

export function ConsGptModule({ onBack }: ModuleProps) {
  const handleOpenConsGPT = () => {
    window.open("https://chatgpt.com/g/g-9rjMAqtTg-consgpt", "_blank");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={onBack}>
                ← Back
              </Button>
              <div className="flex items-center space-x-2">
                <Bot className="h-6 w-6 text-primary" />
                <CardTitle>Cons.GPT</CardTitle>
                <Badge variant="secondary">External</Badge>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground">
            OpenAI ChatGPT especializado em Conscienciologia. Clique no botão abaixo para acessar.
          </p>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Card className="shadow-card">
        <CardContent className="py-12">
          <div className="text-center space-y-6">
            <Bot className="h-16 w-16 mx-auto text-primary" />
            <div>
              <h3 className="text-2xl font-semibold mb-2">Cons.GPT</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
              </p>
            </div>
            <Button 
              onClick={handleOpenConsGPT}
              size="lg"
              className="interactive-hover"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Abrir Cons.GPT
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted/30 border-muted">
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground">
            <Bot className="h-6 w-6 mx-auto mb-2 opacity-70" />
            <p className="font-medium mb-1">Sobre o Cons.GPT</p>
            <p>
              Este é um GPT personalizado hospedado no ChatGPT da OpenAI, 
              treinado especificamente com conhecimentos de Conscienciologia 
              para fornecer respostas mais precisas e contextualizadas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}