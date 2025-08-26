/**
 * Sistema de Logging de Erros
 *
 * Fornece funcionalidades para logging estruturado de erros
 * com diferentes níveis e destinos de log.
 */

import { AppError, ErrorLoggingConfig, ErrorSeverity } from './types'

// ============================================================================
// CONFIGURAÇÃO PADRÃO
// ============================================================================

const DEFAULT_CONFIG: ErrorLoggingConfig = {
  logLevel: 'medium',
  includeStack: process.env.NODE_ENV === 'development',
  includeContext: true,
  sensitiveFields: ['password', 'token', 'apiKey', 'secret', 'authorization']
}

// ============================================================================
// INTERFACE DO LOGGER
// ============================================================================

export interface ErrorLogger {
  log(error: AppError): void
  logCritical(error: AppError): void
  logHigh(error: AppError): void
  logMedium(error: AppError): void
  logLow(error: AppError): void
}

// ============================================================================
// IMPLEMENTAÇÃO DO LOGGER
// ============================================================================

class ErrorLoggerImpl implements ErrorLogger {
  private config: ErrorLoggingConfig

  constructor(config: Partial<ErrorLoggingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Log principal que determina se deve logar baseado no nível
   */
  log(error: AppError): void {
    if (!this.shouldLog(error.severity)) {
      return
    }

    const logEntry = this.formatLogEntry(error)

    // Escolher método de log baseado na severidade
    switch (error.severity) {
      case 'critical':
        console.error('🚨 CRITICAL ERROR:', logEntry)
        this.sendToExternalService(error, logEntry)
        break
      case 'high':
        console.error('❌ HIGH ERROR:', logEntry)
        this.sendToExternalService(error, logEntry)
        break
      case 'medium':
        console.warn('⚠️ MEDIUM ERROR:', logEntry)
        break
      case 'low':
        console.info('ℹ️ LOW ERROR:', logEntry)
        break
    }

    // Enviar para serviços de monitoramento em produção
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(error, logEntry)
    }
  }

  logCritical(error: AppError): void {
    this.log({ ...error, severity: 'critical' })
  }

  logHigh(error: AppError): void {
    this.log({ ...error, severity: 'high' })
  }

  logMedium(error: AppError): void {
    this.log({ ...error, severity: 'medium' })
  }

  logLow(error: AppError): void {
    this.log({ ...error, severity: 'low' })
  }

  /**
   * Determina se deve logar baseado no nível configurado
   */
  private shouldLog(severity: ErrorSeverity): boolean {
    const levels: Record<ErrorSeverity, number> = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4
    }

    return levels[severity] >= levels[this.config.logLevel]
  }

  /**
   * Formata entrada de log removendo informações sensíveis
   */
  private formatLogEntry(error: AppError): any {
    const entry: any = {
      timestamp: error.timestamp.toISOString(),
      code: error.code,
      message: error.message,
      userMessage: error.userMessage,
      severity: error.severity,
      category: error.category,
      actionable: error.actionable,
      retryable: error.retryable
    }

    // Incluir contexto se configurado
    if (this.config.includeContext && error.context) {
      entry.context = this.sanitizeContext(error.context)
    }

    // Incluir stack trace se configurado
    if (this.config.includeStack && error.stack) {
      entry.stack = error.stack
    }

    // Incluir erro original se existir
    if (error.originalError) {
      entry.originalError = {
        name: error.originalError.name,
        message: error.originalError.message,
        stack: this.config.includeStack ? error.originalError.stack : undefined
      }
    }

    return entry
  }

  /**
   * Remove campos sensíveis do contexto
   */
  private sanitizeContext(context: any): any {
    if (!context || typeof context !== 'object') {
      return context
    }

    const sanitized = { ...context };

    for (const field of this.config.sensitiveFields || []) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]'
      }
    }

    // Sanitizar recursivamente objetos aninhados
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeContext(sanitized[key])
      }
    }

    return sanitized
  }

  /**
   * Envia erros críticos para serviço externo (ex: Sentry, LogRocket)
   */
  private async sendToExternalService(error: AppError, logEntry: any): Promise<void> {
    try {
      // Implementar integração com serviços externos aqui
      // Exemplo: Sentry, LogRocket, DataDog, etc.

      if (process.env.VITE_SENTRY_DSN) {
        // Integração com Sentry seria aqui
        console.log('📤 Sending to Sentry:', { error: error.code, severity: error.severity })
      }

      if (process.env.VITE_LOGROCKET_APP_ID) {
        // Integração com LogRocket seria aqui
        console.log('📤 Sending to LogRocket:', { error: error.code, severity: error.severity })
      }

    } catch (sendError) {
      console.error('Failed to send error to external service:', sendError)
    }
  }

  /**
   * Envia métricas para serviços de monitoramento
   */
  private async sendToMonitoring(error: AppError, logEntry: any): Promise<void> {
    try {
      // Implementar métricas aqui
      // Exemplo: incrementar contador de erros por categoria/severidade

      const metrics = {
        error_count: 1,
        error_category: error.category,
        error_severity: error.severity,
        error_code: error.code,
        timestamp: error.timestamp.toISOString()
      }

      console.log('📊 Error metrics:', metrics)

    } catch (metricsError) {
      console.error('Failed to send error metrics:', metricsError)
    }
  }
}

