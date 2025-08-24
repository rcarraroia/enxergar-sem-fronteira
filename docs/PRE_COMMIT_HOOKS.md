# Pre-commit Hooks

Este documento explica o sistema de pre-commit hooks configurado no projeto para garantir qualidade de código.

## ✅ Status Atual - CONFIGURADO E ATIVO

Os pre-commit hooks estão **totalmente configurados e funcionais** no projeto:

- ✅ **Husky instalado** e configurado
- ✅ **Pre-commit hook** ativo com lint-staged
- ✅ **Commit-msg hook** validando conventional commits
- ✅ **Pre-push hook** com verificações por branch
- ✅ **Scripts de qualidade** configurados
- ✅ **Documentação** completa disponível

## 🎯 Objetivo

Os pre-commit hooks garantem que:
- **Código está formatado** corretamente
- **Linting passa** sem erros
- **Tipos TypeScript** estão corretos
- **Testes críticos** passam
- **Mensagens de commit** seguem padrão
- **Build funciona** antes do push

## 🔧 Configuração

### Instalação Automática

Os hooks são configurados automaticamente quando você executa:

```bash
npm install
```

### Configuração Manual

Se necessário, execute o script de configuração:

```bash
chmod +x scripts/setup-hooks.sh
./scripts/setup-hooks.sh
```

## 🪝 Hooks Configurados

### 1. Pre-commit Hook

**Quando executa**: Antes de cada commit

**O que faz**:
- ✅ Executa ESLint com correções automáticas
- ✅ Formata código com Prettier
- ✅ Verifica tipos TypeScript
- ✅ Executa testes críticos
- ✅ Organiza imports automaticamente

**Arquivos verificados**: Apenas arquivos modificados (staged)

```bash
# Exemplo de execução
git add .
git commit -m "feat: adicionar validação"
# → Hooks executam automaticamente
```

### 2. Commit-msg Hook

**Quando executa**: Ao criar mensagem de commit

**O que faz**:
- ✅ Valida formato da mensagem
- ✅ Garante uso de conventional commits
- ✅ Bloqueia mensagens inadequadas

**Formato aceito**:
```
tipo(escopo): descrição

Exemplos válidos:
feat: adicionar validação de CPF
fix(auth): corrigir erro de login
docs: atualizar README
test(validation): adicionar testes
```

**Tipos válidos**:
- `feat`: nova funcionalidade
- `fix`: correção de bug
- `docs`: documentação
- `style`: formatação, estilos
- `refactor`: refatoração
- `test`: testes
- `chore`: manutenção
- `perf`: performance
- `ci`: integração contínua
- `build`: sistema de build
- `revert`: reverter commit

### 3. Pre-push Hook

**Quando executa**: Antes de push para repositório remoto

**O que faz**:

#### Para branches principais (main/master):
- ✅ Verificação completa de tipos
- ✅ Linting completo
- ✅ Verificação de formatação
- ✅ Todos os testes
- ✅ Build de produção

#### Para branches de feature:
- ✅ Verificação básica de tipos
- ✅ Testes críticos apenas

```bash
# Exemplo
git push origin feature/nova-funcionalidade
# → Verificações básicas

git push origin main
# → Verificações completas
```

## 📋 Comandos Disponíveis

### Verificação Manual

```bash
# Verificar qualidade completa
npm run quality:check

# Verificações individuais
npm run type-check      # TypeScript
npm run lint           # ESLint
npm run lint:fix       # ESLint com correções
npm run for# Prettier
npm run format:check   # Verificar formatação
npm run test:critical  # Testes críticos
npm run test:run       # Todos os testes
```

### Correção Automática

```bash
# Corrigir problemas automaticamente
npm run lint:fix && npm run format
```

## 🚫 Ignorar Hooks (Não Recomendado)

Em casos excepcionais, você pode pular os hooks:

```bash
# Pular pre-commit (não recomendado)
git commit --no-verify -m "mensagem"

# Pular pre-push (não recomendado)
git push --no-verify
```

**⚠️ Aviso**: Ignorar hooks pode introduzir código com problemas no repositório.

