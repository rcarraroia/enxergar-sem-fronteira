/**
 * Chat Performance Monitor
 *
 * Componente para monitorar e exibir métricas de performance do chat
 */

import { useChatConfig } from '@/hooks/useChatConfig';
import {
  useChatPerformance
} from '@/hooks/useChatPerformance';
import React, { useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface PerformanceAlert {
  message: string;
  severity: 'low' | 'medium' | 'high';
  type: string;
  timestamp: Date;
}

interface ChatPerformanceMonitorProps {
  /** Se deve mostrar métricas detalhadas */
  showDetailed?: boolean;
  /** Se deve mostrar alertas */
  showAlerts?: boolean;
  /** Se deve mostrar otimizações automáticas */
  showAutoOptimization?: boolean;
  /** Posição do monitor */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Se deve mostrar apenas em modo de desenvolvimento */
  devModeOnly?: boolean;
  /** Classe CSS customizada */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ChatPerformanceMonitor: React.FC<ChatPerformanceMonitorProps> = ({
  showDetailed = false,
  showAlerts = true,
  showAutoOptimization = false,
  position = 'bottom-left',
  devModeOnly = true,
  className = ''
}) => {
  const { config } = useChatConfig();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'alerts' | 'optimization'>('metrics');

  // Hooks de performance
  const { metrics, forceCleanup } = useChatPerformance();
  const { memoryUsage, isMemoryHigh } = useMemoryMonitoring();

  // Estados simulados para compatibilidade
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [alerts] = useState<PerformanceAlert[]>([]);
  const isHealthy = !isMemoryHigh;
  const lastUpdated = new Date();

  // Métricas simuladas para compatibilidade
  const realTimeMetrics = {
    memoryUsage: memoryUsage?.used ? memoryUsage.used / (1024 * 1024) : 0,
    fps: 60,
    latency: 50
  };

  const startMonitoring = () => setIsMonitoring(true);
  const stopMonitoring = () => setIsMonitoring(false);
  const updateMetrics = () => { };
  const clearAlerts = () => { };
  const getOptimizationRecommendations = () => [];

  // Estados de otimização simulados
  const isOptimizing = false;
  const optimizationLevel = 'basic';
  const recommendations: string[] = [];
  const applyOptimizations = (level: string) => { };

  // Não renderizar se devModeOnly for true e não estiver em dev mode
  if (devModeOnly && !config.enableDevMode) {
    return null;
  }

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getHealthColor = (isHealthy: boolean): string => {
    return isHealthy ? '#4CAF50' : '#f44336';
  };

  const getMetricColor = (value: number, thresholds: { good: number; warning: number }): string => {
    if (value <= thresholds.good) return '#4CAF50';
    if (value <= thresholds.warning) return '#FF9800';
    return '#f44336';
  };

  const getSeverityColor = (severity: PerformanceAlert['severity']): string => {
    switch (severity) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#f44336';
      default: return '#888';
    }
  };

  // ============================================================================
  // RENDER COMPONENTS
  // ============================================================================

  const renderCompactView = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      fontSize: '11px'
    }}>
      {/* Status geral */}
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: getHealthColor(isHealthy)
      }} />

      {/* Métricas básicas */}
      <span style={{ color: getMetricColor(realTimeMetrics.memoryUsage, { good: 50, warning: 100 }) }}>
        {formatBytes(realTimeMetrics.memoryUsage * 1024 * 1024)}
      </span>

      <span style={{ color: getMetricColor(realTimeMetrics.fps, { good: 60, warning: 30 }) }}>
        {realTimeMetrics.fps}fps
      </span>

      {realTimeMetrics.latency > 0 && (
        <span style={{ color: getMetricColor(realTimeMetrics.latency, { good: 100, warning: 500 }) }}>
          {Math.round(realTimeMetrics.latency)}ms
        </span>
      )}

      {/* Alertas */}
      {alerts.length > 0 && (
        <span style={{
          backgroundColor: '#f44336',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '10px',
          fontSize: '10px'
        }}>
          {alerts.length}
        </span>
      )}
    </div>
  );

  const renderDetailedMetrics = () => (
    <div style={{ padding: '12px', fontSize: '12px' }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Métricas de Performance</h4>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <strong>Memória:</strong>
          <div style={{ color: getMetricColor(metrics.memoryUsage.used / (1024 * 1024), { good: 50, warning: 100 }) }}>
            {formatBytes(metrics.memoryUsage.used)} / {formatBytes(metrics.memoryUsage.total)}
          </div>
        </div>

        <div>
          <strong>FPS:</strong>
          <div style={{ color: getMetricColor(metrics.averageFPS, { good: 60, warning: 30 }) }}>
            {metrics.averageFPS}
          </div>
        </div>

        <div>
          <strong>Latência:</strong>
          <div style={{ color: getMetricColor(metrics.networkLatency, { good: 100, warning: 500 }) }}>
            {formatDuration(metrics.networkLatency)}
          </div>
        </div>

        <div>
          <strong>Carregamento:</strong>
          <div style={{ color: getMetricColor(metrics.resourceLoadTime, { good: 1000, warning: 3000 }) }}>
            {formatDuration(metrics.resourceLoadTime)}
          </div>
        </div>

        <div>
          <strong>DOM Ready:</strong>
          <div>{formatDuration(metrics.domContentLoaded)}</div>
        </div>

        <div>
          <strong>FCP:</strong>
          <div>{formatDuration(metrics.firstContentfulPaint)}</div>
        </div>
      </div>

      {lastUpdated && (
        <div style={{ marginTop: '8px', color: '#666', fontSize: '10px' }}>
          Última atualização: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );

  const renderAlerts = () => (
    <div style={{ padding: '12px', fontSize: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '14px' }}>Alertas ({alerts.length})</h4>
        {alerts.length > 0 && (
          <button
            onClick={clearAlerts}
            style={{
              background: 'none',
              border: '1px solid #ccc',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            Limpar
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div style={{ color: '#666', fontStyle: 'italic' }}>Nenhum alerta</div>
      ) : (
        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
          {alerts.slice(-5).map((alert, index) => (
            <div
              key={index}
              style={{
                padding: '6px',
                marginBottom: '4px',
                borderLeft: `3px solid ${getSeverityColor(alert.severity)}`,
                backgroundColor: '#f9f9f9',
                fontSize: '11px'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{alert.message}</div>
              <div style={{ color: '#666', fontSize: '10px' }}>
                {alert.timestamp.toLocaleTimeString()} - {alert.type}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderOptimization = () => (
    <div style={{ padding: '12px', fontSize: '12px' }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Otimização</h4>

      <div style={{ marginBottom: '12px' }}>
        <strong>Nível atual:</strong> {optimizationLevel}
      </div>

      <div style={{ marginBottom: '12px' }}>
        <button
          onClick={() => applyOptimizations('basic')}
          disabled={isOptimizing}
          style={{
            marginRight: '8px',
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: isOptimizing ? 'not-allowed' : 'pointer',
            opacity: isOptimizing ? 0.6 : 1
          }}
        >
          Otimização Básica
        </button>

        <button
          onClick={() => applyOptimizations('aggressive')}
          disabled={isOptimizing}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: isOptimizing ? 'not-allowed' : 'pointer',
            opacity: isOptimizing ? 0.6 : 1
          }}
        >
          Otimização Agressiva
        </button>
      </div>

      {recommendations.length > 0 && (
        <div>
          <strong>Recomendações:</strong>
          <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
            {recommendations.map((rec, index) => (
              <li key={index} style={{ fontSize: '11px', marginBottom: '2px' }}>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: '12px' }}>
        <button
          onClick={forceCleanup}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Limpeza Manual
        </button>

        <button
          onClick={updateMetrics}
          style={{
            marginLeft: '8px',
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Atualizar Métricas
        </button>
      </div>
    </div>
  );

  const renderExpandedView = () => (
    <div>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #ccc'
      }}>
        {[
          { key: 'metrics', label: 'Métricas' },
          { key: 'alerts', label: `Alertas (${alerts.length})` },
          { key: 'optimization', label: 'Otimização' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '8px 12px',
              border: 'none',
              background: activeTab === tab.key ? '#f0f0f0' : 'transparent',
              fontSize: '11px',
              cursor: 'pointer',
              borderBottom: activeTab === tab.key ? '2px solid #007acc' : 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'metrics' && renderDetailedMetrics()}
      {activeTab === 'alerts' && renderAlerts()}
      {activeTab === 'optimization' && renderOptimization()}
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  const getPositionStyles = () => {
    const base = {
      position: 'fixed' as const,
      zIndex: 9999,
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '6px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      fontFamily: 'monospace',
      minWidth: isExpanded ? '300px' : '150px',
      maxWidth: isExpanded ? '400px' : '200px'
    };

    switch (position) {
      case 'top-left':
        return { ...base, top: '10px', left: '10px' };
      case 'top-right':
        return { ...base, top: '10px', right: '10px' };
      case 'bottom-left':
        return { ...base, bottom: '10px', left: '10px' };
      case 'bottom-right':
        return { ...base, bottom: '10px', right: '10px' };
      default:
        return { ...base, bottom: '10px', left: '10px' };
    }
  };

  return (
    <div style={getPositionStyles()} className={className}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 8px',
          borderBottom: '1px solid #eee',
          cursor: 'pointer',
          backgroundColor: '#f8f8f8'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span style={{ fontSize: '11px', fontWeight: 'bold' }}>
          Performance {isMonitoring ? '●' : '○'}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {alerts.length > 0 && (
            <span style={{
              backgroundColor: '#f44336',
              color: 'white',
              padding: '1px 4px',
              borderRadius: '8px',
              fontSize: '9px'
            }}>
              {alerts.length}
            </span>
          )}

          <span style={{ fontSize: '10px' }}>
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </div>

      {/* Content */}
      {isExpanded ? renderExpandedView() : renderCompactView()}

      {/* Controls */}
      {isExpanded && (
        <div style={{
          padding: '6px 8px',
          borderTop: '1px solid #eee',
          backgroundColor: '#f8f8f8',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            style={{
              padding: '2px 6px',
              border: '1px solid #ccc',
              borderRadius: '3px',
              fontSize: '10px',
              cursor: 'pointer',
              backgroundColor: isMonitoring ? '#f44336' : '#4CAF50',
              color: 'white'
            }}
          >
            {isMonitoring ? 'Parar' : 'Iniciar'}
          </button>

          <span style={{ fontSize: '9px', color: '#666' }}>
            Chat Performance Monitor
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SIMPLIFIED COMPONENTS
// ============================================================================

/**
 * Componente simplificado para mostrar apenas status
 */
export const ChatPerformanceStatus: React.FC<{
  position?: ChatPerformanceMonitorProps['position'];
}> = ({ position = 'bottom-right' }) => {
  const { isHealthy, memoryUsage, fps } = useChatPerformanceMonitor();

  return (
    <div style={{
      position: 'fixed',
      [position.includes('top') ? 'top' : 'bottom']: '10px',
      [position.includes('left') ? 'left' : 'right']: '10px',
      zIndex: 9999,
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '20px',
      padding: '4px 8px',
      fontSize: '10px',
      fontFamily: 'monospace',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: getHealthColor(isHealthy)
      }} />
      <span>{formatBytes(memoryUsage * 1024 * 1024)}</span>
      <span>{fps}fps</span>
    </div>
  );
};

/**
 * Componente para alertas flutuantes
 */
export const ChatPerformanceAlerts: React.FC = () => {
  const { alerts, clearAlerts } = useChatPerformance();
  const [visibleAlerts, setVisibleAlerts] = useState<PerformanceAlert[]>([]);

  React.useEffect(() => {
    // Mostrar apenas alertas de alta severidade
    const highSeverityAlerts = alerts.filter(alert => alert.severity === 'high');
    setVisibleAlerts(highSeverityAlerts.slice(-3)); // Máximo 3 alertas
  }, [alerts]);

  if (visibleAlerts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {visibleAlerts.map((alert, index) => (
        <div
          key={index}
          style={{
            backgroundColor: '#f44336',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            maxWidth: '250px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          <div style={{ fontWeight: 'bold' }}>{alert.message}</div>
          <div style={{ fontSize: '10px', opacity: 0.8 }}>
            {alert.timestamp.toLocaleTimeString()}
          </div>
          <button
            onClick={() => {
              setVisibleAlerts(prev => prev.filter((_, i) => i !== index));
            }}
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default ChatPerformanceMonitor;
