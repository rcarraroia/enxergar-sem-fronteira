# Guia do Desenvolvedor - Templates de Notificação

## Arquitetura do Sistema

### Visão Geral
O sistema de Templates de Notificação é composto por:
- **Frontend**: Interface administrativa em React/TypeScript
- **Backend**: Edge Functions do Supabase
- **Database**: PostgreSQL com RLS (Row Level Security)
- **Processamento**: Engine de substituição de variáveis

### Componentes Principais

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Admin UI      │    │  Edge Functions  │    │   Database      │
│                 │    │                  │    │                 │
│ - TemplateForm  │◄──►│ - trigger-       │◄──►│ - templates     │
│ - TemplatesList │    │   reminders      │    │ - patients      │
│ - Preview       │    │ - send-email     │    │ - events        │
│                 │    │ - send-whatsapp  │    │ - registrations │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Estrutura do Banco de Dados

### Tabela: notification_templates

```sql
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'whatsapp')),
  subject VARCHAR(200), -- Apenas para email
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Políticas RLS

```sql
-- Apenas admins podem gerenciar templates
CREATE POLICY "Admin users can manage notification templates"
ON notification_templates
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' LIKE '%@admin.enxergar%'
);
```

### Índices

```sql
CREATE INDEX idx_notification_templates_type_active 
ON notification_templates(type, is_active);

CREATE INDEX idx_notification_templates_name 
ON notification_templates(name);
```

## Edge Functions

### 1. trigger-reminders

**Endpoint**: `/functions/v1/trigger-reminders`

**Propósito**: Inicia o processo de envio de lembretes

**Autenticação**: Bearer token (admin apenas)

**Payload**:
```typescript
interface ReminderRequest {
  type: 'reminder' | 'confirmation'
  timestamp: string
  eventId?: string
  testMode?: boolean
}
```

**Fluxo**:
1. Valida autenticação admin
2. Busca eventos dos próximos dias
3. Busca registrações confirmadas
4. Para cada registração:
   - Busca templates ativos
   - Chama send-email e send-whatsapp
   - Registra logs

### 2. send-email

**Endpoint**: `/functions/v1/send-email`

**Propósito**: Envia emails usando templates do banco

**Payload**:
```typescript
interface EmailRequest {
  templateId?: string
  templateName?: string
  templateData: Record<string, string>
  recipientEmail: string
  recipientName: string
  testMode?: boolean
}
```

**Integração**: Resend API

### 3. send-whatsapp

**Endpoint**: `/functions/v1/send-whatsapp`

**Propósito**: Envia mensagens WhatsApp usando templates

**Payload**:
```typescript
interface WhatsAppRequest {
  templateId?: string
  templateName?: string
  templateData: Record<string, string>
  recipientPhone: string
  recipientName: string
  testMode?: boolean
}
```

**Integração**: Meta WhatsApp Business API

## Sistema de Variáveis

### Engine de Processamento

Localizado em `src/utils/templateProcessor.ts`:

```typescript
// Substituição simples
const VARIABLE_REGEX = /\{\{([^}]+)\}\}/g

// Blocos condicionais
const CONDITIONAL_REGEX = /\{\{#([^}]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g

function substituteVariables(content: string, data: Record<string, string>): string {
  // Processa condicionais primeiro
  let processed = processConditionals(content, data)
  
  // Depois substitui variáveis simples
  return processed.replace(VARIABLE_REGEX, (match, variable) => {
    const key = variable.trim()
    return data[key] !== undefined ? data[key] : match
  })
}
```

### Variáveis Disponíveis

```typescript
export const AVAILABLE_VARIABLES = {
  // Paciente
  patient_name: 'Nome completo do paciente',
  patient_email: 'Email do paciente',
  
  // Evento
  event_title: 'Título do evento',
  event_date: 'Data do evento (DD/MM/YYYY)',
  event_time: 'Horário (HH:MM - HH:MM)',
  event_location: 'Nome do local',
  event_address: 'Endereço completo',
  event_city: 'Cidade',
  
  // Sistema
  confirmation_link: 'Link para confirmação',
  unsubscribe_link: 'Link para descadastro'
}
```

### Busca de Dados

Módulo `supabase/functions/_shared/dataFetcher.ts`:

```typescript
// Busca dados por registration ID
export async function fetchTemplateVariables(
  supabase: SupabaseClient,
  registrationId: string,
  options: { baseUrl?: string; includeLinks?: boolean } = {}
): Promise<TemplateVariableData | null>

// Busca dados separadamente
export async function fetchTemplateVariablesSeparate(
  supabase: SupabaseClient,
  patientId: string,
  eventDateId: string,
  options: { baseUrl?: string; includeLinks?: boolean } = {}
): Promise<TemplateVariableData | null>
```

## Frontend - Componentes React

### Estrutura de Componentes

```
src/components/admin/
├── NotificationTemplatesCard.tsx    # Card principal
├── TemplatesList.tsx               # Lista de templates
├── TemplateForm.tsx                # Formulário de edição
├── TemplatePreview.tsx             # Preview em tempo real
└── VariablesHelper.tsx             # Helper de variáveis
```

### Hooks Customizados

```typescript
// Gerenciamento de templates
const useNotificationTemplates = () => {
  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: fetchTemplates
  })
  
  const createTemplate = useMutation({
    mutationFn: createTemplateApi,
    onSuccess: () => queryClient.invalidateQueries(['notification-templates'])
  })
  
  return { templates, isLoading, error, createTemplate, ... }
}

