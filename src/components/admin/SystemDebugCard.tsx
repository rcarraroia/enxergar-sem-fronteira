
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Bug, CheckCircle, RefreshCw, Trash2 } from "lucide-react";
import { debugUtils } from "@/utils/debugUtils";
import { useErrorBoundary } from "@/hooks/useErrorBoundary";
import { toast } from "sonner";

export const SystemDebugCard = () => {
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const { errors, clearErrors, hasErrors } = useErrorBoundary("SystemDebugCard");

  const runDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    toast.info("Executando diagnóstico completo...");
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular tempo de análise
      const results = debugUtils.runFullDiagnostic();
      setDiagnosticResults(results);
      toast.success("Diagnóstico concluído!");
    } catch (error) {
      console.error("Erro no diagnóstico:", error);
      toast.error("Erro ao executar diagnóstico");
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  const fixCommonIssues = () => {
    toast.info("Corrigindo problemas comuns...");
    
    // Limpar dados corrompidos
    debugUtils.cleanCorruptedData();
    
    // Limpar cache de consultas
    if ("caches" in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes("supabase") || name.includes("old")) {
            caches.delete(name);
          }
        });
      });
    }
    
    // Limpar erros
    clearErrors();
    
    toast.success("Correções aplicadas! Recarregue a página se necessário.");
  };

  const getHealthIcon = (isHealthy: boolean) => {
    return isHealthy ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Debug do Sistema
        </CardTitle>
        <CardDescription>
          Diagnóstico e correção de problemas do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controles */}
        <div className="flex gap-2">
          <Button 
            onClick={runDiagnostic} 
            disabled={isRunningDiagnostic}
            className="flex-1"
          >
            {isRunningDiagnostic ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Bug className="h-4 w-4 mr-2" />
            )}
            Executar Diagnóstico
          </Button>
          
          <Button 
            onClick={fixCommonIssues}
            variant="outline"
            className="flex-1"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Corrigir Problemas
          </Button>
        </div>

        {/* Resultados do Diagnóstico */}
        {diagnosticResults && (
          <div className="space-y-3">
            <h4 className="font-medium">Resultados do Diagnóstico:</h4>
            
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center gap-2">
                  {getHealthIcon(diagnosticResults.appHealth)}
                  <span className="text-sm">Saúde da Aplicação</span>
                </div>
                <Badge variant={diagnosticResults.appHealth ? "default" : "destructive"}>
                  {diagnosticResults.appHealth ? "OK" : "Problema"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center gap-2">
                  {getHealthIcon(diagnosticResults.systemConfig)}
                  <span className="text-sm">Configuração do Sistema</span>
                </div>
                <Badge variant={diagnosticResults.systemConfig ? "default" : "destructive"}>
                  {diagnosticResults.systemConfig ? "OK" : "Problema"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center gap-2">
                  {getHealthIcon(diagnosticResults.memoryHealth)}
                  <span className="text-sm">Saúde da Memória</span>
                </div>
                <Badge variant={diagnosticResults.memoryHealth ? "default" : "destructive"}>
                  {diagnosticResults.memoryHealth ? "OK" : "Alto Uso"}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Erros Capturados */}
        {hasErrors && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Erros Capturados ({errors.length})
              </h4>
              <Button onClick={clearErrors} variant="outline" size="sm">
                Limpar
              </Button>
            </div>
            
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {errors.map((error, index) => (
                  <div key={index} className="p-2 rounded border-l-2 border-l-red-500 bg-red-50 dark:bg-red-900/10">
                    <div className="text-xs text-muted-foreground">
                      {error.timestamp.toLocaleTimeString()}
                      {error.component && ` - ${error.component}`}
                    </div>
                    <div className="text-sm font-mono">{error.message}</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Dicas de Debug */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
          <h4 className="text-sm font-medium mb-2">💡 Dicas de Debug:</h4>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>• Verifique o console do navegador para logs detalhados</li>
            <li>• Use as ferramentas de desenvolvedor para inspecionar elementos</li>
            <li>• Execute o diagnóstico após mudanças importantes</li>
            <li>• Limpe o cache se encontrar comportamentos estranhos</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
