/**
 * PublicChatWidget Component
 *
 * Widget de chat flutuante para o site público
 * Integrado com n8n para captação de leads
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Maximize2, MessageSquare, Minimize2, X } from 'lucide-react';
import React, { useState } from 'react';
import ChatInterface from './ChatInterface';

interface PublicChatWidgetProps {
  /** URL do webhook n8n para chat público */
  webhookUrl?: string;
  /** Posição do widget na tela */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Tema do widget */
  theme?: 'light' | 'dark';
  /** Habilitar entrada por voz */
  enableVoice?: boolean;
  /** Texto de boas-vindas */
  welcomeMessage?: string;
  /** Placeholder do input */
  placeholder?: string;
  /** Mostrar badge "Novo" */
  showNewBadge?: boolean;
}

export const PublicChatWidget: React.FC<PublicChatWidgetProps> = ({
  webhookUrl = process.env.VITE_N8N_PUBLIC_WEBHOOK_URL || 'https://demo.n8n.com/webhook/public-chat',
  position = 'bottom-right',
  theme = 'light',
  enableVoice = false,
  welcomeMessage = 'Olá! Como posso ajudar você hoje?',
  placeholder = 'Digite sua mensagem...',
  showNewBadge = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Posicionamento do widget
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  // Tema do widget
  const themeClasses = {
    light: 'bg-white border-gray-200 text-gray-900',
    dark: 'bg-gray-900 border-gray-700 text-white'
  };

  return (
    <div className={cn('fixed z-50', positionClasses[position])}>
      {/* Widget Fechado - Botão Flutuante */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            'h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300',
            'bg-blue-600 hover:bg-blue-700 text-white',
            'flex items-center justify-center relative'
          )}
          size="lg"
        >
          <MessageSquare className="h-6 w-6" />

          {/* Badge "Novo" */}
          {showNewBadge && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              !
            </Badge>
          )}

          {/* Indicador de pulsação */}
          <div className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20" />
        </Button>
      )}

      {/* Widget Aberto - Painel de Chat */}
      {isOpen && (
        <Card
          className={cn(
            'w-80 h-96 shadow-2xl transition-all duration-300',
            themeClasses[theme],
            isMinimized ? 'h-12' : 'h-96'
          )}
        >
          {/* Header do Chat */}
          <CardHeader className="pb-2 px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                Chat de Atendimento
                {showNewBadge && (
                  <Badge variant="secondary" className="text-xs">
                    Novo
                  </Badge>
                )}
              </CardTitle>

              <div className="flex items-center gap-1">
                {/* Botão Minimizar/Maximizar */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-6 w-6 p-0"
                >
                  {isMinimized ? (
                    <Maximize2 className="h-3 w-3" />
                  ) : (
                    <Minimize2 className="h-3 w-3" />
                  )}
                </Button>

                {/* Botão Fechar */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Conteúdo do Chat */}
          {!isMinimized && (
            <CardContent className="p-0 h-full">
              <div className="h-full flex flex-col">
                {/* Mensagem de Boas-vindas */}
                <div className="p-4 bg-blue-50 border-b">
                  <p className="text-sm text-blue-800">
                    {welcomeMessage}
                  </p>
                </div>

                {/* Interface de Chat */}
                <div className="flex-1 min-h-0">
                  <ChatInterface
                    type="public"
                    webhookUrl={webhookUrl}
                    enableVoice={enableVoice}
                    placeholder={placeholder}
                    theme={theme}
                    compact={true}
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};

export default PublicChatWidget;