// ============================================================================
// INSTÂNCIA SINGLETON
// ============================================================================

let loggerInstance: ErrorLogger | null = null

/**
 * Obtém instância singleton do logger
 */
export function getErrorLogger(config?: Partial<ErrorLoggingConfig>): ErrorLogger {
  if (!loggerInstance) {
    loggerInstance = new ErrorLoggerImpl(config)
  }
  return loggerInstance
}

/**
 * Configura o logger global
 */
export function configureErrorLogger(config: Partial<ErrorLoggingConfig>): void {
  loggerInstance = new ErrorLoggerImpl(config)
}

// ============================================================================
// FUNÇÕES DE CONVENIÊNCIA
// ============================================================================

/**
 * Log rápido de erro
 */
export function logError(error: AppError): void {
  getErrorLogger().log(error)
}

/**
 * Log de erro crítico
 */
export function logCriticalError(error: AppError): void {
  getErrorLogger().logCritical(error)
}

/**
 * Log de erro com contexto adicional
 */
export function logErrorWithContext(
  error: AppError,
  additionalContext: Record<string, any>
): void {
  const errorWithContext = {
    ...error,
    context: {
      ...error.context,
      ...additionalContext
    }
  }
  getErrorLogger().log(errorWithContext)
}

// ============================================================================
// INTEGRAÇÃO COM CONSOLE GLOBAL
// ============================================================================

/**
 * Intercepta erros não capturados
 */
export function setupGlobalErrorHandling(): void {
  // Capturar erros não tratados
  window.addEventListener('error', (event) => {
    const error = {
      code: 'UNHANDLED_ERROR',
      message: event.error?.message || event.message,
      userMessage: 'Ocorreu um erro inesperado',
      severity: 'high' as ErrorSeverity,
      category: 'system' as const,
      timestamp: new Date(),
      actionable: false,
      retryable: false,
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      },
      originalError: event.error
    }

    logError(error)
  })

  // Capturar promises rejeitadas não tratadas
  window.addEventListener('unhandledrejection', (event) => {
    const error = {
      code: 'UNHANDLED_PROMISE_REJECTION',
      message: event.reason?.message || String(event.reason),
      userMessage: 'Ocorreu um erro inesperado',
      severity: 'high' as ErrorSeverity,
      category: 'system' as const,
      timestamp: new Date(),
      actionable: false,
      retryable: false,
      context: {
        reason: event.reason,
        stack: event.reason?.stack
      },
      originalError: event.reason instanceof Error ? event.reason : undefined
    }

    logError(error)
  })
}

// ============================================================================
// UTILITÁRIOS DE DESENVOLVIMENTO
// ============================================================================

/**
 * Habilita logs detalhados em desenvolvimento
 */
export function enableVerboseLogging(): void {
  if (process.env.NODE_ENV === 'development') {
    configureErrorLogger({
      logLevel: 'low',
      includeStack: true,
      includeContext: true
    })
  }
}

/**
 * Desabilita logs em testes
 */
export function disableLoggingForTests(): void {
  loggerInstance = {
    log: () => {},
    logCritical: () => {},
    logHigh: () => {},
    logMedium: () => {},
    logLow: () => {}
  }
}
