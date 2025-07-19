export interface ModuleProps {
  onBack: () => void;
}

export interface ModuleConfig {
  id: string;
  title: string;
  description: string;
  icon: any;
  badge?: string;
  disabled?: boolean;
  component: React.ComponentType<ModuleProps>;
}

export interface OpenAISettings {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  instructions?: string;
  vectorStore?: string;
  topK?: number;
}