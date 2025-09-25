# Testes de Acessibilidade

Esta pasta contém testes abrangentes de acessibilidade para o sistema de chat, validando conformidade com padrões WCAG 2.1 AA e compatibilidade com tecnologias assistivas.

## Estrutura dos Testes

### 1. `chat.a11y.test.tsx`
Testes gerais de acessibilidade usando axe-core:
- Validação automática de violações WCAG
- Testes de ARIA labels e roles
- Verificação de contraste de cores
- Validação de estrutura semântica

### 2. `keyboard.a11y.test.tsx`
Testes específicos de navegação por teclado:
- Ordem de tabulação
- Atalhos de teclado
- Navegação em componentes complexos
- Armadilhas de foco (focus traps)

### 3. `screenreader.a11y.test.tsx`
Testes de compatibilidade com leitores de tela:
- Live regions e anúncios
- Labels acessíveis
- Estados dinâmicos
- Feedback de ações

### 4. `utils.ts`
Utilitários para testes de acessibilidade:
- Funções de validação ARIA
- Simuladores de tecnologias assistivas
- Calculadores de contraste
- Helpers de navegação por teclado

### 5. `setup.ts`
Configuração global para testes:
- Mocks de APIs do browser
- Configuração do axe-core
- Utilitários de teste
- Setup de ambiente

## Executando os Testes

### Todos os Testes de Acessibilidade
```bash
npm run test:a11y
```

### Testes Específicos
```bash
# Testes gerais
npm run test src/test/accessibility/chat.a11y.test.tsx

# Testes de teclado
npm run test src/test/accessibility/keyboard.a11y.test.tsx

# Testes de screen reader
npm run test src/test/accessibility/screenreader.a11y.test.tsx
```

### Com Coverage
```bash
npm run test:a11y -- --coverage
```

### Modo Watch
```bash
npm run test:a11y -- --watch
```

## Padrões Testados

### WCAG 2.1 AA
- **Perceptível**: Contraste, texto alternativo, legendas
- **Operável**: Navegação por teclado, tempo suficiente, convulsões
- **Compreensível**: Legibilidade, previsibilidade, assistência de entrada
- **Robusto**: Compatibilidade com tecnologias assistivas

### Navegação por Teclado
- **Tab/Shift+Tab**: Navegação sequencial
- **Arrow Keys**: Navegação direcional em grupos
- **Enter/Space**: Ativação de controles
- **Escape**: Cancelamento/fechamento
- **Home/End**: Navegação para extremos

### Screen Readers
- **ARIA Labels**: Nomes acessíveis
- **ARIA Descriptions**: Informações adicionais
- **Live Regions**: Anúncios dinâmicos
- **Roles**: Semântica de elementos
- **States**: Estados de componentes

### Tecnologias Assistivas
- **NVDA**: Leitor de tela Windows
- **JAWS**: Leitor de tela Windows
- **VoiceOver**: Leitor de tela macOS/iOS
- **TalkBack**: Leitor de tela Android
- **Dragon**: Software de reconhecimento de voz

## Componentes Testados

### ChatInterface
- [x] Estrutura semântica
- [x] Navegação por teclado
- [x] Live regions para mensagens
- [x] Estados de carregamento
- [x] Tratamento de erros

### MessageInput
- [x] Labels de formulário
- [x] Validação acessível
- [x] Atalhos de teclado
- [x] Feedback de caracteres

### MessageBubble
- [x] Identificação de remetente
- [x] Estados de mensagem
- [x] Timestamps acessíveis
- [x] Ações de retry

### VoiceInput
- [x] Estados de gravação
- [x] Permissões de microfone
- [x] Feedback de transcrição
- [x] Controles por teclado

### PublicChatWidget
- [x] Toggle acessível
- [x] Focus trap quando aberto
- [x] Posicionamento responsivo
- [x] Escape para fechar

### AdminChatPanel
- [x] Navegação entre sessões
- [x] Tabs acessíveis
- [x] Múltiplas conversas
- [x] Indicadores de status

## Ferramentas Utilizadas

### axe-core
Biblioteca de testes automatizados de acessibilidade:
```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

const results = await axe(container);
expect(results).toHaveNoViolations();
```

### @testing-library/user-event
Simulação realista de interações do usuário:
```typescript
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();
await user.tab();
await user.keyboard('{Enter}');
```

### jest-axe
Matchers customizados para Jest:
```typescript
expect.extend(toHaveNoViolations);
```

## Configuração Personalizada

### axe-core Rules
```typescript
const axeConfig = {
  rules: {
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'aria-labels': { enabled: true },
    'focus-management': { enabled: true }
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
};
```

