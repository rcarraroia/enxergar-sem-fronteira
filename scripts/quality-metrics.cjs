#!/usr/bin/env node

/**
 * Script de Monitoramento de Qualidade
 *
 * Coleta métricas de qualidade do código e gera relatórios:
 * - Métricas de ESLint (erros, warnings)
 * - Cobertura de testes
 * - Métricas de TypeScript
 * - Tamanho do bundle
 * - Complexidade do código
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

const CONFIG = {
  outputDir: 'quality-reports',
  thresholds: {
    eslintErrors: 0,
    eslintWarnings: 50,
    testCoverage: 70,
    bundleSize: 2000, // KB
    typeScriptErrors: 0
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

function execCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    return { success: true, output: result };
  } catch (error) {
    return {
      success: false,
      output: error.stdout || error.message,
      error: error.stderr || error.message
    };
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function saveReport(filename, data) {
  ensureDir(CONFIG.outputDir);
  const filepath = path.join(CONFIG.outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  return filepath;
}

// ============================================================================
// COLETORES DE MÉTRICAS
// ============================================================================

/**
 * Coleta métricas do ESLint
 */
function collectESLintMetrics() {
  log('📋 Coletando métricas do ESLint...', 'info');

  // Usar formato mais simples para evitar problemas de JSON
  const result = execCommand('npx eslint . --format compact', { silent: true });

  try {
    const output = result.output || result.error || '';
    const lines = output.split('\n').filter(line => line.trim());

    let totalErrors = 0;
    let totalWarnings = 0;
    let filesWithIssues = new Set();

    lines.forEach(line => {
      if (line.includes(': error ')) {
        totalErrors++;
        const filePath = line.split(':')[0];
        if (filePath) filesWithIssues.add(filePath);
      } else if (line.includes(': warning ')) {
        totalWarnings++;
        const filePath = line.split(':')[0];
        if (filePath) filesWithIssues.add(filePath);
      }
    });

    return {
      errors: totalErrors,
      warnings: totalWarnings,
      files: filesWithIssues.size,
      filesWithIssues: filesWithIssues.size
    };
  } catch (error) {
    log(`❌ Erro ao processar saída do ESLint: ${error.message}`, 'error');
    return { errors: -1, warnings: -1, files: 0 };
  }
}

/**
 * Coleta métricas do TypeScript
 */
function collectTypeScriptMetrics() {
  log('🔧 Coletando métricas do TypeScript...', 'info');

  const result = execCommand('npx tsc --noEmit --pretty false', { silent: true });

  const errors = result.output ? result.output.split('\n').filter(line =>
    line.includes('error TS') || line.includes('): error')
  ).length : 0;

  return {
    errors,
    hasErrors: !result.success,
    output: result.output
  };
}

/**
 * Coleta métricas de testes
 */
function collectTestMetrics() {
  log('🧪 Coletando métricas de testes...', 'info');

  // Executar testes simples primeiro
  const result = execCommand('npm run test:run', { silent: true });

  try {
    const output = result.output || result.error || '';

    // Extrair estatísticas do output
    let tests = 0;
    let passed = 0;
    let failed = 0;
    let coverage = 0;

    // Procurar por linhas de resumo
    const lines = output.split('\n');

    // Procurar por "Test Files" e "Tests"
    const testFilesLine = lines.find(line => line.includes('Test Files'));
    const testsLine = lines.find(line => line.includes('Tests') && !line.includes('Test Files'));

    if (testFilesLine) {
      const failedMatch = testFilesLine.match(/(\d+) failed/);
      const passedMatch = testFilesLine.match(/(\d+) passed/);
      if (failedMatch || passedMatch) {
        // Temos dados válidos
      }
    }

    if (testsLine) {
      const failedMatch = testsLine.match(/(\d+) failed/);
      const passedMatch = testsLine.match(/(\d+) passed/);

      if (failedMatch) failed = parseInt(failedMatch[1]);
      if (passedMatch) passed = parseInt(passedMatch[1]);
      tests = passed + failed;
    }

    // Tentar ler arquivo de coverage se existir
    const coverageFile = path.join('coverage', 'coverage-summary.json');
    if (fs.existsSync(coverageFile)) {
      try {
        const coverageData = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
        coverage = coverageData.total?.lines?.pct || 0;
      } catch (e) {
        // Ignorar erro de coverage
      }
    }

    return {
      coverage,
      tests,
      passed,
      failed
    };
  } catch (error) {
    log(`❌ Erro ao processar métricas de teste: ${error.message}`, 'error');
    return { coverage: 0, tests: 0, passed: 0, failed: 0 };
  }
}

/**
 * Coleta métricas do bundle
 */
