#!/usr/bin/env node

/**
 * Sistema de Alertas de Qualidade
 *
 * Monitora regressões de qualidade comparando métricas atuais
 * com métricas históricas e envia alertas quando necessário.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

const CONFIG = {
  historyFile: 'quality-reports/quality-history.json',
  alertsFile: 'quality-reports/quality-alerts.json',
  maxHistoryEntries: 50,
  regressionThresholds: {
    eslintErrors: 0, // Qualquer aumento é regressão
    eslintWarnings: 5, // Aumento de 5+ warnings
    testCoverage: -5, // Redução de 5% na cobertura
    bundleSize: 100, // Aumento de 100KB
    typeScriptErrors: 0 // Qualquer aumento é regressão
  },
  colors: {
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    info: '\x1b[36m',
    reset: '\x1b[0m'
  }
};

// ============================================================================
// UTILITÁRIOS
// ============================================================================

function log(message, color = 'reset') {
  console.log(`${CONFIG.colors[color]}${message}${CONFIG.colors.reset}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadHistory() {
  if (!fs.existsSync(CONFIG.historyFile)) {
    return [];
  }

  try {
    const content = fs.readFileSync(CONFIG.historyFile, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    log(`⚠️ Erro ao carregar histórico: ${error.message}`, 'warning');
    return [];
  }
}

function saveHistory(history) {
  ensureDir(path.dirname(CONFIG.historyFile));

  // Manter apenas as últimas N entradas
  const trimmedHistory = history.slice(-CONFIG.maxHistoryEntries);

  fs.writeFileSync(CONFIG.historyFile, JSON.stringify(trimmedHistory, null, 2));
}

function loadAlerts() {
  if (!fs.existsSync(CONFIG.alertsFile)) {
    return [];
  }

  try {
    const content = fs.readFileSync(CONFIG.alertsFile, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    log(`⚠️ Erro ao carregar alertas: ${error.message}`, 'warning');
    return [];
  }
}

function saveAlerts(alerts) {
  ensureDir(path.dirname(CONFIG.alertsFile));
  fs.writeFileSync(CONFIG.alertsFile, JSON.stringify(alerts, null, 2));
}

// ============================================================================
// ANÁLISE DE REGRESSÕES
// ============================================================================

/**
 * Compara métricas atuais com históricas
 */
function detectRegressions(currentMetrics, history) {
  if (history.length === 0) {
    return { regressions: [], improvements: [] };
  }

  // Usar a média das últimas 5 execuções como baseline
  const recentHistory = history.slice(-5);
  const baseline = calculateBaseline(recentHistory);

  const regressions = [];
  const improvements = [];

  // Verificar ESLint erros
  const errorDiff = currentMetrics.eslint.errors - baseline.eslint.errors;
  if (errorDiff > CONFIG.regressionThresholds.eslintErrors) {
    regressions.push({
      type: 'eslint_errors',
      metric: 'ESLint Erros',
      current: currentMetrics.eslint.errors,
      baseline: baseline.eslint.errors,
      difference: errorDiff,
      severity: 'high',
      message: `Aumento de ${errorDiff} erros de ESLint`
    });
  } else if (errorDiff < 0) {
    improvements.push({
      type: 'eslint_errors',
      metric: 'ESLint Erros',
      current: currentMetrics.eslint.errors,
      baseline: baseline.eslint.errors,
      difference: errorDiff,
      message: `Redução de ${Math.abs(errorDiff)} erros de ESLint`
    });
  }

  // Verificar ESLint warnings
  const warningDiff = currentMetrics.eslint.warnings - baseline.eslint.warnings;
  if (warningDiff > CONFIG.regressionThresholds.eslintWarnings) {
    regressions.push({
      type: 'eslint_warnings',
      metric: 'ESLint Warnings',
      current: currentMetrics.eslint.warnings,
      baseline: baseline.eslint.warnings,
      difference: warningDiff,
      severity: 'medium',
      message: `Aumento de ${warningDiff} warnings de ESLint`
    });
  }

  // Verificar cobertura de testes
  const coverageDiff = currentMetrics.tests.coverage - baseline.tests.coverage;
  if (coverageDiff < CONFIG.regressionThresholds.testCoverage) {
    regressions.push({
      type: 'test_coverage',
      metric: 'Cobertura de Testes',
      current: `${currentMetrics.tests.coverage}%`,
      baseline: `${baseline.tests.coverage}%`,
      difference: coverageDiff,
      severity: 'high',
      message: `Redução de ${Math.abs(coverageDiff).toFixed(1)}% na cobertura de testes`
    });
  } else if (coverageDiff > 2) {
    improvements.push({
      type: 'test_coverage',
      metric: 'Cobertura de Testes',
      current: `${currentMetrics.tests.coverage}%`,
      baseline: `${baseline.tests.coverage}%`,
      difference: coverageDiff,
      message: `Aumento de ${coverageDiff.toFixed(1)}% na cobertura de testes`
    });
  }

  // Verificar tamanho do bundle
  const bundleDiff = currentMetrics.bundle.size - baseline.bundle.size;
  if (bundleDiff > CONFIG.regressionThresholds.bundleSize) {
    regressions.push({
      type: 'bundle_size',
      metric: 'Tamanho do Bundle',
      current: `${currentMetrics.bundle.size}KB`,
      baseline: `${baseline.bundle.size}KB`,
      difference: bundleDiff,
      severity: 'medium',
      message: `Aumento de ${bundleDiff}KB no tamanho do bundle`
    });
  }

  // Verificar TypeScript erros
  const tsDiff = currentMetrics.typescript.errors - baseline.typescript.errors;
  if (tsDiff > CONFIG.regressionThresholds.typeScriptErrors) {
    regressions.push({
      type: 'typescript_errors',
      metric: 'TypeScript Erros',
      current: currentMetrics.typescript.errors,
      baseline: baseline.typescript.errors,
      difference: tsDiff,
      severity: 'high',
      message: `Aumento de ${tsDiff} erros de TypeScript`
    });
  }

  return { regressions, improvements };
}

