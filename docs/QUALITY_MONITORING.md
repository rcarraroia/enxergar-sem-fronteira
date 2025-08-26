# Sistema de Monitoramento de Qualidade

Este documento descreve o sistema de monitoramento contínuo de qualidadmplementado no projeto "Enxergar sem Fronteira".

## 🎯 Visão Geral

O sistema de monitoramento de qualidade coleta, analisa e reporta métricas de qualidade do código em tempo real, detectando regressões e fornecendo insights para manter a qualidade do projeto.

### Funcionalidades Principais

- ✅ **Coleta Automática de Métricas**: ESLint, TypeScript, testes, bundle size
- ✅ **Detecção de Regressões**: Comparação com histórico e alertas automáticos
- ✅ **Dashboard Visual**: Interface web para visualização de métricas
- ✅ **Integração CI/CD**: Execução automática em pipelines
- ✅ **Relatórios Detalhados**: Análise de tendências e recomendações

## 🚀 Como Usar

### Comandos Principais

```bash
# Coletar métricas de qualidade
npm run quality:metrics

# Analisar regressões e gerar alertas
npm run quality:alerts

# Executar análise completa
npm run quality:full

# Abrir dashboard
npm run quality:dashboard
```

### Execução Manual

```bash
# Coletar métricas específicas
node scripts/quality-metrics.js

# Analisar alertas
node scripts/quality-alerts.js

# Abrir dashboard no navegador
open scripts/quality-dashboard.html
```

## 📊 Métricas Coletadas

### 1. ESLint
- **Erros**: Problemas críticos que impedem execução
- **Warnings**: Problemas de estilo e boas práticas
- **Arquivos afetados**: Número de arquivos com problemas
- **Detalhes por arquivo**: Localização específica dos problemas

### 2. TypeScript
- **Erros de tipo**: Problemas de tipagem
- **Verificação rigorosa**: Conformidade com configurações strict
- **Saída detalhada**: Mensagens de erro específicas

### 3. Testes
- **Cobertura**: Percentual de código coberto por testes
- **Testes executados**: Total de testes no projeto
- **Testes passando**: Número de testes bem-sucedidos
- **Testes falhando**: Número de testes com falha

### 4. Bundle
- **Tamanho total**: Tamanho do bundle em KB
- **Tamanho comprimido**: Estimativa do tamanho gzipped
- **Número de arquivos**: Arquivos no build final

### 5. Complexidade
- **Arquivos**: Total de arquivos TypeScript/TSX
- **Linhas de código**: Total de linhas no projeto
- **Funções**: Número total de funções
- **Componentes**: Número de componentes React
- **Média por arquivo**: Linhas médias por arquivo

## 🚨 Sistema de Alertas

### Tipos de Alerta

#### 🔴 **Críticos** (Bloqueiam deploy)
- Erros de ESLint ou TypeScript
- Testes falhando
- Build quebrado

#### 🟡 **Warnings** (Requerem atenção)
- Aumento significativo de warnings
- Redução na cobertura de testes
- Aumento no tamanho do bundle

#### 🟢 **Informativos** (Melhorias)
- Redução de warnings
- Aumento na cobertura
- Otimizações de bundle

### Thresholds Configurados

```javascript
{
  eslintErrors: 0,           // Zero erros permitidos
  eslintWarnings: 50,        // Máximo 50 warnings
  testCoverage: 70,          // Mínimo 70% cobertura
  bundleSize: 2000,          // Máximo 2MB bundle
  typeScriptErrors: 0        // Zero erros de tipo
}
```

### Detecção de Regressões

O sistema compara métricas atuais com a média das últimas 5 execuções:

- **ESLint**: Qualquer aumento em erros é regressão
- **Warnings**: Aumento de 5+ warnings
- **Cobertura**: Redução de 5% ou mais
- **Bundle**: Aumento de 100KB ou mais

## 📈 Dashboard de Qualidade

### Acesso ao Dashboard

1. Execute `npm run quality:metrics` para gerar dados
2. Execute `npm run quality:dashboard` para obter o link
3. Abra o arquivo HTML no navegador

### Funcionalidades do Dashboard

#### **Métricas em Tempo Real**
- Cards com métricas principais
- Indicadores visuais de status (verde/amarelo/vermelho)
- Valores atuais e comparações

#### **Gráficos de Tendência**
- **ESLint**: Evolução de erros e warnings
- **Cobertura**: Histórico de cobertura de testes
- **Bundle**: Evolução do tamanho do bundle
- **Complexidade**: Distribuição de componentes

#### **Alertas Recentes**
- Lista dos últimos alertas gerados
- Classificação por severidade
- Mensagens detalhadas

#### **Auto-refresh**
- Atualização automática a cada 5 minutos
- Botão de refresh manual
- Timestamp da última atualização

## 🔧 Configuração

### Arquivo de Configuração

O sistema usa o arquivo `quality.config.js` para configurações:

```javascript
module.exports = {
  thresholds: {
    eslintErrors: 0,
    eslintWarnings: 50,
    testCoverage: 70,
    bundleSize: 2000
  },

  regression: {
    baselineWindow: 5,
    maxHistoryEntries: 50
  },

  alerts: {
    severities: { /* ... */ },
    notifications: { /* ... */ }
  }
};
```

