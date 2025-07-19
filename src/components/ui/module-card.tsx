import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DivideIcon as LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  badge?: string;
}

export function ModuleCard({
  title,
  description,
  icon: Icon,
  onClick,
  className,
  disabled = false,
  badge
}: ModuleCardProps) {
  return (
    <Card 
      className={cn(
        "module-card relative overflow-hidden card-elegant",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-gradient-primary text-white shadow-soft hover:shadow-glow transition-all duration-300">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
              {badge && (
                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mt-2 shadow-soft ${
                  badge === 'Available' ? 'badge-available' : 'badge-accent'
                }`}>
                  {badge}
                </span>
              )}
            </div>
          </div>
        </div>
        <CardDescription className="text-sm text-foreground/75 mt-2 font-medium">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative">
        <Button 
          onClick={onClick}
          disabled={disabled}
          variant="default"
          className="w-full interactive-hover btn-primary font-semibold"
        >
          Abrir Toolbox
        </Button>
      </CardContent>
    </Card>
  );
}