/**
 * Global Setup para Testes E2E
 *
 * Configuração global executada antes de todos os testes E2E
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...');

  // Configurar browser para setup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Aguardar servidores estarem prontos
    console.log('⏳ Waiting for servers to be ready...');

    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4173';
    const mockServerURL = 'http://localhost:3001';

    // Aguardar aplicação principal
    let retries = 30;
    while (retries > 0) {
      try {
        const response = await page.goto(baseURL, { timeout: 5000 });
        if (response?.ok()) {
          console.log('✅ Main application is ready');
          break;
        }
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error(`Main application not ready at ${baseURL}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Aguardar mock server
    retries = 30;
    while (retries > 0) {
      try {
        const response = await page.goto(`${mockServerURL}/health`, { timeout: 5000 });
        if (response?.ok()) {
          console.log('✅ Mock n8n server is ready');
          break;
        }
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error(`Mock server not ready at ${mockServerURL}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Configurar dados de teste
    console.log('📝 Setting up test data...');

    // Limpar sessões anteriores no mock server
    try {
      await page.goto(`${mockServerURL}/sessions`, { timeout: 5000 });
      await page.evaluate(() => {
        return fetch('/sessions', { method: 'DELETE' });
      });
      console.log('🧹 Cleared previous test sessions');
    } catch (error) {
      console.warn('⚠️ Could not clear previous sessions:', error);
    }

    // Verificar se chat está funcionando
    console.log('🧪 Testing basic chat functionality...');

    await page.goto(baseURL);

    // Verificar se elementos do chat estão presentes
    const chatToggle = page.locator('[data-testid="chat-toggle"]');
    if (await chatToggle.count() > 0) {
      console.log('✅ Chat widget found');

      // Testar abertura do chat
      await chatToggle.click();

      const messageInput = page.locator('[data-testid="message-input"]');
      if (await messageInput.count() > 0) {
        console.log('✅ Chat interface is functional');
      } else {
        console.warn('⚠️ Chat interface may not be working properly');
      }
    } else {
      console.warn('⚠️ Chat widget not found - tests may fail');
    }

    // Configurar localStorage para testes
    await page.evaluate(() => {
      localStorage.setItem('chat-test-mode', 'true');
      localStorage.setItem('chat-config', JSON.stringify({
        enableChat: true,
        enableVoiceInput: true,
        enableMetrics: false,
        enableDevMode: true
      }));
    });

    console.log('✅ E2E test setup completed successfully');

  } catch (error) {
    console.error('❌ E2E test setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
