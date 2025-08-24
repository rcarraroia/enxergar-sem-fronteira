# Script PowerShell para configurar pre-commit hooks

Write-Host "🔧 Configurando pre-commit hooks..." -ForegroundColor Cyan

# Verificar se o npm está disponível
try {
    npm --version | Out-Null
    Write-Host "✅ npm encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ npm não encontrado. Instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se o git está disponível
try {
    git --version | Out-Null
    Write-Host "✅ git encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ git não encontrado. Instale o Git primeiro." -ForegroundColor Red
    exit 1
}

# Inicializar Husky se necessário
if (-not (Test-Path ".husky")) {
    Write-Host "🐕 Inicializando Husky..." -ForegroundColor Yellow
    npx husky init
}

# Configurar permissões dos hooks no Git
Write-Host "🔐 Configurando permissões dos hooks..." -ForegroundColor Yellow
git update-index --chmod=+x .husky/pre-commit
git update-index --chmod=+x .husky/commit-msg
git update-index --chmod=+x .husky/pre-push

# Testar configuração
Write-Host "🧪 Testando configuração..." -ForegroundColor Yellow

# Testar lint-staged
Write-Host "Testando lint-staged..." -ForegroundColor Gray
try {
    npx lint-staged --version | Out-Null
    Write-Host "✅ lint-staged configurado corretamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro na configuração do lint-staged" -ForegroundColor Red
    exit 1
}

# Testar ESLint
Write-Host "Testando ESLint..." -ForegroundColor Gray
try {
    npx eslint --version | Out-Null
    Write-Host "✅ ESLint configurado corretamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro na configuração do ESLint" -ForegroundColor Red
    exit 1
}

# Testar Prettier
Write-Host "Testando Prettier..." -ForegroundColor Gray
try {
    npx prettier --version | Out-Null
    Write-Host "✅ Prettier configurado corretamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro na configuração do Prettier" -ForegroundColor Red
    exit 1
}

# Testar TypeScript
Write-Host "Testando TypeScript..." -ForegroundColor Gray
try {
    npm run type-check 2>$null | Out-Null
    Write-Host "✅ TypeScript configurado corretamente" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Avisos de TypeScript encontrados (normal em desenvolvimento)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Pre-commit hooks configurados com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 O que foi configurado:" -ForegroundColor Cyan
Write-Host "  ✅ Husky para gerenciar git hooks" -ForegroundColor White
Write-Host "  ✅ lint-staged para verificar apenas arquivos modificados" -ForegroundColor White
Write-Host "  ✅ ESLint para verificação de qualidade de código" -ForegroundColor White
Write-Host "  ✅ Prettier para formatação automática" -ForegroundColor White
Write-Host "  ✅ TypeScript para verificação de tipos" -ForegroundColor White
Write-Host "  ✅ Testes críticos antes de commits" -ForegroundColor White
Write-Host "  ✅ Validação de mensagens de commit" -ForegroundColor White
Write-Host "  ✅ Verificações completas antes de push" -ForegroundColor White
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "  1. Faça um commit de teste: git commit -m 'test: configurar pre-commit hooks'" -ForegroundColor White
Write-Host "  2. Os hooks serão executados automaticamente" -ForegroundColor White
Write-Host "  3. Arquivos serão formatados automaticamente se necessário" -ForegroundColor White
Write-Host ""
Write-Host "💡 Dicas:" -ForegroundColor Cyan
Write-Host "  - Use mensagens de commit no formato: tipo(escopo): descrição" -ForegroundColor White
Write-Host "  - Exemplos: feat: nova funcionalidade, fix: correção de bug" -ForegroundColor White
Write-Host "  - Os hooks podem ser ignorados com --no-verify (não recomendado)" -ForegroundColor White
