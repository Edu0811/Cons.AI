import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OpenAISettings } from "../types";

// Vector Store options for RAG modules
const VECTOR_STORE_OPTIONS = [
  { value: 'ALLWV', label: 'ALLWV - Todos os tratados' },
  { value: 'DAC', label: 'DAC - Dicionário de Argumentos da Conscienciologia' },
  { value: 'LO', label: 'LO - Léxico de Ortopensatas' },
  { value: 'QUEST', label: 'QUEST - Questionários' },
  { value: 'MANUAIS', label: 'MANUAIS - Manuais' },
  { value: 'ECWV', label: 'ECWV - Enciclopédia da Conscienciologia' },
  { value: 'HSRP', label: 'HSRP - Homo sapiens reurbanisatus' },
  { value: 'EXP', label: 'EXP - Experimentos da Conscienciologia' },
  { value: 'PROJ', label: 'PROJ - Projeciologia' },
  { value: 'CCG', label: 'CCG - Conscienciograma' },
  { value: 'EDUNOTES', label: 'EDUNOTES - Notas do Edu' }
];

const MODEL_OPTIONS = [
  { value: 'gpt-4.1-nano-2025-04-14', label: 'GPT-4.1 Nano' },
  { value: 'gpt-4.1-mini-2025-04-14', label: 'GPT-4.1 Mini' },
  { value: 'gpt-4.1-2025-04-14', label: 'GPT-4.1' }
];

interface SettingsDialogProps {
  title: string;
  settings: OpenAISettings;
  onSettingsChange: (settings: OpenAISettings) => void;
  onClose: () => void;
  isRAGModule?: boolean;
}

export function SettingsDialog({ 
  title, 
  settings, 
  onSettingsChange, 
  onClose,
  isRAGModule = false
}: SettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState<OpenAISettings>(settings);

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{title} Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="model" className="text-sm font-medium">
              Modelo
            </Label>
            <Select
              value={localSettings.model || 'gpt-4.1-nano-2025-04-14'}
              onValueChange={(value) => setLocalSettings(prev => ({ ...prev, model: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione o modelo" />
              </SelectTrigger>
              <SelectContent>
                {MODEL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isRAGModule && (
            <>
              <div>
                <Label htmlFor="instructions" className="text-sm font-medium">
                  Instruções (Pre-prompt)
                </Label>
                <Textarea
                  id="instructions"
                  value={localSettings.instructions || ''}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Instruções para o assistente..."
                  className="mt-1 min-h-20"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Instruções que definem o comportamento do assistente.
                </p>
              </div>

              <div>
                <Label htmlFor="vectorStore" className="text-sm font-medium">
                  Base de Conhecimento
                </Label>
                <Select
                  value={localSettings.vectorStore || 'ALLWV'}
                  onValueChange={(value) => setLocalSettings(prev => ({ ...prev, vectorStore: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione a base" />
                  </SelectTrigger>
                  <SelectContent>
                    {VECTOR_STORE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Base de conhecimento para consulta RAG.
                </p>
              </div>

              <div>
                <Label htmlFor="topK" className="text-sm font-medium">
                  Top K ({localSettings.topK || 20})
                </Label>
                <Input
                  id="topK"
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={localSettings.topK || 20}
                  onChange={(e) => setLocalSettings(prev => ({ 
                    ...prev, 
                    topK: parseInt(e.target.value) 
                  }))}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Número de documentos relevantes para consulta (1-50).
                </p>
              </div>
            </>
          )}
          
          <div>
            <Label htmlFor="temperature" className="text-sm font-medium">
              Temperature ({localSettings.temperature || 0.7})
            </Label>
            <Input
              id="temperature"
              type="range"
              min="0"
             max="2"
              step="0.1"
              value={localSettings.temperature || 0.7}
              onChange={(e) => setLocalSettings(prev => ({ 
                ...prev, 
                temperature: parseFloat(e.target.value) 
              }))}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Controla a aleatoriedade nas respostas. Valores menores são mais focados.
            </p>
          </div>

          <div>
            <Label htmlFor="maxTokens" className="text-sm font-medium">
              Máximo de Tokens
            </Label>
            <Input
              id="maxTokens"
              type="number"
              min="100"
              max="4000"
              value={localSettings.maxTokens || 2000}
              onChange={(e) => setLocalSettings(prev => ({ 
                ...prev, 
                maxTokens: parseInt(e.target.value) 
              }))}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Comprimento máximo da resposta.
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline">
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}