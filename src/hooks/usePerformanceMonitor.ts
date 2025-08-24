
import { useCallback, useEffect, useState } from "react";

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  memoryUsage?: number
  networkRequests: number
  errorCount: number
}

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    networkRequests: 0,
    errorCount: 0
  });

  const [isMonitoring, setIsMonitoring] = useState(false);

  // Medir tempo de carregamento
  const measureLoadTime = useCallback(() => {
    const navigationTiming = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    if (navigationTiming) {
      const loadTime = navigationTiming.loadEventEnd - navigationTiming.loadEventStart;
      setMetrics(prev => ({ ...prev, loadTime }));
    }
  }, []);

  // Medir uso de memória (quando disponível)
  const measureMemoryUsage = useCallback(() => {
    if ("memory" in performance) {
      const {memory} = (performance as any);
      setMetrics(prev => ({ 
        ...prev, 
        memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB
      }));
    }
  }, []);

  // Contar requisições de rede
  const countNetworkRequests = useCallback(() => {
    const requests = performance.getEntriesByType("resource").length;
    setMetrics(prev => ({ ...prev, networkRequests: requests }));
  }, []);

  // Monitorar erros
  const handleError = useCallback(() => {
    setMetrics(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
  }, []);

  // Iniciar monitoramento
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    
    // Eventos de erro
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleError);
    
    // Medições periódicas
    const interval = setInterval(() => {
      measureLoadTime();
      measureMemoryUsage();
      countNetworkRequests();
    }, 5000);

    return () => {
      setIsMonitoring(false);
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleError);
      clearInterval(interval);
    };
  }, [measureLoadTime, measureMemoryUsage, countNetworkRequests, handleError]);

  // Gerar relatório de performance
  const generateReport = useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      recommendations: []
    };

    // Análise e recomendações
    const recommendations: string[] = [];
    
    if (metrics.loadTime > 3000) {
      recommendations.push("Tempo de carregamento alto - considere otimizações");
    }
    
    if (metrics.memoryUsage && metrics.memoryUsage > 50) {
      recommendations.push("Alto uso de memória - verifique vazamentos");
    }
    
    if (metrics.networkRequests > 20) {
      recommendations.push("Muitas requisições - considere bundling");
    }
    
    if (metrics.errorCount > 0) {
      recommendations.push(`${metrics.errorCount} erros detectados - revisar logs`);
    }

    return { ...report, recommendations };
  }, [metrics]);

  useEffect(() => {
    // Iniciar monitoramento automaticamente
    const cleanup = startMonitoring();
    return cleanup;
  }, [startMonitoring]);

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    generateReport
  };
};
