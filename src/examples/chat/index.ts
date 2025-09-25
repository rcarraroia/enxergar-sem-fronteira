/**
 * Chat Examples Index
 *
 * Exporta todos os exemplos de uso do sistema de chat
 */

export { default as AdvancedChatExample } from './AdvancedChatExample';
export { default as BasicChatExample } from './BasicChatExample';
export { default as N8nIntegrationExample } from './N8nIntegrationExample';
export { default as OfflineChatExample } from './OfflineChatExample';

// Re-export dos componentes principais para facilitar uso nos exemplos
export {
    AdminChatPanel, ChatConfigPanel, ChatInterface, ChatMetricsDashboard,
    ChatPerformanceMonitor, PublicChatWidget, VoiceInput
} from '@/components/chat';

// Re-export dos hooks para facilitar uso nos exemplos
export {
    useChatConfig, useChatHistory, useChatMetrics, useChatPerformance, useN8nChat
} from '@/hooks';

// Re-export das utilidades para facilitar uso nos exemplos
export {
    getChatConfig, isFeatureEnabled, resetChatConfig, updateChatConfig
} from '@/lib/chat/chatConfig';

export {
    clearChatMetrics, getChatMetrics, trackChatMetric
} from '@/lib/chat/chatMetrics';

export {
    LazyChatComponents,
    LazyChatResources, initializeChatPerformanceOptimizations
} from '@/lib/chat/chatLazyLoader';
