/**
 * ChatError Component
 *
 * Componente para exibir erros do chat com opções de retry
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ChatError as ChatErrorType, ChatErrorType as ErrorType } from '@/lib/chat/chatTypes';
import { cn } from '@/lib/utils';
import {
  ArrowPathIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  WifiIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import React, { memo, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface ChatErrorProps {
  /** Dados do erro */
  error: ChatErrorType;
  /** Se pode fazer retry */
  canRetry?: boolean;
  /** Callback para retry */
  onRetry?: () => Promise<void>;
  /** Callback para dispensar erro */
  onDismiss?: () => void;
  /** Se deve mostrar detalhes técnicos */
  showDetails?: boolean;
  /** Classes CSS customizadas */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ERROR_MESSAGES = {
  [ErrorType.NETWORK_ERROR]: {
    title: 'Erro de Conexão',
    message: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
    icon: WifiIcon,
    color: 'text-orange-600'
  },
  [ErrorType.WEBHOOK_ERROR]: {
    title: 'Erro do Servidor',
    message: 'O servidor está temporariamente indisponível.',
    icon: ExclamationTriangleIcon,
    color: 'text-red-600'
  },
  [ErrorType.VALIDATION_ERROR]: {
    title: 'Dados Inválidos',
    message: 'A mensagem contém dados inválidos.',
    icon: ShieldExclamationIcon,
    color: 'text-yellow-600'
  },
  [ErrorType.TIMEOUT_ERROR]: {
    title: 'Tempo Esgotado',
    message: 'O servidor demorou muito para responder.',
    icon: ClockIcon,
    color: 'text-blue-600'
  },
  [ErrorType.VOICE_ERROR]: {
    title: 'Erro de Áudio',
    message: 'Não foi possível processar o áudio.',
    icon: ExclamationTriangleIcon,
    color: 'text-purple-600'
  },
  [ErrorType.SESSION_ERROR]: {
    title: 'Erro de Sessão',
    message: 'Houve um problema com sua sessão.',
    icon: ExclamationTriangleIcon,
    color: 'text-gray-600'
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Componente de exibição de erros do chat
 */
const ChatError: React.FC<ChatErrorProps> = memo(({
  error,
  canRetry = false,
  onRetry,
  onDismiss,
  showDetails = false,
  className
}) => {
  // Estados
  const [isRetrying, setIsRetrying] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);

  // Configuração do erro
  const errorConfig = ERROR_MESSAGES[error.type] || ERROR_MESSAGES[ErrorType.NETWORK_ERROR];
  const IconComponent = errorConfig.icon;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Manipula retry
   */
  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;

    setIsRetrying(true);
    try {
      await onRetry();
    } catch (retryError) {
      console.error('Erro no retry:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  /**
   * Toggle detalhes
   */
  const toggleDetails = () => {
    setShowFullDetails(!showFullDetails);
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  /**
   * Renderiza ícone do erro
   */
  const renderIcon = () => {
    return (
      <div className={cn("flex-shrink-0", errorConfig.color)}>
        <IconComponent className="w-5 h-5" />
      </div>
    );
  };

  /**
   * Renderiza botões de ação
   */
  const renderActions = () => {
    return (
      <div className="flex items-center space-x-2 mt-3">
        {/* Retry Button */}
        {canRetry && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={isRetrying}
            className="h-8"
          >
            {isRetrying ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2" />
                Tentando...
              </>
            ) : (
              <>
                <ArrowPathIcon className="w-3 h-3 mr-2" />
                Tentar Novamente
              </>
            )}
          </Button>
        )}

        {/* Details Button */}
        {showDetails && (error.context || error.originalError) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDetails}
            className="h-8 text-xs"
          >
            {showFullDetails ? 'Ocultar' : 'Detalhes'}
          </Button>
        )}

        {/* Dismiss Button */}
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-8 w-8 p-0 ml-auto"
          >
            <XMarkIcon className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  };

  /**
   * Renderiza detalhes técnicos
   */
  const renderDetails = () => {
    if (!showFullDetails) return null;

    return (
      <div className="mt-3 p-3 bg-muted/50 rounded-md text-xs font-mono">
        <div className="space-y-2">
          {/* Error Type */}
          <div>
            <span className="font-semibold">Tipo:</span> {error.type}
          </div>

          {/* Session ID */}
          {error.sessionId && (
            <div>
              <span className="font-semibold">Sessão:</span> {error.sessionId}
            </div>
          )}

          {/* Message ID */}
          {error.messageId && (
            <div>
              <span className="font-semibold">Mensagem:</span> {error.messageId}
            </div>
          )}

          {/* Context */}
          {error.context && (
            <div>
              <span className="font-semibold">Contexto:</span>
              <pre className="mt-1 text-xs overflow-x-auto">
                {JSON.stringify(error.context, null, 2)}
              </pre>
            </div>
          )}

          {/* Original Error */}
          {error.originalError && (
            <div>
              <span className="font-semibold">Erro Original:</span>
              <div className="mt-1 text-xs text-destructive">
                {error.originalError.message}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * Renderiza sugestões baseadas no tipo de erro
   */
  const renderSuggestions = () => {
    const suggestions: Record<ErrorType, string[]> = {
      [ErrorType.NETWORK_ERROR]: [
        'Verifique sua conexão com a internet',
        'Tente recarregar a página'
      ],
      [ErrorType.WEBHOOK_ERROR]: [
        'O problema é temporário, tente novamente em alguns minutos',
        'Se persistir, entre em contato com o suporte'
      ],
      [ErrorType.VALIDATION_ERROR]: [
        'Verifique se a mensagem não contém caracteres especiais',
        'Tente reformular sua mensagem'
      ],
      [ErrorType.TIMEOUT_ERROR]: [
        'Sua conexão pode estar lenta',
        'Tente novamente com uma mensagem mais curta'
      ],
      [ErrorType.VOICE_ERROR]: [
        'Verifique se o microfone está funcionando',
        'Tente falar mais claramente'
      ],
      [ErrorType.SESSION_ERROR]: [
        'Recarregue a página para iniciar uma nova sessão',
        'Limpe os dados do navegador se o problema persistir'
      ]
    };

    const errorSuggestions = suggestions[error.type] || [];

    if (errorSuggestions.length === 0) return null;

    return (
      <div className="mt-3">
        <p className="text-sm font-medium mb-2">Sugestões:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          {errorSuggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start">
              <span className="mr-2">•</span>
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Alert className={cn("border-destructive/50", className)}>
      <div className="flex items-start space-x-3">
        {/* Icon */}
        {renderIcon()}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Message */}
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-destructive">
              {errorConfig.title}
            </h4>
            <AlertDescription className="text-sm">
              {error.message || errorConfig.message}
            </AlertDescription>
          </div>

          {/* Suggestions */}
          {renderSuggestions()}

          {/* Actions */}
          {renderActions()}

          {/* Technical Details */}
          {renderDetails()}
        </div>
      </div>
    </Alert>
  );
});

ChatError.displayName = 'ChatError';

// ============================================================================
// EXPORT
// ============================================================================

export default ChatError;
