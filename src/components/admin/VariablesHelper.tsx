/**
 * Variables Helper Component
 * Displays available template variables organized by category
 */

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Calendar, 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  Info, 
  Link,
  Sparkles,
  User
} from "lucide-react";
import type { VariablesHelperProps } from "@/types/notificationTemplates";
import { getVariablesForType } from "@/constants/templateVariables";
import { VARIABLE_CATEGORIES } from "@/constants/templateVariables";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const categoryIcons = {
  patient: User,
  event: Calendar,
  system: Link
};

export const VariablesHelper: React.FC<VariablesHelperProps> = ({
  type,
  onVariableClick,
  className
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["patient", "event"]) // Expand patient and event by default
  );
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);

  const variables = getVariablesForType(type);
  const variablesByCategory = VARIABLE_CATEGORIES.map(category => ({
    ...category,
    variables: variables.filter(v => v.type === category.id)
  })).filter(category => category.variables.length > 0);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleVariableClick = (variableKey: string) => {
    onVariableClick(variableKey);
    toast.success(`Variável ${variableKey} inserida`);
  };

  const handleCopyVariable = async (variableKey: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(variableKey);
      setCopiedVariable(variableKey);
      toast.success("Variável copiada para a área de transferência");
      
      // Clear copied state after 2 seconds
      setTimeout(() => setCopiedVariable(null), 2000);
    } catch (error) {
      toast.error("Erro ao copiar variável");
    }
  };

  const requiredVariables = variables.filter(v => v.required);
  const optionalVariables = variables.filter(v => !v.required);

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            Variáveis Disponíveis
          </CardTitle>
          <CardDescription className="text-xs">
            Clique em uma variável para inserir no template. 
            {type === "email" ? "Templates de email" : "Templates de WhatsApp"} suportam estas variáveis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Quick Stats */}
          <div className="flex gap-2 text-xs">
            <Badge variant="secondary" className="text-xs">
              {variables.length} variáveis
            </Badge>
            <Badge variant="outline" className="text-xs">
              {requiredVariables.length} obrigatórias
            </Badge>
            <Badge variant="outline" className="text-xs">
              {optionalVariables.length} opcionais
            </Badge>
          </div>

          {/* Variables by Category */}
          <div className="space-y-2">
            {variablesByCategory.map((category) => {
              const Icon = categoryIcons[category.id as keyof typeof categoryIcons];
              const isExpanded = expandedCategories.has(category.id);
              
              return (
                <Collapsible
                  key={category.id}
                  open={isExpanded}
                  onOpenChange={() => toggleCategory(category.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-2 h-auto text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">{category.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {category.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {category.variables.length}
                        </Badge>
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="space-y-1 mt-1">
                    {category.variables.map((variable) => (
                      <TooltipProvider key={variable.key}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="group relative">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start p-2 h-auto text-left hover:bg-muted/50"
                                onClick={() => handleVariableClick(variable.key)}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">
                                      {variable.key}
                                    </code>
                                    {variable.required && (
                                      <Badge variant="destructive" className="text-xs px-1 py-0">
                                        obrigatória
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1 truncate">
                                    {variable.description}
                                  </div>
                                </div>
                              </Button>
                              
                              {/* Copy button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                                onClick={(e) => handleCopyVariable(variable.key, e)}
                              >
                                <Copy className={cn(
                                  "h-3 w-3",
                                  copiedVariable === variable.key && "text-green-600"
                                )} />
                              </Button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs">
                            <div className="space-y-1">
                              <div className="font-medium">{variable.description}</div>
                              <div className="text-xs text-muted-foreground">
                                <strong>Exemplo:</strong> {variable.example}
                              </div>
                              {variable.required && (
                                <div className="text-xs text-red-400">
                                  Esta variável é obrigatória para templates de {type}
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>

          {/* Quick Insert Tabs for Common Variables */}
          <div className="pt-2 border-t">
            <Tabs defaultValue="common" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="common" className="text-xs">Comuns</TabsTrigger>
                <TabsTrigger value="required" className="text-xs">Obrigatórias</TabsTrigger>
              </TabsList>
              
              <TabsContent value="common" className="mt-2 space-y-1">
                {["{{patient_name}}", "{{event_title}}", "{{event_date}}", "{{event_time}}"]
                  .filter(key => variables.some(v => v.key === key))
                  .map((key) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs h-7"
                      onClick={() => handleVariableClick(key)}
                    >
                      <code className="font-mono">{key}</code>
                    </Button>
                  ))
                }
              </TabsContent>
              
              <TabsContent value="required" className="mt-2 space-y-1">
                {requiredVariables.length > 0 ? (
                  requiredVariables.map((variable) => (
                    <Button
                      key={variable.key}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs h-7 border-red-200"
                      onClick={() => handleVariableClick(variable.key)}
                    >
                      <code className="font-mono">{variable.key}</code>
                    </Button>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    Nenhuma variável obrigatória para templates de {type}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Help Text */}
          <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <div className="font-medium mb-1">Como usar:</div>
              <ul className="space-y-0.5 text-xs">
                <li>• Clique em uma variável para inserir no template</li>
                <li>• Variáveis obrigatórias são recomendadas para melhor experiência</li>
                <li>• Use o botão de copiar para copiar a variável</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};