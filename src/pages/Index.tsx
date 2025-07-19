import { useState } from "react";
import { HeroSection } from "@/components/ui/hero-section";
import { ModuleCard } from "@/components/ui/module-card";
import { Footer } from "@/components/layout/footer";
import { allModules, getModuleById, isModuleAvailable } from "@/modules";

type ActiveModule = 'home' | 'bibliomancia' | 'consgpt';

const Index = () => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('home');

  const handleModuleClick = (moduleId: string) => {
    // Ensure the moduleId is a valid ActiveModule before setting it
    if (isModuleAvailable(moduleId) && (moduleId as ActiveModule)) {
      setActiveModule(moduleId as ActiveModule);
    }
  };

  const handleGetStarted = () => {
    // Scroll to modules section
    const modulesSection = document.getElementById('modules');
    if (modulesSection) {
      modulesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Render active module if it's not home
  if (activeModule !== 'home') {
    const moduleConfig = getModuleById(activeModule);
    if (moduleConfig) {
      const ModuleComponent = moduleConfig.component;
      return <ModuleComponent onBack={() => setActiveModule('home')} />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <HeroSection onGetStarted={handleGetStarted} />

      {/* Modules Section */}
      <section id="modules" className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-12 animate-fade-up">
            <h2 className="text-3xl md:text-4xl font-bold">
              Toolbox de IA da Conscienciologia
            </h2>
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto font-medium">
              Olá conscienciólogo! Escolha o módulo para iniciarmos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up">
            {allModules.map((module) => (
              <ModuleCard
                key={module.id}
                title={module.title}
                description={module.description}
                icon={module.icon}
                badge={module.badge}
                onClick={() => handleModuleClick(module.id)}
                disabled={module.disabled}
              />
            ))}
          </div>
        </div>
      </section>


      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
