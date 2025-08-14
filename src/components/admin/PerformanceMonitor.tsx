
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor'
import { Activity, Clock, Memory, Network, AlertTriangle } from 'lucide-react'

export const PerformanceMonitor = () => {
  const { metrics, generateReport } = usePerformanceMonitor()

  const getPerformanceScore = () => {
    let score = 100
    
    if (metrics.loadTime > 3000) score -= 20
    if (metrics.memoryUsage && metrics.memoryUsage > 50) score -= 15
    if (metrics.networkRequests > 20) score -= 10
    if (metrics.errorCount > 0) score -= metrics.errorCount * 5
    
    return Math.max(0, score)
  }

  const performanceScore = getPerformanceScore()
  const report = generateReport()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Monitor de Performance
        </CardTitle>
        <CardDescription>
          Métricas em tempo real do desempenho da aplicação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score geral */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Score de Performance</span>
            <Badge variant={performanceScore > 80 ? "default" : performanceScore > 60 ? "secondary" : "destructive"}>
              {performanceScore}/100
            </Badge>
          </div>
          <Progress value={performanceScore} className="h-2" />
        </div>

        {/* Métricas detalhadas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              Tempo de Carregamento
            </div>
            <div className="text-lg font-semibold">
              {(metrics.loadTime / 1000).toFixed(2)}s
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Network className="h-4 w-4" />
              Requisições de Rede
            </div>
            <div className="text-lg font-semibold">
              {metrics.networkRequests}
            </div>
          </div>

          {metrics.memoryUsage && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Memory className="h-4 w-4" />
                Uso de Memória
              </div>
              <div className="text-lg font-semibold">
                {metrics.memoryUsage.toFixed(1)} MB
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4" />
              Erros Detectados
            </div>
            <div className="text-lg font-semibold">
              {metrics.errorCount}
            </div>
          </div>
        </div>

        {/* Recomendações */}
        {report.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recomendações:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {report.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-yellow-500">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
