/**
 * Chat Error Component
 * Displays user-friendly error messages with recovery actions
 * SIMPLIFIED VERSION to avoid TypeScript enum issues
 */

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  XCircle,
  Info,
  ExternalLink
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface ChatErrorDisplayProps {
  error: any;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ERROR_MESSAGES = {
  NETWORK_ERROR: {
    title: 'Erro de Conexão',
    message: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
    icon: Wifi,
    color: 'text-orange-600'
  },
  WEBHOOK_ERROR: {
    title: 'Erro do Servidor',
    message: 'O servidor está temporariamente indisponível.',
    icon: AlertTriangle,
    color: 'text-red-600'
  },
  VALIDATION_ERROR: {
    title: 'Dados Inválidos',
    message: 'Os dados fornecidos são inválidos.',
    icon: XCircle,
    color: 'text-red-600'
  },
  RATE_LIMIT_ERROR: {
    title: 'Muitas Tentativas',
    message: 'Muitas tentativas em pouco tempo. Tente novamente em alguns minutos.',
    icon: AlertTriangle,
    color: 'text-yellow-600'
  },
  UNKNOWN_ERROR: {
    title: 'Erro Desconhecido',
    message: 'Ocorreu um erro inesperado.',
    icon: XCircle,
    color: 'text-red-600'
  }
};

const ERROR_RECOVERY_SUGGESTIONS = {
  NETWORK_ERROR: [
    "Verifique sua conexão com a internet",
    "Tente recarregar a página",
    "Entre em contato com o suporte se o problema persistir"
  ],
  WEBHOOK_ERROR: [
    "Tente novamente em alguns momentos",
    "Verifique se há atualizações do sistema",
    "Entre em contato com o administrador se necessário"
  ],
  VALIDATION_ERROR: [
    "Verifique os dados inseridos",
    "Certifique-se de que todos os campos obrigatórios estão preenchidos",
    "Tente usar valores diferentes"
  ],
  RATE_LIMIT_ERROR: [
    "Aguarde alguns minutos antes de tentar novamente",
    "Reduza a frequência de suas ações",
    "Entre em contato com o suporte se necessário"
  ],
  UNKNOWN_ERROR: [
    "Tente recarregar a página",
    "Limpe o cache do navegador",
    "Entre em contato com o suporte técnico"
  ]
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getErrorType = (error: any): string => {
  if (!error) return 'UNKNOWN_ERROR';
  
  if (error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
    return 'NETWORK_ERROR';
  }
  
  if (error.message?.includes('webhook') || error.code === 'WEBHOOK_ERROR') {
    return 'WEBHOOK_ERROR';
  }
  
  if (error.message?.includes('validation') || error.code === 'VALIDATION_ERROR') {
    return 'VALIDATION_ERROR';
  }
  
  if (error.message?.includes('rate limit') || error.code === 'RATE_LIMIT_ERROR') {
    return 'RATE_LIMIT_ERROR';
  }
  
  return 'UNKNOWN_ERROR';
};

const getErrorConfig = (errorType: string) => {
  return ERROR_MESSAGES[errorType as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.UNKNOWN_ERROR;
};

const getRecoverySuggestions = (errorType: string): string[] => {
  return ERROR_RECOVERY_SUGGESTIONS[errorType as keyof typeof ERROR_RECOVERY_SUGGESTIONS] || ERROR_RECOVERY_SUGGESTIONS.UNKNOWN_ERROR;
};

// ============================================================================
// COMPONENT
// ============================================================================

export const ChatErrorDisplay: React.FC<ChatErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  showDetails = false,
  className = ""
}) => {
  const errorType = getErrorType(error);
  const config = getErrorConfig(errorType);
  const suggestions = getRecoverySuggestions(errorType);
  const Icon = config.icon;

  return (
    <Card className={`border-destructive ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Icon className="h-5 w-5" />
            {config.title}
            <Badge variant="destructive" className="text-xs">
              {errorType}
            </Badge>
          </CardTitle>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-8 w-8 p-0"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription className="text-destructive/80">
          {config.message}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Error Details */}
        {showDetails && error && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <details className="mt-2">
                <summary className="cursor-pointer font-medium">
                  Detalhes técnicos
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                  {JSON.stringify(error, null, 2)}
                </pre>
              </details>
            </AlertDescription>
          </Alert>
        )}

        {/* Recovery Suggestions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Possíveis soluções:</h4>
          <ul className="text-sm space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {onRetry && (
            <Button
              onClick={onRetry}
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Recarregar Página
            </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('/suporte', '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Suporte
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Export with a simpler name
export const ChatError = ChatErrorDisplay;