#!/usr/bin/env node

/**
 * =====================================================
 * VALIDADOR DE VARIÁVEIS DE AMBIENTE
 * =====================================================
 * Valida se todas as variáveis de ambiente necessárias estão configuradas
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração das variáveis obrigatórias
const REQUIRED_VARS = {
  // Supabase (Críticas)
  VITE_SUPABASE_URL: {
    description: 'URL do projeto Supabase',
    pattern: /^https:\/\/.*\.supabase\.co$/,
    critical: true
  },
  VITE_SUPABASE_ANON_KEY: {
    description: 'Chave anônima do Supabase',
    minLength: 100,
    critical: true
  },
  
  // APIs Externas (Importantes)
  ASAAS_API_KEY: {
    description: 'Chave da API Asaas para pagamentos',
    minLength: 20,
    critical: false
  },
  WHATSAPP_API_KEY: {
    description: 'Chave da API WhatsApp para mensagens',
    minLength: 20,
    critical: false
  },
  
  // Segurança (Críticas)
  JWT_SECRET: {
    description: 'Chave secreta para JWT',
    minLength: 32,
    critical: true
  },
  ENCRYPTION_KEY: {
    description: 'Chave para criptografia de dados',
    minLength: 32,
    critical: true
  },
  
  // Email (Importante)
  SMTP_HOST: {
    description: 'Servidor SMTP',
    critical: false
  },
  SMTP_USER: {
    description: 'Usuário SMTP',
    critical: false
  },
  SMTP_PASSWORD: {
    description: 'Senha SMTP',
    minLength: 8,
    critical: false
  }
};

// Cores para output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateEnvironment() {
  log('🔍 Validando variáveis de ambiente...', 'blue');
  log('', 'reset');
  
  const errors = [];
  const warnings = [];
  const success = [];
  
  // Verificar se arquivo .env existe
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    errors.push('❌ Arquivo .env não encontrado! Copie .env.example para .env');
  }
  
  // Validar cada variável
  Object.entries(REQUIRED_VARS).forEach(([varName, config]) => {
    const value = process.env[varName];
    
    if (!value) {
      const message = `${config.critical ? '❌' : '⚠️'} ${varName}: ${config.description}`;
      if (config.critical) {
        errors.push(message);
      } else {
        warnings.push(message);
      }
      return;
    }
    
    // Validar comprimento mínimo
    if (config.minLength && value.length < config.minLength) {
      const message = `❌ ${varName}: Muito curta (mín: ${config.minLength} chars)`;
      errors.push(message);
      return;
    }
    
    // Validar padrão
    if (config.pattern && !config.pattern.test(value)) {
      const message = `❌ ${varName}: Formato inválido`;
      errors.push(message);
      return;
    }
    
    // Sucesso
    success.push(`✅ ${varName}: OK`);
  });
  
  // Mostrar resultados
  if (success.length > 0) {
    log('✅ VARIÁVEIS VÁLIDAS:', 'green');
    success.forEach(msg => log(`  ${msg}`, 'green'));
    log('', 'reset');
  }
  
  if (warnings.length > 0) {
    log('⚠️ AVISOS (não críticos):', 'yellow');
    warnings.forEach(msg => log(`  ${msg}`, 'yellow'));
    log('', 'reset');
  }
  
  if (errors.length > 0) {
    log('❌ ERROS CRÍTICOS:', 'red');
    errors.forEach(msg => log(`  ${msg}`, 'red'));
    log('', 'reset');
    log('🚨 Corrija os erros críticos antes de continuar!', 'red');
    process.exit(1);
  }
  
  // Verificações adicionais de segurança
  validateSecurity();
  
  log('🎉 Todas as variáveis de ambiente estão válidas!', 'green');
  log('', 'reset');
}

function validateSecurity() {
  log('🔒 Verificações de segurança:', 'blue');
  
  // Verificar se não está usando valores de exemplo
  const dangerousValues = [
    'your-api-key-here',
    'your-secret-here',
    'change-me',
    'example',
    'test123'
  ];
  
  Object.entries(REQUIRED_VARS).forEach(([varName, config]) => {
    const value = process.env[varName];
    if (value && dangerousValues.some(dangerous => 
      value.toLowerCase().includes(dangerous.toLowerCase())
    )) {
      log(`  ⚠️ ${varName}: Parece estar usando valor de exemplo!`, 'yellow');
    }
  });
  
  // Verificar NODE_ENV
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production') {
    log('  ✅ NODE_ENV: production', 'green');
  } else {
    log(`  ⚠️ NODE_ENV: ${nodeEnv || 'não definido'} (deveria ser 'production')`, 'yellow');
  }
  
  log('', 'reset');
}

function generateEnvTemplate() {
  log('📝 Gerando template de .env...', 'blue');
  
  let template = '# Variáveis de ambiente - Enxergar Sem Fronteira\n';
  template += '# Gerado automaticamente - Configure os valores reais\n\n';
  
  Object.entries(REQUIRED_VARS).forEach(([varName, config]) => {
    template += `# ${config.description}\n`;
    template += `${varName}=\n\n`;
  });
  
  fs.writeFileSync('.env.template', template);
  log('✅ Template salvo em .env.template', 'green');
}

// Executar validação
const args = process.argv.slice(2);

if (args.includes('--generate-template')) {
  generateEnvTemplate();
} else {
  validateEnvironment();
}

export { validateEnvironment, generateEnvTemplate };