function collectBundleMetrics() {
  log('📦 Coletando métricas do bundle...', 'info');

  // Executar build
  const buildResult = execCommand('npm run build', { silent: true });

  if (!buildResult.success) {
    log('❌ Erro ao fazer build', 'error');
    return { size: -1, gzipSize: -1, files: 0 };
  }

  try {
    // Verificar tamanho dos arquivos de build
    const distDir = 'dist';
    if (!fs.existsSync(distDir)) {
      return { size: -1, gzipSize: -1 };
    }

    let totalSize = 0;
    const files = fs.readdirSync(path.join(distDir, 'assets'));

    files.forEach(file => {
      if (file.endsWith('.js') || file.endsWith('.css')) {
        const filePath = path.join(distDir, 'assets', file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }
    });

    return {
      size: Math.round(totalSize / 1024), // KB
      gzipSize: Math.round(totalSize / 1024 * 0.3), // Estimativa
      files: files.length
    };
  } catch (error) {
    log(`❌ Erro ao calcular tamanho do bundle: ${error.message}`, 'error');
    return { size: -1, gzipSize: -1 };
  }
}

/**
 * Coleta métricas de complexidade
 */
function collectComplexityMetrics() {
  log('🔍 Coletando métricas de complexidade...', 'info');

  try {
    // Contar arquivos e linhas
    const srcDir = 'src';
    let totalFiles = 0;
    let totalLines = 0;
    let totalFunctions = 0;
    let totalComponents = 0;

    function countInDirectory(dir) {
      const items = fs.readdirSync(dir);

      items.forEach(item => {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          countInDirectory(itemPath);
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
          totalFiles++;

          const content = fs.readFileSync(itemPath, 'utf8');
          const lines = content.split('\n').length;
          totalLines += lines;

          // Contar funções (aproximado)
          const functionMatches = content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g);
          totalFunctions += functionMatches ? functionMatches.length : 0;

          // Contar componentes React (aproximado)
          const componentMatches = content.match(/export\s+(default\s+)?function\s+[A-Z]|const\s+[A-Z]\w*\s*=\s*\(/g);
          totalComponents += componentMatches ? componentMatches.length : 0;
        }
      });
    }

    if (fs.existsSync(srcDir)) {
      countInDirectory(srcDir);
    }

    return {
      files: totalFiles,
      lines: totalLines,
      functions: totalFunctions,
      components: totalComponents,
      avgLinesPerFile: totalFiles > 0 ? Math.round(totalLines / totalFiles) : 0
    };
  } catch (error) {
    log(`❌ Erro ao calcular complexidade: ${error.message}`, 'error');
    return { files: 0, lines: 0, functions: 0, components: 0, avgLinesPerFile: 0 };
  }
}

// ============================================================================
// ANÁLISE E RELATÓRIOS
// ============================================================================

/**
 * Analisa métricas e determina status
 */
function analyzeMetrics(metrics) {
  const analysis = {
    overall: 'success',
    issues: [],
    warnings: [],
    recommendations: []
  };

  // Análise ESLint
  if (metrics.eslint.errors > CONFIG.thresholds.eslintErrors) {
    analysis.overall = 'error';
    analysis.issues.push(`ESLint: ${metrics.eslint.errors} erros encontrados (limite: ${CONFIG.thresholds.eslintErrors})`);
  }

  if (metrics.eslint.warnings > CONFIG.thresholds.eslintWarnings) {
    analysis.overall = analysis.overall === 'success' ? 'warning' : analysis.overall;
    analysis.warnings.push(`ESLint: ${metrics.eslint.warnings} warnings encontrados (limite: ${CONFIG.thresholds.eslintWarnings})`);
  }

  // Análise TypeScript
  if (metrics.typescript.errors > CONFIG.thresholds.typeScriptErrors) {
    analysis.overall = 'error';
    analysis.issues.push(`TypeScript: ${metrics.typescript.errors} erros encontrados`);
  }

  // Análise de testes
  if (metrics.tests.coverage < CONFIG.thresholds.testCoverage) {
    analysis.overall = analysis.overall === 'success' ? 'warning' : analysis.overall;
    analysis.warnings.push(`Cobertura de testes: ${metrics.tests.coverage}% (meta: ${CONFIG.thresholds.testCoverage}%)`);
  }

  if (metrics.tests.failed > 0) {
    analysis.overall = 'error';
    analysis.issues.push(`Testes: ${metrics.tests.failed} testes falhando`);
  }

  // Análise do bundle
  if (metrics.bundle.size > CONFIG.thresholds.bundleSize) {
    analysis.overall = analysis.overall === 'success' ? 'warning' : analysis.overall;
    analysis.warnings.push(`Bundle: ${metrics.bundle.size}KB (limite: ${CONFIG.thresholds.bundleSize}KB)`);
  }

  // Recomendações
  if (metrics.complexity.avgLinesPerFile > 200) {
    analysis.recommendations.push('Considere quebrar arquivos grandes em módulos menores');
  }

  if (metrics.eslint.warnings > 20) {
    analysis.recommendations.push('Execute `npm run lint:fix` para corrigir warnings automaticamente');
  }

  if (metrics.tests.coverage < 80) {
    analysis.recommendations.push('Adicione mais testes para melhorar a cobertura');
  }

  return analysis;
}

