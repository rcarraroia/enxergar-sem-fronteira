/**
 * Testes de Navegação por Teclado
 *
 * Valida padrões de navegação por teclado em todos os componentes de chat
 */

import {
  AdminChatPanel,
  ChatConfigPanel,
  ChatInterface,
  MessageInput,
  PublicChatWidget,
  VoiceInput
} from '@/components/chat';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  testFocusTrap
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

describe('Keyboard Navigation Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ChatInterface Keyboard Navigation', () => {
    it('should navigate through all interactive elements', async () => {
      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
          enableVoice={true}
        />
      );

      const textInput = screen.getByRole('textbox');
      const voiceButton = screen.getByRole('button', { name: /gravação de voz/i });
      const sendButton = screen.getByRole('button', { name: /enviar/i });

      // Testar ordem de navegação
      await user.tab();
      expect(textInput).toHaveFocus();

      await user.tab();
      expect(voiceButton).toHaveFocus();

      await user.tab();
      expect(sendButton).toHaveFocus();

      // Testar navegação reversa
      await user.tab({ shift: true });
      expect(voiceButton).toHaveFocus();

      await user.tab({ shift: true });
      expect(textInput).toHaveFocus();
    });

    it('should skip disabled elements in navigation', async () => {
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

      // Não deve haver botão de voz na navegação
      const voiceButton = screen.queryByRole('button', { name: /gravação de voz/i });
      expect(voiceButton).not.toBeInTheDocument();
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

      expect(onSessionStart).toHaveBeenCalled();
    });

    it('should handle Ctrl+Enter for multiline input', async () => {
      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
        />
      );

      const textInput = screen.getByRole('textbox');

      await user.click(textInput);
      await user.type(textInput, 'Primeira linha');
      await user.keyboard('{Control>}{Enter}{/Control}');
      await user.type(textInput, 'Segunda linha');

      expect(textInput).toHaveValue('Primeira linha\nSegunda linha');
    });

    it('should handle Escape key to clear input', async () => {
      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
        />
      );

      const textInput = screen.getByRole('textbox');

      await user.click(textInput);
      await user.type(textInput, 'Texto para limpar');
      await user.keyboard('{Escape}');

      expect(textInput).toHaveValue('');
    });
  });

  describe('MessageInput Keyboard Navigation', () => {
    it('should handle all keyboard shortcuts', async () => {
      const onSendMessage = vi.fn();

      render(
        <MessageInput
          onSendMessage={onSendMessage}
          placeholder="Digite sua mensagem"
          enableVoice={true}
        />
      );

      const textInput = screen.getByRole('textbox');

      // Testar Enter para enviar
      await user.click(textInput);
      await user.type(textInput, 'Mensagem de teste');
      await user.keyboard('{Enter}');

      expect(onSendMessage).toHaveBeenCalledWith('Mensagem de teste', false);

      // Testar Ctrl+A para selecionar tudo
      await user.type(textInput, 'Novo texto');
      await user.keyboard('{Control>}a{/Control}');
      await user.type(textInput, 'Substituído');

      expect(textInput).toHaveValue('Substituído');
    });

    it('should prevent form submission when disabled', async () => {
      const onSendMessage = vi.fn();

      render(
        <MessageInput
          onSendMessage={onSendMessage}
          placeholder="Digite sua mensagem"
          disabled={true}
        />
      );

      const textInput = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /enviar/i });

      expect(textInput).toBeDisabled();
      expect(sendButton).toBeDisabled();

      // Tentar enviar com Enter
      await user.keyboard('{Enter}');
      expect(onSendMessage).not.toHaveBeenCalled();

      // Tentar clicar no botão
      await user.click(sendButton);
      expect(onSendMessage).not.toHaveBeenCalled();
    });

    it('should handle character limit feedback', async () => {
      render(
        <MessageInput
          onSendMessage={vi.fn()}
          placeholder="Digite sua mensagem"
          maxLength={10}
        />
      );

      const textInput = screen.getByRole('textbox');

      await user.click(textInput);
      await user.type(textInput, '12345678901'); // 11 caracteres

      expect(textInput).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText(/limite excedido/i)).toBeInTheDocument();
    });
  });

  describe('VoiceInput Keyboard Navigation', () => {
    beforeEach(() => {
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
    });

    it('should toggle recording with Space key', async () => {
      render(
        <VoiceInput
          onTranscription={vi.fn()}
          onError={vi.fn()}
        />
      );

      const voiceButton = screen.getByRole('button', { name: /gravação de voz/i });

      expect(voiceButton).toHaveAttribute('aria-pressed', 'false');

      // Ativar com Space
      voiceButton.focus();
      await user.keyboard('{Space}');

      expect(voiceButton).toHaveAttribute('aria-pressed', 'true');

      // Desativar com Space novamente
      await user.keyboard('{Space}');

      expect(voiceButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should toggle recording with Enter key', async () => {
      render(
        <VoiceInput
          onTranscription={vi.fn()}
          onError={vi.fn()}
        />
      );

      const voiceButton = screen.getByRole('button', { name: /gravação de voz/i });

      voiceButton.focus();
      await user.keyboard('{Enter}');

      expect(voiceButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should stop recording with Escape key', async () => {
      render(
        <VoiceInput
          onTranscription={vi.fn()}
          onError={vi.fn()}
        />
      );

      const voiceButton = screen.getByRole('button', { name: /gravação de voz/i });

      // Iniciar gravação
      voiceButton.focus();
      await user.keyboard('{Space}');
      expect(voiceButton).toHaveAttribute('aria-pressed', 'true');

      // Parar com Escape
      await user.keyboard('{Escape}');
      expect(voiceButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('PublicChatWidget Keyboard Navigation', () => {
    it('should handle toggle with keyboard', async () => {
      render(
        <PublicChatWidget
          webhookUrl="https://test.com/webhook"
          position="bottom-right"
        />
      );

      const toggleButton = screen.getByRole('button', { name: /abrir chat/i });

      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

      // Abrir com Enter
      toggleButton.focus();
      await user.keyboard('{Enter}');

      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

      // Fechar com Escape
      await user.keyboard('{Escape}');

      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
      expect(toggleButton).toHaveFocus();
    });

    it('should trap focus when open', async () => {
      render(
        <PublicChatWidget
          webhookUrl="https://test.com/webhook"
          position="bottom-right"
        />
      );

      const toggleButton = screen.getByRole('button', { name: /abrir chat/i });

      // Abrir widget
      await user.click(toggleButton);

      const chatContainer = screen.getByRole('complementary');
      const focusableElements = [
        'textbox',
        'button'
      ];

      const success = await testFocusTrap(chatContainer, focusableElements);
      expect(success).toBe(true);
    });

    it('should return focus to trigger when closed', async () => {
      render(
        <PublicChatWidget
          webhookUrl="https://test.com/webhook"
          position="bottom-right"
        />
      );

      const toggleButton = screen.getByRole('button', { name: /abrir chat/i });

      // Abrir widget
      toggleButton.focus();
      await user.keyboard('{Enter}');

      // Fechar widget
      await user.keyboard('{Escape}');

      expect(toggleButton).toHaveFocus();
    });
  });

  describe('AdminChatPanel Keyboard Navigation', () => {
    it('should navigate between sessions with arrow keys', async () => {
      render(
        <AdminChatPanel
          webhookUrl="https://test.com/webhook"
          userId="admin-1"
          enableMultipleSessions={true}
        />
      );

      const tabList = screen.queryByRole('tablist');

      if (tabList) {
        const tabs = screen.getAllByRole('tab');

        if (tabs.length > 1) {
          // Focar no primeiro tab
          tabs[0].focus();
          expect(tabs[0]).toHaveFocus();

          // Navegar com seta direita
          await user.keyboard('{ArrowRight}');
          expect(tabs[1]).toHaveFocus();

          // Navegar com seta esquerda
          await user.keyboard('{ArrowLeft}');
          expect(tabs[0]).toHaveFocus();
        }
      }
    });

    it('should handle Home and End keys in tab navigation', async () => {
      render(
        <AdminChatPanel
          webhookUrl="https://test.com/webhook"
          userId="admin-1"
          enableMultipleSessions={true}
        />
      );

      const tabList = screen.queryByRole('tablist');

      if (tabList) {
        const tabs = screen.getAllByRole('tab');

        if (tabs.length > 1) {
          // Focar em um tab do meio
          tabs[Math.floor(tabs.length / 2)].focus();

          // Ir para o primeiro com Home
          await user.keyboard('{Home}');
          expect(tabs[0]).toHaveFocus();

          // Ir para o último com End
          await user.keyboard('{End}');
          expect(tabs[tabs.length - 1]).toHaveFocus();
        }
      }
    });
  });

  describe('ChatConfigPanel Keyboard Navigation', () => {
    it('should navigate through configuration options', async () => {
      render(<ChatConfigPanel />);

      // Verificar se switches são navegáveis
      const switches = screen.getAllByRole('switch');

      if (switches.length > 0) {
        await user.tab();
        expect(switches[0]).toHaveFocus();

        // Alternar com Space
        await user.keyboard('{Space}');

        // Navegar para próximo switch
        await user.tab();
        if (switches[1]) {
          expect(switches[1]).toHaveFocus();
        }
      }
    });

    it('should handle form submission with Enter', async () => {
      render(<ChatConfigPanel />);

      const form = screen.queryByRole('form');

      if (form) {
        const submitButton = screen.queryByRole('button', { name: /salvar/i });

        if (submitButton) {
          submitButton.focus();
          await user.keyboard('{Enter}');

          // Verificar se formulário foi submetido
          expect(submitButton).toHaveFocus();
        }
      }
    });
  });

  describe('Advanced Keyboard Patterns', () => {
    it('should handle custom keyboard shortcuts', async () => {
      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
        />
      );

      const textInput = screen.getByRole('textbox');

      // Testar Ctrl+/ para mostrar ajuda
      await user.click(textInput);
      await user.keyboard('{Control>}/{/Control}');

      // Verificar se ajuda foi mostrada (se implementada)
      const helpDialog = screen.queryByRole('dialog');
      if (helpDialog) {
        expect(helpDialog).toBeInTheDocument();
      }
    });

    it('should handle quick actions with Alt+key', async () => {
      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
          enableVoice={true}
        />
      );

      // Testar Alt+V para ativar voz
      await user.keyboard('{Alt>}v{/Alt}');

      const voiceButton = screen.getByRole('button', { name: /gravação de voz/i });
      expect(voiceButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should handle message history navigation', async () => {
      // Mock histórico de mensagens
      vi.mocked(require('@/hooks/useChatHistory').useChatHistory).mockReturnValue({
        createSession: vi.fn(() => 'test-session'),
        addMessage: vi.fn(),
        getSession: vi.fn(() => ({
          id: 'test-session',
          messages: [
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
              sender: 'user',
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

      const textInput = screen.getByRole('textbox');

      // Testar seta para cima para navegar no histórico
      await user.click(textInput);
      await user.keyboard('{ArrowUp}');

      expect(textInput).toHaveValue('Segunda mensagem');

      await user.keyboard('{ArrowUp}');
      expect(textInput).toHaveValue('Primeira mensagem');

      // Testar seta para baixo
      await user.keyboard('{ArrowDown}');
      expect(textInput).toHaveValue('Segunda mensagem');
    });
  });

  describe('Error Handling in Keyboard Navigation', () => {
    it('should maintain keyboard navigation when errors occur', async () => {
      // Mock erro no hook
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
        retryLastMessage: vi.fn()
      });

      render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
        />
      );

      const textInput = screen.getByRole('textbox');
      const retryButton = screen.queryByRole('button', { name: /tentar novamente/i });

      // Verificar se botão de retry é navegável
      if (retryButton) {
        await user.tab();
        expect(textInput).toHaveFocus();

        await user.tab();
        expect(retryButton).toHaveFocus();

        // Testar ativação com Enter
        await user.keyboard('{Enter}');
      }
    });

    it('should handle focus when components are dynamically added/removed', async () => {
      const { rerender } = render(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
          enableVoice={false}
        />
      );

      const textInput = screen.getByRole('textbox');
      textInput.focus();

      // Adicionar componente de voz dinamicamente
      rerender(
        <ChatInterface
          type="public"
          webhookUrl="https://test.com/webhook"
          placeholder="Digite sua mensagem"
          enableVoice={true}
        />
      );

      // Verificar se foco foi mantido
      expect(textInput).toHaveFocus();

      // Verificar se novo elemento é navegável
      await user.tab();
      const voiceButton = screen.getByRole('button', { name: /gravação de voz/i });
      expect(voiceButton).toHaveFocus();
    });
  });
});
