/**
 * Testes de Screen Reader
 *
 * Valida compatibilidade com leitores de tela e anúncios ARIA
 */

import {
  ChatError,
  ChatInterface,
  MessageBubble,
  PublicChatWidget,
  TypingIndicator
} from '@/components/chat';
import type { ChatError as ChatErrorType, ChatMessage } from '@/lib/chat/chatTypes';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MockScreenReader,
  validateAccessibleLabels,
  validateLiveRegions
} from './utils';

// Mock dos hooks
vi.mock('@/hooks/useChatHistory', () => ({
  useChatHistory: () => ({
    createSession: vi.fn(() => 'test-session'),
    addMessage: vi.fn(() => 'test-message'),
    getSession: vi.fn(() => ({
      id: 'test-session',
      messages: [],
      isActive: true,
      isTyping: false
    })),
    getAllSessions: vi.fn(() => []),
    endSession: vi.fn(),
    setTyping: vi.fn(),
    updateMessageStatus: vi.fn()
  })
}));

vi.mock('@/hooks/useN8nChat', () => ({
  useN8nChat: () => ({
    sendMessage: vi.fn(() => Promise.resolve({ success: true, data: { response: 'Test response' } })),
    state: {
      isLoading: false,
      error: null,
      lastResponse: null
    },
    clearError: vi.fn(),
    retryLastMessage: vi.fn()
  })
}));

vi.mock('@/hooks/useChatConfig', () => ({
  useChatConfig: () => ({
    config: {
      enableChat: true,
      enableVoiceInput: true,
      enableMetrics: true,
      enableDevMode: false,
      maxMessageLength: 1000
    },
    updateConfig: vi.fn()
  })
}));

