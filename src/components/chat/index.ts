/**
 * Chat Components Export Index
 *
 * Exportações centralizadas dos componentes de chat
 */

// Core Components
export { default as ChatError } from './ChatError';
export { default as ChatHistory } from './ChatHistory';
export { default as ChatInterface } from './ChatInterface';
export { default as MessageBubble } from './MessageBubble';
export { default as MessageInput } from './MessageInput';
export { default as TypingIndicator } from './TypingIndicator';

// Specialized Components
export { default as AdminChatPanel } from './AdminChatPanel';
export { default as PublicChatWidget } from './PublicChatWidget';
export { default as VoiceInput } from './VoiceInput';

// Context and Providers
export { ChatProvider, useChatContext } from './ChatContext';

// Types
export type {
    AdminChatPanelProps,
    ChatContextValue, ChatInterfaceProps,
    PublicChatWidgetProps
} from '@/lib/chat/chatTypes';
