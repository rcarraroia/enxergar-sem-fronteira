/**
 * Exemplo Básico de Chat
 *
 * Demonstra como implementar um chat simples com funcionalidades básicas
 */

import { ChatInterface } from '@/components/chat';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import React, { useState } from 'react';

// ============================================================================
// COMPONENT
// ============================================================================

export const BasicChatExample: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSessionStart = (newSessionId: string) => {
    setSessionId(newSessionId);
    setIsActive(true);
    setMessageCount(0);
    console.log('🚀 Nova sessão de chat iniciada:', newSessionId);
  };

  const handleSessionEnd = (endedSessionId: string) => {
    console.log('🏁 Sessão de chat finalizada:', endedSessionId);
    setIsActive(false);
  };

  const handleError = (error: any) => {
    console.error('❌ Erro no chat:', error);
    alert(`Erro no chat: ${error.message}`);
  };

  const handleMetrics = (event: string, data: any) => {
    console.log('📊 Métrica capturada:', event, data);

    if (event === 'message_sent') {
      setMessageCount(prev => prev + 1);
    }
  };

  const resetChat = () => {
    setSessionId(null);
    setIsActive(false);
    setMessageCount(0);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exemplo Básico de Chat</CardTitle>
          <p className="text-muted-foreground">
            Demonstração de um chat simples com integração n8n
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chat Interface */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Chat Interface</h3>
                <div className="flex items-center gap-2">
                  <Badge variant={isActive ? "default" : "secondary"}>
                    {isActive ? "Ativo" : "Inativo"}
                  </Badge>
                  {sessionId && (
                    <Badge variant="outline">
                      {messageCount} mensagens
                    </Badge>
                  )}
                </div>
              </div>

              <ChatInterface
                type="public"
                webhookUrl={process.env.VITE_N8N_PUBLIC_WEBHOOK_URL || 'https://demo.n8n.com/webhook/chat'}
                placeholder="Digite sua mensagem aqui..."
                maxHeight={400}
                enableVoice={false}
                onSessionStart={handleSessionStart}
                onSessionEnd={handleSessionEnd}
                onError={handleError}
                onMetrics={handleMetrics}
                theme="light"
                className="border rounded-lg"
              />

              <Button
                onClick={resetChat}
                variant="outline"
                size="sm"
                disabled={!sessionId}
              >
                Resetar Chat
              </Button>
            </div>

            {/* Informações da Sessão */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações da Sessão</h3>

              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Session ID</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {sessionId || 'Nenhuma sessão ativa'}
                  </p>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-xs text-muted-foreground">
                    {isActive ? 'Chat ativo e funcionando' : 'Chat inativo'}
                  </p>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Mensagens Enviadas</p>
                  <p className="text-xs text-muted-foreground">
                    {messageCount} mensagens nesta sessão
                  </p>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Webhook URL</p>
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    {process.env.VITE_N8N_PUBLIC_WEBHOOK_URL || 'https://demo.n8n.com/webhook/chat'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Código de Exemplo */}
      <Card>
        <CardHeader>
          <CardTitle>Código de Implementação</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
            <code>{`import { ChatInterface } from '@/components/chat';

const MyComponent = () => {
  const handleSessionStart = (sessionId) => {
    console.log('Sessão iniciada:', sessionId);
  };

  const handleError = (error) => {
    console.error('Erro:', error);
  };

  return (
    <ChatInterface
      type="public"
      webhookUrl="https://your-n8n.com/webhook/chat"
      placeholder="Digite sua mensagem..."
      maxHeight={400}
      onSessionStart={handleSessionStart}
      onError={handleError}
      theme="light"
    />
  );
};`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default BasicChatExample;