describe('Screen Reader Accessibility Tests', () => {
  let mockScreenReader: MockScreenReader;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    mockScreenReader = new MockScreenReader();
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ChatInterface Screen Reader Support', () => {
    it('should have proper landmark roles', () => {
      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
        />
      );

      // Verificar região principal
      const mainRegion = screen.getByRole('main');
      expect(mainRegion).toBeInTheDocument();
      expect(mainRegion).toHaveAttribute('aria-label', 'Interface de chat');

      // Verificar área de mensagens
      const messageLog = screen.getByRole('log');
      expect(messageLog).toHaveAttribute('aria-label', 'Histórico de mensagens');
      expect(messageLog).toHaveAttribute('aria-live', 'polite');

      // Verificar formulário
      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('aria-label', 'Enviar mensagem');
    });

    it('should announce new messages to screen readers', async () => {
      // Mock do hook para simular mensagens
      vi.mocked(require('@/hooks/useChatHistory').useChatHistory).mockReturnValue({
        createSession: vi.fn(() => 'test-session'),
        addMessage: vi.fn(),
        getSession: vi.fn(() => ({
          id: 'test-session',
          messages: [
            {
              id: 'msg-1',
              content: 'Nova mensagem do agente',
              sender: 'agent',
              timestamp: new Date(),
              status: 'sent'
            }
          ],
          isActive: true,
          isTyping: false
        })),
        getAllSessions: vi.fn(() => []),
        endSession: vi.fn(),
        setTyping: vi.fn(),
        updateMessageStatus: vi.fn()
      });

      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
        />
      );

      // Verificar se mensagem está na região live
      const messageLog = screen.getByRole('log');
      expect(messageLog).toHaveTextContent('Nova mensagem do agente');
      expect(messageLog).toHaveAttribute('aria-live', 'polite');
    });

    it('should announce typing indicator', () => {
      // Mock do hook para simular digitação
      vi.mocked(require('@/hooks/useChatHistory').useChatHistory).mockReturnValue({
        createSession: vi.fn(() => 'test-session'),
        addMessage: vi.fn(),
        getSession: vi.fn(() => ({
          id: 'test-session',
          messages: [],
          isActive: true,
          isTyping: true
        })),
        getAllSessions: vi.fn(() => []),
        endSession: vi.fn(),
        setTyping: vi.fn(),
        updateMessageStatus: vi.fn()
      });

      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
        />
      );

      const typingIndicator = screen.getByText(/digitando/i);
      expect(typingIndicator).toHaveAttribute('role', 'status');
      expect(typingIndicator).toHaveAttribute('aria-live', 'polite');
      expect(typingIndicator).toHaveAttribute('aria-label', 'Agente está digitando');
    });

    it('should announce connection status changes', () => {
      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
        />
      );

      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');
      expect(statusRegion).toHaveAttribute('aria-label', 'Status da conexão');
    });

    it('should provide context for form controls', () => {
      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
          enableVoice={true}
        />
      );

      const textInput = screen.getByRole('textbox');
      expect(textInput).toHaveAttribute('aria-label', 'Digite sua mensagem');
      expect(textInput).toHaveAttribute('aria-describedby');

      const voiceButton = screen.getByRole('button', { name: /gravação de voz/i });
      expect(voiceButton).toHaveAttribute('aria-pressed', 'false');
      expect(voiceButton).toHaveAttribute('aria-describedby');

      const sendButton = screen.getByRole('button', { name: /enviar/i });
      expect(sendButton).toHaveAttribute('aria-describedby');
    });
  });

  describe('MessageBubble Screen Reader Support', () => {
    const userMessage: ChatMessage = {
      id: 'msg-1',
      content: 'Mensagem do usuário',
      sender: 'user',
      timestamp: new Date(),
      status: 'sent'
    };

    const agentMessage: ChatMessage = {
      id: 'msg-2',
      content: 'Resposta do agente',
      sender: 'agent',
      timestamp: new Date(),
      status: 'sent'
    };

    it('should identify message sender to screen readers', () => {
      const { rerender } = render(<MessageBubble message={userMessage} />);

      let messageElement = screen.getByRole('article');
      expect(messageElement).toHaveAttribute('aria-label', 'Mensagem do usuário');

      rerender(<MessageBubble message={agentMessage} />);

      messageElement = screen.getByRole('article');
      expect(messageElement).toHaveAttribute('aria-label', 'Mensagem do agente');
    });

    it('should announce message status changes', () => {
      const sendingMessage: ChatMessage = {
        ...userMessage,
        status: 'sending'
      };

      const { rerender } = render(<MessageBubble message={sendingMessage} />);

      let statusElement = screen.getByRole('status');
      expect(statusElement).toHaveTextContent(/enviando/i);
      expect(statusElement).toHaveAttribute('aria-live', 'polite');

      const sentMessage: ChatMessage = {
        ...userMessage,
        status: 'sent'
      };

      rerender(<MessageBubble message={sentMessage} />);

      statusElement = screen.getByRole('status');
      expect(statusElement).toHaveTextContent(/enviado/i);
    });

    it('should announce error states', () => {
      const errorMessage: ChatMessage = {
        ...userMessage,
        status: 'error',
        error: 'Falha ao enviar mensagem'
      };

      render(<MessageBubble message={errorMessage} onRetryMessage={vi.fn()} />);

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveTextContent(/erro/i);
      expect(errorAlert).toHaveAttribute('aria-live', 'assertive');

      const retryButton = screen.getByRole('button', { name: /tentar novamente/i });
      expect(retryButton).toHaveAttribute('aria-describedby');
    });

    it('should provide timestamp information', () => {
      render(<MessageBubble message={userMessage} showTimestamp={true} />);

      const timeElement = screen.getByRole('time');
      expect(timeElement).toHaveAttribute('datetime');
      expect(timeElement).toHaveAttribute('aria-label');
    });
  });

  describe('TypingIndicator Screen Reader Support', () => {
    it('should announce typing status', () => {
      render(<TypingIndicator agentName="Assistente" />);

      const indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('aria-live', 'polite');
      expect(indicator).toHaveAttribute('aria-label', 'Assistente está digitando');
      expect(indicator).toHaveTextContent(/assistente.*digitando/i);
    });

    it('should be hidden when not typing', () => {
      const { rerender } = render(<TypingIndicator agentName="Assistente" />);

      let indicator = screen.getByRole('status');
      expect(indicator).toBeInTheDocument();

      rerender(<TypingIndicator agentName="Assistente" isVisible={false} />);

      indicator = screen.queryByRole('status');
      expect(indicator).not.toBeInTheDocument();
    });
  });

  describe('ChatError Screen Reader Support', () => {
    const networkError: ChatErrorType = {
      type: 'NETWORK_ERROR',
      message: 'Erro de conexão com o servidor',
      retryable: true,
      sessionId: 'test-session'
    };

    it('should announce errors with appropriate urgency', () => {
      render(
        <ChatError
          error={networkError}
          onRetry={vi.fn()}
          onDismiss={vi.fn()}
          canRetry={true}
        />
      );

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
      expect(errorAlert).toHaveTextContent(networkError.message);
    });

    it('should provide accessible retry controls', () => {
      const onRetry = vi.fn();

      render(
        <ChatError
          error={networkError}
          onRetry={onRetry}
          onDismiss={vi.fn()}
          canRetry={true}
        />
      );

      const retryButton = screen.getByRole('button', { name: /tentar novamente/i });
      expect(retryButton).toHaveAttribute('aria-describedby');

      const dismissButton = screen.getByRole('button', { name: /dispensar/i });
      expect(dismissButton).toHaveAttribute('aria-label', 'Dispensar erro');
    });

    it('should categorize error types for screen readers', () => {
      const validationError: ChatErrorType = {
        type: 'VALIDATION_ERROR',
        message: 'Mensagem inválida',
        retryable: false,
        sessionId: 'test-session'
      };

      render(
        <ChatError
          error={validationError}
          onRetry={vi.fn()}
          onDismiss={vi.fn()}
          canRetry={false}
        />
      );

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveAttribute('data-error-type', 'VALIDATION_ERROR');
    });
  });

  describe('PublicChatWidget Screen Reader Support', () => {
    it('should announce widget state changes', async () => {
      render(
        <PublicChatWidget
          webhookUrl="https://test.com/webhook"
          position="bottom-right"
        />
      );

      const toggleButton = screen.getByRole('button', { name: /abrir chat/i });
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

      await user.click(toggleButton);

      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
      expect(toggleButton).toHaveAttribute('aria-label', 'Fechar chat');
    });

    it('should provide context for widget position', () => {
      render(
        <PublicChatWidget
          webhookUrl="https://test.com/webhook"
          position="bottom-right"
        />
      );

      const widget = screen.getByRole('complementary');
      expect(widget).toHaveAttribute('aria-label', 'Chat de suporte');
      expect(widget).toHaveAttribute('aria-describedby');
    });

    it('should announce welcome messages', () => {
      render(
        <PublicChatWidget
          webhookUrl="https://test.com/webhook"
          position="bottom-right"
          welcomeMessage="Olá! Como posso ajudar?"
        />
      );

      const welcomeRegion = screen.getByRole('status');
      expect(welcomeRegion).toHaveTextContent('Olá! Como posso ajudar?');
      expect(welcomeRegion).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Live Regions and Announcements', () => {
    it('should have properly configured live regions', () => {
      const { container } = render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
        />
      );

      const expectedRegions = [
        { selector: '[role="log"]', type: 'polite' as const },
        { selector: '[role="status"]', type: 'polite' as const }
      ];

      const isValid = validateLiveRegions(container, expectedRegions);
      expect(isValid).toBe(true);
    });

    it('should announce form validation errors', async () => {
      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
        />
      );

      const textInput = screen.getByRole('textbox');

      // Simular erro de validação
      fireEvent.change(textInput, { target: { value: 'a'.repeat(1001) } }); // Muito longo

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
        expect(errorMessage).toHaveTextContent(/limite/i);
      });
    });

    it('should announce successful actions', async () => {
      const onSessionStart = vi.fn();

      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
          onSessionStart={onSessionStart}
        />
      );

      const textInput = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /enviar/i });

      await user.type(textInput, 'Mensagem de teste');
      await user.click(sendButton);

      await waitFor(() => {
        const successMessage = screen.getByRole('status');
        expect(successMessage).toHaveTextContent(/enviado/i);
      });
    });
  });

  describe('Accessible Labels and Descriptions', () => {
    it('should have comprehensive accessible names', () => {
      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
          enableVoice={true}
        />
      );

      const elements = [
        screen.getByRole('textbox'),
        screen.getByRole('button', { name: /gravação de voz/i }),
        screen.getByRole('button', { name: /enviar/i })
      ];

      const expectedLabels = [
        'Digite sua mensagem',
        'gravação de voz',
        'enviar'
      ];

      const isValid = validateAccessibleLabels(elements, expectedLabels);
      expect(isValid).toBe(true);
    });

    it('should provide helpful descriptions', () => {
      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
          enableVoice={true}
        />
      );

      const textInput = screen.getByRole('textbox');
      const describedBy = textInput.getAttribute('aria-describedby');

      if (describedBy) {
        const description = document.getElementById(describedBy);
        expect(description).toBeInTheDocument();
        expect(description).toHaveTextContent(/pressione enter para enviar/i);
      }
    });

    it('should update labels dynamically', async () => {
      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
          enableVoice={true}
        />
      );

      const voiceButton = screen.getByRole('button', { name: /gravação de voz/i });

      expect(voiceButton).toHaveAttribute('aria-pressed', 'false');
      expect(voiceButton).toHaveAttribute('aria-label', 'Iniciar gravação de voz');

      await user.click(voiceButton);

      expect(voiceButton).toHaveAttribute('aria-pressed', 'true');
      expect(voiceButton).toHaveAttribute('aria-label', 'Parar gravação de voz');
    });
  });

  describe('Complex Interactions', () => {
    it('should handle multi-step processes accessibly', async () => {
      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
        />
      );

      const textInput = screen.getByRole('textbox');

      // Passo 1: Digitar mensagem
      await user.type(textInput, 'Mensagem de teste');

      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toHaveTextContent(/digitando/i);

      // Passo 2: Enviar mensagem
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(statusRegion).toHaveTextContent(/enviando/i);
      });

      // Passo 3: Confirmar envio
      await waitFor(() => {
        expect(statusRegion).toHaveTextContent(/enviado/i);
      });
    });

    it('should handle error recovery flows', async () => {
      // Mock erro no envio
      vi.mocked(require('@/hooks/useN8nChat').useN8nChat).mockReturnValue({
        sendMessage: vi.fn(() => Promise.reject(new Error('Network error'))),
        state: {
          isLoading: false,
          error: {
            type: 'NETWORK_ERROR',
            message: 'Erro de conexão',
            retryable: true
          },
          lastResponse: null
        },
        clearError: vi.fn(),
        retryLastMessage: vi.fn(() => Promise.resolve({ success: true }))
      });

      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
        />
      );

      // Erro deve ser anunciado
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveAttribute('aria-live', 'assertive');

      // Retry deve ser acessível
      const retryButton = screen.getByRole('button', { name: /tentar novamente/i });
      await user.click(retryButton);

      // Sucesso deve ser anunciado
      await waitFor(() => {
        const statusRegion = screen.getByRole('status');
        expect(statusRegion).toHaveTextContent(/enviado/i);
      });
    });
  });

  describe('Internationalization Support', () => {
    it('should support different languages in screen reader announcements', () => {
      // Mock configuração de idioma
      Object.defineProperty(navigator, 'language', {
        value: 'pt-BR',
        configurable: true
      });

      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
        />
      );

      const messageLog = screen.getByRole('log');
      expect(messageLog).toHaveAttribute('lang', 'pt-BR');
    });

    it('should handle RTL languages properly', () => {
      // Mock idioma RTL
      Object.defineProperty(document.documentElement, 'dir', {
        value: 'rtl',
        configurable: true
      });

      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="اكتب رسالتك"
        />
      );

      const textInput = screen.getByRole('textbox');
      expect(textInput).toHaveAttribute('dir', 'rtl');
    });
  });
});
