# Testes de Performance e Carga

Esta pasta contém testes abrangentes de performance e carga para o sistema de chat, validando comportamento sob diferentes condições de uso.

## Estrutura dos Testes

### 1. `chat-performance.test.ts`
Testes específicos de performance:
- Tempo de renderização de componentes
- Uso de memória
- Performance de rede
- Métricas de FPS
- Otimização de bundle

### 2. `chat-load.test.ts`
Testes de carga e stress:
- Múltiplas sessões simultâneas
- Alto volume de mensagens
- Processamento concorrente
- Vazamentos de memória
- Responsividade da UI

### 3. `../scripts/performance-test.js`
Script automatizado para execução completa:
- Execução de todos os testes
- Análise de bundle
- Geração de relatórios
- Métricas de ambiente

## Executando os Testes

### Testes Individuais
```bash
# Testes de performance
npm run test:performance

# Testes de carga
npm run test:load

# Modo watch para desenvolvimento
npm run test:performance:watch
```

### Suite Completa
```bash
# Execução completa com relatórios
npm run test:perf-suite

# Com limpeza de cache
CLEAR_CACHE=true npm run test:perf-suite
```

### Testes E2E de Performance
```bash
# Testes E2E focados em performance
npx playwright test --grep="performance"

# Com relatório detalhado
npx playwright test --grep="performance" --reporter=html
```

## Métricas Monitoradas

### Performance de Renderização
- **Tempo de Renderização**: < 100ms para componentes básicos
- **FPS**: Manter > 50fps durante animações
- **Time to Interactive**: < 3 segundos
- **First Contentful Paint**: < 2 segundos

### Uso de Memória
- **Heap Usage**: < 100MB para uso normal
- **Memory Leaks**: < 10% de aumento após ciclos
- **Garbage Collection**: Eficiente limpeza automática
- **Large Datasets**: < 50MB para 500 mensagens

### Performance de Rede
- **Request Latency**: < 500ms em média
- **Concurrent Requests**: Suporte a 10+ simultâneas
- **Payload Size**: < 2KB por mensagem
- **Retry Logic**: Recuperação automática de falhas

### Carga e Stress
- **Multiple Sessions**: Suporte a 50+ sessões
- **Message Volume**: 100+ mensagens por sessão
- **Concurrent Processing**: 5+ sessões simultâneas
- **UI Responsiveness**: < 100ms de resposta

## Thresholds de Performance

### Configuração Padrão
```javascript
const thresholds = {
  renderTime: 100,      // ms
  memoryUsage: 100,     // MB
  bundleSize: 200,      // KB
  fps: 50,              // frames per second
  latency: 500,         // ms
  concurrentSessions: 10,
  messagesPerSession: 100
};
```

### Níveis de Alerta
- **Verde**: Dentro dos thresholds
- **Amarelo**: 10-25% acima dos thresholds
- **Vermelho**: > 25% acima dos thresholds

## Cenários de Teste

### 1. Uso Normal
- 1-3 sessões ativas
- 10-50 mensagens por sessão
- Interações típicas do usuário
- Rede estável

### 2. Uso Intenso
- 5-10 sessões simultâneas
- 50-100 mensagens por sessão
- Múltiplos usuários ativos
- Variações de rede

### 3. Stress Test
- 10+ sessões simultâneas
- 100+ mensagens por sessão
- Envio rápido de mensagens
- Condições adversas de rede

### 4. Edge Cases
- Mensagens muito longas
- Histórico extenso (500+ mensagens)
- Falhas de rede frequentes
- Recursos limitados

## Análise de Resultados

### Métricas de Sucesso
```
✅ Render Time: 45ms (< 100ms)
✅ Memory Usage: 75MB (< 100MB)
✅ Bundle Size: 150KB (< 200KB)
✅ FPS: 58 (> 50)
✅ Network Latency: 250ms (< 500ms)
```

### Identificação de Problemas
```
❌ Memory Leak: 15% increase (> 10%)
⚠️ Bundle Size: 220KB (> 200KB)
❌ Render Time: 150ms (> 100ms)
```

### Recomendações Automáticas
- Otimização de componentes
- Lazy loading adicional
- Limpeza de memória
- Code splitting
- Compressão de assets

## Relatórios Gerados

