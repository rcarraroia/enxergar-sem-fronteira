/**
 * =====================================================
 * COMPONENTES PARA EXIBIÇÃO DE ERROS
 * =====================================================
 * Componentes reutilizáveis para mostrar erros ao usuário
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppError, ErrorSeverity } from "@/lib/errors/types";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, Info, RefreshCw, X } from "lucide-react";

// ============================================================================
// COMPONENTE PRINCIPAL DE EXIBIÇÃO DE ERRO
// ============================================================================

interface ErrorDisplayProps {
    error: AppError | Error | string
    onRetry?: () => void
    onDismiss?: () => void
    showDetails?: boolean
    className?: string
    variant?: "alert" | "card" | "inline"
}

export function ErrorDisplay({
    error,
    onRetry,
    onDismiss,
    showDetails = false,
    className,
    variant = "alert"
}: ErrorDisplayProps) {
    // Normalizar erro para AppError
    const normalizedError = normalizeErrorForDisplay(error);

    const severityConfig = getSeverityConfig(normalizedError.severity);

    if (variant === "card") {
        return (
            <Card className={cn("border-l-4", severityConfig.borderClass, className)}>
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                            <severityConfig.icon className={cn("w-5 h-5", severityConfig.iconClass)} />
                            <div>
                                <CardTitle className="text-sm font-medium">
                                    {getSeverityLabel(normalizedError.severity)}
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    {normalizedError.userMessage || normalizedError.message}
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {normalizedError.category && (
                                <Badge variant="outline" className="text-xs">
                                    {getCategoryLabel(normalizedError.category)}
                                </Badge>
                            )}
                            {onDismiss && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onDismiss}
                                    className="h-6 w-6 p-0"
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>

                {(showDetails || onRetry) && (
                    <CardContent className="pt-0">
                        {showDetails && (
                            <div className="mb-3 p-2 bg-gray-50 rounded text-xs font-mono text-gray-600">
                                <div><strong>Código:</strong> {normalizedError.code}</div>
                                {normalizedError.timestamp && (
                                    <div><strong>Horário:</strong> {normalizedError.timestamp.toLocaleString()}</div>
                                )}
                                {normalizedError.context && Object.keys(normalizedError.context).length > 0 && (
                                    <div><strong>Contexto:</strong> {JSON.stringify(normalizedError.context, null, 2)}</div>
                                )}
                            </div>
                        )}

                        {onRetry && normalizedError.retryable && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRetry}
                                className="w-full"
                            >
                                <RefreshCw className="w-3 h-3 mr-2" />
                                Tentar novamente
                            </Button>
                        )}
                    </CardContent>
                )}
            </Card>
        );
    }

    if (variant === "inline") {
        return (
            <div className={cn("flex items-center gap-2 text-sm", severityConfig.textClass, className)}>
                <severityConfig.icon className="w-4 h-4 flex-shrink-0" />
                <span>{normalizedError.userMessage || normalizedError.message}</span>
                {onRetry && normalizedError.retryable && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRetry}
                        className="h-6 px-2 ml-auto"
                    >
                        <RefreshCw className="w-3 h-3" />
                    </Button>
                )}
                {onDismiss && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDismiss}
                        className="h-6 w-6 p-0"
                    >
                        <X className="w-3 h-3" />
                    </Button>
                )}
            </div>
        );
    }

    // Variant 'alert' (padrão)
    return (
        <Alert className={cn(severityConfig.alertClass, className)}>
            <severityConfig.icon className="h-4 w-4" />
            <div className="flex-1">
                <AlertTitle className="flex items-center justify-between">
                    <span>{getSeverityLabel(normalizedError.severity)}</span>
                    <div className="flex items-center gap-1">
                        {normalizedError.category && (
                            <Badge variant="outline" className="text-xs">
                                {getCategoryLabel(normalizedError.category)}
                            </Badge>
                        )}
                        {onDismiss && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onDismiss}
                                className="h-6 w-6 p-0"
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        )}
                    </div>
                </AlertTitle>
                <AlertDescription className="mt-1">
                    {normalizedError.userMessage || normalizedError.message}
                </AlertDescription>

                {(showDetails || onRetry) && (
                    <div className="mt-3 space-y-2">
                        {showDetails && (
                            <div className="p-2 bg-black/5 rounded text-xs font-mono">
                                <div><strong>Código:</strong> {normalizedError.code}</div>
                                {normalizedError.timestamp && (
                                    <div><strong>Horário:</strong> {normalizedError.timestamp.toLocaleString()}</div>
                                )}
                            </div>
                        )}

                        {onRetry && normalizedError.retryable && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRetry}
                            >
                                <RefreshCw className="w-3 h-3 mr-2" />
                                Tentar novamente
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </Alert>
    );
}

// ============================================================================
// COMPONENTE PARA LISTA DE ERROS
// ============================================================================

interface ErrorListProps {
    errors: (AppError | Error | string)[]
    onRetry?: (index: number) => void
    onDismiss?: (index: number) => void
    onDismissAll?: () => void
    showDetails?: boolean
    className?: string
}

export function ErrorList({
    errors,
    onRetry,
    onDismiss,
    onDismissAll,
    showDetails = false,
    className
}: ErrorListProps) {
    if (errors.length === 0) {
        return null;
    }

    return (
        <div className={cn("space-y-2", className)}>
            {errors.length > 1 && onDismissAll && (
                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDismissAll}
                        className="text-xs"
                    >
                        Limpar todos
                    </Button>
                </div>
            )}

            {errors.map((error, index) => (
                <ErrorDisplay
                    key={index}
                    error={error}
                    onRetry={onRetry ? () => onRetry(index) : undefined}
                    onDismiss={onDismiss ? () => onDismiss(index) : undefined}
                    showDetails={showDetails}
                    variant="card"
                />
            ))}
        </div>
    );
}

// ============================================================================
// COMPONENTE PARA ERROS DE CAMPO
// ============================================================================

interface FieldErrorProps {
    error?: string
    className?: string
}

export function FieldError({ error, className }: FieldErrorProps) {
    if (!error) {
        return null;
    }

    return (
        <div className={cn("flex items-center gap-1 text-sm text-red-600 mt-1", className)}>
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            <span>{error}</span>
        </div>
    );
}

// ============================================================================
// COMPONENTE PARA ESTADO DE ERRO VAZIO
// ============================================================================

interface EmptyErrorStateProps {
    title?: string
    description?: string
    action?: {
        label: string
        onClick: () => void
    }
    className?: string
}

export function EmptyErrorState({
    title = "Nenhum erro encontrado",
    description = "Tudo está funcionando corretamente.",
    action,
    className
}: EmptyErrorStateProps) {
    return (
        <div className={cn("text-center py-8", className)}>
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Info className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 mb-4">{description}</p>
            {action && (
                <Button onClick={action.onClick} variant="outline">
                    {action.label}
                </Button>
            )}
        </div>
    );
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

function normalizeErrorForDisplay(error: AppError | Error | string): AppError {
    if (typeof error === "string") {
        return {
            code: "GENERIC_ERROR",
            message: error,
            userMessage: error,
            severity: "medium" as ErrorSeverity,
            category: "system" as const,
            timestamp: new Date(),
            actionable: false,
            retryable: false
        };
    }

    if ("code" in error && "category" in error) {
        return error as AppError;
    }

    return {
        code: "SYSTEM_ERROR",
        message: error.message,
        userMessage: error.message,
        severity: "high" as ErrorSeverity,
        category: "system" as const,
        timestamp: new Date(),
        actionable: false,
        retryable: false
    };
}

function getSeverityConfig(severity: ErrorSeverity) {
    switch (severity) {
        case "critical":
            return {
                icon: AlertTriangle,
                iconClass: "text-red-600",
                textClass: "text-red-600",
                alertClass: "border-red-200 bg-red-50",
                borderClass: "border-l-red-500"
            };
        case "high":
            return {
                icon: AlertCircle,
                iconClass: "text-red-500",
                textClass: "text-red-500",
                alertClass: "border-red-200 bg-red-50",
                borderClass: "border-l-red-400"
            };
        case "medium":
            return {
                icon: AlertTriangle,
                iconClass: "text-yellow-500",
                textClass: "text-yellow-600",
                alertClass: "border-yellow-200 bg-yellow-50",
                borderClass: "border-l-yellow-500"
            };
        case "low":
            return {
                icon: Info,
                iconClass: "text-blue-500",
                textClass: "text-blue-600",
                alertClass: "border-blue-200 bg-blue-50",
                borderClass: "border-l-blue-500"
            };
        default:
            return {
                icon: AlertCircle,
                iconClass: "text-gray-500",
                textClass: "text-gray-600",
                alertClass: "border-gray-200 bg-gray-50",
                borderClass: "border-l-gray-500"
            };
    }
}

function getSeverityLabel(severity: ErrorSeverity): string {
    switch (severity) {
        case "critical": return "Erro Crítico";
        case "high": return "Erro Grave";
        case "medium": return "Aviso";
        case "low": return "Informação";
    }
}

function getCategoryLabel(category: AppError["category"]): string {
    switch (category) {
        case "validation": return "Validação";
        case "authentication": return "Autenticação";
        case "authorization": return "Autorização";
        case "network": return "Rede";
        case "database": return "Banco de Dados";
        case "business_logic": return "Regra de Negócio";
        case "system": return "Sistema";
        case "user_input": return "Entrada do Usuário";
        case "external_api": return "API Externa";
        case "file_operation": return "Arquivo";
        default: return "Geral";
    }
}
