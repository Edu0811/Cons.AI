import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ExternalLink } from "lucide-react";
import { ModuleProps } from "../shared/types";

export function ConsLmModule({ onBack }: ModuleProps) {
  const handleOpenConsLM = () => {
    window.open("https://notebooklm.google.com/notebook/c3528e65-0c2b-4a80-b3f2-2f22e3626b67?_gl=1*1plgwls*_ga*MTk3OTE1MzMxNC4xNzIzMTU4NzQz*_ga_W0LDH41ZCB*MTczMjM2NDM3Ni4yMy4xLjE3MzIzNjQzOTcuMzkuMC4w", "_blank");
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
                <BookOpen className="h-6 w-6 text-primary" />
                <CardTitle>Cons.LM</CardTitle>
                <Badge variant="secondary">External</Badge>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground">
            Google NotebookLM especializado em Conscienciologia. Clique no botão abaixo para acessar.
          </p>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Card className="shadow-card">
        <CardContent className="py-12">
          <div className="text-center space-y-6">
            <BookOpen className="h-16 w-16 mx-auto text-primary" />
            <div>
              <h3 className="text-2xl font-semibold mb-2">Cons.LM</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
              </p>
            </div>
            <Button 
              onClick={handleOpenConsLM}
              size="lg"
              className="interactive-hover"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Abrir Cons.LM
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted/30 border-muted">
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground">
            <BookOpen className="h-6 w-6 mx-auto mb-2 opacity-70" />
            <p className="font-medium mb-1">Sobre o Cons.LM</p>
            <p>
              Este é um notebook especializado hospedado no NotebookLM do Google, 
              configurado com conhecimentos de Conscienciologia para análise 
              e geração de insights contextualizados.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}