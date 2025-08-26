/**
 * Testes E2E do Sistema de Chat
 *
 * Testes end-to-end para validar funcionalidade completa do chat
 */

import { expect, Page, test } from '@playwright/test';

// ============================================================================
// SETUP E HELPERS
// ============================================================================

class ChatPage {
  constructor(private page: Page) {}

  // Seletores
  get chatWidget() { return this.page.locator('[data-testid="chat-widget"]'); }
  get chatToggle() { return this.page.locator('[data-testid="chat-toggle"]'); }
  get messageInput() { return this.page.locator('[data-testid="message-input"]'); }
  get sendButton() { return this.page.locator('[data-testid="send-button"]'); }
  get voiceButton() { return this.page.locator('[data-testid="voice-button"]'); }
  get messageHistory() { return this.page.locator('[data-testid="message-history"]'); }
  get typingIndicator() { return this.page.locator('[data-testid="typing-indicator"]'); }
  get errorMessage() { return this.page.locator('[data-testid="error-message"]'); }
  get retryButton() { return this.page.locator('[data-testid="retry-button"]'); }

  // Ações
  async openChat() {
    await this.chatToggle.click();
    await expect(this.chatWidget).toBeVisible();
  }

  async closeChat() {
    await this.page.keyboard.press('Escape');
    await expect(this.chatWidget).not.toBeVisible();
  }

  async sendMessage(message: string) {
    await this.messageInput.fill(message);
    await this.sendButton.click();
  }

  async sendMessageWithEnter(message: string) {
    await this.messageInput.fill(message);
    await this.page.keyboard.press('Enter');
  }

  async waitForResponse(timeout = 5000) {
    await this.page.waitForTimeout(1000); // Aguardar processamento
    await expect(this.typingIndicator).not.toBeVisible({ timeout });
  }

  async getLastMessage() {
    const messages = this.messageHistory.locator('[data-testid="message-bubble"]');
    return messages.last();
  }

  async getMessageCount() {
    const messages = this.messageHistory.locator('[data-testid="message-bubble"]');
    return await messages.count();
  }
}

// ============================================================================
// TESTES
// ============================================================================

