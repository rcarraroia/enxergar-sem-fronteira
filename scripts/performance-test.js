/**
 * Script de Testes de Performance
 *
 * Executa testes de carga e performance do sistema de chat
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Thresholds de performance
  thresholds: {
    renderTime: 100, // ms
    memoryUsage: 100, // MB
    bundleSize: 200, // KB
    fps: 50,
    latency: 500 // ms
  },

  // Configurações de teste
  test: {
    iterations: 10,
    concurrentSessions: 5,
    messagesPerSession: 20,
    timeout: 30000 // 30 segundos
  },

  // Saída de relatórios
  output: {
    directory: './performance-reports',
    format: 'json'
  }
};

// ============================================================================
// UTILITIES
// ============================================================================

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m'
  };

  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDuration(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

class PerformanceTestRunner {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage()
      },
      tests: {},
      summary: {
        passed: 0,
        failed: 0,
        warnings: 0,
        totalTime: 0
      }
    };
  }

  async runAllTests() {
    log('🚀 Starting performance test suite...');
    const startTime = Date.now();

    try {
      // Preparar ambiente
      await this.setupEnvironment();

      // Executar testes
      await this.runUnitPerformanceTests();
      await this.runLoadTests();
      await this.runMemoryTests();
      await this.runBundleAnalysis();
      await this.runE2EPerformanceTests();

      // Gerar relatório
      this.results.summary.totalTime = Date.now() - startTime;
      await this.generateReport();

      log(`✅ Performance tests completed in ${formatDuration(this.results.summary.totalTime)}`, 'success');

    } catch (error) {
      log(`❌ Performance tests failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async setupEnvironment() {
    log('🔧 Setting up test environment...');

    // Criar diretório de relatórios
    ensureDirectory(CONFIG.output.directory);

    // Verificar dependências
    try {
      execSync('npm list --depth=0', { stdio: 'pipe' });
      log('✅ Dependencies verified');
    } catch (error) {
      log('⚠️ Some dependencies may be missing', 'warning');
    }

    // Limpar cache se necessário
    if (process.env.CLEAR_CACHE === 'true') {
      try {
        execSync('npm run build:clean', { stdio: 'pipe' });
        log('🧹 Cache cleared');
      } catch (error) {
        log('⚠️ Could not clear cache', 'warning');
      }
    }
  }

  async runUnitPerformanceTests() {
    log('🧪 Running unit performance tests...');

    try {
      const output = execSync(
        'npm run test -- src/test/performance/chat-performance.test.ts --reporter=json',
        {
          encoding: 'utf8',
          timeout: CONFIG.test.timeout
        }
      );

      const testResults = JSON.parse(output);

      this.results.tests.unit = {
        passed: testResults.numPassedTests || 0,
        failed: testResults.numFailedTests || 0,
        duration: testResults.testResults?.[0]?.perfStats?.runtime || 0,
        details: testResults.testResults || []
      };

      if (testResults.numFailedTests > 0) {
        this.results.summary.failed += testResults.numFailedTests;
        log(`❌ ${testResults.numFailedTests} unit performance tests failed`, 'error');
      } else {
        this.results.summary.passed += testResults.numPassedTests;
        log(`✅ ${testResults.numPassedTests} unit performance tests passed`, 'success');
      }

    } catch (error) {
      log(`❌ Unit performance tests failed: ${error.message}`, 'error');
      this.results.tests.unit = { error: error.message };
      this.results.summary.failed++;
    }
  }

  async runLoadTests() {
    log('⚡ Running load tests...');

    try {
      const output = execSync(
        'npm run test -- src/test/performance/chat-load.test.ts --reporter=json',
        {
          encoding: 'utf8',
          timeout: CONFIG.test.timeout * 2 // Load tests podem demorar mais
        }
      );

      const testResults = JSON.parse(output);

      this.results.tests.load = {
        passed: testResults.numPassedTests || 0,
        failed: testResults.numFailedTests || 0,
        duration: testResults.testResults?.[0]?.perfStats?.runtime || 0,
        details: testResults.testResults || []
      };

      if (testResults.numFailedTests > 0) {
        this.results.summary.failed += testResults.numFailedTests;
        log(`❌ ${testResults.numFailedTests} load tests failed`, 'error');
      } else {
        this.results.summary.passed += testResults.numPassedTests;
        log(`✅ ${testResults.numPassedTests} load tests passed`, 'success');
      }

    } catch (error) {
      log(`❌ Load tests failed: ${error.message}`, 'error');
      this.results.tests.load = { error: error.message };
      this.results.summary.failed++;
    }
  }

  async runMemoryTests() {
    log('🧠 Running memory tests...');

    const memoryBefore = process.memoryUsage();

    try {
      // Executar testes de memória específicos
      const output = execSync(
        'npm run test -- --testNamePattern="Memory" --reporter=json',
        {
          encoding: 'utf8',
          timeout: CONFIG.test.timeout
        }
      );

      const memoryAfter = process.memoryUsage();
      const memoryDiff = {
        rss: memoryAfter.rss - memoryBefore.rss,
        heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
        heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
        external: memoryAfter.external - memoryBefore.external
      };

      this.results.tests.memory = {
        before: memoryBefore,
        after: memoryAfter,
        diff: memoryDiff,
        passed: true
      };

      // Verificar se uso de memória está dentro dos limites
      const heapUsedMB = memoryDiff.heapUsed / 1024 / 1024;
      if (heapUsedMB > CONFIG.thresholds.memoryUsage) {
        log(`⚠️ Memory usage exceeded threshold: ${heapUsedMB.toFixed(2)}MB`, 'warning');
        this.results.summary.warnings++;
      } else {
        log(`✅ Memory usage within limits: ${heapUsedMB.toFixed(2)}MB`, 'success');
        this.results.summary.passed++;
      }

    } catch (error) {
      log(`❌ Memory tests failed: ${error.message}`, 'error');
      this.results.tests.memory = { error: error.message };
      this.results.summary.failed++;
    }
  }

  async runBundleAnalysis() {
    log('📦 Running bundle analysis...');

    try {
      // Build da aplicação
      execSync('npm run build', { stdio: 'pipe' });

      // Analisar tamanho do bundle
      const distPath = path.join(process.cwd(), 'dist');
      const bundleStats = this.analyzeBundleSize(distPath);

      this.results.tests.bundle = bundleStats;

      // Verificar se bundle está dentro dos limites
      const chatBundleSizeKB = bundleStats.chatSystem / 1024;
      if (chatBundleSizeKB > CONFIG.thresholds.bundleSize) {
        log(`⚠️ Chat bundle size exceeded threshold: ${chatBundleSizeKB.toFixed(2)}KB`, 'warning');
        this.results.summary.warnings++;
      } else {
        log(`✅ Chat bundle size within limits: ${chatBundleSizeKB.toFixed(2)}KB`, 'success');
        this.results.summary.passed++;
      }

    } catch (error) {
      log(`❌ Bundle analysis failed: ${error.message}`, 'error');
      this.results.tests.bundle = { error: error.message };
      this.results.summary.failed++;
    }
  }

  analyzeBundleSize(distPath) {
    const stats = {
      total: 0,
      chatSystem: 0,
      files: []
    };

    if (!fs.existsSync(distPath)) {
      throw new Error('Build directory not found');
    }

    const files = fs.readdirSync(distPath, { recursive: true });

    for (const file of files) {
      const filePath = path.join(distPath, file);

      if (fs.statSync(filePath).isFile()) {
        const size = fs.statSync(filePath).size;
        stats.total += size;

        // Identificar arquivos relacionados ao chat
        if (file.includes('chat') || file.includes('Chat')) {
          stats.chatSystem += size;
        }

        stats.files.push({
          name: file,
          size: size,
          sizeFormatted: formatBytes(size)
        });
      }
    }

    // Ordenar arquivos por tamanho
    stats.files.sort((a, b) => b.size - a.size);

    return stats;
  }

  async runE2EPerformanceTests() {
    log('🎭 Running E2E performance tests...');

    try {
      // Verificar se Playwright está disponível
      const playwrightConfig = path.join(process.cwd(), 'playwright.config.ts');
      if (!fs.existsSync(playwrightConfig)) {
        log('⚠️ Playwright not configured, skipping E2E performance tests', 'warning');
        return;
      }

      const output = execSync(
        'npx playwright test --grep="performance" --reporter=json',
        {
          encoding: 'utf8',
          timeout: CONFIG.test.timeout * 3 // E2E tests podem demorar mais
        }
      );

      const testResults = JSON.parse(output);

      this.results.tests.e2e = {
        passed: testResults.stats?.passed || 0,
        failed: testResults.stats?.failed || 0,
        duration: testResults.stats?.duration || 0,
        details: testResults.suites || []
      };

      if (testResults.stats?.failed > 0) {
        this.results.summary.failed += testResults.stats.failed;
        log(`❌ ${testResults.stats.failed} E2E performance tests failed`, 'error');
      } else {
        this.results.summary.passed += testResults.stats?.passed || 0;
        log(`✅ ${testResults.stats?.passed || 0} E2E performance tests passed`, 'success');
      }

    } catch (error) {
      log(`❌ E2E performance tests failed: ${error.message}`, 'error');
      this.results.tests.e2e = { error: error.message };
      this.results.summary.failed++;
    }
  }

  async generateReport() {
    log('📊 Generating performance report...');

    const reportPath = path.join(
      CONFIG.output.directory,
      `performance-report-${Date.now()}.json`
    );

    // Adicionar resumo final
    this.results.summary.total = this.results.summary.passed + this.results.summary.failed;
    this.results.summary.successRate = this.results.summary.total > 0
      ? (this.results.summary.passed / this.results.summary.total) * 100
      : 0;

    // Salvar relatório JSON
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    // Gerar relatório HTML
    await this.generateHTMLReport();

    // Exibir resumo no console
    this.displaySummary();

    log(`📄 Report saved to: ${reportPath}`, 'success');
  }

  async generateHTMLReport() {
    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title>Chat Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 24px; font-weight: bold; }
        .passed { color: #4CAF50; }
        .failed { color: #f44336; }
        .warning { color: #FF9800; }
        .details { margin: 20px 0; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Chat System Performance Report</h1>
        <p>Generated: ${this.results.timestamp}</p>
        <p>Duration: ${formatDuration(this.results.summary.totalTime)}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Tests Passed</h3>
            <div class="value passed">${this.results.summary.passed}</div>
        </div>
        <div class="metric">
            <h3>Tests Failed</h3>
            <div class="value failed">${this.results.summary.failed}</div>
        </div>
        <div class="metric">
            <h3>Warnings</h3>
            <div class="value warning">${this.results.summary.warnings}</div>
        </div>
        <div class="metric">
            <h3>Success Rate</h3>
            <div class="value">${this.results.summary.successRate.toFixed(1)}%</div>
        </div>
    </div>

    <div class="details">
        <h2>Test Results</h2>
        ${Object.entries(this.results.tests).map(([testType, results]) => `
            <div class="test-section">
                <h3>${testType.charAt(0).toUpperCase() + testType.slice(1)} Tests</h3>
                <pre>${JSON.stringify(results, null, 2)}</pre>
            </div>
        `).join('')}
    </div>

    <div class="details">
        <h2>Environment</h2>
        <pre>${JSON.stringify(this.results.environment, null, 2)}</pre>
    </div>
</body>
</html>`;

    const htmlPath = path.join(CONFIG.output.directory, 'performance-report.html');
    fs.writeFileSync(htmlPath, htmlTemplate);

    log(`📄 HTML report saved to: ${htmlPath}`, 'success');
  }

  displaySummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PERFORMANCE TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.results.summary.total}`);
    console.log(`Passed: ${this.results.summary.passed}`);
    console.log(`Failed: ${this.results.summary.failed}`);
    console.log(`Warnings: ${this.results.summary.warnings}`);
    console.log(`Success Rate: ${this.results.summary.successRate.toFixed(1)}%`);
    console.log(`Duration: ${formatDuration(this.results.summary.totalTime)}`);
    console.log('='.repeat(60) + '\n');
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const runner = new PerformanceTestRunner();
  await runner.runAllTests();
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Performance test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { PerformanceTestRunner, CONFIG };