/**
 * Calcula baseline das métricas baseado no histórico
 */
function calculateBaseline(history) {
  if (history.length === 0) {
    return null;
  }

  const baseline = {
    eslint: { errors: 0, warnings: 0 },
    typescript: { errors: 0 },
    tests: { coverage: 0 },
    bundle: { size: 0 }
  };

  history.forEach(entry => {
    baseline.eslint.errors += entry.metrics.eslint.errors || 0;
    baseline.eslint.warnings += entry.metrics.eslint.warnings || 0;
    baseline.typescript.errors += entry.metrics.typescript.errors || 0;
    baseline.tests.coverage += entry.metrics.tests.coverage || 0;
    baseline.bundle.size += entry.metrics.bundle.size || 0;
  });

  const count = history.length;
  baseline.eslint.errors = Math.round(baseline.eslint.errors / count);
  baseline.eslint.warnings = Math.round(baseline.eslint.warnings / count);
  baseline.typescript.errors = Math.round(baseline.typescript.errors / count);
  baseline.tests.coverage = Math.round((baseline.tests.coverage / count) * 10) / 10;
  baseline.bundle.size = Math.round(baseline.bundle.size / count);

  return baseline;
}

// ============================================================================
// SISTEMA DE ALERTAS
// ============================================================================

/**
 * Cria alertas baseado nas regressões detectadas
 */
function createAlerts(regressions, improvements, currentMetrics) {
  const alerts = [];
  const timestamp = new Date().toISOString();

  // Alertas de regressão
  regressions.forEach(regression => {
    alerts.push({
      id: `${regression.type}_${Date.now()}`,
      type: 'regression',
      severity: regression.severity,
      metric: regression.metric,
      message: regression.message,
      current: regression.current,
      baseline: regression.baseline,
      difference: regression.difference,
      timestamp,
      status: 'active'
    });
  });

  // Alertas de melhoria (informativos)
  improvements.forEach(improvement => {
    alerts.push({
      id: `${improvement.type}_improvement_${Date.now()}`,
      type: 'improvement',
      severity: 'info',
      metric: improvement.metric,
      message: improvement.message,
      current: improvement.current,
      baseline: improvement.baseline,
      difference: improvement.difference,
      timestamp,
      status: 'active'
    });
  });

  return alerts;
}

/**
 * Envia notificações de alertas
 */
function sendNotifications(alerts) {
  const criticalAlerts = alerts.filter(alert =>
    alert.type === 'regression' && alert.severity === 'high'
  );

  if (criticalAlerts.length > 0) {
    log('🚨 ALERTAS CRÍTICOS DETECTADOS!', 'error');
    log('================================', 'error');

    criticalAlerts.forEach(alert => {
      log(`❌ ${alert.metric}: ${alert.message}`, 'error');
    });

    log('', 'reset');
    log('Ações recomendadas:', 'warning');
    log('• Execute `npm run lint:fix` para corrigir problemas de linting', 'warning');
    log('• Execute `npm run test` para verificar testes', 'warning');
    log('• Revise as mudanças recentes no código', 'warning');
    log('', 'reset');
  }

  const improvements = alerts.filter(alert => alert.type === 'improvement');
  if (improvements.length > 0) {
    log('✨ MELHORIAS DETECTADAS!', 'success');
    log('========================', 'success');

    improvements.forEach(alert => {
      log(`✅ ${alert.metric}: ${alert.message}`, 'success');
    });
    log('', 'reset');
  }
}

