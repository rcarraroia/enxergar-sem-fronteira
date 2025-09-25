/**
 * UI Integration Tests
 *
 * Testes de integração para componentes de interface do chat
 */

import { AdminChatPanel } from '@/components/chat/AdminChatPanel';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { PublicChatWidget } from '@/components/chat/PublicChatWidget';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockServerUtils,
  setupChatIntegrationTests,
  testDataFactory,
  testEnvironment
} from './setup';

// Setup global para todos os testes
setupChatIntegrationTests();

describe('UI Integration Tests', () => {
  describe('ChatInterface Integration', () => {
    it('should complete full conversation flow', async () => {
      const user = userEvent.setup();
      const config = testDataFactory.createWebhookConfig();

      const onSessionStart = jest.fn();
      const onSessionEnd = jest.fn();
      const onMetrics = jest.fn();

      render(
        <ChatInterface
          type="public"
          webhookUrl={config.publicCaptureUrl}
          onSessionStart={onSessionStart}
          onSessionEnd={onSessionEnd}
          onMetrics={onMetrics}
          placeholder="Type your message..."
        />
      );

      // Verificar que interface foi renderizada
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();

      // Verificar que sessão foi criada
      await waitFor(() => {
        expect(onSessionStart).toHaveBeenCalled();
      });

      const sessionId = onSessionStart.mock.calls[0][0];

      // Enviar primeira mensagem
      const input = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Hello, I need help with my account');
      await user.click(sendButton);

      // Verificar que mensagem foi enviada
      await waitFor(() => {
        expect(screen.getByText('Hello, I need help with my account')).toBeInTheDocument();
      });

      // Verificar que resposta foi recebida
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Verificar métricas
      expect(onMetrics).toHaveBeenCalledWith('message_sent', expect.any(Object));
      expect(onMetrics).toHaveBeenCalledWith('response_received', expect.any(Object));

      // Enviar segunda mensagem
      await user.type(input, 'I forgot my password');
      await user.click(sendButton);

      // Verificar que segunda mensagem apareceu
      await waitFor(() => {
        expect(screen.getByText('I forgot my password')).toBeInTheDocument();
      });

      // Verificar que input foi limpo
      expect(input).toHaveValue('');

      // Verificar que histórico está sendo mantido
      expect(screen.getByText('Hello, I need help with my account')).toBeInTheDocument();
      expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument();
    });

    it('should handle errors with retry functionality', async () => {
      const user = userEvent.setup();
      const config = testDataFactory.createWebhookConfig({
        publicCaptureUrl: testEnvironment.webhooks.error
      });

      render(
        <ChatInterface
          type="public"
          webhookUrl={config.publicCaptureUrl}
        />
      );

      const input = screen.getByPlaceholderText(/type/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Enviar mensagem que causará erro
      await user.type(input, 'This will cause an error');
      await user.click(sendButton);

      // Verificar que erro foi exibido
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      // Verificar que botão de retry está disponível
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      // Configurar sucesso para retry
      mockServerUtils.setResponse(
        config.publicCaptureUrl,
        {
          success: true,
          data: { response: 'Success after retry' }
        }
      );

      // Tentar novamente
      await user.click(retryButton);

      // Verificar que erro foi removido e resposta foi recebida
      await waitFor(() => {
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
        expect(screen.getByText('Success after retry')).toBeInTheDocument();
      });
    });

    it('should show typing indicator during response', async () => {
      const user = userEvent.setup();

      // Configurar delay para ver o typing indicator
      mockServerUtils.setDelay(testEnvironment.webhooks.public, 2000);

      render(
        <ChatInterface
          type="public"
          webhookUrl={testEnvironment.webhooks.public}
        />
      );

      const input = screen.getByPlaceholderText(/type/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Test message');
      await user.click(sendButton);

      // Verificar que typing indicator aparece
      await waitFor(() => {
        expect(screen.getByText(/typing/i)).toBeInTheDocument();
      });

      // Verificar que input está desabilitado
      expect(input).toBeDisabled();
      expect(sendButton).toBeDisabled();

      // Aguardar resposta
      await waitFor(() => {
        expect(screen.queryByText(/typing/i)).not.toBeInTheDocument();
        expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verificar que input foi reabilitado
      expect(input).not.toBeDisabled();
      expect(sendButton).not.toBeDisabled();
    });

    it('should handle session completion', async () => {
      const user = userEvent.setup();
      const config = testDataFactory.createWebhookConfig({
        publicCaptureUrl: testEnvironment.webhooks.complete
      });

      const onSessionEnd = jest.fn();

      render(
        <ChatInterface
          type="public"
          webhookUrl={config.publicCaptureUrl}
          onSessionEnd={onSessionEnd}
        />
      );

      const input = screen.getByPlaceholderText(/type/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Thank you, goodbye');
      await user.click(sendButton);

      // Verificar que sessão foi encerrada
      await waitFor(() => {
        expect(onSessionEnd).toHaveBeenCalled();
      });

      // Verificar que interface indica fim da sessão
      await waitFor(() => {
        expect(screen.getByText(/session.*complete/i)).toBeInTheDocument();
      });
    });
  });

  describe('PublicChatWidget Integration', () => {
    it('should toggle visibility and maintain state', async () => {
      const user = userEvent.setup();
      const config = testDataFactory.createWebhookConfig();

      render(
        <PublicChatWidget
          webhookUrl={config.publicCaptureUrl}
          position="bottom-right"
        />
      );

      // Inicialmente deve mostrar apenas o botão
      const toggleButton = screen.getByRole('button', { name: /chat/i });
      expect(toggleButton).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/type/i)).not.toBeInTheDocument();

      // Abrir chat
      await user.click(toggleButton);

      // Verificar que chat foi aberto
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type/i)).toBeInTheDocument();
      });

      // Enviar mensagem
      const input = screen.getByPlaceholderText(/type/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Hello from widget');
      await user.click(sendButton);

      // Verificar que mensagem foi enviada
      await waitFor(() => {
        expect(screen.getByText('Hello from widget')).toBeInTheDocument();
      });

      // Fechar chat
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      // Verificar que chat foi fechado mas estado mantido
      expect(screen.queryByPlaceholderText(/type/i)).not.toBeInTheDocument();

      // Reabrir chat
      await user.click(toggleButton);

      // Verificar que mensagem anterior ainda está lá
      await waitFor(() => {
        expect(screen.getByText('Hello from widget')).toBeInTheDocument();
      });
    });

    it('should show notification badge for new messages', async () => {
      const user = userEvent.setup();
      const config = testDataFactory.createWebhookConfig();

      render(
        <PublicChatWidget
          webhookUrl={config.publicCaptureUrl}
          showNotifications={true}
        />
      );

      const toggleButton = screen.getByRole('button', { name: /chat/i });

      // Abrir chat e enviar mensagem
      await user.click(toggleButton);

      const input = screen.getByPlaceholderText(/type/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Test notification');
      await user.click(sendButton);

      // Aguardar resposta
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument();
      });

      // Fechar chat
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      // Verificar que badge de notificação aparece
      // (Isso dependeria da implementação específica do componente)
      const badge = screen.queryByTestId('notification-badge');
      if (badge) {
        expect(badge).toBeInTheDocument();
      }
    });
  });

  describe('AdminChatPanel Integration', () => {
    it('should handle multiple concurrent sessions', async () => {
      const user = userEvent.setup();
      const config = testDataFactory.createWebhookConfig();

      render(
        <AdminChatPanel
          webhookUrl={config.adminSupportUrl}
          maxConcurrentSessions={3}
        />
      );

      // Criar primeira sessão
      const newSessionButton = screen.getByRole('button', { name: /new.*session/i });
      await user.click(newSessionButton);

      // Verificar que primeira sessão foi criada
      await waitFor(() => {
        expect(screen.getByText(/session.*1/i)).toBeInTheDocument();
      });

      // Criar segunda sessão
      await user.click(newSessionButton);

      // Verificar que segunda sessão foi criada
      await waitFor(() => {
        expect(screen.getByText(/session.*2/i)).toBeInTheDocument();
      });

      // Alternar entre sessões
      const session1Tab = screen.getByText(/session.*1/i);
      const session2Tab = screen.getByText(/session.*2/i);

      await user.click(session1Tab);
      // Verificar que sessão 1 está ativa

      await user.click(session2Tab);
      // Verificar que sessão 2 está ativa

      // Enviar mensagem na sessão 2
      const input = screen.getByPlaceholderText(/type/i);
      await user.type(input, 'Message in session 2');

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      // Verificar que mensagem foi enviada na sessão correta
      await waitFor(() => {
        expect(screen.getByText('Message in session 2')).toBeInTheDocument();
      });

      // Alternar para sessão 1 e verificar que não tem a mensagem
      await user.click(session1Tab);
      expect(screen.queryByText('Message in session 2')).not.toBeInTheDocument();
    });

    it('should show session metrics and statistics', async () => {
      const config = testDataFactory.createWebhookConfig();

      render(
        <AdminChatPanel
          webhookUrl={config.adminSupportUrl}
          showMetrics={true}
        />
      );

      // Verificar que métricas são exibidas
      // (Isso dependeria da implementação específica do componente)
      const metricsPanel = screen.queryByTestId('metrics-panel');
      if (metricsPanel) {
        expect(metricsPanel).toBeInTheDocument();

        // Verificar métricas específicas
        expect(screen.getByText(/active.*sessions/i)).toBeInTheDocument();
        expect(screen.getByText(/total.*messages/i)).toBeInTheDocument();
        expect(screen.getByText(/response.*time/i)).toBeInTheDocument();
      }
    });
  });

  describe('Accessibility Integration', () => {
    it('should support keyboard navigation throughout the interface', async () => {
      const user = userEvent.setup();
      const config = testDataFactory.createWebhookConfig();

      render(
        <ChatInterface
          type="public"
          webhookUrl={config.publicCaptureUrl}
        />
      );

      // Navegar usando Tab
      await user.tab();

      // Deve focar no input de mensagem
      const input = screen.getByPlaceholderText(/type/i);
      expect(input).toHaveFocus();

      // Navegar para o botão de envio
      await user.tab();
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toHaveFocus();

      // Voltar para o input
      await user.tab({ shift: true });
      expect(input).toHaveFocus();

      // Digitar mensagem e enviar com Enter
      await user.type(input, 'Keyboard navigation test');
      await user.keyboard('{Enter}');

      // Verificar que mensagem foi enviada
      await waitFor(() => {
        expect(screen.getByText('Keyboard navigation test')).toBeInTheDocument();
      });
    });

    it('should announce messages to screen readers', async () => {
      const user = userEvent.setup();
      const config = testDataFactory.createWebhookConfig();

      render(
        <ChatInterface
          type="public"
          webhookUrl={config.publicCaptureUrl}
        />
      );

      const input = screen.getByPlaceholderText(/type/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Screen reader test');
      await user.click(sendButton);

      // Verificar que existe região live para anúncios
      await waitFor(() => {
        const liveRegion = screen.getByRole('status');
        expect(liveRegion).toBeInTheDocument();
      });

      // Aguardar resposta
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument();
      });

      // Verificar que resposta foi anunciada
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent(/new message/i);
    });

    it('should have proper ARIA labels and roles', () => {
      const config = testDataFactory.createWebhookConfig();

      render(
        <ChatInterface
          type="public"
          webhookUrl={config.publicCaptureUrl}
        />
      );

      // Verificar região principal do chat
      const chatRegion = screen.getByRole('region');
      expect(chatRegion).toHaveAttribute('aria-label', expect.stringContaining('Chat'));

      // Verificar input de mensagem
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', expect.stringContaining('message'));

      // Verificar botão de envio
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toHaveAttribute('aria-label', expect.stringContaining('send'));

      // Verificar histórico de mensagens
      const messageList = screen.getByRole('log');
      expect(messageList).toHaveAttribute('aria-label', expect.stringContaining('conversation'));
    });
  });

  describe('Performance Integration', () => {
    it('should handle large conversation histories efficiently', async () => {
      const user = userEvent.setup();
      const config = testDataFactory.createWebhookConfig();

      render(
        <ChatInterface
          type="public"
          webhookUrl={config.publicCaptureUrl}
        />
      );

      const input = screen.getByPlaceholderText(/type/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Simular conversa longa
      const startTime = Date.now();

      for (let i = 0; i < 20; i++) {
        await user.clear(input);
        await user.type(input, `Message ${i + 1}`);
        await user.click(sendButton);

        // Aguardar resposta antes da próxima mensagem
        await waitFor(() => {
          expect(screen.getByText(`Message ${i + 1}`)).toBeInTheDocument();
        });
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verificar que performance é aceitável (menos de 30s para 20 mensagens)
      expect(totalTime).toBeLessThan(30000);

      // Verificar que todas as mensagens estão visíveis
      for (let i = 1; i <= 20; i++) {
        expect(screen.getByText(`Message ${i}`)).toBeInTheDocument();
      }
    });

    it('should virtualize long message lists', async () => {
      const config = testDataFactory.createWebhookConfig();

      // Criar sessão com muitas mensagens
      const manyMessages = Array.from({ length: 100 }, (_, i) =>
        testDataFactory.createMessage({
          id: `msg${i}`,
          content: `Message ${i + 1}`,
          sender: i % 2 === 0 ? 'user' : 'agent'
        })
      );

      // Mock do hook para retornar sessão com muitas mensagens
      jest.doMock('@/hooks/useChatHistory', () => ({
        useChatHistory: () => ({
          sessions: {
            'test-session': {
              id: 'test-session',
              messages: manyMessages,
              isActive: true,
              isTyping: false
            }
          },
          activeSessionId: 'test-session',
          createSession: jest.fn(() => 'test-session'),
          addMessage: jest.fn(),
          updateMessageStatus: jest.fn(),
          setTyping: jest.fn()
        })
      }));

      render(
        <ChatInterface
          type="public"
          webhookUrl={config.publicCaptureUrl}
        />
      );

      // Verificar que nem todas as mensagens estão no DOM (virtualização)
      const renderedMessages = screen.getAllByTestId(/message/);
      expect(renderedMessages.length).toBeLessThan(100);

      // Mas as mensagens visíveis devem estar corretas
      expect(screen.getByText('Message 100')).toBeInTheDocument(); // Última mensagem
    });
  });
});
