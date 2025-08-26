/**
 * Lighthouse CI Configuration
 *
 * Configuração para testes de performance automatizados
 */

module.exports = {
  ci: {
    collect: {
      // URLs para testar
      url: [
        'http://localhost:4173/',
        'http://localhost:4173/admin',
        'http://localhost:4173/chat-examples'
      ],

      // Configurações de coleta
      numberOfRuns: 3,
      settings: {
        // Configurações do Chrome
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',

        // Configurações específicas para chat
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        },

        // Configurações de rede
        emulatedFormFactor: 'desktop',
        locale: 'pt-BR',

        // Configurações específicas
        onlyCategories: ['performance', 'accessibility', 'best-practices'],

        // Configurações de timeout
        maxWaitForLoad: 45000,
        maxWaitForFcp: 15000,

        // Configurações de screenshot
        fullPageScreenshot: true,
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false
        }
      }
    },

    assert: {
      // Assertions para performance
      assertions: {
        // Performance metrics
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],

        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],

        // Métricas específicas para chat
        'interactive': ['error', { maxNumericValue: 3000 }],
        'speed-index': ['error', { maxNumericValue: 2500 }],

        // Métricas de recursos
        'unused-javascript': ['warn', { maxNumericValue: 20000 }],
        'unused-css-rules': ['warn', { maxNumericValue: 10000 }],
        'render-blocking-resources': ['warn', { maxNumericValue: 500 }],

        // Acessibilidade específica
        'color-contrast': 'error',
        'aria-labels': 'error',
        'keyboard-navigation': 'error',

        // Best practices
        'uses-https': 'error',
        'no-vulnerable-libraries': 'error',
        'csp-xss': 'warn'
      }
    },

    upload: {
      // Configuração para GitHub Actions
      target: 'temporary-public-storage',

      // Configuração para servidor próprio (se disponível)
      // serverBaseUrl: 'https://your-lhci-server.com',
      // token: process.env.LHCI_TOKEN
    },

    server: {
      // Configuração do servidor LHCI (opcional)
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: './lhci.db'
      }
    }
  }
};
