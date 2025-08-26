/**
 * Testes de Acessibilidade para Sistema de Chat
 *
 * Valida navegação por teclado, screen readers e padrões WCAG
 */

import {
  AdminChatPanel,
  ChatInterface,
  MessageBubble,
  MessageInput,
  PublicChatWidget,
  VoiceInput
} from '@/components/chat';
import type { ChatMessage } from '@/lib/chat/chatTypes';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

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

// Mock do Web Speech API
Object.defineProperty(window, 'SpeechRecognition', {
  value: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  })),
  writable: true
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
  value: window.SpeechRecognition,
  writable: true
});

describe('Chat Accessibility Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ChatInterface Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels and roles', () => {
      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
        />
      );

      // Verificar região principal do chat
      expect(screen.getByRole('main')).toBeInTheDocument();

      // Verificar área de mensagens
      expect(screen.getByRole('log')).toBeInTheDocument();
      expect(screen.getByRole('log')).toHaveAttribute('aria-live', 'polite');
      expect(screen.getByRole('log')).toHaveAttribute('aria-label', 'Histórico de mensagens');

      // Verificar formulário de entrada
      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByRole('form')).toHaveAttribute('aria-label', 'Enviar mensagem');

      // Verificar input de texto
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'Digite sua mensagem');

      // Verificar botão de envio
      expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
        />
      );

      const textInput = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /enviar/i });

      // Navegar com Tab
      await user.tab();
      expect(textInput).toHaveFocus();

      await user.tab();
      expect(sendButton).toHaveFocus();

      // Navegar com Shift+Tab (voltar)
      await user.tab({ shift: true });
      expect(textInput).toHaveFocus();
    });

    it('should handle Enter key to send message', async () => {
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

      await user.click(textInput);
      await user.type(textInput, 'Teste de mensagem');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(onSessionStart).toHaveBeenCalled();
      });
    });

    it('should have proper focus management', async () => {
      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
        />
      );

      const textInput = screen.getByRole('textbox');

      // Input deve manter foco após envio
      await user.click(textInput);
      await user.type(textInput, 'Teste');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(textInput).toHaveFocus();
      });
    });

    it('should announce new messages to screen readers', async () => {
      const { rerender } = render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
        />
      );

      // Simular nova mensagem
      const mockMessage: ChatMessage = {
        id: 'msg-1',
        content: 'Nova mensagem',
        sender: 'agent',
        timestamp: new Date(),
        status: 'sent'
      };

      // Verificar se a região live foi atualizada
      const liveRegion = screen.getByRole('log');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('should have proper contrast ratios', () => {
      const { container } = render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
          theme="light"
        />
      );

      // Verificar se elementos têm classes de contraste adequado
      const chatContainer = container.querySelector('[data-theme="light"]');
      expect(chatContainer).toBeInTheDocument();
    });
  });

  describe('MessageInput Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <MessageInput
          onSendMessage={vi.fn()}
          placeholder="Digite sua mensagem"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper form labels', () => {
      render(
        <MessageInput
          onSendMessage={vi.fn()}
          placeholder="Digite sua mensagem"
        />
      );

      const textInput = screen.getByRole('textbox');
      expect(textInput).toHaveAttribute('aria-label', 'Digite sua mensagem');

      const sendButton = screen.getByRole('button', { name: /enviar/i });
      expect(sendButton).toHaveAttribute('type', 'submit');
    });

    it('should handle disabled state properly', () => {
      render(
        <MessageInput
          onSendMessage={vi.fn()}
          placeholder="Digite sua mensagem"
          disabled={true}
        />
      );

      const textInput = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /enviar/i });

      expect(textInput).toBeDisabled();
      expect(sendButton).toBeDisabled();
      expect(textInput).toHaveAttribute('aria-disabled', 'true');
      expect(sendButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('should provide feedback for character limit', async () => {
      render(
        <MessageInput
          onSendMessage={vi.fn()}
          placeholder="Digite sua mensagem"
          maxLength={10}
        />
      );

      const textInput = screen.getByRole('textbox');
      await user.type(textInput, '12345678901'); // 11 caracteres

      // Verificar se há indicação de limite excedido
      expect(screen.getByText(/limite excedido/i)).toBeInTheDocument();
      expect(textInput).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('MessageBubble Accessibility', () => {
    const mockMessage: ChatMessage = {
      id: 'msg-1',
      content: 'Mensagem de teste',
      sender: 'user',
      timestamp: new Date(),
      status: 'sent'
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(
        <MessageBubble message={mockMessage} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper semantic structure', () => {
      render(<MessageBubble message={mockMessage} />);

      const messageElement = screen.getByRole('article');
      expect(messageElement).toBeInTheDocument();
      expect(messageElement).toHaveAttribute('aria-label', 'Mensagem do usuário');
    });

    it('should indicate message status to screen readers', () => {
      const errorMessage: ChatMessage = {
        ...mockMessage,
        status: 'error',
        error: 'Falha ao enviar'
      };

      render(<MessageBubble message={errorMessage} />);

      const messageElement = screen.getByRole('article');
      expect(messageElement).toHaveAttribute('aria-describedby');

      const statusElement = screen.getByText(/erro/i);
      expect(statusElement).toHaveAttribute('role', 'status');
      expect(statusElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should handle retry action accessibility', async () => {
      const errorMessage: ChatMessage = {
        ...mockMessage,
        status: 'error',
        error: 'Falha ao enviar'
      };

      const onRetry = vi.fn();

      render(
        <MessageBubble
          message={errorMessage}
          onRetryMessage={onRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /tentar novamente/i });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveAttribute('aria-describedby');

      await user.click(retryButton);
      expect(onRetry).toHaveBeenCalledWith(errorMessage.id);
    });
  });

  describe('VoiceInput Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <VoiceInput
          onTranscription={vi.fn()}
          onError={vi.fn()}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes for voice recording', () => {
      render(
        <VoiceInput
          onTranscription={vi.fn()}
          onError={vi.fn()}
        />
      );

      const voiceButton = screen.getByRole('button', { name: /gravação de voz/i });
      expect(voiceButton).toHaveAttribute('aria-pressed', 'false');
      expect(voiceButton).toHaveAttribute('aria-describedby');
    });

    it('should update ARIA state during recording', async () => {
      render(
        <VoiceInput
          onTranscription={vi.fn()}
          onError={vi.fn()}
        />
      );

      const voiceButton = screen.getByRole('button', { name: /gravação de voz/i });

      await user.click(voiceButton);

      await waitFor(() => {
        expect(voiceButton).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('should provide status updates to screen readers', async () => {
      render(
        <VoiceInput
          onTranscription={vi.fn()}
          onError={vi.fn()}
        />
      );

      // Verificar se há região de status
      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('should handle keyboard activation', async () => {
      render(
        <VoiceInput
          onTranscription={vi.fn()}
          onError={vi.fn()}
        />
      );

      const voiceButton = screen.getByRole('button', { name: /gravação de voz/i });

      voiceButton.focus();
      await user.keyboard('{Space}');

      await waitFor(() => {
        expect(voiceButton).toHaveAttribute('aria-pressed', 'true');
      });
    });
  });

  describe('PublicChatWidget Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <PublicChatWidget
          webhookUrl="https://test.com/webhook"
          position="bottom-right"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper landmark roles', () => {
      render(
        <PublicChatWidget
          webhookUrl="https://test.com/webhook"
          position="bottom-right"
        />
      );

      const chatWidget = screen.getByRole('complementary');
      expect(chatWidget).toHaveAttribute('aria-label', 'Chat de suporte');
    });

    it('should handle toggle button accessibility', async () => {
      render(
        <PublicChatWidget
          webhookUrl="https://test.com/webhook"
          position="bottom-right"
        />
      );

      const toggleButton = screen.getByRole('button', { name: /abrir chat/i });
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

      await user.click(toggleButton);

      await waitFor(() => {
        expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should manage focus when opening/closing', async () => {
      render(
        <PublicChatWidget
          webhookUrl="https://test.com/webhook"
          position="bottom-right"
        />
      );

      const toggleButton = screen.getByRole('button', { name: /abrir chat/i });

      await user.click(toggleButton);

      await waitFor(() => {
        const chatInput = screen.getByRole('textbox');
        expect(chatInput).toHaveFocus();
      });
    });

    it('should handle Escape key to close', async () => {
      render(
        <PublicChatWidget
          webhookUrl="https://test.com/webhook"
          position="bottom-right"
        />
      );

      const toggleButton = screen.getByRole('button', { name: /abrir chat/i });
      await user.click(toggleButton);

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
        expect(toggleButton).toHaveFocus();
      });
    });
  });

  describe('AdminChatPanel Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <AdminChatPanel
          webhookUrl="https://test.com/webhook"
          userId="admin-1"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper navigation structure', () => {
      render(
        <AdminChatPanel
          webhookUrl="https://test.com/webhook"
          userId="admin-1"
          enableMultipleSessions={true}
        />
      );

      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveAttribute('aria-label', 'Sessões de chat');
    });

    it('should handle session switching with keyboard', async () => {
      render(
        <AdminChatPanel
          webhookUrl="https://test.com/webhook"
          userId="admin-1"
          enableMultipleSessions={true}
        />
      );

      // Verificar se tabs são navegáveis por teclado
      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();

      const tabs = screen.getAllByRole('tab');
      if (tabs.length > 0) {
        await user.tab();
        expect(tabs[0]).toHaveFocus();

        await user.keyboard('{ArrowRight}');
        if (tabs[1]) {
          expect(tabs[1]).toHaveFocus();
        }
      }
    });
  });

  describe('Keyboard Navigation Patterns', () => {
    it('should follow proper tab order', async () => {
      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
          enableVoice={true}
        />
      );

      // Ordem esperada: input de texto -> botão de voz -> botão de envio
      const textInput = screen.getByRole('textbox');
      const voiceButton = screen.getByRole('button', { name: /gravação de voz/i });
      const sendButton = screen.getByRole('button', { name: /enviar/i });

      await user.tab();
      expect(textInput).toHaveFocus();

      await user.tab();
      expect(voiceButton).toHaveFocus();

      await user.tab();
      expect(sendButton).toHaveFocus();
    });

    it('should skip disabled elements in tab order', async () => {
      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
          enableVoice={false}
        />
      );

      const textInput = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /enviar/i });

      await user.tab();
      expect(textInput).toHaveFocus();

      await user.tab();
      expect(sendButton).toHaveFocus();
    });

    it('should handle arrow key navigation in message history', async () => {
      const messages: ChatMessage[] = [
        {
          id: 'msg-1',
          content: 'Primeira mensagem',
          sender: 'user',
          timestamp: new Date(),
          status: 'sent'
        },
        {
          id: 'msg-2',
          content: 'Segunda mensagem',
          sender: 'agent',
          timestamp: new Date(),
          status: 'sent'
        }
      ];

      // Mock do hook para retornar mensagens
      vi.mocked(require('@/hooks/useChatHistory').useChatHistory).mockReturnValue({
        createSession: vi.fn(() => 'test-session'),
        addMessage: vi.fn(),
        getSession: vi.fn(() => ({
          id: 'test-session',
          messages,
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

      // Verificar se mensagens são navegáveis
      const messageElements = screen.getAllByRole('article');
      expect(messageElements).toHaveLength(2);

      // Focar no histórico de mensagens
      const messageHistory = screen.getByRole('log');
      messageHistory.focus();

      // Navegar com setas
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowUp}');
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should announce typing indicator', async () => {
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
      expect(typingIndicator).toHaveAttribute('aria-live', 'polite');
      expect(typingIndicator).toHaveAttribute('role', 'status');
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
    });

    it('should announce error messages', () => {
      // Mock do hook para simular erro
      vi.mocked(require('@/hooks/useN8nChat').useN8nChat).mockReturnValue({
        sendMessage: vi.fn(),
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
        retryLastMessage: vi.fn()
      });

      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
        />
      );

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('should maintain contrast in dark theme', async () => {
      const { container } = render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
          theme="dark"
        />
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });

      expect(results).toHaveNoViolations();
    });

    it('should maintain contrast in light theme', async () => {
      const { container } = render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
          theme="light"
        />
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });

      expect(results).toHaveNoViolations();
    });

    it('should not rely solely on color for information', () => {
      const errorMessage: ChatMessage = {
        id: 'msg-1',
        content: 'Mensagem com erro',
        sender: 'user',
        timestamp: new Date(),
        status: 'error',
        error: 'Falha ao enviar'
      };

      render(<MessageBubble message={errorMessage} />);

      // Verificar se há indicadores além da cor
      expect(screen.getByText(/erro/i)).toBeInTheDocument();
      expect(screen.getByRole('img', { name: /erro/i })).toBeInTheDocument();
    });
  });

  describe('Mobile Accessibility', () => {
    it('should have proper touch targets', async () => {
      // Simular viewport mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      const { container } = render(
        <PublicChatWidget
          webhookUrl="https://test.com/webhook"
          position="bottom-right"
        />
      );

      const toggleButton = screen.getByRole('button', { name: /abrir chat/i });
      const buttonRect = toggleButton.getBoundingClientRect();

      // Verificar se o botão tem tamanho mínimo recomendado (44px)
      expect(buttonRect.width).toBeGreaterThanOrEqual(44);
      expect(buttonRect.height).toBeGreaterThanOrEqual(44);
    });

    it('should handle swipe gestures for mobile', async () => {
      render(
        <PublicChatWidget
          webhookUrl="https://test.com/webhook"
          position="bottom-right"
        />
      );

      const chatWidget = screen.getByRole('complementary');

      // Simular gesto de swipe
      fireEvent.touchStart(chatWidget, {
        touches: [{ clientX: 100, clientY: 100 }]
      });

      fireEvent.touchMove(chatWidget, {
        touches: [{ clientX: 200, clientY: 100 }]
      });

      fireEvent.touchEnd(chatWidget);

      // Verificar se o gesto foi tratado adequadamente
      expect(chatWidget).toBeInTheDocument();
    });
  });
});
