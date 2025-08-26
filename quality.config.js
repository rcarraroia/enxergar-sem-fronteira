/**
 * Configuração do Sistema de Monitoramento de Qualidade
 *
 * Define thresholds, alertas e configurações para o monitoramento
 * contínuo da qualidade do código.
 */

module.exports = {
  // ============================================================================
  // THRESHOLDS DE QUALIDADE
  // ============================================================================

  thresholds: {
    // ESLint
    eslintErrors: 0,           // Máximo de erros permitidos
    eslintWarnings: 50,ximo de warnings permitidos

    // TypeScript
    typeScriptErrors: 0,       // Máximo de erros de tipo permitidos

    // Testes
    testCoverage: 70,          // Cobertura mínima de testes (%)
    testFailures: 0,           // Máximo de testes falhando

    // Bundle
    bundleSize: 2000,          // Tamanho máximo do bundle (KB)
    bundleSizeIncrease: 100,   // Aumento máximo permitido (KB)

    // Complexidade
    maxLinesPerFile: 300,      // Máximo de linhas por arquivo
    maxFunctionsPerFile: 20,   // Máximo de funções por arquivo
    cyclomaticComplexity: 10,  // Complexidade ciclomática máxima

    // Performance
    buildTime: 60,             // Tempo máximo de build (segundos)
    testTime: 30,              // Tempo máximo de testes (segundos)
  },

  // ============================================================================
  // CONFIGURAÇÕES DE REGRESSÃO
  // ============================================================================

  regression: {
    // Thresholds para detectar regressões
    thresholds: {
      eslintErrors: 0,         // Qualquer aumento é regressão
      eslintWarnings: 5,       // Aumento de 5+ warnings
      testCoverage: -5,        // Redução de 5% na cobertura
      bundleSize: 100,         // Aumento de 100KB
      typeScriptErrors: 0,     // Qualquer aumento é regressão
      buildTime: 10,           // Aumento de 10+ segundos
    },

    // Número de execuções para calcular baseline
    baselineWindow: 5,

    // Máximo de entradas no histórico
    maxHistoryEntries: 50,
  },

  // ============================================================================
  // CONFIGURAÇÕES DE ALERTAS
  // ============================================================================

  alerts: {
    // Severidades de alerta
    severities: {
      critical: {
        color: '#dc2626',
        icon: '🚨',
        exitCode: 1
      },
      high: {
        color: '#ef4444',
        icon: '❌',
        exitCode: 1
      },
      medium: {
        color: '#f59e0b',
        icon: '⚠️',
        exitCode: 0
      },
      low: {
        color: '#6b7280',
        icon: 'ℹ️',
        exitCode: 0
      },
      info: {
        color: '#3b82f6',
        icon: '📊',
        exitCode: 0
      }
    },

    // Configurações de notificação
    notifications: {
      console: true,           // Exibir no console
      file: true,              // Salvar em arquivo
      webhook: false,          // Enviar para webhook (futuro)
      email: false,            // Enviar por email (futuro)
    },

    // Filtros de alerta
    filters: {
      minSeverity: 'low',      // Severidade mínima para exibir
      maxAlerts: 10,           // Máximo de alertas por execução
      deduplicate: true,       // Remover alertas duplicados
    }
  },

  // ============================================================================
  // CONFIGURAÇÕES DE RELATÓRIOS
  // ============================================================================

  reports: {
    // Diretório de saída
    outputDir: 'quality-reports',

    // Formatos de relatório
    formats: {
      json: true,              // Relatório JSON detalhado
      text: true,              // Relatório de texto legível
      html: false,             // Relatório HTML (futuro)
      csv: false,              // Dados em CSV (futuro)
    },

    // Configurações de arquivo
    files: {
      latestReport: 'latest-quality-report.json',
      historyFile: 'quality-history.json',
      alertsFile: 'quality-alerts.json',
      trendsFile: 'quality-trends.json',
    },

    // Retenção de dados
    retention: {
      reports: 30,             // Dias para manter relatórios
      history: 90,             // Dias para manter histórico
      alerts: 7,               // Dias para manter alertas
    }
  },

  // ============================================================================
  // CONFIGURAÇÕES DE COLETA
  // ============================================================================

  collection: {
    // Comandos para coleta de métricas
    commands: {
      eslint: 'npx eslint . --format json',
      typescript: 'npx tsc --noEmit --pretty false',
      test: 'npm run test:run',
      testCoverage: 'npm run test:coverage',
      build: 'npm run build',
    },

    // Timeouts para comandos (segundos)
    timeouts: {
      eslint: 60,
      typescript: 120,
      test: 180,
      build: 300,
    },

    // Diretórios para análise
    directories: {
      source: 'src',
      tests: 'src/test',
      build: 'dist',
      coverage: 'coverage',
    },

    // Padrões de arquivo
    patterns: {
      source: '**/*.{ts,tsx}',
      tests: '**/*.{test,spec}.{ts,tsx}',
      ignore: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        '**/*.d.ts'
      ]
    }
  },

  // ============================================================================
  // CONFIGURAÇÕES DE DASHBOARD
  // ============================================================================

  dashboard: {
    // Configurações visuais
    theme: {
      primaryColor: '#3b82f6',
      successColor: '#10b981',
      warningColor: '#f59e0b',
      errorColor: '#ef4444',
      backgroundColor: '#f8fafc',
    },

    // Métricas para exibir
    metrics: [
      'eslint.errors',
      'eslint.warnings',
      'typescript.errors',
      'tests.coverage',
      'tests.passed',
      'bundle.size',
      'complexity.files',
      'complexity.lines'
    ],

    // Gráficos para exibir
    charts: [
      'eslint-trends',
      'coverage-trends',
      'bundle-trends',
      'complexity-overview'
    ],

    // Configurações de atualização
    refresh: {
      interval: 300000,        // 5 minutos em ms
      autoRefresh: true,
    }
  },

  // ============================================================================
  // CONFIGURAÇÕES DE INTEGRAÇÃO
  // ============================================================================

  integrations: {
    // GitHub Actions
    github: {
      enabled: true,
      uploadArtifacts: true,
      commentPR: false,        // Comentar em PRs (futuro)
      createIssues: false,     // Criar issues para regressões (futuro)
    },

    // Webhooks
    webhooks: {
      enabled: false,
      endpoints: [],
    },

    // Slack (futuro)
    slack: {
      enabled: false,
      webhook: null,
      channel: '#quality',
    },

    // Email (futuro)
    email: {
      enabled: false,
      smtp: null,
      recipients: [],
    }
  },

  // ============================================================================
  // CONFIGURAÇÕES AVANÇADAS
  // ============================================================================

  advanced: {
    // Paralelização
    parallel: {
      enabled: true,
      maxConcurrency: 4,
    },

    // Cache
    cache: {
      enabled: true,
      ttl: 3600,               // 1 hora em segundos
      directory: '.quality-cache',
    },

    // Logging
    logging: {
      level: 'info',           // debug, info, warn, error
      file: 'quality.log',
      maxSize: '10MB',
      maxFiles: 5,
    },

    // Experimentais
    experimental: {
      aiAnalysis: false,       // Análise com IA (futuro)
      predictiveAlerts: false, // Alertas preditivos (futuro)
      autoFix: false,          // Correção automática (futuro)
    }
  }
};
