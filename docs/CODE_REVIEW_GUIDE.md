# Guia de Revisão de Código

Este documento estabelece as diretrizes para revisão de código no projeto
Enxergar Sem Fronteira.

## 🎯 Objetivos da Revisão

- **Qualidade**: Garantir que o código atende aos padrões estabelecidos
- **Segurança**: Identificar vulnerabilidades e práticas inseguras
- **Performance**: Detectar possíveis gargalos e otimizações
- **Manutenibilidade**: Assegurar código legível e bem estruturado
- **Conhecimento**: Compartilhar conhecimento entre a equipe

## 📋 Checklist de Revisão

### ✅ Funcionalidade

- [ ] O código faz o que deveria fazer?
- [ ] A lógica está correta?
- [ ] Casos extremos foram considerados?
- [ ] Tratamento de erros está adequado?
- [ ] Validações necessárias estão implementadas?

### 🔒 Segurança

- [ ] Dados de entrada são validados e sanitizados?
- [ ] Não há exposição de informações sensíveis?
- [ ] Autenticação e autorização estão corretas?
- [ ] Não há vulnerabilidades XSS ou injection?
- [ ] Secrets não estão hardcoded?

### 🚀 Performance

- [ ] Não há loops desnecessários ou ineficientes?
- [ ] Consultas ao banco são otimizadas?
- [ ] Componentes React usam memo/callback quando apropriado?
- [ ] Não há re-renders desnecessários?
- [ ] Lazy loading está implementado onde necessário?

### 📚 Qualidade do Código

- [ ] Código segue os padrões estabelecidos?
- [ ] Nomenclatura é clara e consistente?
- [ ] Funções têm responsabilidade única?
- [ ] Código está bem documentado (JSDoc)?
- [ ] Não há código duplicado?
- [ ] Complexidade está dentro dos limites?

### 🧪 Testes

- [ ] Testes cobrem funcionalidades principais?
- [ ] Casos de erro estão testados?
- [ ] Testes são claros e bem nomeados?
- [ ] Mocks são apropriados?
- [ ] Testes passam consistentemente?

### 🎨 UI/UX (para componentes)

- [ ] Interface está responsiva?
- [ ] Acessibilidade foi considerada?
- [ ] Estados de loading/erro estão implementados?
- [ ] Feedback visual é adequado?
- [ ] Componente segue design system?

## 🔍 Processo de Revisão

### 1. Preparação

**Autor do PR:**

- [ ] Código está completo e testado
- [ ] Descrição do PR é clara e detalhada
- [ ] Testes passam localmente
- [ ] Linting não apresenta erros
- [ ] Auto-revisão foi feita

**Revisor:**

- [ ] Entender o contexto e objetivos
- [ ] Verificar se há documentação relacionada
- [ ] Preparar ambiente se necessário

### 2. Revisão Técnica

#### Análise Estática

```bash
# Executar verificações automáticas
npm run lint
npm run type-check
npm run test
npm run build
```

#### Análise Manual

- Ler código linha por linha
- Verificar lógica de negócio
- Avaliar arquitetura e design
- Testar funcionalidade se necessário

### 3. Feedback

#### ✅ Comentários Construtivos

````markdown
# ✅ Bom

Considere usar `useMemo` aqui para otimizar o cálculo:

```typescript
const expensiveValue = useMemo(() => heavyCalculation(data), [data]);
```
````

# ❌ Evitar

Este código está ruim.

````

#### 🏷️ Categorias de Comentários

- **🚨 Crítico**: Deve ser corrigido antes do merge
- **⚠️ Importante**: Deveria ser corrigido
- **💡 Sugestão**: Melhoria opcional
- **❓ Pergunta**: Esclarecimento necessário
- **👍 Elogio**: Reconhecer bom código

### 4. Resolução

**Autor:**
- Responder a todos os comentários
- Implementar correções necessárias
- Explicar decisões quando apropriado
- Solicitar nova revisão se necessário

**Revisor:**
- Verificar correções implementadas
- Aprovar quando satisfeito
- Continuar discussão se necessário

## 📝 Templates de Comentários

### Problemas de Segurança
```markdown
🚨 **Segurança**: Este código pode ser vulnerável a XSS.
Considere sanitizar a entrada usando DOMPurify:

```typescript
const sanitized = DOMPurify.sanitize(userInput)
````

````

