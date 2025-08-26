# Guia de Configuração de Webhooks n8n

## Visão Geral

Este guia explica como configurar webhooks n8n para integração com o sistema de chat. Os webhooks permitem que o n8n receba mensagens do chat e responda de forma automatizada.

## Pré-requisitos

- Instância do n8n configurada e acessível
- Conhecimento básico de workflows n8n
- URLs de webhook configuradas nas variáveis de ambiente

## Configuração Básica

### 1. Criar Novo Workflow

1. Acesse sua instância n8n
2. Clique em "New Workflow"
3. Adicione um node "Webhook"

### 2. Configurar Node Webhook

```json
{
  "name": "Chat Webhook",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "path": "chat",
    "httpMethod": "POST",
    "responseMode": "respondToWebhook",
    "responseCode": 200,
    "responseHeaders": {
      "Content-Type": "application/json"
    }
  }
}
```

### 3. Estrutura de Dados Recebidos

O webhook receberá dados no seguinte formato:

```json
{
  "message": "Mensagem do usuário",
  "sessionId": "session-uuid-123",
  "type": "public", // ou "admin"
  "timestamp": "2024-01-15T10:30:00.000Z",
  "metadata": {
    "voiceInput": false,
    "userAgent": "Mozilla/5.0...",
    "ip": "192.168.1.1"
  }
}
```

### 4. Estrutura de Resposta Esperada

O webhook deve responder com:

```json
{
  "success": true,
  "data": {
    "response": "Resposta do agente",
    "sessionId": "session-uuid-123",
    "sessionComplete": false,
    "actions": [
      {
        "type": "redirect",
        "url": "/contact"
      }
    ],
    "metadata": {
      "sentiment": "positive",
      "confidence": 0.95,
      "processedAt": "2024-01-15T10:30:01.000Z"
    }
  },
  "error": null
}
```

## Exemplos de Workflows

### Exemplo 1: Resposta Simples

```json
{
  "name": "Simple Chat Response",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "chat",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Process Message",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const userMessage = $json.message.toLowerCase();\nconst sessionId = $json.sessionId;\n\nlet response = 'Obrigado pela sua mensagem!';\n\nif (userMessage.includes('preço')) {\n  response = 'Nossos preços começam em R$ 99/mês. Gostaria de mais detalhes?';\n} else if (userMessage.includes('contato')) {\n  response = 'Você pode nos contatar pelo telefone (11) 1234-5678.';\n} else if (userMessage.includes('horário')) {\n  response = 'Funcionamos de segunda a sexta, das 9h às 18h.';\n}\n\nreturn {\n  success: true,\n  data: {\n    response,\n    sessionId,\n    sessionComplete: false\n  }\n};"
      }
    },
    {
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}"
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Process Message",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Process Message": {
      "main": [
        [
          {
            "node": "Respond",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

### Exemplo 2: Integração com OpenAI

```json
{
  "name": "AI Chat Response",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "ai-chat",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Prepare AI Request",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const userMessage = $json.message;\nconst sessionId = $json.sessionId;\n\nreturn {\n  messages: [\n    {\n      role: 'system',\n      content: 'Você é um assistente virtual prestativo de uma empresa de tecnologia. Responda de forma amigável e profissional.'\n    },\n    {\n      role: 'user',\n      content: userMessage\n    }\n  ],\n  sessionId,\n  originalMessage: userMessage\n};"
      }
    },
    {
      "name": "OpenAI Chat",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "operation": "chat",
        "model": "gpt-3.5-turbo",
        "messages": "={{ $json.messages }}",
        "maxTokens": 150,
        "temperature": 0.7
      }
    },
    {
      "name": "Format Response",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const aiResponse = $json.choices[0].message.content;\nconst sessionId = $('Prepare AI Request').first().json.sessionId;\n\nreturn {\n  success: true,\n  data: {\n    response: aiResponse,\n    sessionId,\n    sessionComplete: false,\n    metadata: {\n      aiGenerated: true,\n      model: 'gpt-3.5-turbo',\n      processedAt: new Date().toISOString()\n    }\n  }\n};"
      }
    },
    {
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}"
      }
    }
  ]
}
```

### Exemplo 3: Salvamento em Banco de Dados

```json
{
  "name": "Chat with Database",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook"
    },
    {
      "name": "Save User Message",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "insert",
        "table": "chat_messages",
        "columns": [
          "session_id",
          "message",
          "sender",
          "created_at"
        ],
        "values": [
          "={{ $json.sessionId }}",
          "={{ $json.message }}",
          "user",
          "={{ new Date().toISOString() }}"
        ]
      }
    },
    {
      "name": "Generate Response",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const userMessage = $json.message;\nconst sessionId = $json.sessionId;\n\n// Lógica de resposta baseada no histórico\nlet response = 'Obrigado pela sua mensagem! Como posso ajudar?';\n\nreturn {\n  sessionId,\n  response,\n  sender: 'agent',\n  created_at: new Date().toISOString()\n};"
      }
    },
    {
      "name": "Save Agent Response",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "insert",
        "table": "chat_messages",
        "columns": [
          "session_id",
          "message",
          "sender",
          "created_at"
        ],
        "values": [
          "={{ $json.sessionId }}",
          "={{ $json.response }}",
          "={{ $json.sender }}",
          "={{ $json.created_at }}"
        ]
      }
    },
    {
      "name": "Format Final Response",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const response = $('Generate Response').first().json.response;\nconst sessionId = $('Generate Response').first().json.sessionId;\n\nreturn {\n  success: true,\n  data: {\n    response,\n    sessionId,\n    sessionComplete: false,\n    metadata: {\n      savedToDatabase: true,\n      processedAt: new Date().toISOString()\n    }\n  }\n};"
      }
    }
  ]
}
```

### Exemplo 4: Validação e Tratamento de Erros

```json
{
  "name": "Chat with Validation",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook"
    },
    {
      "name": "Validate Input",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": [
          {
            "leftValue": "={{ $json.message }}",
            "operation": "isNotEmpty"
          },
          {
            "leftValue": "={{ $json.sessionId }}",
            "operation": "isNotEmpty"
          }
        ],
        "combineOperation": "all"
      }
    },
    {
      "name": "Process Valid Message",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const message = $json.message.trim();\nconst sessionId = $json.sessionId;\n\n// Validações adicionais\nif (message.length > 1000) {\n  throw new Error('Mensagem muito longa');\n}\n\nif (message.length < 1) {\n  throw new Error('Mensagem vazia');\n}\n\n// Sanitização básica\nconst sanitizedMessage = message.replace(/<[^>]*>/g, '');\n\nreturn {\n  success: true,\n  data: {\n    response: `Recebi sua mensagem: \"${sanitizedMessage}\". Como posso ajudar?`,\n    sessionId,\n    sessionComplete: false\n  }\n};"
      }
    },
    {
      "name": "Handle Invalid Input",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "return {\n  success: false,\n  error: {\n    type: 'VALIDATION_ERROR',\n    message: 'Dados de entrada inválidos',\n    details: 'Mensagem e sessionId são obrigatórios'\n  }\n};"
      }
    },
    {
      "name": "Handle Processing Error",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const error = $json.error || 'Erro desconhecido';\n\nreturn {\n  success: false,\n  error: {\n    type: 'PROCESSING_ERROR',\n    message: 'Erro ao processar mensagem',\n    details: error.toString()\n  }\n};"
      }
    }
  ]
}
```

## Configurações Avançadas

### Autenticação

Para adicionar autenticação ao webhook:

```json
{
  "name": "Webhook with Auth",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "path": "secure-chat",
    "httpMethod": "POST",
    "authentication": "headerAuth",
    "headerAuth": {
      "name": "Authorization",
      "value": "Bearer YOUR_SECRET_TOKEN"
    }
  }
}
```

### Rate Limiting

Implementar rate limiting no workflow:

```javascript
// Node: Function - Rate Limiting
const sessionId = $json.sessionId;
const now = Date.now();