### JSON Report
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "summary": {
    "passed": 25,
    "failed": 2,
    "warnings": 3,
    "successRate": 89.3
  },
  "tests": {
    "unit": { "passed": 10, "failed": 0 },
    "load": { "passed": 8, "failed": 1 },
    "memory": { "passed": 5, "failed": 1 },
    "bundle": { "passed": 2, "failed": 0 }
  }
}
```

### HTML Report
- Dashboard visual interativo
- Gráficos de métricas
- Detalhes de cada teste
- Histórico de execuções
- Comparações temporais

## Integração com CI/CD

### GitHub Actions
```yaml
- name: Run Performance Tests
  run: npm run test:perf-suite

- name: Upload Performance Report
  uses: actions/upload-artifact@v2
  with:
    name: performance-report
    path: performance-reports/
```

### Thresholds no CI
```yaml
- name: Check Performance Thresholds
  run: |
    if [ $(jq '.summary.successRate' performance-report.json) -lt 90 ]; then
      echo "Performance tests below 90% success rate"
      exit 1
    fi
```

## Monitoramento Contínuo

### Métricas Históricas
- Tendências de performance
- Regressões detectadas
- Melhorias implementadas
- Comparações entre versões

### Alertas Automáticos
- Degradação de performance
- Vazamentos de memória
- Aumento de bundle size
- Falhas de carga

## Otimizações Implementadas

### Code Splitting
```typescript
// Lazy loading de componentes
const ChatPerformanceMonitor = lazy(() =>
  import('./ChatPerformanceMonitor')
);

const VirtualizedMessageList = lazy(() =>
  import('./VirtualizedMessageList')
);
```

### Virtualização
```typescript
// Lista virtualizada para grandes datasets
<VirtualizedMessageList
  messages={messages}
  itemHeight={60}
  windowSize={10}
/>
```

### Memoização
```typescript
// Componentes memoizados
const MessageBubble = React.memo(({ message }) => {
  // Renderização otimizada
});

// Hooks memoizados
const memoizedMessages = useMemo(() =>
  messages.filter(filterFn), [messages, filterFn]
);
```

### Debouncing
```typescript
// Debounce para entrada de texto
const debouncedSendMessage = useCallback(
  debounce(sendMessage, 300),
  [sendMessage]
);
```

## Troubleshooting

### Problemas Comuns

1. **Testes falhando por timeout**
   - Aumentar timeout nos testes
   - Verificar recursos do sistema
   - Otimizar operações lentas

2. **Vazamentos de memória**
   - Verificar cleanup de event listeners
   - Limpar timers e intervals
   - Revisar referências circulares

3. **Performance degradada**
   - Analisar bundle size
   - Verificar re-renderizações
   - Otimizar queries e operações

4. **Falhas de rede simuladas**
   - Verificar mocks de rede
   - Ajustar timeouts
   - Validar retry logic

### Debug de Performance

```typescript
// Profiling de componentes
import { Profiler } from 'react';

<Profiler id="ChatInterface" onRender={onRenderCallback}>
  <ChatInterface />
</Profiler>

// Métricas customizadas
performance.mark('chat-start');
// ... operação
performance.mark('chat-end');
performance.measure('chat-operation', 'chat-start', 'chat-end');
```

### Análise de Bundle

```bash
# Análise detalhada do bundle
npm run build -- --analyze

# Visualização interativa
npx webpack-bundle-analyzer dist/stats.json
```

## Melhores Práticas

### Escrita de Testes
- Usar dados realistas
- Simular condições reais
- Medir métricas relevantes
- Incluir casos extremos

### Otimização
- Lazy loading para componentes não críticos
- Virtualização para listas grandes
- Memoização para cálculos caros
- Debouncing para interações frequentes

### Monitoramento
- Executar testes regularmente
- Acompanhar tendências
- Definir alertas apropriados
- Documentar otimizações

## Recursos Adicionais

### Ferramentas
- [React DevTools Profiler](https://reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html)
- [Chrome DevTools Performance](https://developers.google.com/web/tools/chrome-devtools/performance)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)

### Documentação
- [Web Performance Metrics](https://web.dev/metrics/)
- [React Performance](https://reactjs.org/docs/optimizing-performance.html)
- [JavaScript Performance](https://developer.mozilla.org/en-US/docs/Web/Performance)

### Benchmarks
- [React Component Benchmarks](https://github.com/paularmstrong/react-component-benchmark)
- [Performance Testing Best Practices](https://web.dev/performance-testing/)