/**
 * Gera relatório de tendências
 */
function generateTrendReport(history) {
  if (history.length < 2) {
    return 'Histórico insuficiente para análise de tendências.';
  }

  const recent = history.slice(-10); // Últimas 10 execuções
  const lines = [];

  lines.push('📈 ANÁLISE DE TENDÊNCIAS (últimas 10 execuções)');
  lines.push('===============================================');
  lines.push('');

  // Calcular tendências
  const first = recent[0].metrics;
  const last = recent[recent.length - 1].metrics;

  const trends = {
    eslintErrors: last.eslint.errors - first.eslint.errors,
    eslintWarnings: last.eslint.warnings - first.eslint.warnings,
    testCoverage: last.tests.coverage - first.tests.coverage,
    bundleSize: last.bundle.size - first.bundle.size
  };

  // Exibir tendências
  Object.entries(trends).forEach(([key, value]) => {
    const metric = key.replace(/([A-Z])/g, ' $1').toLowerCase();
    const trend = value > 0 ? '📈' : value < 0 ? '📉' : '➡️';
    const color = value > 0 ? (key.includes('Coverage') ? 'success' : 'warning') :
                  value < 0 ? (key.includes('Coverage') ? 'warning' : 'success') : 'info';

    lines.push(`${trend} ${metric}: ${value > 0 ? '+' : ''}${value}`);
  });

  return lines.join('\n');
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function main() {
  log('🔍 Iniciando análise de qualidade e alertas...', 'info');

  // Carregar métricas atuais (executar coleta)
  const { execSync } = require('child_process');

  try {
    // Executar coleta de métricas
    execSync('node scripts/quality-metrics.js', { stdio: 'pipe' });
  } catch (error) {
    // Métricas podem falhar, mas continuamos com alertas
    log('⚠️ Erro ao coletar métricas, usando dados existentes', 'warning');
  }

  // Carregar último relatório
  const reportsDir = 'quality-reports';
  if (!fs.existsSync(reportsDir)) {
    log('❌ Nenhum relatório de qualidade encontrado. Execute quality-metrics.js primeiro.', 'error');
    process.exit(1);
  }

  const reportFiles = fs.readdirSync(reportsDir)
    .filter(file => file.startsWith('quality-report-') && file.endsWith('.json'))
    .sort()
    .reverse();

  if (reportFiles.length === 0) {
    log('❌ Nenhum relatório JSON encontrado.', 'error');
    process.exit(1);
  }

  const latestReport = JSON.parse(
    fs.readFileSync(path.join(reportsDir, reportFiles[0]), 'utf8')
  );

  // Carregar histórico
  const history = loadHistory();

  // Detectar regressões
  const { regressions, improvements } = detectRegressions(latestReport.metrics, history);

  // Criar alertas
  const newAlerts = createAlerts(regressions, improvements, latestReport.metrics);

  // Carregar alertas existentes e adicionar novos
  const existingAlerts = loadAlerts();
  const allAlerts = [...existingAlerts, ...newAlerts];

  // Salvar alertas
  saveAlerts(allAlerts);

  // Adicionar ao histórico
  history.push({
    timestamp: latestReport.timestamp,
    metrics: latestReport.metrics,
    analysis: latestReport.analysis,
    regressions: regressions.length,
    improvements: improvements.length
  });

  saveHistory(history);

  // Enviar notificações
  sendNotifications(newAlerts);

  // Gerar relatório de tendências
  const trendReport = generateTrendReport(history);
  console.log('\n' + trendReport);

  // Salvar relatório de tendências
  const trendFile = path.join(reportsDir, 'trend-report.txt');
  fs.writeFileSync(trendFile, trendReport);

  log(`\n📊 Análise concluída. ${newAlerts.length} novos alertas gerados.`, 'info');
  log(`📈 Relatório de tendências salvo: ${trendFile}`, 'info');

  // Exit code baseado na severidade dos alertas
  const criticalAlerts = newAlerts.filter(alert =>
    alert.type === 'regression' && alert.severity === 'high'
  );

  process.exit(criticalAlerts.length > 0 ? 1 : 0);
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    log(`💥 Erro fatal: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  detectRegressions,
  createAlerts,
  generateTrendReport,
  calculateBaseline
};