// Verificar cache de rate limiting (usar Redis ou similar)
const lastRequest = global.rateLimitCache?.[sessionId] || 0;
const timeDiff = now - lastRequest;

if (timeDiff < 1000) { // 1 segundo entre mensagens
  throw new Error('Rate limit exceeded');
}

// Atualizar cache
if (!global.rateLimitCache) {
  global.rateLimitCache = {};
}
global.rateLimitCache[sessionId] = now;

return $json;
```

### Logging e Monitoramento

```javascript
// Node: Function - Logging
const logData = {
  timestamp: new Date().toISOString(),
  sessionId: $json.sessionId,
  message: $json.message,
  type: $json.type,
  userAgent: $json.metadata?.userAgent,
  ip: $json.metadata?.ip
};

// Log para sistema externo (webhook, database, etc.)
console.log('Chat message received:', logData);

return $json;
```

## Testes e Debug

### Testando Webhooks

1. Use o exemplo de integração no sistema
2. Verifique logs do n8n
3. Use ferramentas como Postman para testes manuais

### Exemplo de Teste Manual

```bash
curl -X POST https://your-n8n.com/webhook/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Olá, teste!",
    "sessionId": "test-123",
    "type": "public",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }'
```

### Debug Common Issues

1. **Webhook não responde**
   - Verificar se o workflow está ativo
   - Confirmar URL do webhook
   - Verificar logs de erro no n8n

2. **Resposta em formato incorreto**
   - Validar estrutura JSON de resposta
   - Verificar se todos os campos obrigatórios estão presentes

3. **Timeout**
   - Otimizar processamento no workflow
   - Implementar processamento assíncrono se necessário

## Boas Práticas

### Segurança

- Use HTTPS sempre
- Implemente autenticação
- Valide e sanitize todas as entradas
- Implemente rate limiting
- Log atividades suspeitas

### Performance

- Mantenha workflows simples e eficientes
- Use cache quando apropriado
- Implemente timeout adequado
- Monitore uso de recursos

### Manutenibilidade

- Documente workflows complexos
- Use nomes descritivos para nodes
- Implemente tratamento de erro robusto
- Mantenha logs detalhados

### Escalabilidade

- Use processamento assíncrono para operações longas
- Implemente queue para alto volume
- Considere load balancing
- Monitore métricas de performance

## Troubleshooting

### Problemas Comuns

| Problema | Causa Provável | Solução |
|----------|----------------|---------|
| Webhook não recebe dados | URL incorreta | Verificar configuração de URL |
| Resposta não chega ao chat | Formato de resposta incorreto | Validar estrutura JSON |
| Timeout | Processamento muito lento | Otimizar workflow |
| Erro 500 | Erro no código do workflow | Verificar logs e debug |

### Logs Úteis

```javascript
// Adicionar em nodes de função para debug
console.log('Input data:', JSON.stringify($json, null, 2));
console.log('Processing step X completed');
console.log('Output data:', JSON.stringify(result, null, 2));
```

## Recursos Adicionais

- [Documentação oficial n8n](https://docs.n8n.io/)
- [Exemplos de workflows](https://n8n.io/workflows/)
- [Comunidade n8n](https://community.n8n.io/)

## Suporte

Para suporte adicional:
1. Consulte a documentação do sistema de chat
2. Verifique exemplos no código
3. Entre em contato com a equipe de desenvolvimento
