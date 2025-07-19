import { consGptConfig } from './consgpt';
import { consLmConfig } from './conslm';
import { ragConfig } from './botrag';
import { bmancConfig } from './bmanc';
import { lexicalConfig } from './lexical';
import { ModuleConfig } from './shared/types';
import { Brain, Palette, Code, Zap } from 'lucide-react';

// Available modules
const availableModules: ModuleConfig[] = [
  consGptConfig,
  consLmConfig,
  ragConfig,
  bmancConfig,
  lexicalConfig
];

// Coming soon modules (for display purposes)
const comingSoonModules = [
  {
    id: 'knowledge-base',
    title: 'Knowledge Base',
    description: 'Aguarde...',
    icon: Brain,
    badge: 'Coming Soon',
    disabled: true
  },
];

// All modules combined
export const allModules = [...availableModules, ...comingSoonModules];

// Helper function to get module by id
export function getModuleById(id: string): ModuleConfig | undefined {
  return availableModules.find(module => module.id === id);
}

// Helper function to check if module is available
export function isModuleAvailable(id: string): boolean {
  return availableModules.some(module => module.id === id);
}