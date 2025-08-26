# Design Document - Interfaces de Chat com Integração n8n

## Overview

Este documento detalha o design técnico para implementação de duas interfaces de chat que se integram com o sistema n8n através de webhooks. O sistema será construído usando React, TypeScript e seguirá os padrões arquiteturais já estabelecidos no projeto.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   HTTP Webhooks  │    │      n8n        │
│   React App     │◄──►│   Communication  │◄──►│   AI Agent      │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Local Storage  │
│  Chat History   │
│                 │
└─────────────────┘
```

### Component Architecture

```
src/components/chat/
├── ChatInterface.tsx          # Base chat component
├── PublicChatWidget.tsx       # Public site integration
├── AdminChatPanel.tsx         # Admin panel integration
├── MessageBubble.tsx          # Individual message display
├── MessageInput.tsx           # Input with send button
├── TypingIndicator.tsx        # "Agent is typing..." indicator
├── ChatHistory.tsx            # Message history display
├── VoiceInput.tsx             # Voice-to-text input (optional)
└── ChatError.tsx              # Error handling display

src/hooks/
├── useN8nChat.ts             # n8n webhook communication
├── useChatHistory.ts         # Chat state management
├── useVoiceToText.ts         # Voice functionality
└── useChatWebSocket.ts       # Real-time updates (future)

src/lib/chat/
├── n8nClient.ts              # HTTP client for n8n
├── chatTypes.ts              # TypeScript interfaces
├── chatUtils.ts              # Utility functions
└── chatValidation.ts         # Input/output validation
```

## Components and Interfaces

### Core Types

```typescript
// Chat message structure
interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'error';
  metadata?: {
    retryCount?: number;
    errorMessage?: string;
    voiceInput?: boolean;
  };
}

// Chat session state
interface ChatSession {
  id: string;
  type: 'public' | 'admin';
  messages: ChatMessage[];
  isActive: boolean;
  isTyping: boolean;
  webhookUrl: string;
  lastActivity: Date;
}

// n8n webhook configuration
interface N8nWebhookConfig {
  publicCaptureUrl: string;
  adminSupportUrl: string;
  timeout: number;
  retryAttempts: number;
  headers: Record<string, string>;
}

// Voice input configuration
interface VoiceConfig {
  enabled: boolean;
  language: string;
  apiKey?: string;
  provider: 'browser' | 'external';
}
```

### ChatInterface Component

```typescript
interface ChatInterfaceProps {
  type: 'public' | 'admin';
  webhookUrl: string;
  placeholder?: string;
  maxHeight?: number;
  enableVoice?: boolean;
  onSessionStart?: (sessionId: string) => void;
  onSessionEnd?: (sessionId: string) => void;
  onError?: (error: ChatError) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  type,
  webhookUrl,
  placeholder = "Digite sua mensagem...",
  maxHeight = 400,
  enableVoice = false,
  onSessionStart,
  onSessionEnd,
  onError
}) => {
  // Component implementation
};
```

### PublicChatWidget Component

```typescript
interface PublicChatWidgetProps {
  isVisible: boolean;
  onToggle: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'inline';
  theme?: 'light' | 'dark';
}

const PublicChatWidget: React.FC<PublicChatWidgetProps> = ({
  isVisible,
  onToggle,
  position = 'bottom-right',
  theme = 'light'
}) => {
  // Widget implementation with floating button
};
```

### AdminChatPanel Component

```typescript
interface AdminChatPanelProps {
  className?: string;
  defaultExpanded?: boolean;
  showMultipleSessions?: boolean;
}

const AdminChatPanel: React.FC<AdminChatPanelProps> = ({
  className,
  defaultExpanded = false,
  showMultipleSessions = true
}) => {
  // Admin panel integration
};
```

## Data Models

### Chat State Management

```typescript
// Chat context for global state
interface ChatContextValue {
  sessions: Record<string, ChatSession>;
  activeSessionId: string | null;
  config: N8nWebhookConfig;

  // Actions
  createSession: (type: 'public' | 'admin') => string;
  sendMessage: (sessionId: string, content: string) => Promise<void>;
  receiveMessage: (sessionId: string, content: string) => void;
  setTyping: (sessionId: string, isTyping: boolean) => void;
  endSession: (sessionId: string) => void;
  retryMessage: (sessionId: string, messageId: string) => Promise<void>;
}

// Local storage schema
interface ChatStorageSchema {
  sessions: ChatSession[];
  config: N8nWebhookConfig;
  lastCleanup: Date;
}
```

### n8n Integration Schema

```typescript
// Request payload to n8n
interface N8nChatRequest {
  sessionId: string;
  message: string;
  userType: 'public' | 'admin';
  timestamp: string;
  metadata?: {
    userAgent?: string;
    referrer?: string;
    sessionData?: Record<string, unknown>;
  };
}

