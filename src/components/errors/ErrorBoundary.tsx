/**
 * ErrorBoundary - Componente para capturar erros do React
 *
 * Captura erros que ocorrem na árvore de componentes React
 * e exibe uma interface de fallback amigável ao usuário.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { createError } from "@/lib/errors/factory";
import { logCriticalError } from "@/lib/errors/logger";
import type { AppError } from "@/lib/errors/types";
import { AlertTriangle, Bug, Home, RefreshCw } from "lucide-react";
import type { ErrorInfo, ReactNode } from "react";
import React, { Component } from "react";

// ============================================================================
// TYPES
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: AppError, retry: () => void) => ReactNode
  onError?: (error: AppError, errorInfo: ErrorInfo) => void
  showDetails?: boolean
  level?: "page" | "section" | "component"
}

interface ErrorBoundaryState {
  hasError: boolean
  error: AppError | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Gerar ID único para o erro
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Converter erro nativo para AppError
    const appError = createError(
      "REACT_ERROR_BOUNDARY",
      error.message,
      {
        category: "system",
        severity: "critical",
        actionable: false,
        retryable: true,
        originalError: error,
        context: {
          errorId,
          boundary: "react",
          timestamp: new Date()
        }
      }
    );

    return {
      hasError: true,
      error: appError,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    const { error: appError } = this.state;

    // Adicionar informações do React ao erro
    if (appError) {
      appError.context = {
        ...appError.context,
        componentStack: errorInfo.componentStack,
        errorBoundary: errorInfo.errorBoundary?.name,
        errorBoundaryStack: errorInfo.errorBoundaryStack
      };

      // Logar erro crítico
      logCriticalError(appError);

      // Chamar callback se fornecido
      onError?.(appError, errorInfo);
    }

    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails = false, level = "component" } = this.props;

    if (hasError && error) {
      // Usar fallback customizado se fornecido
      if (fallback) {
        return fallback(error, this.handleRetry);
      }

      // Renderizar UI de erro padrão baseada no nível
      return this.renderErrorUI(error, errorInfo, level);
    }

    return children;
  }

  private renderErrorUI(error: AppError, errorInfo: ErrorInfo | null, level: string) {
    const { showDetails } = this.props;

    if (level === "page") {
      return this.renderPageError(error, errorInfo);
    }

    if (level === "section") {
      return this.renderSectionError(error, errorInfo);
    }

    return this.renderComponentError(error, errorInfo);
  }

  private renderPageError(error: AppError, errorInfo: ErrorInfo | null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full">
          <Card className="border-red-200">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-red-900">Ops! Algo deu errado</CardTitle>
              <CardDescription>
                Ocorreu um erro inesperado na aplicação. Nossa equipe foi notificada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Badge variant="destructive" className="text-xs">
                  Erro #{error.context?.errorId?.slice(-8)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {error.category}
                </Badge>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={this.handleRetry}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  className="w-full"
                  variant="outline"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Voltar ao Início
                </Button>

                <Button
                  onClick={this.handleReload}
                  className="w-full"
                  variant="ghost"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recarregar Página
                </Button>
              </div>

              {this.props.showDetails && this.renderErrorDetails(error, errorInfo)}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  private renderSectionError(error: AppError, errorInfo: ErrorInfo | null) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <CardTitle className="text-sm text-red-900">
                Erro nesta seção
              </CardTitle>
              <CardDescription className="text-xs text-red-700">
                {error.userMessage || error.message}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2">
            <Button
              onClick={this.handleRetry}
              size="sm"
              variant="outline"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Tentar Novamente
            </Button>

            <Badge variant="destructive" className="text-xs">
              #{error.context?.errorId?.slice(-6)}
            </Badge>
          </div>

          {this.props.showDetails && this.renderErrorDetails(error, errorInfo)}
        </CardContent>
      </Card>
    );
  }

  private renderComponentError(error: AppError, errorInfo: ErrorInfo | null) {
    return (
      <div className="border border-red-200 bg-red-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span className="text-sm font-medium text-red-900">
            Erro no componente
          </span>
          <Badge variant="destructive" className="text-xs">
            #{error.context?.errorId?.slice(-6)}
          </Badge>
        </div>

        <p className="text-xs text-red-700 mb-3">
          {error.userMessage || error.message}
        </p>

        <Button
          onClick={this.handleRetry}
          size="sm"
          variant="outline"
          className="text-xs"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Tentar Novamente
        </Button>

        {this.props.showDetails && this.renderErrorDetails(error, errorInfo)}
      </div>
    );
  }

  private renderErrorDetails(error: AppError, errorInfo: ErrorInfo | null) {
    return (
      <Collapsible className="mt-4">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full text-xs">
            <Bug className="w-3 h-3 mr-1" />
            Detalhes Técnicos
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs font-mono overflow-auto max-h-40">
            <div className="space-y-2">
              <div>
                <strong>Código:</strong> {error.code}
              </div>
              <div>
                <strong>Categoria:</strong> {error.category}
              </div>
              <div>
                <strong>Severidade:</strong> {error.severity}
              </div>
              <div>
                <strong>Timestamp:</strong> {error.timestamp.toISOString()}
              </div>

              {error.originalError && (
                <div>
                  <strong>Erro Original:</strong> {error.originalError.message}
                </div>
              )}

              {errorInfo?.componentStack && (
                <div>
                  <strong>Component Stack:</strong>
                  <pre className="mt-1 text-xs overflow-auto">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}

              {error.stack && (
                <div>
                  <strong>Stack Trace:</strong>
                  <pre className="mt-1 text-xs overflow-auto">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }
}

// ============================================================================
// HOC WRAPPER
// ============================================================================

/**
 * HOC para envolver componentes com ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// ============================================================================
// SPECIALIZED ERROR BOUNDARIES
// ============================================================================

/**
 * Error Boundary para páginas inteiras
 */
export function PageErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, "level">) {
  return (
    <ErrorBoundary level="page" {...props}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error Boundary para seções
 */
export function SectionErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, "level">) {
  return (
    <ErrorBoundary level="section" {...props}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error Boundary para componentes
 */
export function ComponentErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, "level">) {
  return (
    <ErrorBoundary level="component" {...props}>
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
