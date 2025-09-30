# 🔗 Sistema de Integração N8N - Webhooks Automatizados

## 📋 Visão Geral

Sistema completo de automação via webhooks N8N que gerencia todo o ciclo de atendimento: desde a confirmação de inscrição até campanhas de doação, passando pelo controle de presenças e vendas de óculos.

## 🎯 Funcionalidades Implementadas

### ✅ Fase 1 - Sistema Base (Implementado)

#### 1. Webhook de Confirmação de Inscrição
- **Trigger**: Após inscrição bem-sucedida
- **Ação**: Envia confirmação via WhatsApp
- **Status**: ✅ Implementado e integrado

#### 2. Interface de Controle de Eventos
- **Localização**: `/admin/event-control` ou `/admin-v2/event-control`
- **Funcionalidades**:
  - Seleção de evento por data
  - Lista de inscritos com filtros
  - Confirmação de presença
  - Registro de compra de óculos
  - Finalização de atendimento
- **Status**: ✅ Implementado

#### 3. Extensão do Banco de Dados
- **Tabela**: `registrations` estendida com novos campos
- **Campos adicionados**:
  - `attendance_confirmed`, `attendance_confirmed_at`
  - `purchased_glasses`, `glasses_purchase_amount`
  - `process_completed`, `completed_at`
  - `attended_by`
- **Status**: ✅ Migração criada (aguardando aplicação)

#### 4. Sistema de Webhooks
- **WebhookService**: Classe principal para envio de webhooks
- **Tipos**: Confirmação, Entrega, Doação (agendada)
- **Características**: Não-bloqueante, retry automático, logging
- **Status**: ✅ Implementado

### ⏳ Fase 2 - Sistema Avançado (Planejado)

#### 1. Sistema de Agendamento Real
- **Funcionalidade**: Agendamento de webhooks com delay de 48h
- **Implementação**: Job scheduler + tabela `scheduled_webhooks`
- **Status**: 📋 Planejado

#### 2. Avisos sobre Novos Eventos
- **Funcionalidade**: Reengajamento de pacientes anteriores
- **Interface**: Seleção de público-alvo e templates
- **Status**: 📋 Planejado

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Formulário    │───▶│    Supabase      │───▶│   Webhook N8N   │
│   Inscrição     │    │   (registrations)│    │  (Confirmação)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Interface     │───▶│   Atualização    │───▶│   Webhook N8N   │
│   Controle      │    │    Campos        │    │   (Entrega)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Finalização    │───▶│   Webhook N8N   │
                       │   (48h delay)    │    │   (Doação)      │
                       └──────────────────┘    └─────────────────┘
```

## 🚀 Como Usar

### 1. Aplicar Migração do Banco
```sql
-- Execute no Supabase Dashboard
-- Arquivo: supabase/migrations/20250928000001_add_event_control_fields_to_registrations.sql
```

### 2. Configurar Variáveis de Ambiente
```bash
# URLs dos webhooks N8N
VITE_WEBHOOK_CONFIRMATION_URL=https://n8n.example.com/webhook/confirmacao-inscricao
VITE_WEBHOOK_DELIVERY_URL=https://n8n.example.com/webhook/entrega-oculos
VITE_WEBHOOK_DONATION_URL=https://n8n.example.com/webhook/campanha-doacao

# Configurações de timing
WEBHOOK_DONATION_DELAY_HOURS=48
WEBHOOK_TIMEOUT_MS=5000
WEBHOOK_RETRY_MAX_ATTEMPTS=3
```

### 3. Acessar Interface de Controle
1. Faça login como administrador
2. Acesse `/admin/event-control`
3. Selecione o evento do dia
4. Gerencie presenças e vendas

## 📁 Estrutura de Arquivos

```
src/
├── services/
│   └── WebhookService.ts              # Serviço principal de webhooks
├── hooks/admin-v2/
│   └── useEventControl.ts             # Hooks para controle de eventos
├── pages/admin-v2/EventControl/
│   ├── index.tsx                      # Página principal
│   └── components/
│       ├── EventSelector.tsx          # Seletor de eventos
│       ├── RegistrationList.tsx       # Lista de inscritos
│       ├── RegistrationCard.tsx       # Card individual
│       ├── GlassesModal.tsx          # Modal de óculos
│       ├── FilterBar.tsx             # Filtros e busca
│       └── EventStats.tsx            # Estatísticas
├── types/
│   └── webhook.ts                     # Tipos TypeScript
└── components/
    └── PatientRegistrationForm.tsx    # Formulário integrado
