/**
 * Chat Metrics Dashboard
 *
 * Dashboard para visualização de métricas do chat
 */

import { useChatConfig } from '@/hooks/useChatConfig';
import {
  useChatEventAnalysis,
  useChatMetrics,
  useChatPerformanceMetrics,
  useChatRealTimeMetrics,
  useChatSecurityMetrics
} from '@/hooks/useChatMetrics';
import React, { useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface ChatMetricsDashboardProps {
  /** Se deve mostrar métricas em tempo real */
  showRealTime?: boolean;
  /** Se deve mostrar métricas de performance */
  showPerformance?: boolean;
  /** Se deve mostrar métricas de segurança */
  showSecurity?: boolean;
  /** Se deve mostrar análise de eventos */
  showEvents?: boolean;
  /** Período de dados em ms */
  dataPeriod?: number;
  /** Intervalo de atualização em ms */
  updateInterval?: number;
  /** Classe CSS customizada */
  className?: string;
  /** Se deve mostrar apenas em modo de desenvolvimento */
  devModeOnly?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ChatMetricsDashboard: React.FC<ChatMetricsDashboardProps> = ({
  showRealTime = true,
  showPerformance = true,
  showSecurity = true,
  showEvents = false,
  dataPeriod = 300000, // 5 minutos
  updateInterval = 30000, // 30 segundos
  className = '',
  devModeOnly = false
}) => {
  const { isDevMode } = useChatConfig();
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'security' | 'events'>('overview');

  // Hooks de métricas
  const {
    snapshot,
    isLoading: mainLoading,
    error,
    lastUpdated,
    refresh,
    stats
  } = useChatMetrics({
    dataPeriod,
    updateInterval,
    includeEvents: showEvents,
    includeCustomMetrics: true
  });

  const realTimeMetrics = useChatRealTimeMetrics(5000);
  const performanceMetrics = useChatPerformanceMetrics();
  const securityMetrics = useChatSecurityMetrics();
  const eventAnalysis = useChatEventAnalysis();

  // Não renderizar se devModeOnly for true e não estiver em dev mode
  if (devModeOnly && !isDevMode) {
    return null;
  }

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }): string => {
    if (value >= thresholds.good) return '#4CAF50';
    if (value >= thresholds.warning) return '#FF9800';
    return '#f44336';
  };

  // ============================================================================
  // RENDER COMPONENTS
  // ============================================================================

  const renderMetricCard = (
    title: string,
    value: string | number,
    subtitle?: string,
    color?: string,
    trend?: 'up' | 'down' | 'stable'
  ) => (
    <div style={{
      backgroundColor: '#2a2a2a',
      borderRadius: '8px',
      padding: '16px',
      minWidth: '150px',
      border: '1px solid #444'
    }}>
      <div style={{
        fontSize: '12px',
        color: '#888',
        marginBottom: '4px',
        textTransform: 'uppercase'
      }}>
        {title}
      </div>
      <div style={{
        fontSize: '24px',
        fontWeight: 'bold',
        color: color || '#ffffff',
        marginBottom: '4px'
      }}>
        {value}
      </div>
      {subtitle && (
        <div style={{
          fontSize: '11px',
          color: '#666'
        }}>
          {subtitle}
          {trend && (
            <span style={{
              marginLeft: '4px',
              color: trend === 'up' ? '#4CAF50' : trend === 'down' ? '#f44336' : '#888'
            }}>
              {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
            </span>
          )}
        </div>
      )}
    </div>
  );

  const renderOverviewTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Métricas em tempo real */}
      {showRealTime && (
        <div>
          <h4 style={{ margin: '0 0 12px 0', color: '#4CAF50' }}>Tempo Real</h4>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {renderMetricCard(
              'Sessões Ativas',
              realTimeMetrics.activeSessions,
              'agora'
            )}
            {renderMetricCard(
              'Msgs/Min',
              realTimeMetrics.messagesPerMinute,
              'último minuto'
            )}
            {renderMetricCard(
              'Tempo Resposta',
              formatDuration(realTimeMetrics.averageResponseTime),
              'média atual',
              getStatusColor(realTimeMetrics.averageResponseTime, { good: 2000, warning: 5000 })
            )}
            {renderMetricCard(
              'Taxa de Erro',
              formatPercentage(realTimeMetrics.errorRate),
              'último minuto',
              getStatusColor(1 - realTimeMetrics.errorRate, { good: 0.95, warning: 0.9 })
            )}
          </div>
        </div>
      )}

      {/* Resumo geral */}
      <div>
        <h4 style={{ margin: '0 0 12px 0', color: '#2196F3' }}>Resumo ({formatDuration(dataPeriod)})</h4>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {renderMetricCard(
            'Total Sessões',
            stats.totalSessions,
            `${stats.activeSessions} ativas`
          )}
          {renderMetricCard(
            'Total Mensagens',
            stats.totalMessages,
            'enviadas + recebidas'
          )}
          {renderMetricCard(
            'Tempo Médio',
            formatDuration(stats.averageResponseTime),
            'resposta'
          )}
          {renderMetricCard(
            'Taxa Sucesso',
            formatPercentage(stats.successRate),
            'webhooks',
            getStatusColor(stats.successRate, { good: 0.95, warning: 0.9 })
          )}
        </div>
      </div>

      {/* Distribuição por tipo de usuário */}
      {snapshot && (
        <div>
          <h4 style={{ margin: '0 0 12px 0', color: '#FF9800' }}>Por Tipo de Usuário</h4>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {renderMetricCard(
              'Público',
              snapshot.sessions.byUserType.public,
              'sessões'
            )}
            {renderMetricCard(
              'Admin',
              snapshot.sessions.byUserType.admin,
              'sessões'
            )}
            {renderMetricCard(
              'Msgs Público',
              snapshot.messages.byUserType.public,
              'mensagens'
            )}
            {renderMetricCard(
              'Msgs Admin',
              snapshot.messages.byUserType.admin,
              'mensagens'
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderPerformanceTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#4CAF50' }}>Performance</h4>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {renderMetricCard(
          'Tempo Médio',
          formatDuration(performanceMetrics.averageResponseTime),
          'resposta',
          getStatusColor(performanceMetrics.averageResponseTime, { good: 2000, warning: 5000 })
        )}
        {renderMetricCard(
          'P95',
          formatDuration(performanceMetrics.p95ResponseTime),
          '95% das respostas',
          getStatusColor(performanceMetrics.p95ResponseTime, { good: 5000, warning: 10000 })
        )}
        {renderMetricCard(
          'P99',
          formatDuration(performanceMetrics.p99ResponseTime),
          '99% das respostas',
          getStatusColor(performanceMetrics.p99ResponseTime, { good: 10000, warning: 20000 })
        )}
        {renderMetricCard(
          'Webhook Success',
          formatPercentage(performanceMetrics.webhookSuccessRate),
          'taxa de sucesso',
          getStatusColor(performanceMetrics.webhookSuccessRate, { good: 0.95, warning: 0.9 })
        )}
        {renderMetricCard(
          'Validation Success',
          formatPercentage(performanceMetrics.validationSuccessRate),
          'taxa de validação',
          getStatusColor(performanceMetrics.validationSuccessRate, { good: 0.98, warning: 0.95 })
        )}
      </div>

      {snapshot && (
        <div>
          <h5 style={{ margin: '16px 0 8px 0', color: '#888' }}>Detalhes de Sessão</h5>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {renderMetricCard(
              'Duração Média',
              formatDuration(snapshot.sessions.averageDuration),
              'por sessão'
            )}
            {renderMetricCard(
              'Completadas',
              snapshot.sessions.completed,
              'sessões'
            )}
            {renderMetricCard(
              'Abandonadas',
              snapshot.sessions.abandoned,
              'sessões'
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderSecurityTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#f44336' }}>Segurança</h4>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {renderMetricCard(
          'Violações',
          securityMetrics.violationsDetected,
          'detectadas',
          securityMetrics.violationsDetected > 0 ? '#f44336' : '#4CAF50'
        )}
        {renderMetricCard(
          'Sessões Bloqueadas',
          securityMetrics.sessionsBlocked,
          'por segurança',
          securityMetrics.sessionsBlocked > 0 ? '#f44336' : '#4CAF50'
        )}
        {renderMetricCard(
          'Rate Limit',
          securityMetrics.rateLimitHits,
          'hits',
          securityMetrics.rateLimitHits > 10 ? '#FF9800' : '#4CAF50'
        )}
        {renderMetricCard(
          'Atividade Suspeita',
          securityMetrics.suspiciousActivity,
          'eventos',
          securityMetrics.suspiciousActivity > 0 ? '#f44336' : '#4CAF50'
        )}
      </div>

      {snapshot && snapshot.errors.total > 0 && (
        <div>
          <h5 style={{ margin: '16px 0 8px 0', color: '#888' }}>Erros por Tipo</h5>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {Object.entries(snapshot.errors.byType).map(([type, count]) =>
              renderMetricCard(
                type.replace(/_/g, ' '),
                count,
                'ocorrências',
                '#f44336'
              )
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderEventsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#9C27B0' }}>Eventos</h4>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {Object.entries(eventAnalysis.eventCounts).map(([type, count]) =>
          renderMetricCard(
            type.replace(/_/g, ' '),
            count,
            'eventos'
          )
        )}
      </div>

      {eventAnalysis.events.length > 0 && (
        <div>
          <h5 style={{ margin: '16px 0 8px 0', color: '#888' }}>Eventos Recentes</h5>
          <div style={{
            maxHeight: '200px',
            overflow: 'auto',
            backgroundColor: '#1a1a1a',
            borderRadius: '4px',
            padding: '8px'
          }}>
            {eventAnalysis.events.slice(-10).reverse().map((event, index) => (
              <div key={index} style={{
                padding: '4px 0',
                borderBottom: '1px solid #333',
                fontSize: '11px',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span style={{ color: '#4CAF50' }}>
                  {event.type.replace(/_/g, ' ')}
                </span>
                <span style={{ color: '#888' }}>
                  {event.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  const containerStyles: React.CSSProperties = {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    borderRadius: '8px',
    padding: '16px',
    fontFamily: 'monospace',
    fontSize: '12px',
    maxWidth: '800px',
    margin: '0 auto'
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #333'
  };

  const tabStyles: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px'
  };

  const tabButtonStyles = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    border: 'none',
    backgroundColor: active ? '#444' : '#2a2a2a',
    color: '#ffffff',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '11px',
    transition: 'background-color 0.2s'
  });

  if (error) {
    return (
      <div style={{ ...containerStyles, textAlign: 'center' }}>
        <div style={{ color: '#f44336', marginBottom: '8px' }}>
          Erro ao carregar métricas
        </div>
        <div style={{ color: '#888', fontSize: '10px', marginBottom: '12px' }}>
          {error.message}
        </div>
        <button
          onClick={refresh}
          style={{
            padding: '6px 12px',
            backgroundColor: '#444',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className={className} style={containerStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <div>
          <h3 style={{ margin: '0', color: '#4CAF50' }}>Chat Metrics</h3>
          {lastUpdated && (
            <div style={{ fontSize: '10px', color: '#888' }}>
              Atualizado: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {mainLoading && (
            <div style={{ color: '#4CAF50', fontSize: '10px' }}>
              Carregando...
            </div>
          )}
          <button
            onClick={refresh}
            style={{
              padding: '4px 8px',
              backgroundColor: '#444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
            title="Atualizar métricas"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={tabStyles}>
        <button
          style={tabButtonStyles(activeTab === 'overview')}
          onClick={() => setActiveTab('overview')}
        >
          Visão Geral
        </button>
        {showPerformance && (
          <button
            style={tabButtonStyles(activeTab === 'performance')}
            onClick={() => setActiveTab('performance')}
          >
            Performance
          </button>
        )}
        {showSecurity && (
          <button
            style={tabButtonStyles(activeTab === 'security')}
            onClick={() => setActiveTab('security')}
          >
            Segurança
          </button>
        )}
        {showEvents && (
          <button
            style={tabButtonStyles(activeTab === 'events')}
            onClick={() => setActiveTab('events')}
          >
            Eventos
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'performance' && renderPerformanceTab()}
      {activeTab === 'security' && renderSecurityTab()}
      {activeTab === 'events' && renderEventsTab()}
    </div>
  );
};

// ============================================================================
// DEVELOPMENT ONLY WRAPPER
// ============================================================================

/**
 * Wrapper que só renderiza o dashboard em desenvolvimento
 */
export const DevChatMetricsDashboard: React.FC<Omit<ChatMetricsDashboardProps, 'devModeOnly'>> = (props) => {
  return <ChatMetricsDashboard {...props} devModeOnly={true} />;
};

// ============================================================================
// EXPORTS
// ============================================================================

export default ChatMetricsDashboard;