// Expected response from n8n
interface N8nChatResponse {
  success: boolean;
  message?: string;
  data?: {
    response: string;
    actions?: Array<{
      type: 'redirect' | 'form' | 'download';
      payload: Record<string, unknown>;
    }>;
    sessionComplete?: boolean;
  };
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}
```

## Error Handling

### Error Types and Recovery

```typescript
enum ChatErrorType {
  NETWORK_ERROR = 'network_error',
  WEBHOOK_ERROR = 'webhook_error',
  VALIDATION_ERROR = 'validation_error',
  VOICE_ERROR = 'voice_error',
  SESSION_ERROR = 'session_error'
}

interface ChatError {
  type: ChatErrorType;
  message: string;
  retryable: boolean;
  sessionId?: string;
  messageId?: string;
  originalError?: Error;
}

// Error handling strategy
const errorHandlingStrategy = {
  [ChatErrorType.NETWORK_ERROR]: {
    maxRetries: 3,
    backoffMs: [1000, 2000, 4000],
    userMessage: "Problema de conexão. Tentando novamente..."
  },
  [ChatErrorType.WEBHOOK_ERROR]: {
    maxRetries: 2,
    backoffMs: [2000, 5000],
    userMessage: "Erro no servidor. Tentando novamente..."
  },
  [ChatErrorType.VALIDATION_ERROR]: {
    maxRetries: 0,
    userMessage: "Mensagem inválida. Tente reformular."
  }
};
```

### Integration with Existing Error System

```typescript
// Extend existing error factory
import { createError, ErrorType } from '@/lib/errors/factory';

export const createChatError = (
  type: ChatErrorType,
  message: string,
  context?: Record<string, unknown>
) => {
  return createError(ErrorType.INTEGRATION_ERROR, message, {
    ...context,
    chatErrorType: type,
    component: 'ChatInterface'
  });
};
```

## Testing Strategy

### Unit Tests

```typescript
// Test coverage areas
describe('ChatInterface', () => {
  describe('Message Sending', () => {
    it('should send message to correct webhook URL');
    it('should handle network errors gracefully');
    it('should retry failed messages with backoff');
    it('should validate message content before sending');
  });

  describe('Message Receiving', () => {
    it('should display received messages correctly');
    it('should handle malformed responses');
    it('should update typing indicators appropriately');
  });

  describe('Session Management', () => {
    it('should create unique session IDs');
    it('should persist session state in localStorage');
    it('should clean up expired sessions');
  });
});

describe('useN8nChat Hook', () => {
  it('should make HTTP requests with correct payload');
  it('should handle different response types');
  it('should implement retry logic correctly');
  it('should manage loading states properly');
});
```

### Integration Tests

```typescript
// Integration test scenarios
describe('Chat Integration Tests', () => {
  describe('Public Chat Widget', () => {
    it('should integrate with existing captação page');
    it('should not interfere with existing forms');
    it('should maintain responsive design');
  });

  describe('Admin Chat Panel', () => {
    it('should integrate with admin v2 layout');
    it('should respect admin authentication');
    it('should handle multiple concurrent sessions');
  });

  describe('n8n Communication', () => {
    it('should handle webhook timeouts gracefully');
    it('should process different response formats');
    it('should maintain session continuity');
  });
});
```

### Performance Tests

```typescript
// Performance benchmarks
describe('Chat Performance', () => {
  it('should handle 100+ messages without memory leaks');
  it('should respond to user input within 100ms');
  it('should load initial interface within 500ms');
  it('should handle concurrent sessions efficiently');
});
```

## Security Considerations

### Input Validation and Sanitization

```typescript
// Message validation schema
import { z } from 'zod';

const chatMessageSchema = z.object({
  content: z.string()
    .min(1, 'Mensagem não pode estar vazia')
    .max(1000, 'Mensagem muito longa')
    .refine(content => !containsXSS(content), 'Conteúdo inválido'),
  sessionId: z.string().uuid('ID de sessão inválido')
});

// XSS prevention
const sanitizeMessage = (content: string): string => {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};
```

### Webhook Security

```typescript
// Secure webhook configuration
const webhookConfig = {
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'ChatInterface/1.0',
    'X-API-Key': process.env.VITE_N8N_API_KEY
  },
  timeout: 30000,
  validateSSL: true,
  allowedDomains: [
    process.env.VITE_N8N_WEBHOOK_DOMAIN
  ]
};

// URL validation
const validateWebhookUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' &&
           webhookConfig.allowedDomains.includes(parsed.hostname);
  } catch {
    return false;
  }
};
```

## Performance Optimizations

### Message Virtualization

```typescript
// For long chat histories
import { FixedSizeList as List } from 'react-window';