```

## 🔧 Componentes Principais

### WebhookService
```typescript
import { webhookService } from '@/services/WebhookService';

// Enviar webhook de confirmação
await webhookService.sendConfirmationWebhook(registrationId);

// Enviar webhook de entrega
await webhookService.sendDeliveryWebhook(registrationId, deliveryDate);

// Agendar webhook de doação
await webhookService.scheduleDonationWebhook(registrationId, baseDate);
```

### Hooks de Controle
```typescript
import {
  useEventControlRegistrations,
  useConfirmAttendance,
  useRegisterGlasses,
  useCompleteProcess
} from '@/hooks/admin-v2/useEventControl';

// Buscar registros do evento
const { data: registrations } = useEventControlRegistrations(eventDateId);

// Confirmar presença
const confirmMutation = useConfirmAttendance();
await confirmMutation.mutateAsync({ registrationId, attendedBy });
```

## 📊 Monitoramento

### Tabela registration_notifications
Todos os webhooks são registrados com:
- `notification_type`: 'confirmation' | 'delivery' | 'donation'
- `status`: 'sent' | 'failed' | 'scheduled'
- `sent_at`: Timestamp do envio
- `message_content`: Payload enviado

### Logs do Console
```
✅ [WebhookService] Webhook de confirmação enviado: reg_123
⚠️ [WebhookService] Tentativa 2 falhou: HTTP 500
❌ [WebhookService] Webhook falhou após 3 tentativas
```

## 🔒 Segurança

### Tratamento Não-Bloqueante
- Falhas de webhook **nunca** impedem operações principais
- Inscrições continuam funcionando mesmo com N8N offline
- Interface de controle funciona independente dos webhooks

### Rate Limiting
- Máximo de 5 webhooks por minuto (configurável)
- Circuit breaker para N8N indisponível
- Retry com backoff exponencial

### Validações
- Valores monetários validados
- Datas de entrega devem ser futuras
- Presença obrigatória antes de finalizar

## 🧪 Testes

### Teste de Conectividade
```typescript
import { webhookService } from '@/services/WebhookService';

const results = await webhookService.testWebhookConnectivity();
console.log(results);
```

### Validação da Migração
```bash
python scripts/validate_migration.py
```

## 📚 Documentação Adicional

- [Guia de Migração Segura](../scripts/README_MIGRATION_SAFETY.md)
- [Variáveis de Ambiente](./webhook-environment-variables.md)
- [Especificação Técnica](../.kiro/specs/n8n-webhook-integration/)

## 🚨 Troubleshooting

### Webhook não dispara
1. Verificar variáveis de ambiente
2. Testar conectividade com N8N
3. Verificar logs na tabela `registration_notifications`

### Interface não carrega registros
1. Verificar se migração foi aplicada
2. Verificar permissões do usuário
3. Verificar console para erros

### Erro ao confirmar presença
1. Verificar se campos existem na tabela
2. Verificar se usuário tem permissão admin
3. Verificar logs do Supabase

## 🎉 Status do Projeto

| Componente | Status | Observações |
|------------|--------|-------------|
| WebhookService | ✅ Completo | Pronto para uso |
| Interface de Controle | ✅ Completo | Todas as funcionalidades |
| Migração do Banco | ⚠️ Pendente | Aguardando aplicação manual |
| Webhook Confirmação | ✅ Integrado | Funcionando no formulário |
| Sistema de Agendamento | 📋 Fase 2 | Implementação futura |
| Avisos de Eventos | 📋 Fase 2 | Implementação futura |

## 👥 Próximos Passos

1. **Aplicar migração** em momento de baixo tráfego
2. **Configurar URLs** dos webhooks N8N
3. **Testar fluxo completo** em ambiente de desenvolvimento
4. **Treinar equipe** na nova interface
5. **Monitorar métricas** após deploy

---

**Desenvolvido com ❤️ para Enxergar Sem Fronteira**
