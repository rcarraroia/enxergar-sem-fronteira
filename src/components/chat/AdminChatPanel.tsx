/**
 * AdminChatPanel Component
 *
 * Painel de chat integrado ao dashboard administrativo
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useChatHistory } from '@/hooks/useChatHistory';
import { AdminChatPanelProps } from '@/lib/chat/chatTypes';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  MessageSquare,
  Plus,
  User,
  X
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import ChatInterface from './ChatInterface';

// ============================================================================
// TYPES
// ============================================================================

interface AdminChatPanelState {
  isExpanded: boolean;
  activeSessions: string[];
  selectedSessionId: string | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Painel de chat administrativo com múltiplas sessões
 */
const AdminChatPanel: React.FC<AdminChatPanelProps> = ({
  className,
  defaultExpanded = false,
  showMultipleSessions = true,
  onStateChange
}) => {
  // Estados
  const [panelState, setPanelState] = useState<AdminChatPanelState>({
    isExpanded: defaultExpanded,
    activeSessions: [],
    selectedSessionId: null
  });

  // Hooks
  const chatHistory = useChatHistory();

  // Configuração do webhook
  const webhookUrl = process.env.VITE_N8N_ADMIN_WEBHOOK_URL || '';

  // Sessões administrativas ativas
  const adminSessions = chatHistory.findSessions({
    type: 'admin',
    isActive: true
  });

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Sincronizar sessões ativas
   */
  useEffect(() => {
    const activeSessionIds = adminSessions.map(session => session.id);
    setPanelState(prev => ({
      ...prev,
      activeSessions: activeSessionIds,
      selectedSessionId: prev.selectedSessionId && activeSessionIds.includes(prev.selectedSessionId)
        ? prev.selectedSessionId
        : activeSessionIds[0] || null
    }));
  }, [adminSessions]);

  /**
   * Notificar mudanças de estado
   */
  useEffect(() => {
    const state = panelState.isExpanded ? 'expanded' : 'collapsed';
    onStateChange?.(state);
  }, [panelState.isExpanded, onStateChange]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Toggle expansão do painel
   */
  const handleToggleExpansion = useCallback(() => {
    setPanelState(prev => ({
      ...prev,
      isExpanded: !prev.isExpanded
    }));
  }, []);

  /**
   * Cria nova sessão de chat
   */
  const handleCreateSession = useCallback(() => {
    const sessionId = chatHistory.createSession(
      'admin',
      webhookUrl,
      { autoActivate: true }
    );

    setPanelState(prev => ({
      ...prev,
      selectedSessionId: sessionId,
      isExpanded: true
    }));
  }, [chatHistory, webhookUrl]);

  /**
   * Seleciona sessão ativa
   */
  const handleSelectSession = useCallback((sessionId: string) => {
    setPanelState(prev => ({
      ...prev,
      selectedSessionId: sessionId
    }));
  }, []);

  /**
   * Fecha sessão
   */
  const handleCloseSession = useCallback((sessionId: string) => {
    chatHistory.endSession(sessionId);

    setPanelState(prev => {
      const remainingSessions = prev.activeSessions.filter(id => id !== sessionId);
      return {
        ...prev,
        selectedSessionId: prev.selectedSessionId === sessionId
          ? remainingSessions[0] || null
          : prev.selectedSessionId
      };
    });
  }, [chatHistory]);

  /**
   * Callback para métricas
   */
  const handleMetrics = useCallback((event: string, data: Record<string, unknown>) => {
    console.log('Métrica do chat admin:', event, data);
  }, []);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  /**
   * Renderiza header do painel
   */
  const renderPanelHeader = () => {
    return (
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Chat de Suporte</CardTitle>
            {adminSessions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {adminSessions.length}
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* New Session Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateSession}
              className="h-8"
              title="Nova conversa"
            >
              <Plus className="h-4 w-4" />
            </Button>

            {/* Expand/Collapse Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleExpansion}
              className="h-8 w-8 p-0"
              title={panelState.isExpanded ? "Recolher" : "Expandir"}
            >
              {panelState.isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
    );
  };

  /**
   * Renderiza lista de sessões
   */
  const renderSessionsList = () => {
    if (!showMultipleSessions || adminSessions.length <= 1) {
      return null;
    }

    return (
      <div className="px-4 pb-3">
        <ScrollArea className="h-32">
          <div className="space-y-2">
            {adminSessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors",
                  "hover:bg-muted/50",
                  panelState.selectedSessionId === session.id
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-muted/20"
                )}
                onClick={() => handleSelectSession(session.id)}
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      Sessão {session.id.slice(-8)}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(session.lastActivity).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {session.messages.length}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseSession(session.id);
                  }}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Fechar sessão"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  };

  /**
   * Renderiza conteúdo do chat
   */
  const renderChatContent = () => {
    if (!panelState.selectedSessionId) {
      return (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm mb-4">Nenhuma conversa ativa</p>
            <Button onClick={handleCreateSession} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Iniciar Nova Conversa
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          type="admin"
          webhookUrl={webhookUrl}
          placeholder="Digite sua mensagem para o suporte..."
          maxHeight={400}
          enableVoice={true}
          onMetrics={handleMetrics}
          className="h-full border-0 shadow-none rounded-none"
        />
      </div>
    );
  };

  /**
   * Renderiza painel colapsado
   */
  const renderCollapsedPanel = () => {
    return (
      <Card className={cn("w-full", className)}>
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={handleToggleExpansion}
        >
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span className="font-medium">Chat de Suporte</span>
            {adminSessions.length > 0 && (
              <Badge variant="secondary">
                {adminSessions.length}
              </Badge>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>
    );
  };

  /**
   * Renderiza painel expandido
   */
  const renderExpandedPanel = () => {
    return (
      <Card className={cn("w-full h-[600px] flex flex-col", className)}>
        {/* Header */}
        {renderPanelHeader()}

        {/* Sessions List */}
        {renderSessionsList()}

        {showMultipleSessions && adminSessions.length > 1 && (
          <Separator className="mx-4" />
        )}

        {/* Chat Content */}
        <CardContent className="flex-1 p-0 overflow-hidden">
          {renderChatContent()}
        </CardContent>
      </Card>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return panelState.isExpanded ? renderExpandedPanel() : renderCollapsedPanel();
};

// ============================================================================
// EXPORT
// ============================================================================

export default AdminChatPanel;
