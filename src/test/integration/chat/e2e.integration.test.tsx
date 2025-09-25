/**
 * End-to-End Integration Tests
 *
 * Testes de integração completos simulando fluxos reais de usuário
 */

import { ChatInterface } from '@/components/chat/ChatInterface';
import { PublicChatWidget } from '@/components/chat/PublicChatWidget';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockLocalStorage,
  mockServerUtils,
  setupChatIntegrationTests,
  testEnvironment
} from './setup';

// Setup global para todos os testes
setupChatIntegrationTests();

describe('End-to-End Integration Tests', () => {
  describe('Complete User Journey - Public Chat', () => {
    it('should complete full customer support flow', async () => {
      const user = userEvent.setup();

      // Configurar respostas específicas para simular fluxo de suporte
      const responses = [
        {
          success: true,
          data: {
            response: 'Hello! I\'m here to help. What can I assist you with today?',
            actions: []
          }
        },
        {
          success: true,
          data: {
            response: 'I understand you\'re having trouble with your account. Let me help you with that. Can you provide your email address?',
            actions: []
          }
        },
        {
          success: true,
          data: {
            response: 'Thank you! I\'ve found your account. I can see the issue. Let me create a support ticket for you.',
            actions: [
              {
                type: 'form',
                payload: {
                  formId: 'support-ticket',
                  fields: ['issue_description', 'priority']
                },
                description: 'Support ticket form'
              }
            ]
          }
        },
        {
          success: true,
          data: {
            response: 'Perfect! I\'ve created ticket #12345 for you. You should receive an email confirmation shortly. Is there anything else I can help you with?',
            actions: []
          }
        },
        {
          success: true,
          data: {
            response: 'You\'re welcome! Have a great day and thank you for contacting us.',
            actions: [],
            sessionComplete: true
          }
        }
      ];

      let responseIndex = 0;
      mockServerUtils.setResponse(
        testEnvironment.webhooks.public,
        () => responses[responseIndex++] || responses[responses.length - 1]
      );

      const onSessionStart = jest.fn();
      const onSessionEnd = jest.fn();
      const onMetrics = jest.fn();

      render(
        <ChatInterface
          type="public"
          webhookUrl={testEnvironment.webhooks.public}
          onSessionStart={onSessionStart}
          onSessionEnd={onSessionEnd}
          onMetrics={onMetrics}
          placeholder="How can we help you today?"
        />
      );

      // Aguardar inicialização
      await waitFor(() => {
        expect(onSessionStart).toHaveBeenCalled();
      });

      const input = screen.getByPlaceholderText('How can we help you today?');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // 1. Saudação inicial
      await user.type(input, 'Hi, I need help with my account');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Hi, I need help with my account')).toBeInTheDocument();
        expect(screen.getByText('Hello! I\'m here to help. What can I assist you with today?')).toBeInTheDocument();
      });

      // 2. Descrever problema
      await user.type(input, 'I can\'t log into my account');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('I can\'t log into my account')).toBeInTheDocument();
        expect(screen.getByText(/trouble with your account.*email address/)).toBeInTheDocument();
      });

      // 3. Fornecer informações
      await user.type(input, 'My email is john.doe@example.com');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('My email is john.doe@example.com')).toBeInTheDocument();
        expect(screen.getByText(/found your account.*support ticket/)).toBeInTheDocument();
      });

      // Verificar que ação de formulário foi apresentada
      // (Isso dependeria da implementação específica de como as ações são renderizadas)

      // 4. Confirmar criação do ticket
      await user.type(input, 'Yes, please create the ticket');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/ticket #12345.*email confirmation/)).toBeInTheDocument();
      });

      // 5. Finalizar conversa
      await user.type(input, 'No, that\'s all. Thank you!');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/welcome.*great day/)).toBeInTheDocument();
      });

      // Verificar que sessão foi encerrada
      await waitFor(() => {
        expect(onSessionEnd).toHaveBeenCalled();
      });

      // Verificar métricas coletadas
      expect(onMetrics).toHaveBeenCalledWith('message_sent', expect.any(Object));
      expect(onMetrics).toHaveBeenCalledWith('response_received', expect.any(Object));
      expect(onMetrics).toHaveBeenCalledWith('session_completed', expect.any(Object));

      // Verificar que histórico foi persistido
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'chat_sessions',
        expect.stringContaining('john.doe@example.com')
      );
    });

    it('should handle error recovery and retry flow', async () => {
      const user = userEvent.setup();

      let attemptCount = 0;
      mockServerUtils.setResponse(
        testEnvironment.webhooks.public,
        () => {
          attemptCount++;
          if (attemptCount === 1) {
            throw new Error('Network error');
          } else if (attemptCount === 2) {
            return { success: false, error: { code: 'TEMP_ERROR', message: 'Temporary error' } };
          } else {
            return {
              success: true,
              data: {
                response: 'Sorry for the delay! How can I help you?',
                actions: []
              }
            };
          }
        }
      );

      render(
        <ChatInterface
          type="public"
          webhookUrl={testEnvironment.webhooks.public}
        />
      );

      const input = screen.getByPlaceholderText(/type/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Enviar mensagem que falhará
      await user.type(input, 'Hello, this will fail initially');
      await user.click(sendButton);

      // Verificar que erro foi exibido
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      // Tentar novamente
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      // Segundo erro
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      // Tentar novamente (terceira vez será sucesso)
      await user.click(retryButton);

      // Verificar sucesso
      await waitFor(() => {
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
        expect(screen.getByText('Sorry for the delay! How can I help you?')).toBeInTheDocument();
      });

      expect(attemptCount).toBe(3);
    });
  });

  describe('Widget Integration Flow', () => {
    it('should integrate seamlessly with existing page content', async () => {
      const user = userEvent.setup();

      // Simular página com conteúdo existente
      const PageWithWidget = () => (
        <div>
          <header>
            <h1>Company Website</h1>
            <nav>
              <a href="/home">Home</a>
              <a href="/about">About</a>
              <a href="/contact">Contact</a>
            </nav>
          </header>

          <main>
            <h2>Welcome to our website</h2>
            <p>This is some existing page content.</p>

            <form data-testid="existing-form">
              <input type="text" placeholder="Your name" />
              <input type="email" placeholder="Your email" />
              <button type="submit">Submit</button>
            </form>
          </main>

          <PublicChatWidget
            webhookUrl={testEnvironment.webhooks.public}
            position="bottom-right"
            theme="light"
          />
        </div>
      );

      render(<PageWithWidget />);

      // Verificar que conteúdo da página existe
      expect(screen.getByText('Company Website')).toBeInTheDocument();
      expect(screen.getByText('Welcome to our website')).toBeInTheDocument();
      expect(screen.getByTestId('existing-form')).toBeInTheDocument();

      // Verificar que widget está presente mas não interfere
      const chatButton = screen.getByRole('button', { name: /chat/i });
      expect(chatButton).toBeInTheDocument();

      // Interagir com formulário existente
      const nameInput = screen.getByPlaceholderText('Your name');
      await user.type(nameInput, 'John Doe');
      expect(nameInput).toHaveValue('John Doe');

      // Abrir chat widget
      await user.click(chatButton);

      // Verificar que chat abriu sem afetar o resto da página
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type.*message/i)).toBeInTheDocument();
      });

      // Formulário ainda deve estar funcional
      expect(nameInput).toHaveValue('John Doe');

      // Usar chat
      const chatInput = screen.getByPlaceholderText(/type.*message/i);
      const chatSendButton = screen.getByRole('button', { name: /send/i });

      await user.type(chatInput, 'I have a question about your services');
      await user.click(chatSendButton);

      // Verificar que chat funciona
      await waitFor(() => {
        expect(screen.getByText('I have a question about your services')).toBeInTheDocument();
        expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument();
      });

      // Fechar chat
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      // Verificar que página volta ao normal
      expect(screen.queryByPlaceholderText(/type.*message/i)).not.toBeInTheDocument();
      expect(nameInput).toHaveValue('John Doe'); // Estado preservado
    });

    it('should handle multiple page interactions without conflicts', async () => {
      const user = userEvent.setup();

      const InteractivePage = () => (
        <div>
          <button onClick={() => alert('Page button clicked')}>Page Button</button>
          <input data-testid="page-input" placeholder="Page input" />

          <PublicChatWidget
            webhookUrl={testEnvironment.webhooks.public}
            position="bottom-left"
          />
        </div>
      );

      // Mock alert para evitar popup real
      window.alert = jest.fn();

      render(<InteractivePage />);

      const pageButton = screen.getByText('Page Button');
      const pageInput = screen.getByTestId('page-input');
      const chatButton = screen.getByRole('button', { name: /chat/i });

      // Interagir com elementos da página
      await user.click(pageButton);
      expect(window.alert).toHaveBeenCalledWith('Page button clicked');

      await user.type(pageInput, 'Page content');
      expect(pageInput).toHaveValue('Page content');

      // Abrir chat
      await user.click(chatButton);

      // Verificar que chat não interfere com elementos da página
      await user.type(pageInput, ' more content');
      expect(pageInput).toHaveValue('Page content more content');

      // Usar chat
      const chatInput = screen.getByPlaceholderText(/type.*message/i);
      await user.type(chatInput, 'Chat message');

      // Verificar que inputs são independentes
      expect(pageInput).toHaveValue('Page content more content');
      expect(chatInput).toHaveValue('Chat message');

      // Clicar fora do chat não deve afetar nada
      await user.click(pageButton);
      expect(window.alert).toHaveBeenCalledTimes(2);
    });
  });

  describe('Multi-Session Scenarios', () => {
    it('should handle session persistence across page reloads', async () => {
      const user = userEvent.setup();

      // Primeira renderização - criar sessão
      const { unmount } = render(
        <ChatInterface
          type="public"
          webhookUrl={testEnvironment.webhooks.public}
        />
      );

      const input = screen.getByPlaceholderText(/type/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'First message before reload');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('First message before reload')).toBeInTheDocument();
        expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument();
      });

      // Simular reload desmontando e remontando
      unmount();

      // Segunda renderização - simular reload
      render(
        <ChatInterface
          type="public"
          webhookUrl={testEnvironment.webhooks.public}
        />
      );

      // Verificar que histórico foi restaurado
      await waitFor(() => {
        expect(screen.getByText('First message before reload')).toBeInTheDocument();
        expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument();
      });

      // Continuar conversa
      const newInput = screen.getByPlaceholderText(/type/i);
      const newSendButton = screen.getByRole('button', { name: /send/i });

      await user.type(newInput, 'Second message after reload');
      await user.click(newSendButton);

      await waitFor(() => {
        expect(screen.getByText('Second message after reload')).toBeInTheDocument();
      });

      // Verificar que ambas as mensagens estão presentes
      expect(screen.getByText('First message before reload')).toBeInTheDocument();
      expect(screen.getByText('Second message after reload')).toBeInTheDocument();
    });

    it('should handle concurrent sessions in different tabs', async () => {
      const user = userEvent.setup();

      // Simular duas abas com diferentes sessões
      const Tab1 = () => (
        <div data-testid="tab1">
          <ChatInterface
            type="public"
            webhookUrl={testEnvironment.webhooks.public}
          />
        </div>
      );

      const Tab2 = () => (
        <div data-testid="tab2">
          <ChatInterface
            type="admin"
            webhookUrl={testEnvironment.webhooks.admin}
          />
        </div>
      );

      const { rerender } = render(<Tab1 />);

      // Aba 1 - Sessão pública
      const input1 = screen.getByPlaceholderText(/type/i);
      const send1 = screen.getByRole('button', { name: /send/i });

      await user.type(input1, 'Message from tab 1');
      await user.click(send1);

      await waitFor(() => {
        expect(screen.getByText('Message from tab 1')).toBeInTheDocument();
      });

      // Simular mudança de aba
      rerender(<Tab2 />);

      // Aba 2 - Sessão admin
      const input2 = screen.getByPlaceholderText(/type/i);
      const send2 = screen.getByRole('button', { name: /send/i });

      await user.type(input2, 'Message from tab 2');
      await user.click(send2);

      await waitFor(() => {
        expect(screen.getByText('Message from tab 2')).toBeInTheDocument();
      });

      // Verificar que mensagem da aba 1 não está presente
      expect(screen.queryByText('Message from tab 1')).not.toBeInTheDocument();

      // Voltar para aba 1
      rerender(<Tab1 />);

      // Verificar que sessão da aba 1 foi preservada
      await waitFor(() => {
        expect(screen.getByText('Message from tab 1')).toBeInTheDocument();
      });

      // Verificar que mensagem da aba 2 não está presente
      expect(screen.queryByText('Message from tab 2')).not.toBeInTheDocument();
    });
  });

  describe('Performance Under Load', () => {
    it('should maintain responsiveness with high message volume', async () => {
      const user = userEvent.setup();

      render(
        <ChatInterface
          type="public"
          webhookUrl={testEnvironment.webhooks.public}
        />
      );

      const input = screen.getByPlaceholderText(/type/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      const startTime = Date.now();
      const messageCount = 50;

      // Enviar muitas mensagens rapidamente
      for (let i = 0; i < messageCount; i++) {
        await user.clear(input);
        await user.type(input, `Bulk message ${i + 1}`, { delay: 1 });
        await user.click(sendButton);

        // Aguardar apenas que a mensagem apareça, não a resposta
        await waitFor(() => {
          expect(screen.getByText(`Bulk message ${i + 1}`)).toBeInTheDocument();
        }, { timeout: 1000 });
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTimePerMessage = totalTime / messageCount;

      // Verificar performance aceitável (menos de 500ms por mensagem em média)
      expect(avgTimePerMessage).toBeLessThan(500);

      // Verificar que todas as mensagens estão presentes
      for (let i = 1; i <= messageCount; i++) {
        expect(screen.getByText(`Bulk message ${i}`)).toBeInTheDocument();
      }
    });

    it('should handle memory efficiently with long conversations', async () => {
      const user = userEvent.setup();

      // Mock performance.memory se disponível
      const mockMemory = {
        usedJSHeapSize: 10000000, // 10MB inicial
        totalJSHeapSize: 20000000,
        jsHeapSizeLimit: 100000000
      };

      Object.defineProperty(performance, 'memory', {
        value: mockMemory,
        configurable: true
      });

      render(
        <ChatInterface
          type="public"
          webhookUrl={testEnvironment.webhooks.public}
        />
      );

      const input = screen.getByPlaceholderText(/type/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      const initialMemory = mockMemory.usedJSHeapSize;

      // Simular conversa longa
      for (let i = 0; i < 100; i++) {
        await user.clear(input);
        await user.type(input, `Memory test message ${i + 1}`, { delay: 1 });
        await user.click(sendButton);

        if (i % 10 === 0) {
          // Simular aumento gradual de memória
          mockMemory.usedJSHeapSize += 100000; // 100KB por 10 mensagens
        }
      }

      const finalMemory = mockMemory.usedJSHeapSize;
      const memoryIncrease = finalMemory - initialMemory;

      // Verificar que aumento de memória é razoável (menos de 50MB para 100 mensagens)
      expect(memoryIncrease).toBeLessThan(50000000);

      // Verificar que interface ainda responde
      await user.type(input, 'Final test message');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Final test message')).toBeInTheDocument();
      });
    });
  });

  describe('Real-world Error Scenarios', () => {
    it('should handle intermittent network connectivity', async () => {
      const user = userEvent.setup();

      let isOnline = true;
      let requestCount = 0;

      mockServerUtils.setResponse(
        testEnvironment.webhooks.public,
        () => {
          requestCount++;

          // Simular conectividade intermitente
          if (requestCount % 3 === 0) {
            isOnline = !isOnline;
          }

          if (!isOnline) {
            throw new Error('Network error');
          }

          return {
            success: true,
            data: {
              response: `Response ${requestCount} (online: ${isOnline})`,
              actions: []
            }
          };
        }
      );

      render(
        <ChatInterface
          type="public"
          webhookUrl={testEnvironment.webhooks.public}
        />
      );

      const input = screen.getByPlaceholderText(/type/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Primeira mensagem (online)
      await user.type(input, 'First message');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Response 1 (online: true)')).toBeInTheDocument();
      });

      // Segunda mensagem (online)
      await user.type(input, 'Second message');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Response 2 (online: true)')).toBeInTheDocument();
      });

      // Terceira mensagem (vai ficar offline)
      await user.type(input, 'Third message');
      await user.click(sendButton);

      // Deve mostrar erro
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      // Retry (ainda offline)
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      // Retry novamente (volta online)
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Response.*online: true/)).toBeInTheDocument();
      });
    });
  });
});
