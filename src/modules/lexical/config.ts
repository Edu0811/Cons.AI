import { Search } from "lucide-react";
import { ModuleConfig } from "../shared/types";
import { LexicalModule } from "./LexicalModule";

export const lexicalConfig: ModuleConfig = {
  id: 'lexical',
  title: 'Lexical Search',
  description: 'Sistema de busca textual (literal) em livros.',
  icon: Search,
  badge: 'Available',
  component: LexicalModule
};