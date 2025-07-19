import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ArrowRight, Sparkles, Zap } from "lucide-react";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center text-center px-4 overflow-hidden">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-hero opacity-10" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-fade-up">
        <div className="space-y-4">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-4 py-2">
            <Sparkles className="h-4 w-4 mr-2" />
            Conscienciologia
          </Badge>
          <br />
          <br />
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent leading-tight">
            Cons.IA
            <br />
            <span className="relative">
              Assistant Hub
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-primary rounded-full opacity-60" />
            </span>
          </h1>
          <br />
          <br />
        
          <p
            className="
              text-sm      
              sm:!text-base 
              text-secondary-foreground
              max-w-2xl mx-auto leading-relaxed font-normal
            "
          >
            Olá conscienciólogo!<br />
            Bem-vindo à caixa de ferramentas de IA para a pesquisa conscienciológica. <br />
            Cada ferramenta é ideal para uma tarefa específica.<br />
            Se já sabe qual utilizar, abra a caixa e escolha à vontade.<br />
            Se quiser que eu te oriente, explique o que precisa que eu indico o que usar!
          </p>


        </div>
        <br />

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg" 
            onClick={onGetStarted}
            className="interactive-hover btn-primary px-8 py-3 text-lg font-semibold"
          >
            <Zap className="h-5 w-5 mr-2" />
            Abrir Toolbox
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          
          <Button 
            size="lg" 
            variant="outline"
            className="interactive-hover px-8 py-3 text-lg font-semibold border-2 border-primary/30 text-primary hover:bg-primary/10"
          >
            Me ajude a escolher!
          </Button>
          
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => window.location.href = '/example-bot'}
            className="interactive-hover px-8 py-3 text-lg font-semibold border-2 border-accent/30 text-accent hover:bg-accent/10 mt-4 sm:mt-0"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Testar Chat IA
          </Button>
        </div>

      </div>
    </section>
  );
}