## 🔍 Lint-staged Configuration

O `lint-staged` executa comandos apenas em arquivos modificados:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "bash -c 'npm run type-check'"
    ],
    "*.{js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,css,md}": [
      "prettier --write"
    ],
    "*.{ts,tsx,js,jsx}": [
      "bash -c 'npm run test:critical -- --run --passWithNoTests'"
    ]
  }
}
```

## 🐛 Solução de Problemas

### Hook não executa

```bash
# Verificar se Husky está instalado
npx husky --version

# Reinstalar hooks
npx husky init
chmod +x .husky/*
```

### Erro de permissão

```bash
# Dar permissão aos hooks
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
chmod +x .husky/pre-push
```

### ESLint falha

```bash
# Verificar configuração
npm run lint

# Corrigir automaticamente
npm run lint:fix
```

### Prettier falha

```bash
# Verificar formatação
npm run format:check

# Corrigir formatação
npm run format
```

### TypeScript falha

```bash
# Verificar tipos
npm run type-check

# Ver erros detalhados
npx tsc --noEmit --pretty
```

### Testes falham

```bash
# Executar testes críticos
npm run test:critical

# Executar todos os testes
npm run test:run

# Executar com interface
npm run test:ui
```

## 📊 Métricas e Monitoramento

### Tempo de Execução Típico

- **Pre-commit**: 10-30 segundos
- **Commit-msg**: < 1 segundo
- **Pre-push (feature)**: 30-60 segundos
- **Pre-push (main)**: 2-5 minutos

### Otimizações Implementadas

- ✅ **Lint-staged**: Apenas arquivos modificados
- ✅ **Cache ESLint**: Reutiliza resultados
- ✅ **Testes críticos**: Subset focado
- ✅ **Verificação condicional**: Diferente por branch

## 🔄 Fluxo de Trabalho

### Desenvolvimento Normal

```bash
# 1. Fazer mudanças
git add src/components/NewComponent.tsx

# 2. Commit (hooks executam automaticamente)
git commit -m "feat: adicionar novo componente"
# → Pre-commit hook executa
# → Commit-msg hook valida mensagem

# 3. Push (verificações executam)
git push origin feature/novo-componente
# → Pre-push hook executa verificações básicas
```

### Branch Principal

```bash
# 1. Merge para main
git checkout main
git merge feature/novo-componente

# 2. Push (verificações completas)
git push origin main
# → Pre-push hook executa verificações completas
# → Build, todos os testes, etc.
```

## 🎯 Benefícios

### Para Desenvolvedores

- ✅ **Feedback imediato** sobre problemas
- ✅ **Correção automática** de formatação
- ✅ **Prevenção de bugs** antes do commit
- ✅ **Padronização** automática

### Para o Projeto

- ✅ **Qualidade consistente** do código
- ✅ **Histórico limpo** de commits
- ✅ **Redução de bugs** em produção
- ✅ **Manutenibilidade** melhorada

### Para a Equipe

- ✅ **Code review** mais eficiente
- ✅ **Onboarding** facilitado
- ✅ **Padrões** automaticamente aplicados
- ✅ **Confiança** no código

## 📚 Recursos Adicionais

- [Husky Documentation](https://typicode.github.io/husky/)
- [Lint-staged Documentation](https://github.com/okonet/lint-staged)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)

## 🔧 Customização

### Adicionar Nova Verificação

1. **Editar `.husky/pre-commit`**:
```bash
# Adicionar nova verificação
echo "🔍 Executando nova verificação..."
npm run nova-verificacao
```

2. **Atualizar `lint-staged`** no `package.json`:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "nova-verificacao"
    ]
  }
}
```

### Modificar Padrão de Commit

Editar `.husky/commit-msg` para alterar regex:
```bash
# Novo padrão
commit_regex='^(seu-padrao): .{1,50}'
```

### Ajustar Verificações por Branch

Editar `.husky/pre-push` para diferentes branches:
```bash
if [ "$current_branch" = "staging" ]; then
  # Verificações específicas para staging
fi
```
