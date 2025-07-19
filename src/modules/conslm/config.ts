import { BookOpen } from "lucide-react";
import { ModuleConfig } from "../shared/types";
import { ConsLmModule } from "./ConsLmModule";

export const consLmConfig: ModuleConfig = {
  id: 'conslm',
  title: 'Cons.LM',
  description: 'Assistente NotebookLM (Gemini) com os tratados conscienciológicos.',
  icon: BookOpen,
  badge: 'Available',
  component: ConsLmModule
};