import { Brain } from "lucide-react";
import { ModuleConfig } from "../shared/types";
import { RAGModule } from "./RAGModule";

export const ragConfig: ModuleConfig = {
  id: 'rag',
  title: 'RAG Bot',
  description: 'Chatbot RAG especializado em Conscienciologia.',
  icon: Brain,
  badge: 'Available',
  component: RAGModule
};