// Preview de templates
const useTemplatePreview = (template: NotificationTemplateInput) => {
  return useQuery({
    queryKey: ['template-preview', template],
    queryFn: () => processTemplate(template),
    enabled: !!template.content
  })
}
```

### Validação

```typescript
const templateValidationRules: TemplateValidationRules = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9_-]+$/
  },
  subject: {
    required: (type: string) => type === 'email',
    maxLength: 200
  },
  content: {
    required: true,
    minLength: 10,
    maxLength: 5000
  }
}
```

## API de Integração

### Endpoints REST (Supabase)

```typescript
// Listar templates
GET /rest/v1/notification_templates
?select=*
&type=eq.email
&is_active=eq.true
&order=created_at.desc

// Criar template
POST /rest/v1/notification_templates
{
  "name": "novo_template",
  "type": "email",
  "subject": "Assunto",
  "content": "Conteúdo {{patient_name}}",
  "is_active": true
}

// Atualizar template
PATCH /rest/v1/notification_templates?id=eq.{id}
{
  "subject": "Novo assunto",
  "content": "Novo conteúdo"
}

// Deletar template
DELETE /rest/v1/notification_templates?id=eq.{id}
```

### Autenticação

```typescript
// Headers obrigatórios
const headers = {
  'Authorization': `Bearer ${supabaseToken}`,
  'apikey': supabaseAnonKey,
  'Content-Type': 'application/json'
}
```

## Testes

### Estrutura de Testes

```
src/
├── utils/__tests__/
│   └── templateProcessor.test.ts    # Testes unitários
├── components/admin/__tests__/
│   └── NotificationTemplates.test.tsx # Testes integração
└── e2e/
    └── notification-templates.spec.ts  # Testes E2E
```

### Executar Testes

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

## Deployment

### Variáveis de Ambiente

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Email (Resend)
RESEND_API_KEY=your-resend-key

# WhatsApp (Meta)
WHATSAPP_API_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id
```

### Migração do Banco

```bash
# Aplicar migrações
supabase db push

# Verificar status
supabase db diff
```

### Deploy das Edge Functions

```bash
# Deploy todas as funções
supabase functions deploy

# Deploy função específica
supabase functions deploy trigger-reminders
supabase functions deploy send-email
supabase functions deploy send-whatsapp
```

## Monitoramento

### Logs das Edge Functions

```bash
# Visualizar logs em tempo real
supabase functions logs trigger-reminders --follow

# Logs específicos
supabase functions logs send-email --filter="ERROR"
```

### Métricas

```sql
-- Templates mais usados
SELECT name, COUNT(*) as usage_count
FROM system_settings 
WHERE key LIKE '%_sent'
GROUP BY name
ORDER BY usage_count DESC;

-- Erros de envio
SELECT value->>'error' as error_message, COUNT(*)
FROM system_settings 
WHERE key = 'last_error'
GROUP BY error_message;
```

## Extensibilidade

### Adicionando Novas Variáveis

1. **Atualizar constantes**:
```typescript
// src/constants/templateVariables.ts
export const AVAILABLE_VARIABLES = {
  ...existing,
  new_variable: 'Descrição da nova variável'
}
```

2. **Atualizar dataFetcher**:
```typescript
// supabase/functions/_shared/dataFetcher.ts
export interface TemplateVariableData {
  ...existing,
  new_variable: string
}
```

3. **Atualizar buildTemplateVariables**:
```typescript
const variables: TemplateVariableData = {
  ...existing,
  new_variable: computeNewVariable(data)
}
```

### Adicionando Novos Tipos de Template

1. **Atualizar schema**:
```sql
ALTER TABLE notification_templates 
DROP CONSTRAINT notification_templates_type_check;

ALTER TABLE notification_templates 
ADD CONSTRAINT notification_templates_type_check 
CHECK (type IN ('email', 'whatsapp', 'sms'));
```

2. **Criar nova Edge Function**:
```typescript
// supabase/functions/send-sms/index.ts
// Implementar lógica específica para SMS
```

3. **Atualizar frontend**:
```typescript
// Adicionar nova aba no componente
// Implementar validações específicas
```

## Troubleshooting

### Problemas Comuns

**Template não encontrado**:
- Verificar se está ativo (`is_active = true`)
- Confirmar nome exato
- Verificar políticas RLS

**Variáveis não substituídas**:
- Verificar sintaxe: `{{variable}}` (não `{variable}`)
- Confirmar se variável existe nos dados
- Verificar logs da Edge Function

**Erro de permissão**:
- Verificar se usuário tem email `@admin.enxergar`
- Confirmar token de autenticação
- Verificar políticas RLS

### Debug

```typescript
// Habilitar logs detalhados
console.log('Template data:', templateData)
console.log('Processed content:', processedContent)
console.log('Variables found:', extractVariables(content))
```

## Contribuição

### Padrões de Código

- **TypeScript**: Tipagem estrita
- **ESLint**: Configuração padrão
- **Prettier**: Formatação automática
- **Conventional Commits**: Mensagens padronizadas

### Pull Requests

1. Criar branch feature: `feature/template-enhancement`
2. Implementar mudanças com testes
3. Atualizar documentação
4. Criar PR com descrição detalhada

---

**Versão**: 1.0  
**Última Atualização**: Janeiro 2025  
**Mantenedor**: Equipe Enxergar sem Fronteiras