/**
 * Exemplo Avançado de Chat
 *
 * Demonstra funcionalidades avançadas como voz, métricas e configurações
 */

import { ChatInterface, ChatMetricsDashboard, ChatPerformanceMonitor } from '@/components/chat';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChatConfig, useChatHistory, useChatPerformance } from '@/hooks';
import React, { useEffect, useState } from 'react';

// ============================================================================
// COMPONENT
// ============================================================================

export const AdvancedChatExample: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);

  // Hooks
  const { config, updateConfig } = useChatConfig();
  const chatHistory = useChatHistory();
  const {
    metrics,
    isHealthy,
    alerts,
    forceCleanup,
    getOptimizationRecommendations
  } = useChatPerformance({
    autoInitialize: true,
    trackMetrics: true
  });

  // Estados derivados
  const currentSession = sessionId ? chatHistory.getSession(sessionId) : null;
  const allSessions = chatHistory.getAllSessions();
  const recommendations = getOptimizationRecommendations();

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    // Configurar chat para exemplo avançado
    updateConfig({
      enableVoiceInput: true,
      enableMetrics: true,
      enableDevMode: true,
      maxMessageLength: 2000
    });
  }, [updateConfig]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSessionStart = (newSessionId: string) => {
    setSessionId(newSessionId);
    console.log('🚀 Sessão avançada iniciada:', newSessionId);
  };

  const handleSessionEnd = (endedSessionId: string) => {
    console.log('🏁 Sessão avançada finalizada:', endedSessionId);
  };

  const handleError = (error: any) => {
    console.error('❌ Erro no chat avançado:', error);
  };

  const handleMetrics = (event: string, data: any) => {
    console.log('📊 Métrica avançada:', event, data);
  };

  const handleConfigChange = (key: string, value: any) => {
    updateConfig({ [key]: value });
  };

  const clearAllSessions = () => {
    allSessions.forEach(session => {
      chatHistory.endSession(session.id);
    });
    setSessionId(null);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exemplo Avançado de Chat</CardTitle>
          <p className="text-muted-foreground">
            Demonstração completa com voz, métricas, performance e configurações
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="config">Configurações</TabsTrigger>
              <TabsTrigger value="metrics">Métricas</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            {/* Tab: Chat */}
            <TabsContent value="chat" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chat Interface */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Chat com Recursos Avançados</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={sessionId ? "default" : "secondary"}>
                        {sessionId ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge variant={isHealthy ? "default" : "destructive"}>
                        {isHealthy ? "Saudável" : "Problemas"}
                      </Badge>
                    </div>
                  </div>

                  <ChatInterface
                    type="public"
                    webhookUrl={process.env.VITE_N8N_PUBLIC_WEBHOOK_URL || 'https://demo.n8n.com/webhook/chat'}
                    placeholder="Digite ou fale sua mensagem..."
                    maxHeight={500}
                    enableVoice={config.enableVoiceInput}
                    onSessionStart={handleSessionStart}
                    onSessionEnd={handleSessionEnd}
                    onError={handleError}
                    onMetrics={handleMetrics}
                    theme="light"
                    className="border rounded-lg"
                  />
                </div>

                {/* Informações da Sessão */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informações</h3>

                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Sessão Atual</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {sessionId || 'Nenhuma'}
                      </p>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Mensagens</p>
                      <p className="text-xs text-muted-foreground">
                        {currentSession?.messages.length || 0} na sessão atual
                      </p>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Total de Sessões</p>
                      <p className="text-xs text-muted-foreground">
                        {allSessions.length} sessões no histórico
                      </p>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Memória</p>
                      <p className="text-xs text-muted-foreground">
                        {(metrics.memoryUsage.used / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>

                    {alerts.length > 0 && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm font-medium text-destructive">Alertas</p>
                        <p className="text-xs text-destructive/80">
                          {alerts.length} problema(s) detectado(s)
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={clearAllSessions}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Limpar Histórico
                    </Button>

                    <Button
                      onClick={forceCleanup}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Limpeza de Memória
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Configurações */}
            <TabsContent value="config" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações do Chat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Funcionalidades</h4>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="voice-input">Entrada de Voz</Label>
                        <Switch
                          id="voice-input"
                          checked={config.enableVoiceInput}
                          onCheckedChange={(checked) => handleConfigChange('enableVoiceInput', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="metrics">Métricas</Label>
                        <Switch
                          id="metrics"
                          checked={config.enableMetrics}
                          onCheckedChange={(checked) => handleConfigChange('enableMetrics', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="notifications">Notificações</Label>
                        <Switch
                          id="notifications"
                          checked={config.enableNotifications}
                          onCheckedChange={(checked) => handleConfigChange('enableNotifications', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="persistence">Persistência</Label>
                        <Switch
                          id="persistence"
                          checked={config.enablePersistence}
                          onCheckedChange={(checked) => handleConfigChange('enablePersistence', checked)}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Limites</h4>

                      <div className="space-y-2">
                        <Label>Tamanho Máximo da Mensagem</Label>
                        <p className="text-sm text-muted-foreground">
                          {config.maxMessageLength} caracteres
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Timeout da Sessão</Label>
                        <p className="text-sm text-muted-foreground">
                          {Math.round(config.sessionTimeout / (1000 * 60))} minutos
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Intervalo de Limpeza</Label>
                        <p className="text-sm text-muted-foreground">
                          {Math.round(config.cleanupInterval / (1000 * 60 * 60))} horas
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Configuração Atual (JSON)</h4>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(config, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Métricas */}
            <TabsContent value="metrics" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Dashboard de Métricas</h3>
                <Switch
                  checked={showMetrics}
                  onCheckedChange={setShowMetrics}
                />
              </div>

              {showMetrics && (
                <ChatMetricsDashboard
                  showRealTime={true}
                  showHistorical={true}
                  timeRange="1h"
                  refreshInterval={10000}
                />
              )}

              {!showMetrics && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      Ative o switch acima para visualizar as métricas
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab: Performance */}
            <TabsContent value="performance" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Monitor de Performance</h3>
                <Switch
                  checked={showPerformance}
                  onCheckedChange={setShowPerformance}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {(metrics.memoryUsage.used / (1024 * 1024)).toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">MB Memória</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{metrics.averageFPS}</p>
                      <p className="text-xs text-muted-foreground">FPS</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {Math.round(metrics.networkLatency)}
                      </p>
                      <p className="text-xs text-muted-foreground">ms Latência</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{alerts.length}</p>
                      <p className="text-xs text-muted-foreground">Alertas</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recomendações de Otimização</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {recommendations.map((rec, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-muted-foreground">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {showPerformance && (
                <div className="relative">
                  <ChatPerformanceMonitor
                    showDetailed={true}
                    showAlerts={true}
                    showAutoOptimization={true}
                    position="bottom-right"
                    devModeOnly={false}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedChatExample;
