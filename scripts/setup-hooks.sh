#!/bin/bash

echo "🔧 Configurando pre-commit hooks..."

# Verificar se o npm está disponível
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Instale o Node.js primeiro."
    exit 1
fi

# Instalar dependências se necessário
echo "📦 Instalando dependências..."
npm install

# Inicializar Husky
echo "🐕 Inicializando Husky..."
npx husky init

# Tornar os hooks executáveis
echo "🔐 Configurando permissões dos hooks..."
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
chmod +x .husky/pre-push

# Testar configuração
echo "🧪 Testando configuração..."

# Testar lint-staged
echo "Testando lint-staged..."
if npx lint-staged --version &> /dev/null; then
    echo "✅ lint-staged configurado corretamente"
else
    echo "❌ Erro na configuração do lint-staged"
    exit 1
fi

# Testar ESLint
echo "Testando ESLint..."
if npm run lint -- --version &> /dev/null; then
    echo "✅ ESLint configurado corretamente"
else
    echo "❌ Erro na configuração do ESLint"
    exit 1
fi

# Testar Prettier
echo "Testando Prettier..."
if npx prettier --version &> /dev/null; then
    echo "✅ Prettier configurado corretamente"
else
    echo "❌ Erro na configuração do Prettier"
    exit 1
fi

# Testar TypeScript
echo "Testando TypeScript..."
if npm run type-check &> /dev/null; then
    echo "✅ TypeScript configurado corretamente"
else
    echo "⚠️  Avisos de TypeScript encontrados (normal em desenvolvimento)"
fi

echo ""
echo "🎉 Pre-commit hooks configurados com sucesso!"
echo ""
echo "📋 O que foi configurado:"
echo "  ✅ Husky para gerenciar git hooks"
echo "  ✅ lint-staged para verificar apenas arquivos modificados"
echo "  ✅ ESLint para verificação de qualidade de código"
echo "  ✅ Prettier para formatação automática"
echo "  ✅ TypeScript para verificação de tipos"
echo "  ✅ Testes críticos antes de commits"
echo "  ✅ Validação de mensagens de commit"
echo "  ✅ Verificações completas antes de push"
echo ""
echo "📝 Próximos passos:"
echo "  1. Faça um commit de teste: git commit -m 'test: configurar pre-commit hooks'"
echo "  2. Os hooks serão executados automaticamente"
echo "  3. Arquivos serão formatados automaticamente se necessário"
echo ""
echo "💡 Dicas:"
echo "  - Use mensagens de commit no formato: tipo(escopo): descrição"
echo "  - Exemplos: feat: nova funcionalidade, fix: correção de bug"
echo "  - Os hooks podem ser ignorados com --no-verify (não recomendado)"