### Mocks de APIs
```typescript
// Web Speech API
global.SpeechRecognition = class MockSpeechRecognition {
  start = vi.fn();
  stop = vi.fn();
  addEventListener = vi.fn();
};

// Intersection Observer
global.IntersectionObserver = class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};
```

## Casos de Teste Específicos

### Navegação por Teclado
```typescript
it('should navigate through all interactive elements', async () => {
  const user = userEvent.setup();

  await user.tab(); // Input de texto
  expect(screen.getByRole('textbox')).toHaveFocus();

  await user.tab(); // Botão de voz
  expect(screen.getByRole('button', { name: /voz/i })).toHaveFocus();

  await user.tab(); // Botão de envio
  expect(screen.getByRole('button', { name: /enviar/i })).toHaveFocus();
});
```

### Live Regions
```typescript
it('should announce new messages', async () => {
  render(<ChatInterface />);

  const messageLog = screen.getByRole('log');
  expect(messageLog).toHaveAttribute('aria-live', 'polite');
  expect(messageLog).toHaveAttribute('aria-label', 'Histórico de mensagens');
});
```

### Focus Management
```typescript
it('should trap focus in modal', async () => {
  render(<PublicChatWidget />);

  const toggleButton = screen.getByRole('button');
  await user.click(toggleButton);

  // Focus deve estar no primeiro elemento focável do modal
  const firstFocusable = screen.getByRole('textbox');
  expect(firstFocusable).toHaveFocus();
});
```

## Relatórios de Acessibilidade

### Formato de Saída
Os testes geram relatórios detalhados incluindo:
- Violações encontradas
- Elementos afetados
- Sugestões de correção
- Nível de conformidade WCAG

### Exemplo de Violação
```
Accessibility violation: color-contrast
- Element: button.send-button
- Impact: serious
- Help: Elements must have sufficient color contrast
- WCAG: 1.4.3 Contrast (Minimum) (AA)
- Fix: Increase contrast ratio to at least 4.5:1
```

## Integração com CI/CD

### GitHub Actions
```yaml
- name: Run Accessibility Tests
  run: npm run test:a11y

- name: Upload A11y Report
  uses: actions/upload-artifact@v2
  with:
    name: accessibility-report
    path: coverage/accessibility/
```

### Pre-commit Hooks
```bash
#!/bin/sh
npm run test:a11y --passWithNoTests
```

## Boas Práticas

### 1. Testes Incrementais
- Adicione testes de acessibilidade para cada novo componente
- Valide mudanças com testes automatizados
- Use TDD para funcionalidades acessíveis

### 2. Testes Manuais
- Teste com leitores de tela reais
- Valide navegação apenas por teclado
- Verifique em diferentes dispositivos

### 3. Documentação
- Documente padrões de acessibilidade
- Mantenha guias de implementação
- Compartilhe conhecimento com a equipe

### 4. Monitoramento Contínuo
- Execute testes em cada deploy
- Monitore métricas de acessibilidade
- Colete feedback de usuários

## Recursos Adicionais

### Documentação
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)

### Ferramentas
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)
- [Lighthouse Accessibility Audit](https://developers.google.com/web/tools/lighthouse)

### Leitores de Tela
- [NVDA (Free)](https://www.nvaccess.org/)
- [JAWS (Commercial)](https://www.freedomscientific.com/products/software/jaws/)
- [VoiceOver (Built-in macOS/iOS)](https://support.apple.com/guide/voiceover/)

## Troubleshooting

### Problemas Comuns

1. **Testes falhando por timeout**
   - Aumentar timeout nos testes assíncronos
   - Verificar se elementos estão sendo renderizados

2. **Mocks não funcionando**
   - Verificar se setup.ts está sendo importado
   - Confirmar ordem de importação dos mocks

3. **axe-core não detectando violações**
   - Verificar configuração de rules
   - Confirmar se elementos estão no DOM

4. **Focus não sendo detectado**
   - Usar waitFor para mudanças assíncronas
   - Verificar se elementos são focáveis

### Debug

```typescript
// Debug de elementos focáveis
const focusableElements = container.querySelectorAll(
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
);
console.log('Focusable elements:', focusableElements);

// Debug de ARIA attributes
const element = screen.getByRole('button');
console.log('ARIA attributes:', {
  'aria-label': element.getAttribute('aria-label'),
  'aria-describedby': element.getAttribute('aria-describedby'),
  'aria-expanded': element.getAttribute('aria-expanded')
});
```

## Contribuição

Para adicionar novos testes de acessibilidade:

1. Identifique o componente ou funcionalidade
2. Determine os padrões WCAG aplicáveis
3. Escreva testes automatizados
4. Valide com testes manuais
5. Documente padrões implementados
6. Adicione ao CI/CD pipeline
