

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, RefreshCw, Shield, Zap } from "lucide-react";
import { useSystemMonitoring } from "@/hooks/useSystemMonitoring";

export const SystemHealthCard = () => {
  const { systemHealth, checkSystemHealth } = useSystemMonitoring();

  const getStatusBadge = (isHealthy: boolean) => (
    <Badge variant={isHealthy ? "default" : "destructive"}>
      {isHealthy ? "✅ OK" : "❌ Erro"}
    </Badge>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Saúde do Sistema
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkSystemHealth}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Verificar
          </Button>
        </CardTitle>
        <CardDescription>
          Última verificação: {systemHealth.lastChecked.toLocaleString("pt-BR")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span>Banco de Dados</span>
          </div>
          {getStatusBadge(systemHealth.dbConnected)}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Sistema de Autenticação</span>
          </div>
          {getStatusBadge(systemHealth.authWorking)}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span>Edge Functions</span>
          </div>
          {getStatusBadge(systemHealth.edgeFunctionsHealthy)}
        </div>

        {(!systemHealth.dbConnected || !systemHealth.authWorking || !systemHealth.edgeFunctionsHealthy) && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive font-medium">
              ⚠️ Alguns serviços não estão funcionando corretamente. Verifique os logs do console.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
