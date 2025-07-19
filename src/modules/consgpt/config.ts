import { MessageCircle } from "lucide-react";
import { ModuleConfig } from "../shared/types";
import { ConsGptModule } from "./ConsGptModule";

export const consGptConfig: ModuleConfig = {
  id: 'consgpt',
  title: 'Cons.GPT',
  description: 'Assistente ChatGPT (OpenAI) com os tratados conscienciológicos.',
  icon: MessageCircle,
  badge: 'Available',
  component: ConsGptModule
};