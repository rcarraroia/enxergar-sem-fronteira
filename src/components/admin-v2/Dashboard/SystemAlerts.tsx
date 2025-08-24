/**
 * SYSTEM ALERTS V2 - Alertas do sistema
 */

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Info,
  XCircle
} from "lucide-react";
import { useAdminMetricsV2 } from "@/hooks/admin-v2/useAdminMetrics";

interface SystemAlert {
  id: string
  type: "success" | "warning" | "error" | "info"
  title: string
  message: string
  timestamp: string
  priority: "high" | "medium" | "low"
}

export const SystemAlerts: React.FC = () => {
  const { data: metrics, isLoading } = useAdminMetricsV2();

  if (isLoading) {
    return null;
  }

  if (!metrics) {
    return null;
  }

  // Gerar alertas baseados nas métricas
  const alerts: SystemAlert[] = [];

  // Alerta de ocupação alta
  if (metrics.occupancyRate > 90) {
    alerts.push({
      id: "high-occupancy",
      type: "warning",
      title: "Taxa de Ocupação Alta",
      message: `Taxa de ocupação em ${metrics.occupancyRate}%. Considere criar mais eventos.`,
      timestamp: new Date().toISOString(),
      priority: "high"
    });
  }

  // Alerta de poucos eventos ativos
  if (metrics.activeEvents < 3 && metrics.totalEvents > 0) {
    alerts.push({
      id: "few-active-events",
      type: "warning",
      title: "Poucos Eventos Ativos",
      message: `Apenas ${metrics.activeEvents} eventos ativos. Considere programar mais eventos.`,
      timestamp: new Date().toISOString(),
      priority: "medium"
    });
  }

  // Alerta de sistema saudável
  if (metrics.systemHealth === "healthy" && metrics.totalEvents > 0 && metrics.totalPatients > 0) {
    alerts.push({
      id: "system-healthy",
      type: "success",
      title: "Sistema Operacional",
      message: "Todos os sistemas funcionando normalmente.",
      timestamp: new Date().toISOString(),
      priority: "low"
    });
  }

  // Alerta de erro no sistema
  if (metrics.systemHealth === "error") {
    alerts.push({
      id: "system-error",
      type: "error",
      title: "Problema no Sistema",
      message: "Detectados problemas na conectividade ou dados. Verifique as configurações.",
      timestamp: new Date().toISOString(),
      priority: "high"
    });
  }

  // Alerta informativo sobre dados
  if (metrics.totalPatients === 0 || metrics.totalEvents === 0) {
    alerts.push({
      id: "no-data",
      type: "info",
      title: "Dados Iniciais",
      message: "Sistema pronto para receber dados. Comece criando eventos e cadastrando pacientes.",
      timestamp: new Date().toISOString(),
      priority: "medium"
    });
  }

  if (alerts.length === 0) {
    return null;
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="h-4 w-4" />;
      case "warning": return <AlertTriangle className="h-4 w-4" />;
      case "error": return <XCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (type: string) => {
    switch (type) {
      case "error": return "destructive";
      case "warning": return "default";
      default: return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  // Ordenar por prioridade
  const sortedAlerts = alerts.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  return (
    <div className="space-y-4">
      {sortedAlerts.map((alert) => (
        <Alert key={alert.id} variant={getAlertVariant(alert.type)}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {getAlertIcon(alert.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium">{alert.title}</h4>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getPriorityColor(alert.priority)}`}
                >
                  {alert.priority === "high" ? "Alta" : 
                   alert.priority === "medium" ? "Média" : "Baixa"}
                </Badge>
              </div>
              <AlertDescription className="text-sm">
                {alert.message}
              </AlertDescription>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Agora mesmo</span>
              </div>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
};