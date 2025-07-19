import { useState, useCallback } from 'react';
import { OpenAISettings } from '../types';

// Valid OpenAI models
const VALID_MODELS = [
  'gpt-4.1-nano-2025-04-14',
  'gpt-4.1-mini-2025-04-14', 
  'gpt-4.1-2025-04-14'
];

/**
 * Validates and returns a valid model name
 */
function validateModel(model?: string): string {
  const defaultModel = 'gpt-4.1-nano-2025-04-14';
  if (!model || !VALID_MODELS.includes(model)) {
    console.warn(`Invalid model '${model}', using default: ${defaultModel}`);
    return defaultModel;
  }
  return model;
}

const DEFAULT_SETTINGS: OpenAISettings = {
  temperature: 0.2,
  maxTokens: 2000,
  model: 'gpt-4.1-nano-2025-04-14',
  instructions: 'Você é um assistente especialista em Conscienciologia. Responda de forma objetiva e precisa baseado nas fontes fornecidas.',
  vectorStore: 'ALLWV',
  topK: 20
};

export function useModuleSettings(moduleId: string) {
  const [settings, setSettings] = useState<OpenAISettings>(() => {
    const stored = localStorage.getItem(`${moduleId}-settings`);
    if (stored) {
      const parsedSettings = JSON.parse(stored);
      // Validate the model from stored settings
      parsedSettings.model = validateModel(parsedSettings.model);
      return { ...DEFAULT_SETTINGS, ...parsedSettings };
    }
    return DEFAULT_SETTINGS;
  });

  const updateSettings = useCallback((newSettings: OpenAISettings) => {
    // Validate model before saving
    const validatedSettings = {
      ...newSettings,
      model: validateModel(newSettings.model)
    };
    setSettings(validatedSettings);
    localStorage.setItem(`${moduleId}-settings`, JSON.stringify(validatedSettings));
  }, [moduleId]);

  // API key is now always configured via environment variables
  const isConfigured = true;

  return {
    settings,
    updateSettings,
    isConfigured
  };
}