const VirtualizedChatHistory: React.FC<{
  messages: ChatMessage[];
  height: number;
}> = ({ messages, height }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <MessageBubble message={messages[index]} />
    </div>
  );

  return (
    <List
      height={height}
      itemCount={messages.length}
      itemSize={60}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### Request Debouncing

```typescript
// Prevent spam requests
import { useDebouncedCallback } from 'use-debounce';

const useDebouncedSend = (sendMessage: (content: string) => void) => {
  return useDebouncedCallback(sendMessage, 300, {
    leading: true,
    trailing: false
  });
};
```

### Memory Management

```typescript
// Automatic cleanup of old sessions
const useSessionCleanup = () => {
  useEffect(() => {
    const cleanup = () => {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
      const sessions = getChatSessions();
      const activeSessions = sessions.filter(
        session => session.lastActivity > cutoff
      );
      setChatSessions(activeSessions);
    };

    const interval = setInterval(cleanup, 60 * 60 * 1000); // Every hour
    return () => clearInterval(interval);
  }, []);
};
```

## Deployment and Configuration

### Environment Variables

```typescript
// Required environment variables
interface ChatEnvironmentConfig {
  VITE_N8N_PUBLIC_WEBHOOK_URL: string;
  VITE_N8N_ADMIN_WEBHOOK_URL: string;
  VITE_N8N_API_KEY?: string;
  VITE_VOICE_API_KEY?: string;
  VITE_CHAT_DEBUG_MODE?: string;
}

// Configuration validation
const validateChatConfig = (): ChatEnvironmentConfig => {
  const config = {
    VITE_N8N_PUBLIC_WEBHOOK_URL: import.meta.env.VITE_N8N_PUBLIC_WEBHOOK_URL,
    VITE_N8N_ADMIN_WEBHOOK_URL: import.meta.env.VITE_N8N_ADMIN_WEBHOOK_URL,
    VITE_N8N_API_KEY: import.meta.env.VITE_N8N_API_KEY,
    VITE_VOICE_API_KEY: import.meta.env.VITE_VOICE_API_KEY,
    VITE_CHAT_DEBUG_MODE: import.meta.env.VITE_CHAT_DEBUG_MODE
  };

  if (!config.VITE_N8N_PUBLIC_WEBHOOK_URL || !config.VITE_N8N_ADMIN_WEBHOOK_URL) {
    throw new Error('n8n webhook URLs are required');
  }

  return config;
};
```

### Feature Flags

```typescript
// Progressive rollout configuration
interface ChatFeatureFlags {
  enablePublicChat: boolean;
  enableAdminChat: boolean;
  enableVoiceInput: boolean;
  enableMultipleSessions: boolean;
  debugMode: boolean;
}

const getChatFeatureFlags = (): ChatFeatureFlags => ({
  enablePublicChat: import.meta.env.VITE_ENABLE_PUBLIC_CHAT === 'true',
  enableAdminChat: import.meta.env.VITE_ENABLE_ADMIN_CHAT === 'true',
  enableVoiceInput: import.meta.env.VITE_ENABLE_VOICE_INPUT === 'true',
  enableMultipleSessions: import.meta.env.VITE_ENABLE_MULTIPLE_SESSIONS === 'true',
  debugMode: import.meta.env.VITE_CHAT_DEBUG_MODE === 'true'
});
```

## Monitoring and Analytics

### Performance Metrics

```typescript
// Chat performance tracking
interface ChatMetrics {
  sessionStarted: (type: 'public' | 'admin') => void;
  messageSent: (sessionId: string, responseTime: number) => void;
  messageReceived: (sessionId: string, processingTime: number) => void;
  errorOccurred: (error: ChatError) => void;
  sessionEnded: (sessionId: string, duration: number, messageCount: number) => void;
}

const useChatMetrics = (): ChatMetrics => {
  return {
    sessionStarted: (type) => {
      // Track session initiation
      analytics.track('chat_session_started', { type });
    },
    messageSent: (sessionId, responseTime) => {
      // Track message performance
      analytics.track('chat_message_sent', { sessionId, responseTime });
    },
    // ... other metrics
  };
};
```

### Error Monitoring

```typescript
// Integration with existing error logging
import { logError } from '@/lib/errors/logger';

const logChatError = (error: ChatError) => {
  logError(error.originalError || new Error(error.message), {
    component: 'ChatInterface',
    chatErrorType: error.type,
    sessionId: error.sessionId,
    messageId: error.messageId,
    retryable: error.retryable
  });
};
```

This design provides a comprehensive foundation for implementing the chat interfaces while maintaining consistency with the existing codebase architecture and quality standards.