### Problemas de Performance
```markdown
⚠️ **Performance**: Este useEffect pode causar re-renders desnecessários.
Considere adicionar dependências específicas:

```typescript
useEffect(() => {
  // lógica
}, [specificDependency]) // ao invés de []
````

````

### Sugestões de Melhoria
```markdown
💡 **Sugestão**: Este código poderia ser mais legível usando destructuring:

```typescript
// Ao invés de
const name = user.name
const email = user.email

// Considere
const { name, email } = user
````

````

### Questões de Arquitetura
```markdown
❓ **Arquitetura**: Por que esta lógica está no componente ao invés de um hook customizado?
Isso facilitaria reutilização e testabilidade.
````

## 🎯 Foco por Tipo de Mudança

### 🆕 Novas Funcionalidades

- Requisitos foram atendidos?
- Integração com código existente?
- Testes adequados?
- Documentação atualizada?

### 🐛 Correções de Bug

- Root cause foi identificado?
- Correção não introduz novos bugs?
- Testes previnem regressão?
- Casos similares foram considerados?

### 🔧 Refatoração

- Funcionalidade permanece inalterada?
- Melhoria é significativa?
- Testes cobrem mudanças?
- Não há breaking changes?

### 📚 Documentação

- Informação está correta e atualizada?
- Exemplos funcionam?
- Linguagem está clara?
- Formatação está consistente?

## ⚡ Dicas para Revisões Eficientes

### Para Revisores

1. **Seja Construtivo**
   - Foque no código, não na pessoa
   - Explique o "porquê" das sugestões
   - Ofereça soluções alternativas

2. **Seja Específico**
   - Aponte linhas exatas
   - Forneça exemplos de código
   - Referencie documentação quando relevante

3. **Priorize**
   - Identifique problemas críticos primeiro
   - Separe "must fix" de "nice to have"
   - Considere o contexto e prazos

4. **Seja Eficiente**
   - Use ferramentas automatizadas
   - Foque em aspectos que máquinas não detectam
   - Não refaça o trabalho do linter

### Para Autores

1. **Prepare o PR**
   - Faça auto-revisão primeiro
   - Escreva descrição clara
   - Mantenha PRs pequenos e focados

2. **Responda Construtivamente**
   - Agradeça feedback
   - Explique decisões quando necessário
   - Implemente sugestões válidas

3. **Aprenda Continuamente**
   - Veja revisões como oportunidade de aprendizado
   - Faça perguntas quando não entender
   - Aplique lições em código futuro

## 🚫 Antipadrões a Evitar

### ❌ Revisões Inadequadas

- Aprovar sem ler o código
- Focar apenas em estilo/formatação
- Ser excessivamente crítico
- Ignorar contexto de negócio
- Não testar funcionalidade

### ❌ Comentários Inadequados

- Críticas pessoais
- Comentários vagos ("isso está errado")
- Nitpicking excessivo
- Reescrever código completamente
- Ignorar padrões estabelecidos

## 📊 Métricas de Qualidade

### Métricas de PR

- Tempo médio de revisão
- Número de iterações por PR
- Taxa de aprovação na primeira revisão
- Tamanho médio dos PRs

### Métricas de Código

- Cobertura de testes
- Complexidade ciclomática
- Duplicação de código
- Violações de linting

### Métricas de Bugs

- Bugs encontrados em revisão vs produção
- Tempo para correção
- Taxa de regressão

## 🛠️ Ferramentas de Apoio

### Automação

- **ESLint**: Verificação de qualidade
- **Prettier**: Formatação consistente
- **TypeScript**: Verificação de tipos
- **Husky**: Pre-commit hooks
- **SonarQube**: Análise de qualidade

### Integração

- **GitHub Actions**: CI/CD pipeline
- **Codecov**: Cobertura de testes
- **Dependabot**: Atualizações de dependências

## 📚 Recursos Adicionais

- [Padrões de Código](./CODING_STANDARDS.md)
- [Guia de Testes](./TESTING_GUIDE.md)
- [Documentação de Arquitetura](./ARCHITECTURE.md)
- [Guia de Segurança](./SECURITY_GUIDE.md)

## 🔄 Processo de Melhoria

Este guia deve ser revisado e atualizado regularmente baseado em:

- Feedback da equipe
- Lições aprendidas
- Mudanças na tecnologia
- Evolução dos padrões da indústria

**Última atualização**: [Data atual] **Próxima revisão**: [Data + 3 meses]
