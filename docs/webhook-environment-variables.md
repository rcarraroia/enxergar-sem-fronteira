# Variáveis de Ambiente - Sistema de Webhooks N8N

## 📋 Visão Geral

Este documento descreve as variáveis de ambiente necessárias para o sistema de webhooks N8N que automatiza notificações via WhatsApp para confirmação de inscrições, entrega de óculos e campanhas de doação.

## 🔗 URLs dos Webhooks

### VITE_WEBHOOK_CONFIRMATION_URL
- **Descrição**: URL do webhook N8N para confirmação de inscrição
- **Quando é usado**: Disparado automaticamente após inscrição bem-sucedida
- **Exemplo**: `https://n8n.example.com/webhook/confirmacao-inscricao`
- **Obrigatório**: Não (se não configurado, webhook é desabilitado)

### VITE_WEBHOOK_DELIVERY_URL
- **Descrição**: URL do webhook N8N para notificação de entrega de óculos
- **Quando é usado**: Disparado quando data de entrega é definida
- **Exemplo**: `https://n8n.example.com/webhook/entrega-oculos`
- **Obrigatório**: Não (se não configurado, webhook é desabilitado)

### VITE_WEBHOOK_DONATION_URL
- **Descrição**: URL do webhook N8N para campanha de doação
- **Quando é usado**: Disparado 48h após entrega ou finalização sem compra
- **Exemplo**: `https://n8n.example.com/webhook/campanha-doacao`
- **Obrigatório**: Não (se não configurado, webhook é desabilitado)

### VITE_WEBHOOK_EVENT_REMINDER_URL
- **Descrição**: URL do webhook N8N para avisos sobre novos eventos
- **Quando é usado**: Funcionalidade futura para reengajamento
- **Exemplo**: `https://n8n.example.com/webhook/lembrete-eventos`
- **Obrigatório**: Não (funcionalidade futura)

## ⏰ Configurações de Timing

### WEBHOOK_DONATION_DELAY_HOURS
- **Descrição**: Horas de delay antes de disparar webhook de doação
- **Valor padrão**: `48`
- **Exemplo**: `48` (48 horas após entrega/finalização)
- **Obrigatório**: Não

### WEBHOOK_TIMEOUT_MS
- **Descrição**: Timeout para requisições de webhook em milissegundos
- **Valor padrão**: `5000`
- **Exemplo**: `5000` (5 segundos)
- **Obrigatório**: Não

### WEBHOOK_RETRY_MAX_ATTEMPTS
- **Descrição**: Número máximo de tentativas de retry
- **Valor padrão**: `3`
- **Exemplo**: `3`
- **Obrigatório**: Não

### WEBHOOK_CIRCUIT_BREAKER_TIMEOUT_MINUTES
- **Descrição**: Tempo em minutos para parar tentativas se N8N estiver indisponível
- **Valor padrão**: `15`
- **Exemplo**: `15`
- **Obrigatório**: Não

## 🚦 Rate Limiting

### WEBHOOK_MAX_PER_MINUTE
- **Descrição**: Máximo de webhooks por minuto para evitar sobrecarga
- **Valor padrão**: `5`
- **Exemplo**: `5`
- **Obrigatório**: Não

### WEBHOOK_BATCH_SIZE
- **Descrição**: Tamanho do lote para processamento de webhooks
- **Valor padrão**: `10`
- **Exemplo**: `10`
- **Obrigatório**: Não

## 🔧 Configuração

### Desenvolvimento
```bash
# .env.local
VITE_WEBHOOK_CONFIRMATION_URL=https://n8n-dev.example.com/webhook/confirmacao-inscricao
VITE_WEBHOOK_DELIVERY_URL=https://n8n-dev.example.com/webhook/entrega-oculos
VITE_WEBHOOK_DONATION_URL=https://n8n-dev.example.com/webhook/campanha-doacao
WEBHOOK_DONATION_DELAY_HOURS=1
WEBHOOK_TIMEOUT_MS=3000
```

### Produção
```bash
# .env.production
VITE_WEBHOOK_CONFIRMATION_URL=https://n8n.enxergarsemfronteira.com/webhook/confirmacao-inscricao
VITE_WEBHOOK_DELIVERY_URL=https://n8n.enxergarsemfronteira.com/webhook/entrega-oculos
VITE_WEBHOOK_DONATION_URL=https://n8n.enxergarsemfronteira.com/webhook/campanha-doacao
WEBHOOK_DONATION_DELAY_HOURS=48
WEBHOOK_TIMEOUT_MS=5000
WEBHOOK_RETRY_MAX_ATTEMPTS=3
```

## 🔒 Segurança

- **URLs HTTPS**: Sempre use HTTPS para webhooks em produção
- **Domínio Confiável**: Configure apenas URLs do seu domínio N8N
- **Rate Limiting**: Configure limites apropriados para evitar abuso
- **Monitoramento**: Monitore logs de webhook para detectar problemas

## 🧪 Teste

Para testar a conectividade dos webhooks, use o método `testWebhookConnectivity()` do WebhookService:

```typescript
import { webhookService } from '@/services/WebhookService';

// Testar todos os webhooks
const results = await webhookService.testWebhookConnectivity();
console.log(results);
```

## 📊 Monitoramento

O sistema registra todas as tentativas de webhook na tabela `registration_notifications` com os seguintes status:

- `sent`: Webhook enviado com sucesso
- `failed`: Webhook falhou após todas as tentativas
- `scheduled`: Webhook agendado (para doação com delay)
- `pending`: Webhook pendente de envio

## 🚨 Troubleshooting

### Webhook não está sendo disparado
1. Verifique se a variável de ambiente está configurada
2. Verifique se a URL está acessível
3. Verifique os logs da tabela `registration_notifications`

### Webhook falhando
1. Verifique se o N8N está rodando
2. Verifique se a URL do webhook está correta
3. Verifique se há rate limiting ativo
4. Verifique os logs de erro no console

### Performance lenta
1. Reduza o timeout (`WEBHOOK_TIMEOUT_MS`)
2. Reduza o número de tentativas (`WEBHOOK_RETRY_MAX_ATTEMPTS`)
3. Aumente o rate limiting (`WEBHOOK_MAX_PER_MINUTE`)

## 📝 Logs

Todos os webhooks são logados com informações detalhadas:

```
✅ [WebhookService] Webhook enviado com sucesso (200)
⚠️ [WebhookService] Tentativa 2 falhou: HTTP 500: Internal Server Error
❌ [WebhookService] Webhook falhou após 3 tentativas: Connection timeout
```
