/**
 * Exemplo de Chat com Funcionalidade Offline
 *
 * Este exemplo demonstra como usar o sistema de chat com suporte offline,
 * incluindo fallbacks inteligentes e sincronização automática.
 */

import { ChatInterface } from '@/components/chat';
import { useN8nChat } from '@/hooks/useN8nChat';
import { useOfflineChat } from '@/hooks/useOfflineChat';
import { createDefaultN8nConfig } from '@/lib/chat/n8nClient';
import React, { useState } from 'react';

interface OfflineChatExampleProps {
  webhookUrl: string;
  enableVoice?: boolean;
  theme?: 'light' | 'dark';
}

/**
 * Exemplo de chat com funcionalidade offline completa
 */
const OfflineChatExample: React.FC<OfflineChatExampleProps> = ({
  webhookUrl,
  enableVoice = true,
  theme = 'light'
}) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [syncHistory, setSyncHistory] = useState<Array<{
    timestamp: number;
    status: 'success' | 'error';
    messageCount: number;
    error?: string;
  }>>([]);

  // Configuração n8n
  const n8nConfig = createDefaultN8nConfig(webhookUrl);
  const n8nChat = useN8nChat(n8nConfig);

  // Sistema offline
  const offlineChat = useOfflineChat({
    // Respostas de fallback personalizadas
    fallbackResponses: {
      greeting: "Olá! 👋 No momento estou offline, mas sua mensagem foi salva e será processada assim que a conexão for restabelecida.",
      general: "Desculpe, estou temporariamente offline. 📱 Sua mensagem foi registrada e você receberá uma resposta em breve.",
      error: "Não foi possível conectar ao servidor. 🔄 Suas mensagens estão sendo salvas localmente e serão sincronizadas automaticamente.",
      help: "Estou offline no momento, mas posso ajudar com informações básicas. Sua mensagem será processada quando eu voltar online! 💬"
    },

    // Habilitar respostas inteligentes
    enableSmartResponses: true,

    // Sincronizar automaticamente quando voltar online
    syncOnReconnect: true,

    // Callback de sincronização personalizado
    onSync: async (pendingMessages) => {
      console.log(`Sincronizando ${pendingMessages.length} mensagens pendentes...`);

      try {
        let successCount = 0;
        let errorCount = 0;

        for (const message of pendingMessages) {
          try {
            // Tentar enviar mensagem para n8n
            await n8nChat.sendMessage(
              message.sessionId,
              message.content,
              'public',
              {
                metadata: {
                  ...message.metadata,
                  isOfflineSync: true,
                  originalTimestamp: message.timestamp
                }
              }
            );
            successCount++;
          } catch (error) {
            console.error('Erro ao sincronizar mensagem:', error);
            errorCount++;
          }
        }

        // Registrar histórico de sincronização
        const syncResult = {
          timestamp: Date.now(),
          status: errorCount === 0 ? 'success' as const : 'error' as const,
          messageCount: pendingMessages.length,
          error: errorCount > 0 ? `${errorCount} mensagens falharam` : undefined
        };

        setSyncHistory(prev => [syncResult, ...prev.slice(0, 9)]); // Manter últimas 10

        return {
          success: errorCount === 0,
          syncedCount: successCount,
          errorCount
        };
      } catch (error) {
        console.error('Erro na sincronização:', error);

        setSyncHistory(prev => [{
          timestamp: Date.now(),
          status: 'error',
          messageCount: pendingMessages.length,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }, ...prev.slice(0, 9)]);

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro na sincronização'
        };
      }
    }
  });

  // Simular mudanças de conectividade para demonstração
  const simulateOffline = () => {
    // Simular perda de conexão
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });
    window.dispatchEvent(new Event('offline'));

    // Voltar online após 10 segundos
    setTimeout(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
      window.dispatchEvent(new Event('online'));
    }, 10000);
  };

  const handleSessionStart = (newSessionId: string) => {
    setSessionId(newSessionId);
    console.log('Sessão iniciada:', newSessionId);
  };

  const handleError = (error: any) => {
    console.error('Erro no chat:', error);
  };

  const handleMetrics = (event: string, data: any) => {
    console.log('Métrica:', event, data);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">
          Chat com Funcionalidade Offline
        </h1>

        <p className="text-gray-600 mb-6">
          Este exemplo demonstra um sistema de chat robusto que funciona mesmo quando offline,
          com fallbacks inteligentes e sincronização automática.
        </p>

        {/* Status da Conexão */}
        <div className="mb-6 p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">Status da Conexão</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${offlineChat.isOnline ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
              <span className={`font-medium ${offlineChat.isOnline ? 'text-green-700' : 'text-red-700'
                }`}>
                {offlineChat.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {offlineChat.pendingMessages.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-orange-600">
                  📝 {offlineChat.pendingMessages.length} mensagens pendentes
                </span>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Sincronização: {offlineChat.syncStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Controles de Demonstração */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Controles de Demonstração</h3>
          <div className="flex space-x-4">
            <button
              onClick={simulateOffline}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              disabled={!offlineChat.isOnline}
            >
              Simular Offline (10s)
            </button>

            <button
              onClick={() => offlineChat.clearPendingMessages()}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              disabled={offlineChat.pendingMessages.length === 0}
            >
              Limpar Pendentes
            </button>
          </div>
        </div>

        {/* Interface do Chat */}
        <div className="border rounded-lg">
          <ChatInterface
            type="public"
            webhookUrl={webhookUrl}
            placeholder="Digite sua mensagem... (funciona offline!)"
            maxHeight={400}
            enableVoice={enableVoice}
            onSessionStart={handleSessionStart}
            onError={handleError}
            onMetrics={handleMetrics}
            theme={theme}
          />
        </div>
      </div>

      {/* Painel de Informações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mensagens Pendentes */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold mb-4">Mensagens Pendentes</h3>

          {offlineChat.pendingMessages.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma mensagem pendente</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {offlineChat.pendingMessages.map((message) => (
                <div key={message.id} className="p-3 bg-gray-50 rounded border-l-4 border-orange-400">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Sessão: {message.sessionId}</p>
                      <p className="text-sm text-gray-600 mt-1">{message.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(message.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => offlineChat.removePendingMessage(message.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Histórico de Sincronização */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold mb-4">Histórico de Sincronização</h3>

          {syncHistory.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma sincronização realizada</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {syncHistory.map((sync, index) => (
                <div key={index} className={`p-3 rounded border-l-4 ${sync.status === 'success'
                    ? 'bg-green-50 border-green-400'
                    : 'bg-red-50 border-red-400'
                  }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`text-sm font-medium ${sync.status === 'success' ? 'text-green-700' : 'text-red-700'
                        }`}>
                        {sync.status === 'success' ? '✅ Sucesso' : '❌ Erro'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {sync.messageCount} mensagens
                      </p>
                      {sync.error && (
                        <p className="text-xs text-red-600 mt-1">{sync.error}</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(sync.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Informações Técnicas */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="font-semibold mb-4">Como Funciona</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium mb-2">🔄 Detecção de Status</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Monitora navigator.onLine</li>
              <li>• Escuta eventos online/offline</li>
              <li>• Detecta falhas de rede automaticamente</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">💾 Armazenamento Local</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Salva mensagens no localStorage</li>
              <li>• Persiste entre sessões</li>
              <li>• Limpeza automática de mensagens antigas</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">🤖 Respostas Inteligentes</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Detecta saudações automaticamente</li>
              <li>• Respostas contextuais</li>
              <li>• Fallbacks personalizáveis</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">🔄 Sincronização</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Automática ao voltar online</li>
              <li>• Retry em caso de falha</li>
              <li>• Histórico de sincronizações</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineChatExample;
