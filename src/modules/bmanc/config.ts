import { Sparkles } from "lucide-react";
import { ModuleConfig } from "../shared/types";
import { BMancModule } from "./BMancModule";

export const bmancConfig: ModuleConfig = {
  id: 'bmanc',
  title: 'Bibliomancia Digital',
  description: 'Seleção de trechos do Léxico de Ortopensatas.',
  icon: Sparkles,
  badge: 'Available',
  component: BMancModule
};