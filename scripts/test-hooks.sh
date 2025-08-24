#!/bin/bash

echo "🧪 Testando configuração dos pre-commit hooks..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para testar comandos
test_command() {
    local cmd="$1"
    local description="$2"

    echo -e "\n🔍 Testando: $description"
    echo "Comando: $cmd"

    if eval "$cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $description - OK${NC}"
        return 0
    else
        echo -e "${RED}❌ $description - FALHOU${NC}"
        return 1
    fi
}

# Contador de testes
total_tests=0
passed_tests=0

# Teste 1: Verificar se Husky está instalado
total_tests=$((total_tests + 1))
if test_command "npx husky --version" "Husky instalado"; then
    passed_tests=$((passed_tests + 1))
fi

# Teste 2: Verificar se lint-staged está configurado
total_tests=$((total_tests + 1))
if test_command "npx lint-staged --version" "lint-staged disponível"; then
    passed_tests=$((passed_tests + 1))
fi

# Teste 3: Verificar se ESLint funciona
total_tests=$((total_tests + 1))
if test_command "npm run lint -- --version" "ESLint configurado"; then
    passed_tests=$((passed_tests + 1))
fi

# Teste 4: Verificar se Prettier funciona
total_tests=$((total_tests + 1))
if test_command "npx prettier --version" "Prettier disponível"; then
    passed_tests=$((passed_tests + 1))
fi

# Teste 5: Verificar se TypeScript funciona
total_tests=$((total_tests + 1))
if test_command "npx tsc --version" "TypeScript disponível"; then
    passed_tests=$((passed_tests + 1))
fi

# Teste 6: Verificar se testes críticos funcionam
total_tests=$((total_tests + 1))
if test_command "npm run test:critical -- --run --reporter=basic" "Testes críticos"; then
    passed_tests=$((passed_tests + 1))
fi

# Teste 7: Verificar se hooks existem
total_tests=$((total_tests + 1))
if [ -f ".husky/pre-commit" ] && [ -f ".husky/commit-msg" ] && [ -f ".husky/pre-push" ]; then
    echo -e "${GREEN}✅ Arquivos de hooks existem - OK${NC}"
    passed_tests=$((passed_tests + 1))
else
    echo -e "${RED}❌ Arquivos de hooks não encontrados - FALHOU${NC}"
fi

# Teste 8: Verificar configuração do lint-staged no package.json
total_tests=$((total_tests + 1))
if grep -q "lint-staged" package.json; then
    echo -e "${GREEN}✅ lint-staged configurado no package.json - OK${NC}"
    passed_tests=$((passed_tests + 1))
else
    echo -e "${RED}❌ lint-staged não configurado no package.json - FALHOU${NC}"
fi

# Resumo dos testes
echo -e "\n📊 Resumo dos testes:"
echo -e "Total de testes: $total_tests"
echo -e "Testes passaram: ${GREEN}$passed_tests${NC}"
echo -e "Testes falharam: ${RED}$((total_tests - passed_tests))${NC}"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "\n🎉 ${GREEN}Todos os testes passaram! Pre-commit hooks estão configurados corretamente.${NC}"

    echo -e "\n📋 Próximos passos:"
    echo "1. Faça um commit de teste para verificar os hooks em ação"
    echo "2. Os hooks executarão automaticamente a partir de agora"
    echo "3. Use 'git commit --no-verify' apenas em emergências"

    exit 0
else
    echo -e "\n⚠️  ${YELLOW}Alguns testes falharam. Verifique a configuração.${NC}"

    echo -e "\n🔧 Comandos para corrigir problemas:"
    echo "- Reinstalar Husky: npx husky init"
    echo "- Instalar dependências: npm install"
    echo "- Executar setup: npm run hooks:setup"

    exit 1
fi
