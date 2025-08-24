/**
 * STATS CHART V2 - Gráfico de estatísticas simples
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingDown, TrendingUp } from "lucide-react";
import { useAdminMetricsV2 } from "@/hooks/admin-v2/useAdminMetrics";

interface StatItem {
  label: string
  value: number
  percentage: number
  trend: "up" | "down" | "stable"
}

export const StatsChart: React.FC = () => {
  const { data: metrics, isLoading } = useAdminMetricsV2();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Estatísticas Visuais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-2 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return null;
  }

  // Calcular estatísticas baseadas nas métricas
  const totalCapacity = metrics.totalEvents * 20; // Estimativa de 20 vagas por evento
  const registrationRate = totalCapacity > 0 ? (metrics.totalRegistrations / totalCapacity) * 100 : 0;
  const activeEventRate = metrics.totalEvents > 0 ? (metrics.activeEvents / metrics.totalEvents) * 100 : 0;

  const stats: StatItem[] = [
    {
      label: "Taxa de Inscrições",
      value: metrics.totalRegistrations,
      percentage: Math.min(registrationRate, 100),
      trend: registrationRate > 70 ? "up" : registrationRate > 40 ? "stable" : "down"
    },
    {
      label: "Eventos Ativos",
      value: metrics.activeEvents,
      percentage: activeEventRate,
      trend: activeEventRate > 60 ? "up" : activeEventRate > 30 ? "stable" : "down"
    },
    {
      label: "Taxa de Ocupação",
      value: metrics.occupancyRate,
      percentage: metrics.occupancyRate,
      trend: metrics.occupancyRate > 80 ? "up" : metrics.occupancyRate > 50 ? "stable" : "down"
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="h-3 w-3 text-green-600" />;
      case "down": return <TrendingDown className="h-3 w-3 text-red-600" />;
      default: return <div className="h-3 w-3 rounded-full bg-yellow-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up": return "text-green-600";
      case "down": return "text-red-600";
      default: return "text-yellow-600";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Estatísticas Visuais
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {stats.map((stat, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {stat.label}
                </span>
                <div className="flex items-center gap-2">
                  {getTrendIcon(stat.trend)}
                  <Badge variant="outline" className={getTrendColor(stat.trend)}>
                    {typeof stat.value === "number" && stat.label !== "Taxa de Ocupação" 
                      ? stat.value 
                      : `${stat.value}%`
                    }
                  </Badge>
                </div>
              </div>
              
              {/* Barra de progresso visual */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    stat.trend === "up" 
                      ? "bg-green-500" 
                      : stat.trend === "down" 
                        ? "bg-red-500" 
                        : "bg-yellow-500"
                  }`}
                  style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>{stat.percentage.toFixed(1)}%</span>
                <span>100%</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Status geral do sistema */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status do Sistema</span>
            <Badge 
              variant={metrics.systemHealth === "healthy" ? "default" : "destructive"}
              className={
                metrics.systemHealth === "healthy" 
                  ? "bg-green-100 text-green-800 border-green-200" 
                  : metrics.systemHealth === "warning"
                    ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                    : "bg-red-100 text-red-800 border-red-200"
              }
            >
              {metrics.systemHealth === "healthy" ? "✅ Saudável" : 
               metrics.systemHealth === "warning" ? "⚠️ Atenção" : "❌ Erro"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};