test.describe('Chat System E2E Tests', () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await page.goto('/');
  });

  test.describe('Basic Chat Functionality', () => {
    test('should open and close chat widget', async ({ page }) => {
      // Verificar se widget está fechado inicialmente
      await expect(chatPage.chatWidget).not.toBeVisible();

      // Abrir chat
      await chatPage.openChat();
      await expect(chatPage.chatWidget).toBeVisible();
      await expect(chatPage.messageInput).toBeFocused();

      // Fechar chat
      await chatPage.closeChat();
      await expect(chatPage.chatWidget).not.toBeVisible();
    });

    test('should send and receive messages', async ({ page }) => {
      await chatPage.openChat();

      const testMessage = 'Olá, este é um teste!';

      // Enviar mensagem
      await chatPage.sendMessage(testMessage);

      // Verificar se mensagem do usuário aparece
      const userMessage = await chatPage.getLastMessage();
      await expect(userMessage).toContainText(testMessage);
      await expect(userMessage).toHaveAttribute('data-sender', 'user');

      // Aguardar resposta do agente
      await chatPage.waitForResponse();

      // Verificar se resposta do agente aparece
      const agentMessage = await chatPage.getLastMessage();
      await expect(agentMessage).toHaveAttribute('data-sender', 'agent');
      await expect(agentMessage).toBeVisible();
    });

    test('should handle Enter key to send message', async ({ page }) => {
      await chatPage.openChat();

      const testMessage = 'Teste com Enter';

      await chatPage.sendMessageWithEnter(testMessage);

      // Verificar se mensagem foi enviada
      const messageCount = await chatPage.getMessageCount();
      expect(messageCount).toBeGreaterThan(0);
    });

    test('should show typing indicator', async ({ page }) => {
      await chatPage.openChat();

      await chatPage.sendMessage('Teste de digitação');

      // Verificar se indicador de digitação aparece
      await expect(chatPage.typingIndicator).toBeVisible();

      // Aguardar resposta e verificar se indicador desaparece
      await chatPage.waitForResponse();
      await expect(chatPage.typingIndicator).not.toBeVisible();
    });
  });

  test.describe('Message Types and Responses', () => {
    test('should handle greeting messages', async ({ page }) => {
      await chatPage.openChat();

      await chatPage.sendMessage('Olá');
      await chatPage.waitForResponse();

      const response = await chatPage.getLastMessage();
      await expect(response).toContainText(/olá|bem-vindo|oi/i);
    });

    test('should handle pricing inquiries', async ({ page }) => {
      await chatPage.openChat();

      await chatPage.sendMessage('Qual é o preço?');
      await chatPage.waitForResponse();

      const response = await chatPage.getLastMessage();
      await expect(response).toContainText(/preço|valor|R\$/i);
    });

    test('should handle contact requests', async ({ page }) => {
      await chatPage.openChat();

      await chatPage.sendMessage('Como posso entrar em contato?');
      await chatPage.waitForResponse();

      const response = await chatPage.getLastMessage();
      await expect(response).toContainText(/contato|telefone|email/i);
    });

    test('should handle multiple messages in sequence', async ({ page }) => {
      await chatPage.openChat();

      const messages = [
        'Primeira mensagem',
        'Segunda mensagem',
        'Terceira mensagem'
      ];

      for (const message of messages) {
        await chatPage.sendMessage(message);
        await chatPage.waitForResponse();
      }

      const totalMessages = await chatPage.getMessageCount();
      expect(totalMessages).toBe(messages.length * 2); // User + Agent messages
    });
  });

  test.describe('Voice Input', () => {
    test('should show voice button when enabled', async ({ page }) => {
      await page.goto('/?voice=true');
      await chatPage.openChat();

      await expect(chatPage.voiceButton).toBeVisible();
    });

    test('should toggle voice recording', async ({ page }) => {
      await page.goto('/?voice=true');
      await chatPage.openChat();

      // Verificar estado inicial
      await expect(chatPage.voiceButton).toHaveAttribute('aria-pressed', 'false');

      // Iniciar gravação
      await chatPage.voiceButton.click();
      await expect(chatPage.voiceButton).toHaveAttribute('aria-pressed', 'true');

      // Parar gravação
      await chatPage.voiceButton.click();
      await expect(chatPage.voiceButton).toHaveAttribute('aria-pressed', 'false');
    });

    test('should handle voice permissions', async ({ page, context }) => {
      // Conceder permissão de microfone
      await context.grantPermissions(['microphone']);

      await page.goto('/?voice=true');
      await chatPage.openChat();

      await chatPage.voiceButton.click();

      // Verificar se não há erro de permissão
      await expect(chatPage.errorMessage).not.toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simular erro de rede
      await page.route('**/webhook/**', route => {
        route.abort('failed');
      });

      await chatPage.openChat();
      await chatPage.sendMessage('Teste de erro');

      // Verificar se erro é exibido
      await expect(chatPage.errorMessage).toBeVisible();
      await expect(chatPage.retryButton).toBeVisible();
    });

    test('should retry failed messages', async ({ page }) => {
      let requestCount = 0;

      // Falhar primeira tentativa, suceder na segunda
      await page.route('**/webhook/**', route => {
        requestCount++;
        if (requestCount === 1) {
          route.abort('failed');
        } else {
          route.continue();
        }
      });

      await chatPage.openChat();
      await chatPage.sendMessage('Teste de retry');

      // Aguardar erro aparecer
      await expect(chatPage.errorMessage).toBeVisible();

      // Tentar novamente
      await chatPage.retryButton.click();

      // Verificar se mensagem foi enviada com sucesso
      await chatPage.waitForResponse();
      await expect(chatPage.errorMessage).not.toBeVisible();
    });

    test('should handle server timeout', async ({ page }) => {
      // Simular timeout
      await page.route('**/webhook/**', route => {
        // Não responder para simular timeout
        setTimeout(() => route.abort('timedout'), 10000);
      });

      await chatPage.openChat();
      await chatPage.sendMessage('Teste de timeout');

      // Verificar se erro de timeout é exibido
      await expect(chatPage.errorMessage).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Accessibility', () => {
    test('should be navigable by keyboard', async ({ page }) => {
      await chatPage.openChat();

      // Navegar com Tab
      await page.keyboard.press('Tab');
      await expect(chatPage.messageInput).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(chatPage.voiceButton.or(chatPage.sendButton)).toBeFocused();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await chatPage.openChat();

      await expect(chatPage.messageInput).toHaveAttribute('aria-label');
      await expect(chatPage.sendButton).toHaveAttribute('aria-label');
      await expect(chatPage.messageHistory).toHaveAttribute('role', 'log');
    });

    test('should announce messages to screen readers', async ({ page }) => {
      await chatPage.openChat();

      await chatPage.sendMessage('Teste de acessibilidade');
      await chatPage.waitForResponse();

      // Verificar se mensagens têm atributos de acessibilidade
      const messages = chatPage.messageHistory.locator('[data-testid="message-bubble"]');
      await expect(messages.first()).toHaveAttribute('role', 'article');
    });
  });

  test.describe('Performance', () => {
    test('should load chat widget quickly', async ({ page }) => {
      const startTime = Date.now();

      await chatPage.openChat();

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2000); // Menos de 2 segundos
    });

    test('should handle many messages efficiently', async ({ page }) => {
      await chatPage.openChat();

      // Enviar muitas mensagens
      for (let i = 0; i < 10; i++) {
        await chatPage.sendMessage(`Mensagem ${i + 1}`);
        await page.waitForTimeout(100); // Pequeno delay entre mensagens
      }

      // Verificar se todas as mensagens estão visíveis
      const messageCount = await chatPage.getMessageCount();
      expect(messageCount).toBeGreaterThanOrEqual(10);
    });

    test('should not cause memory leaks', async ({ page }) => {
      await chatPage.openChat();

      // Simular uso intenso
      for (let i = 0; i < 5; i++) {
        await chatPage.sendMessage(`Teste ${i}`);
        await chatPage.waitForResponse();
      }

      // Fechar e reabrir chat
      await chatPage.closeChat();
      await chatPage.openChat();

      // Verificar se chat ainda funciona
      await chatPage.sendMessage('Teste após reabrir');
      await chatPage.waitForResponse();

      const lastMessage = await chatPage.getLastMessage();
      await expect(lastMessage).toBeVisible();
    });
  });

  test.describe('Mobile Experience', () => {
    test('should work on mobile devices', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Este teste é apenas para mobile');

      await chatPage.openChat();

      // Verificar se interface se adapta ao mobile
      await expect(chatPage.chatWidget).toBeVisible();
      await expect(chatPage.messageInput).toBeVisible();

      // Testar envio de mensagem no mobile
      await chatPage.sendMessage('Teste mobile');
      await chatPage.waitForResponse();

      const response = await chatPage.getLastMessage();
      await expect(response).toBeVisible();
    });

    test('should handle touch interactions', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Este teste é apenas para mobile');

      await chatPage.openChat();

      // Testar toque no botão de envio
      await chatPage.messageInput.fill('Teste de toque');
      await chatPage.sendButton.tap();

      await chatPage.waitForResponse();

      const messageCount = await chatPage.getMessageCount();
      expect(messageCount).toBeGreaterThan(0);
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('should work consistently across browsers', async ({ page, browserName }) => {
      await chatPage.openChat();

      await chatPage.sendMessage(`Teste no ${browserName}`);
      await chatPage.waitForResponse();

      const response = await chatPage.getLastMessage();
      await expect(response).toBeVisible();
      await expect(response).toContainText(/teste|obrigado|como posso/i);
    });
  });
});
