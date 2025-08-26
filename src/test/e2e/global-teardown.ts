/**
 * Global Teardown para Testes E2E
 *
 * Limpeza global executada após todos os testes E2E
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test teardown...');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    const mockServerURL = 'http://localhost:3001';

    // Limpar dados de teste
    console.log('🗑️ Cleaning up test data...');

    try {
      // Limpar sessões do mock server
      await page.goto(`${mockServerURL}/sessions`, { timeout: 5000 });
      await page.evaluate(() => {
        return fetch('/sessions', { method: 'DELETE' });
      });
      console.log('✅ Test sessions cleared');
    } catch (error) {
      console.warn('⚠️ Could not clear test sessions:', error);
    }

    // Gerar relatório de sessões (se necessário)
    try {
      const response = await page.goto(`${mockServerURL}/sessions`, { timeout: 5000 });
      if (response?.ok()) {
        const sessions = await page.evaluate(() => {
          return fetch('/sessions').then(r => r.json());
        });

        if (sessions.total > 0) {
          console.log(`📊 ${sessions.total} sessions were created during tests`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not generate session report:', error);
    }

    console.log('✅ E2E test teardown completed successfully');

  } catch (error) {
    console.error('❌ E2E test teardown failed:', error);
    // Não falhar o teardown por erros de limpeza
  } finally {
    await browser.close();
  }
}

export default globalTeardown;
