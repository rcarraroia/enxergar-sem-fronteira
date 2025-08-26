# Exemplos de Chat

Esta pasta contém exemplos práticos de como usar o sistema de chat com integração n8n.

## Exemplos Disponíveis

### 1. BasicChatExample
Demonstra a implementação básica de um chat simples.

**Funcionalidades:**
- Chat interface básica
- Tratamento de eventos de sessão
- Exibição de métricas simples
- Controles de reset

**Como usar:**
```tsx
import { BasicChatExample } from '@/examples/chat';

const MyPage = () => {
  return (
    <div>
      <h1>Minha Página</h1>
      <BasicChatExample />
    </div>
  );
};
```

### 2. AdvancedChatExample
Demonstra funcionalidades avançadas do sistema de chat.

**Funcionalidades:**
- Interface com abas (Chat, Configurações, Métricas, Performance)
- Configurações dinâmicas
- Dashboard de métricas
- Monitor de performance
- Entrada de voz
- Otimizações automáticas

**Como usar:**
```tsx
import { AdvancedChatExample } from '@/examples/chat';

const AdminPage = () => {
  return (
    <div>
      <h1>Painel Administrativo</h1>
      <AdvancedChatExample />
    </div>
  );
};
```

### 3. N8nIntegrationExample
Demonstra como configurar e testar a integração com n8n.

**Funcionalidades:**
- Teste de webhooks
- Exemplos de workflows n8n
- Configuração de integração
- Debug de comunicação

**Como usar:**
```tsx
import { N8nIntegrationExample } from '@/examples/chat';

const IntegrationPage = () => {
  return (
    <div>
      <h1>Teste de Integração n8n</h1>
      <N8nIntegrationExample />
    </div>
  );
};
```

## Configuração

### Variáveis de Ambiente

Certifique-se de configurar as seguintes variáveis:

```env
# URLs dos webhooks n8n
VITE_N8N_PUBLIC_WEBHOOK_URL=https://your-n8n.com/webhook/public-chat
VITE_N8N_ADMIN_WEBHOOK_URL=https://your-n8n.com/webhook/admin-chat

# API Key do n8n (opcional)
VITE_N8N_API_KEY=your-api-key
```

### Dependências

Os exemplos dependem dos seguintes componentes:

- `@/components/chat/*` - Componentes de chat
- `@/hooks/useChat*` - Hooks de chat
- `@/lib/chat/*` - Utilitários de chat
- `@/components/ui/*` - Componentes de UI (shadcn/ui)

## Executando os Exemplos

### 1. Em Desenvolvimento

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas configurações

# Executar em modo desenvolvimento
npm run dev
```

### 2. Como Componentes

Você pode importar e usar os exemplos diretamente em suas páginas:

```tsx
import React from 'react';
import { BasicChatExample, AdvancedChatExample } from '@/examples/chat';

const ExamplesPage = () => {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <section>
        <h2>Exemplo Básico</h2>
        <BasicChatExample />
      </section>

      <section>
        <h2>Exemplo Avançado</h2>
        <AdvancedChatExample />
      </section>
    </div>
  );
};

export default ExamplesPage;
```

### 3. Customização

Todos os exemplos podem ser customizados:

```tsx
import React from 'react';
import { ChatInterface } from '@/components/chat';

const CustomChatExample = () => {
  return (
    <ChatInterface
      type="public"
      webhookUrl="https://my-custom-n8n.com/webhook/chat"
      placeholder="Digite sua mensagem personalizada..."
      maxHeight={600}
      enableVoice={true}
      theme="dark"
      onSessionStart={(sessionId) => {
        console.log('Sessão customizada iniciada:', sessionId);
        // Sua lógica customizada aqui
      }}
      onError={(error) => {
        console.error('Erro customizado:', error);
        // Seu tratamento de erro aqui
      }}
    />
  );
};
```

## Estrutura dos Arquivos

```
src/examples/chat/
├── README.md                    # Este arquivo
├── index.ts                     # Exportações principais
├── BasicChatExample.tsx         # Exemplo básico
├── AdvancedChatExample.tsx      # Exemplo avançado
└── N8nIntegrationExample.tsx    # Exemplo de integração n8n
```

## Casos de Uso

### Para Desenvolvedores Iniciantes
- Comece com `BasicChatExample`
- Entenda os conceitos básicos
- Experimente com diferentes configurações

### Para Desenvolvedores Avançados
- Use `AdvancedChatExample` como base
- Explore todas as funcionalidades
- Customize conforme suas necessidades

### Para Integração n8n
- Use `N8nIntegrationExample` para testar
- Configure seus workflows
- Debug problemas de comunicação

## Dicas e Boas Práticas

### 1. Configuração de Webhooks
- Sempre teste seus webhooks antes de usar em produção
- Use URLs HTTPS em produção
- Implemente tratamento de erro robusto

### 2. Performance
- Monitore o uso de memória em conversas longas
- Use virtualização para listas grandes de mensagens
- Implemente limpeza automática de sessões antigas

### 3. Acessibilidade
- Teste navegação por teclado
- Verifique compatibilidade com screen readers
- Mantenha contraste adequado

### 4. Segurança
- Valide e sanitize todas as entradas
- Use HTTPS sempre
- Implemente rate limiting

## Troubleshooting

### Problemas Comuns

1. **Chat não carrega**
   - Verificar variáveis de ambiente
   - Confirmar se componentes estão importados corretamente

2. **Webhook não responde**
   - Verificar URL do webhook
   - Testar com `N8nIntegrationExample`

3. **Erros de TypeScript**
   - Verificar se todos os tipos estão importados
   - Confirmar versões das dependências

### Debug

Use o console do navegador para debug:

```tsx
const handleDebug = (event: string, data: any) => {
  console.log('Chat Event:', event, data);
};

<ChatInterface
  onMetrics={handleDebug}
  onError={(error) => console.error('Chat Error:', error)}
  // ... outras props
/>
```

## Contribuição

Para adicionar novos exemplos:

1. Crie um novo arquivo `.tsx` nesta pasta
2. Siga o padrão dos exemplos existentes
3. Adicione exportação no `index.ts`
4. Documente no README
5. Adicione testes se necessário

## Recursos Adicionais

- [Documentação do Sistema de Chat](../../docs/CHAT_SYSTEM.md)
- [Guia de Webhooks n8n](../../docs/N8N_WEBHOOK_GUIDE.md)
- [Componentes de Chat](../../components/chat/README.md)
- [Hooks de Chat](../../hooks/README.md)