/**
 * Gera relatório em formato texto
 */
function generateTextReport(metrics, analysis) {
  const lines = [];

  lines.push('');
  lines.push('🎯 RELATÓRIO DE QUALIDADE DO CÓDIGO');
  lines.push('=====================================');
  lines.push('');

  // Status geral
  const statusIcon = analysis.overall === 'success' ? '✅' :
                    analysis.overall === 'warning' ? '⚠️' : '❌';
  lines.push(`Status Geral: ${statusIcon} ${analysis.overall.toUpperCase()}`);
  lines.push('');

  // Métricas principais
  lines.push('📊 MÉTRICAS PRINCIPAIS');
  lines.push('----------------------');
  lines.push(`ESLint Erros:      ${metrics.eslint.errors}`);
  lines.push(`ESLint Warnings:   ${metrics.eslint.warnings}`);
  lines.push(`TypeScript Erros:  ${metrics.typescript.errors}`);
  lines.push(`Cobertura Testes:  ${metrics.tests.coverage}%`);
  lines.push(`Testes Passando:   ${metrics.tests.passed}/${metrics.tests.tests}`);
  lines.push(`Bundle Size:       ${metrics.bundle.size}KB`);
  lines.push('');

  // Complexidade
  lines.push('🔍 COMPLEXIDADE DO CÓDIGO');
  lines.push('-------------------------');
  lines.push(`Arquivos:          ${metrics.complexity.files}`);
  lines.push(`Linhas de Código:  ${metrics.complexity.lines}`);
  lines.push(`Funções:           ${metrics.complexity.functions}`);
  lines.push(`Componentes:       ${metrics.complexity.components}`);
  lines.push(`Média Linhas/Arq:  ${metrics.complexity.avgLinesPerFile}`);
  lines.push('');

  // Issues
  if (analysis.issues.length > 0) {
    lines.push('❌ PROBLEMAS CRÍTICOS');
    lines.push('---------------------');
    analysis.issues.forEach(issue => lines.push(`• ${issue}`));
    lines.push('');
  }

  // Warnings
  if (analysis.warnings.length > 0) {
    lines.push('⚠️ AVISOS');
    lines.push('---------');
    analysis.warnings.forEach(warning => lines.push(`• ${warning}`));
    lines.push('');
  }

  // Recomendações
  if (analysis.recommendations.length > 0) {
    lines.push('💡 RECOMENDAÇÕES');
    lines.push('----------------');
    analysis.recommendations.forEach(rec => lines.push(`• ${rec}`));
    lines.push('');
  }

  lines.push(`Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`);
  lines.push('');

  return lines.join('\n');
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function main() {
  log('🚀 Iniciando coleta de métricas de qualidade...', 'info');

  const startTime = Date.now();

  // Coletar todas as métricas
  const metrics = {
    timestamp: new Date().toISOString(),
    eslint: collectESLintMetrics(),
    typescript: collectTypeScriptMetrics(),
    tests: collectTestMetrics(),
    bundle: collectBundleMetrics(),
    complexity: collectComplexityMetrics()
  };

  // Analisar métricas
  const analysis = analyzeMetrics(metrics);

  // Gerar relatórios
  const report = {
    metrics,
    analysis,
    duration: Date.now() - startTime
  };

  // Salvar relatório JSON
  const jsonFile = saveReport(`quality-report-${Date.now()}.json`, report);
  log(`📄 Relatório JSON salvo: ${jsonFile}`, 'success');

  // Salvar relatório de texto
  const textReport = generateTextReport(metrics, analysis);
  const textFile = path.join(CONFIG.outputDir, 'latest-quality-report.txt');
  fs.writeFileSync(textFile, textReport);
  log(`📄 Relatório de texto salvo: ${textFile}`, 'success');

  // Exibir relatório no console
  console.log(textReport);

  // Exit code baseado no status
  const exitCode = analysis.overall === 'error' ? 1 : 0;

  log(`✨ Coleta concluída em ${report.duration}ms`, 'success');

  process.exit(exitCode);
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
  collectESLintMetrics,
  collectTypeScriptMetrics,
  collectTestMetrics,
  collectBundleMetrics,
  collectComplexityMetrics,
  analyzeMetrics,
  generateTextReport
};
