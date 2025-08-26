/**
 * Chat Library Export Index
 *
 * Exportações centralizadas da biblioteca de chat
 */

// Types
export * from './chatTypes';

// Utilities
export * from './chatUtils';

// Validation
export * from './chatValidation';

// Security
export * from './chatSecurity';

// Re-export commonly used types
export type {
    AdminChatPanelProps, ChatError,
    ChatInterfaceProps, ChatMessage,
    ChatSession,
    ChatType,
    MessageSender,
    MessageStatus,
    N8nChatRequest,
    N8nChatResponse, PublicChatWidgetProps
} from './chatTypes';

// Re-export commonly used utilities
export {
    cleanupExpiredSessions, createChatMessage,
    createChatSession, formatMessageTime, generateMessageId, generateSessionId, loadChatSessions, sanitizeMessageContent as sanitizeMessage, saveChatSessions, validateMessageContent as validateMessage
} from './chatUtils';

// Re-export validation functions
export {
    validateAndSanitizeMessage, validateChatMessage,
    validateChatSession, validateMessageContent, validateN8nRequest,
    validateN8nResponse, validateSessionId,
    validateWebhookUrl
} from './chatValidation';
// Exportar sistema de error handling
export {
    CHAT_ERROR_CODES,
    CHAT_ERROR_MESSAGES, createChatError, createHistoryError, createSecurityError, createSessionError, createVoiceError, createWebhookError, fromChatError, type ChatAppError
} from './chatErrorFactory';

// Exportar logging
export {
    configureChatLogger, getChatLogger, logChatError, logChatPerformance, logSecurityThreat, logSessionActivity,
    type ChatLoggingConfig
} from './chatLogger';

// Exportar middleware de segurança
export {
    chatSecurityMiddleware,
    createSecurityContext,
    secureValidateMessage,
    secureValidateRequest,
    secureValidateResponse, type MiddlewareResult, type SecurityContext,
    type SecurityMiddlewareOptions
} from './securityMiddleware';

// Exportar integração de erros
export {
    ChatErrorHandler,
    ChatPerformanceMonitor, convertLegacyChatError,
    convertToLegacyChatError, endPerformanceMonitoring, handleChatError, handleSecurityError, handleSessionError, handleValidationError, handleWebhookError, startPerformanceMonitoring
} from './errorIntegration';
// Exportar sistema de métricas
export {
    chatMetricsCollector, getChatMetricsSnapshot,
    getRecentChatEvents,
    getRecentChatMetrics, trackChatError, trackChatEvent,
    trackChatMetric, trackMessageSent,
    trackResponseReceived, trackSecurityViolation, trackSessionEnd, trackSessionStart, trackWebhookCall, type ChatEvent,
    type ChatEventType, type ChatMetric, type ChatMetricsSnapshot
} from './chatMetrics';