### Personalização de Thresholds

Para ajustar os limites de qualidade:

1. Edite `quality.config.js`
2. Modifique os valores em `thresholds`
3. Execute `npm run quality:full` para testar

### Configuração de Alertas

```javascript
alerts: {
  notifications: {
    console: true,      // Exibir no console
    file: true,         // Salvar em arquivo
    webhook: false,     // Webhook (futuro)
    email: false        // Email (futuro)
  }
}
```

## 🔄 Integração CI/CD

### GitHub Actions

O workflow `.github/workflows/quality-check.yml` inclui:

```yaml
- name: Quality metrics collection
  run: npm run quality:metrics

- name: Quality alerts check
  run: npm run quality:alerts

- name: Upload quality reports
  uses: actions/upload-artifact@v4
  with:
    name: quality-reports
    path: quality-reports/
```

### Execução Automática

O sistema executa automaticamente em:
- ✅ Push para `main` ou `develop`
- ✅ Pull Requests
- ✅ Releases
- ✅ Execução manual

### Artefatos Gerados

- `quality-reports/`: Relatórios JSON e texto
- `coverage/`: Relatórios de cobertura
- `quality-history.json`: Histórico de métricas

## 📁 Estrutura de Arquivos

```
quality-reports/
├── quality-report-[timestamp].json    # Relatório detalhado
├── latest-quality-report.txt          # Relatório legível
├── quality-history.json               # Histórico de execuções
├── quality-alerts.json                # Alertas ativos
└── trend-report.txt                   # Análise de tendências

scripts/
├── quality-metrics.js                 # Coleta de métricas
├── quality-alerts.js                  # Sistema de alertas
└── quality-dashboard.html             # Dashboard web

quality.config.js                      # Configurações
```

## 🛠️ Manutenção

### Limpeza de Dados

```bash
# Limpar relatórios antigos (manual)
rm -rf quality-reports/quality-report-*.json

# Manter apenas últimos 30 dias
find quality-reports/ -name "*.json" -mtime +30 -delete
```

### Backup de Histórico

```bash
# Backup do histórico
cp quality-reports/quality-history.json backups/quality-history-$(date +%Y%m%d).json
```

### Atualização de Configurações

1. Edite `quality.config.js`
2. Teste com `npm run quality:full`
3. Commit as mudanças
4. Deploy automático via CI/CD

## 📊 Interpretação de Métricas

### Métricas Saudáveis

- ✅ **ESLint Erros**: 0
- ✅ **ESLint Warnings**: < 20
- ✅ **Cobertura Testes**: > 80%
- ✅ **Bundle Size**: < 1.5MB
- ✅ **TypeScript Erros**: 0

### Sinais de Alerta

- ⚠️ **Warnings crescendo**: Revisar código recente
- ⚠️ **Cobertura caindo**: Adicionar testes
- ⚠️ **Bundle crescendo**: Otimizar imports
- ⚠️ **Complexidade alta**: Refatorar código

### Ações Recomendadas

#### Para Erros de ESLint
```bash
npm run lint:fix          # Correção automática
npm run lint              # Verificar problemas restantes
```

#### Para Cobertura Baixa
```bash
npm run test:coverage     # Ver relatório detalhado
npm run test:integration  # Executar testes de integração
```

#### Para Bundle Grande
```bash
npm run build             # Analisar saída do build
# Revisar imports desnecessários
# Considerar code splitting
```

## 🚀 Próximos Passos

### Funcionalidades Planejadas

- [ ] **Integração Slack**: Notificações em tempo real
- [ ] **Análise com IA**: Sugestões inteligentes
- [ ] **Alertas Preditivos**: Detecção precoce de problemas
- [ ] **Auto-correção**: Fixes automáticos para problemas simples
- [ ] **Relatórios HTML**: Dashboard mais rico
- [ ] **API REST**: Acesso programático às métricas

### Melhorias Contínuas

- [ ] **Performance**: Otimizar coleta de métricas
- [ ] **Precisão**: Melhorar detecção de regressões
- [ ] **Usabilidade**: Interface mais intuitiva
- [ ] **Documentação**: Guias mais detalhados

## 🆘 Troubleshooting

### Problemas Comuns

#### "Comando não encontrado"
```bash
# Verificar se Node.js está instalado
node --version
npm --version

# Reinstalar dependências
npm install
```

#### "Erro ao coletar métricas"
```bash
# Verificar se build funciona
npm run build

# Verificar se testes passam
npm run test
```

#### "Dashboard não carrega"
```bash
# Gerar dados primeiro
npm run quality:metrics

# Verificar se arquivo existe
ls -la scripts/quality-dashboard.html
```

### Logs de Debug

```bash
# Executar com logs detalhados
DEBUG=quality:* npm run quality:full

# Verificar logs do sistema
tail -f quality.log
```

### Suporte

Para problemas não resolvidos:

1. Verificar [Issues no GitHub](https://github.com/projeto/issues)
2. Criar nova issue com logs detalhados
3. Incluir configuração e ambiente
4. Descrever passos para reproduzir

---

**Última atualização**: Janeiro 2025
**Versão do sistema**: 1.0.0
