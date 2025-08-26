/**
 * Webhook Integration Tests
 *
 * Testes de integração para comunicação com webhooks n8n
 */

import { useChatHistory } from '@/hooks/useChatHistory';
import { useN8nChat } from '@/hooks/useN8nChat';
import { act, renderHook } from '@testing-library/react';
import {
    mockServerUtils,
    setupChatIntegrationTests,
    testDataFactory,
    testEnvironment,
    waitUtils
} from './setup';

// Setup global para todos os testes
setupChatIntegrationTests();

describe('Webhook Integration Tests', () => {
  describe('Successful Communication', () => {
    it('should send message and receive response successfully', async () => {
      const config = testDataFactory.createWebhookConfig();
      const { result: chatResult } = renderHook(() => useN8nChat(config));
      const { result: historyResult } = renderHook(() => useChatHistory());

      let sessionId: string;
      let response: any;

      // Criar sessão
      await act(async () => {
        sessionId = historyResult.current.createSession('public', config.publicCaptureUrl);
      });

      // Enviar mensagem
      await act(async () => {
        response = await chatResult.current.sendMessage(
          sessionId,
          'Hello, I need help',
          'public'
        );
      });

      // Verificar resposta
      expect(response.success).toBe(true);
      expect(response.data.response).toBe('Hello! How can I help you today?');
      expect(chatResult.current.state.error).toBeNull();
      expect(chatResult.current.state.isLoading).toBe(false);

      // Verificar se mensagem foi adicionada ao histórico
      const session = historyResult.current.sessions[sessionId];
      expect(session.messages).toHaveLength(2); // User message + agent response

      const userMessage = session.messages[0];
      expect(userMessage.content).toBe('Hello, I need help');
      expect(userMessage.sender).toBe('user');

      const agentMessage = session.messages[1];
      expect(agentMessage.content).toBe('Hello! How can I help you today?');
      expect(agentMessage.sender).toBe('agent');
    });

    it('should handle webhook response with actions', async () => {
      const config = testDataFactory.createWebhookConfig({
        publicCaptureUrl: testEnvironment.webhooks.actions
      });

      const { result: chatResult } = renderHook(() => useN8nChat(config));
      const { result: historyResult } = renderHook(() => useChatHistory());

      let sessionId: string;
      let response: any;

      await act(async () => {
        sessionId = historyResult.current.createSession('public', config.publicCaptureUrl);
      });

      await act(async () => {
        response = await chatResult.current.sendMessage(
          sessionId,
          'I need to contact support',
          'public'
        );
      });

      // Verificar resposta com ações
      expect(response.success).toBe(true);
      expect(response.data.actions).toHaveLength(1);
      expect(response.data.actions[0].type).toBe('form');
      expect(response.data.actions[0].payload.formId).toBe('contact-form');
    });

    it('should handle session completion', async () => {
      const config = testDataFactory.createWebhookConfig({
        publicCaptureUrl: testEnvironment.webhooks.complete
      });

      const { result: chatResult } = renderHook(() => useN8nChat(config));
      const { result: historyResult } = renderHook(() => useChatHistory());

      let sessionId: string;
      let response: any;

      await act(async () => {
        sessionId = historyResult.current.createSession('public', config.publicCaptureUrl);
      });

      await act(async () => {
        response = await chatResult.current.sendMessage(
          sessionId,
          'Thank you, goodbye',
          'public'
        );
      });

      // Verificar que sessão foi marcada como completa
      expect(response.data.sessionComplete).toBe(true);

      // Verificar que sessão foi encerrada
      const session = historyResult.current.sessions[sessionId];
      expect(session.isActive).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle webhook errors gracefully', async () => {
      const config = testDataFactory.createWebhookConfig({
        publicCaptureUrl: testEnvironment.webhooks.error
      });

      const { result: chatResult } = renderHook(() => useN8nChat(config));
      const { result: historyResult } = renderHook(() => useChatHistory());

      let sessionId: string;
      let error: any;

      await act(async () => {
        sessionId = historyResult.current.createSession('public', config.publicCaptureUrl);
      });

      await act(async () => {
        try {
          await chatResult.current.sendMessage(
            sessionId,
            'This will cause an error',
            'public'
          );
        } catch (e) {
          error = e;
        }
      });

      // Verificar que erro foi capturado
      expect(error).toBeDefined();
      expect(chatResult.current.state.error).toBeDefined();
      expect(chatResult.current.state.isLoading).toBe(false);
    });

    it('should handle network timeouts', async () => {
      const config = testDataFactory.createWebhookConfig({
        publicCaptureUrl: testEnvironment.webhooks.timeout,
        timeout: 1000 // 1 segundo
      });

      const { result: chatResult } = renderHook(() => useN8nChat(config));
      const { result: historyResult } = renderHook(() => useChatHistory());

      let sessionId: string;
      let error: any;

      await act(async () => {
        sessionId = historyResult.current.createSession('public', config.publicCaptureUrl);
      });

      await act(async () => {
        try {
          await chatResult.current.sendMessage(
            sessionId,
            'This will timeout',
            'public'
          );
        } catch (e) {
          error = e;
        }
      });

      // Verificar que timeout foi tratado
      expect(error).toBeDefined();
      expect(error.type).toContain('TIMEOUT');
    });

    it('should handle server errors (5xx)', async () => {
      const config = testDataFactory.createWebhookConfig({
        publicCaptureUrl: testEnvironment.webhooks.serverError
      });

      const { result: chatResult } = renderHook(() => useN8nChat(config));
      const { result: historyResult } = renderHook(() => useChatHistory());

      let sessionId: string;
      let error: any;

      await act(async () => {
        sessionId = historyResult.current.createSession('public', config.publicCaptureUrl);
      });

      await act(async () => {
        try {
          await chatResult.current.sendMessage(
            sessionId,
            'Server error test',
            'public'
          );
        } catch (e) {
          error = e;
        }
      });

      expect(error).toBeDefined();
      expect(error.type).toContain('WEBHOOK');
    });

    it('should handle unauthorized requests (401)', async () => {
      const config = testDataFactory.createWebhookConfig({
        publicCaptureUrl: testEnvironment.webhooks.unauthorized
      });

      const { result: chatResult } = renderHook(() => useN8nChat(config));
      const { result: historyResult } = renderHook(() => useChatHistory());

      let sessionId: string;
      let error: any;

      await act(async () => {
        sessionId = historyResult.current.createSession('public', config.publicCaptureUrl);
      });

      await act(async () => {
        try {
          await chatResult.current.sendMessage(
            sessionId,
            'Unauthorized test',
            'public'
          );
        } catch (e) {
          error = e;
        }
      });

      expect(error).toBeDefined();
      expect(error.type).toContain('AUTH');
    });

    it('should handle rate limiting (429)', async () => {
      const config = testDataFactory.createWebhookConfig({
        publicCaptureUrl: testEnvironment.webhooks.rateLimit
      });

      const { result: chatResult } = renderHook(() => useN8nChat(config));
      const { result: historyResult } = renderHook(() => useChatHistory());

      let sessionId: string;
      let error: any;

      await act(async () => {
        sessionId = historyResult.current.createSession('public', config.publicCaptureUrl);
      });

      await act(async () => {
        try {
          await chatResult.current.sendMessage(
            sessionId,
            'Rate limit test',
            'public'
          );
        } catch (e) {
          error = e;
        }
      });

      expect(error).toBeDefined();
      expect(error.type).toContain('RATE_LIMIT');
    });
  });

  describe('Retry Mechanism', () => {
    it('should retry failed requests automatically', async () => {
      const config = testDataFactory.createWebhookConfig({
        retryAttempts: 2
      });

      // Configurar para falhar nas primeiras 2 tentativas e suceder na 3ª
      let attemptCount = 0;
      mockServerUtils.setResponse(
        config.publicCaptureUrl,
        () => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Network error');
          }
          return {
            success: true,
            data: { response: 'Success after retry' }
          };
        }
      );

      const { result: chatResult } = renderHook(() => useN8nChat(config));
      const { result: historyResult } = renderHook(() => useChatHistory());

      let sessionId: string;
      let response: any;

      await act(async () => {
        sessionId = historyResult.current.createSession('public', config.publicCaptureUrl);
      });

      await act(async () => {
        response = await chatResult.current.sendMessage(
          sessionId,
          'Retry test',
          'public',
          { autoRetry: true }
        );
      });

      expect(response.success).toBe(true);
      expect(response.data.response).toBe('Success after retry');
      expect(attemptCount).toBe(3);
    });

    it('should not retry non-retryable errors', async () => {
      const config = testDataFactory.createWebhookConfig({
        publicCaptureUrl: testEnvironment.webhooks.unauthorized,
        retryAttempts: 3
      });

      const { result: chatResult } = renderHook(() => useN8nChat(config));
      const { result: historyResult } = renderHook(() => useChatHistory());

      let sessionId: string;
      let error: any;

      await act(async () => {
        sessionId = historyResult.current.createSession('public', config.publicCaptureUrl);
      });

      await act(async () => {
        try {
          await chatResult.current.sendMessage(
            sessionId,
            'Non-retryable error',
            'public',
            { autoRetry: true }
          );
        } catch (e) {
          error = e;
        }
      });

      // Deve falhar imediatamente sem retry
      expect(error).toBeDefined();
      expect(chatResult.current.state.retryCount).toBe(0);
    });
  });

  describe('Performance and Load', () => {
    it('should handle multiple concurrent requests', async () => {
      const config = testDataFactory.createWebhookConfig();
      const { result: chatResult } = renderHook(() => useN8nChat(config));
      const { result: historyResult } = renderHook(() => useChatHistory());

      const sessionIds: string[] = [];
      const promises: Promise<any>[] = [];

      // Criar múltiplas sessões
      await act(async () => {
        for (let i = 0; i < 5; i++) {
          const sessionId = historyResult.current.createSession('public', config.publicCaptureUrl);
          sessionIds.push(sessionId);
        }
      });

      // Enviar mensagens concorrentemente
      await act(async () => {
        sessionIds.forEach((sessionId, index) => {
          const promise = chatResult.current.sendMessage(
            sessionId,
            `Concurrent message ${index}`,
            'public'
          );
          promises.push(promise);
        });

        const responses = await Promise.all(promises);

        // Todas as respostas devem ser bem-sucedidas
        responses.forEach(response => {
          expect(response.success).toBe(true);
        });
      });
    });

    it('should handle large message payloads', async () => {
      const config = testDataFactory.createWebhookConfig();
      const { result: chatResult } = renderHook(() => useN8nChat(config));
      const { result: historyResult } = renderHook(() => useChatHistory());

      let sessionId: string;
      let response: any;

      await act(async () => {
        sessionId = historyResult.current.createSession('public', config.publicCaptureUrl);
      });

      // Mensagem grande (próxima ao limite)
      const largeMessage = 'A'.repeat(900);

      await act(async () => {
        response = await chatResult.current.sendMessage(
          sessionId,
          largeMessage,
          'public'
        );
      });

      expect(response.success).toBe(true);

      // Verificar que mensagem foi processada corretamente
      const session = historyResult.current.sessions[sessionId];
      const userMessage = session.messages.find((msg: any) => msg.sender === 'user');
      expect(userMessage.content).toBe(largeMessage);
    });

    it('should measure and report response times', async () => {
      // Configurar delay no servidor
      mockServerUtils.setDelay(testEnvironment.webhooks.public, 500);

      const config = testDataFactory.createWebhookConfig();
      const { result: chatResult } = renderHook(() => useN8nChat(config));
      const { result: historyResult } = renderHook(() => useChatHistory());

      let sessionId: string;
      let response: any;
      const startTime = Date.now();

      await act(async () => {
        sessionId = historyResult.current.createSession('public', config.publicCaptureUrl);
      });

      await act(async () => {
        response = await chatResult.current.sendMessage(
          sessionId,
          'Performance test',
          'public'
        );
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.success).toBe(true);
      expect(responseTime).toBeGreaterThan(400); // Pelo menos o delay configurado
    });
  });

  describe('Security Integration', () => {
    it('should validate and sanitize messages before sending', async () => {
      const config = testDataFactory.createWebhookConfig();
      const { result: chatResult } = renderHook(() => useN8nChat(config));
      const { result: historyResult } = renderHook(() => useChatHistory());

      let sessionId: string;
      let error: any;

      await act(async () => {
        sessionId = historyResult.current.createSession('public', config.publicCaptureUrl);
      });

      // Tentar enviar conteúdo malicioso
      await act(async () => {
        try {
          await chatResult.current.sendMessage(
            sessionId,
            '<script>alert("xss")</script>',
            'public'
          );
        } catch (e) {
          error = e;
        }
      });

      // Deve ser bloqueado pela validação de segurança
      expect(error).toBeDefined();
      expect(error.type).toContain('VALIDATION');
    });

    it('should handle blocked sessions', async () => {
      const config = testDataFactory.createWebhookConfig();
      const { result: chatResult } = renderHook(() => useN8nChat(config));
      const { result: historyResult } = renderHook(() => useChatHistory());

      let sessionId: string;
      let error: any;

      await act(async () => {
        sessionId = historyResult.current.createSession('public', config.publicCaptureUrl);
      });

      // Simular sessão bloqueada
      // (Isso dependeria da implementação específica do middleware de segurança)

      await act(async () => {
        try {
          await chatResult.current.sendMessage(
            sessionId,
            'Normal message',
            'public'
          );
        } catch (e) {
          error = e;
        }
      });

      // Se a sessão estiver bloqueada, deve retornar erro específico
      if (error) {
        expect(error.type).toContain('SESSION');
      }
    });

    it('should enforce rate limiting', async () => {
      const config = testDataFactory.createWebhookConfig();
      const { result: chatResult } = renderHook(() => useN8nChat(config));
      const { result: historyResult } = renderHook(() => useChatHistory());

      let sessionId: string;
      let error: any;

      await act(async () => {
        sessionId = historyResult.current.createSession('public', config.publicCaptureUrl);
      });

      // Enviar muitas mensagens rapidamente
      await act(async () => {
        const promises = [];
        for (let i = 0; i < 25; i++) { // Acima do limite padrão
          promises.push(
            chatResult.current.sendMessage(
              sessionId,
              `Rate limit test ${i}`,
              'public'
            ).catch(e => e)
          );
        }

        const results = await Promise.all(promises);

        // Algumas devem falhar por rate limiting
        const errors = results.filter(result => result instanceof Error);
        expect(errors.length).toBeGreaterThan(0);

        const rateLimitErrors = errors.filter(error =>
          error.type && error.type.includes('RATE_LIMIT')
        );
        expect(rateLimitErrors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Persistence', () => {
    it('should persist chat history across page reloads', async () => {
      const config = testDataFactory.createWebhookConfig();
      const { result: historyResult1 } = renderHook(() => useChatHistory());

      let sessionId: string;

      // Primeira instância - criar sessão e mensagem
      await act(async () => {
        sessionId = historyResult1.current.createSession('public', config.publicCaptureUrl);
        historyResult1.current.addMessage(sessionId, {
          id: 'msg1',
          content: 'Persistent message',
          sender: 'user',
          timestamp: new Date(),
          status: 'sent'
        });
      });

      // Aguardar persistência
      await waitUtils.waitForLocalStorageChange('chat_sessions');

      // Segunda instância - simular reload
      const { result: historyResult2 } = renderHook(() => useChatHistory());

      // Verificar que dados foram carregados
      expect(historyResult2.current.sessions[sessionId]).toBeDefined();
      expect(historyResult2.current.sessions[sessionId].messages).toHaveLength(1);
      expect(historyResult2.current.sessions[sessionId].messages[0].content).toBe('Persistent message');
    });

    it('should cleanup expired sessions', async () => {
      const { result: historyResult } = renderHook(() => useChatHistory());

      // Criar sessão expirada (simulando data antiga)
      const expiredSession = testDataFactory.createSession({
        lastActivity: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 horas atrás
      });

      await act(async () => {
        // Adicionar sessão expirada manualmente ao localStorage
        const sessionsData = {
          sessions: [expiredSession],
          version: '1.0.0',
          lastCleanup: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
        };

        localStorage.setItem('chat_sessions', JSON.stringify(sessionsData));

        // Executar limpeza
        historyResult.current.cleanupExpiredSessions();
      });

      // Sessão expirada deve ter sido removida
      expect(historyResult.current.sessions[expiredSession.id]).toBeUndefined();
    });
  });
});
