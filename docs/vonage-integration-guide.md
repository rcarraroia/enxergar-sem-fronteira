# Guia de Integração Vonage - SMS e WhatsApp

## Visão Geral

A Vonage (anteriormente Nexmo) oferece APIs robustas para envio de SMS e WhatsApp Business. Este guia detalha como obter as credenciais necessárias e implementar a integração.

## 🔑 Credenciais Necessárias

### Para SMS (Vonage SMS API)
- **API Key**: Chave de identificação da aplicação
- **API Secret**: Chave secreta para autenticação
- **From Number**: Número ou nome do remetente (opcional)

### Para WhatsApp (Vonage Messages API)
- **Application ID**: ID da aplicação Vonage
- **Private Key**: Chave privada JWT para autenticação
- **WhatsApp Number**: Número WhatsApp Business aprovado

## 📋 Como Encontrar as Credenciais no Painel Vonage

### 1. Acessar o Dashboard
1. Acesse [dashboard.nexmo.com](https://dashboard.nexmo.com)
2. Faça login com sua conta Vonage
3. Você será direcionado para o dashboard principal

### 2. Credenciais SMS (API Key & Secret)

**Localização**: Dashboard Principal
```
Dashboard > Settings > API Settings
```

**Passos**:
1. No dashboard principal, procure por **"API Settings"** no menu lateral
2. Ou vá diretamente em **Settings > API Settings**
3. Você verá:
   - **API Key**: String alfanumérica (ex: `a1b2c3d4`)
   - **API Secret**: String longa (ex: `AbCdEfGhIjKlMnOp`)

**Captura de Tela Localização**:
```
┌─────────────────────────────────────┐
│ Vonage Dashboard                    │
├─────────────────────────────────────┤
│ 📊 Overview                         │
│ 📱 Numbers                          │
│ 💬 Messages                         │
│ ⚙️  Settings                        │ ← Clique aqui
│   └── API Settings                  │ ← Depois aqui
│ 📈 Analytics                        │
└─────────────────────────────────────┘
```

### 3. Números de Envio (From Numbers)

**Para SMS**:
```
Dashboard > Numbers > Your Numbers
```

**Passos**:
1. Vá em **Numbers > Your Numbers**
2. Veja os números disponíveis para envio
3. Ou use um **Sender ID** personalizado (ex: "ENXERGAR")

### 4. Credenciais WhatsApp (Messages API)

**Localização**: Applications
```
Dashboard > Applications > Create Application
```

**Passos para Configurar**:

1. **Criar Aplicação**:
   ```
   Dashboard > Applications > Create Application
   ```

2. **Configurar Capabilities**:
   - Marque **"Messages"**
   - Configure webhook URLs
   - Gere chave privada

3. **Obter Credenciais**:
   - **Application ID**: Visível na lista de aplicações
   - **Private Key**: Baixar arquivo `.key` ou copiar conteúdo

4. **Configurar WhatsApp**:
   ```
   Dashboard > Messages > WhatsApp
   ```
   - Conectar número WhatsApp Business
   - Aguardar aprovação do Facebook

## 🛠️ Variáveis de Ambiente Necessárias

Adicione estas variáveis no seu projeto:

```bash
# SMS via Vonage
VONAGE_API_KEY=sua_api_key_aqui
VONAGE_API_SECRET=sua_api_secret_aqui
VONAGE_FROM_NUMBER=ENXERGAR  # ou seu número

# WhatsApp via Vonage (Messages API)
VONAGE_APPLICATION_ID=sua_application_id
VONAGE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
sua_private_key_aqui
-----END PRIVATE KEY-----"
VONAGE_WHATSAPP_NUMBER=5511999999999
```

## 📱 Implementação SMS

### Edge Function: send-sms

```typescript
// supabase/functions/send-sms/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const VONAGE_API_KEY = Deno.env.get('VONAGE_API_KEY')
const VONAGE_API_SECRET = Deno.env.get('VONAGE_API_SECRET')
const VONAGE_FROM_NUMBER = Deno.env.get('VONAGE_FROM_NUMBER') || 'ENXERGAR'

// SMS sending function
async function sendSMS({ to, message }: { to: string; message: string }) {
  const params = new URLSearchParams({
    api_key: VONAGE_API_KEY!,
    api_secret: VONAGE_API_SECRET!,
    to,
    from: VONAGE_FROM_NUMBER,
    text: message,
    type: 'unicode'
  })
  
  const res = await fetch('https://rest.nexmo.com/sms/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  })

  const result = await res.json()
  
  if (result.messages?.[0]?.status === '0') {
    return { success: true, messageId: result.messages[0]['message-id'] }
  }
  
  throw new Error(result.messages?.[0]?.['error-text'] || 'SMS failed')
}
```

## 📲 Implementação WhatsApp (Vonage Messages API)

### Edge Function: send-whatsapp-vonage

```typescript
// supabase/functions/send-whatsapp-vonage/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const VONAGE_APPLICATION_ID = Deno.env.get('VONAGE_APPLICATION_ID')
const VONAGE_PRIVATE_KEY = Deno.env.get('VONAGE_PRIVATE_KEY')
const VONAGE_WHATSAPP_NUMBER = Deno.env.get('VONAGE_WHATSAPP_NUMBER')

// JWT generation for Vonage
async function generateJWT() {
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    application_id: VONAGE_APPLICATION_ID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    jti: crypto.randomUUID()
  }
  
  // Implement JWT signing with RS256
  // (Simplified - use proper JWT library in production)
  return 'jwt_token_here'
}

// WhatsApp sending function
async function sendWhatsApp({ to, message }: { to: string; message: string }) {
  const jwt = await generateJWT()
  
  const res = await fetch('https://api.nexmo.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: VONAGE_WHATSAPP_NUMBER,
      to,
      message_type: 'text',
      text: message,
      channel: 'whatsapp'
    })
  })

  if (res.ok) {
    const result = await res.json()
    return { success: true, messageId: result.message_uuid }
  }
  
  throw new Error('WhatsApp send failed')
}
```

## 🔧 Configuração do Banco de Dados

Atualize a tabela para suportar SMS:

```sql
-- Adicionar SMS como tipo de template
ALTER TABLE notification_templates 
DROP CONSTRAINT notification_templates_type_check;

ALTER TABLE notification_templates 
ADD CONSTRAINT notification_templates_type_check 
CHECK (type IN ('email', 'whatsapp', 'sms'));

-- Inserir templates padrão SMS
INSERT INTO notification_templates (name, type, content, is_active) VALUES
('lembrete_sms_24h', 'sms', 
'🔔 Lembrete ENXERGAR: {{patient_name}}, você tem atendimento amanhã ({{event_date}}) às {{event_time}} em {{event_location}}. Chegue 30min antes. Info: {{event_address}}', 
true),

('confirmacao_sms', 'sms',
'✅ ENXERGAR: {{patient_name}}, sua inscrição foi confirmada! {{event_title}} em {{event_date}} às {{event_time}}. Local: {{event_location}}. Chegue 30min antes.',
true);
```

## 🎯 Integração no Sistema

### 1. Atualizar trigger-reminders

```typescript
// Adicionar SMS ao processo de envio
if (smsTemplate && patient.telefone) {
  const { error: smsError } = await supabase.functions.invoke('send-sms', {
    body: {
      templateName: `lembrete_sms_${reminderType}`,
      templateData,
      recipientPhone: patient.telefone,
      recipientName: patient.nome
    }
  })
  
  if (smsError) {
    console.error(`❌ SMS error for ${patient.telefone}:`, smsError)
  } else {
    console.log(`✅ SMS sent to ${patient.telefone}`)
  }
}
```

### 2. Atualizar Frontend

```typescript
// Adicionar SMS tab no NotificationTemplatesCard
const tabs = [
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sms', label: 'SMS' }  // Nova aba
]

// Atualizar validação para SMS
const validateTemplate = (template: NotificationTemplateInput) => {
  // SMS não precisa de subject
  if (template.type === 'sms' && template.content.length > 1600) {
    return ['SMS deve ter no máximo 1600 caracteres']
  }
  // ... outras validações
}
```

## 📊 Custos e Limites

### SMS
- **Custo**: ~$0.05 por SMS no Brasil
- **Limite**: 1600 caracteres (concatenação automática)
- **Entrega**: Quase instantânea

### WhatsApp
- **Custo**: ~$0.02 por mensagem no Brasil
- **Limite**: 4096 caracteres
- **Requisitos**: Número WhatsApp Business aprovado

## 🧪 Testes

### Testar SMS
```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-sms \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "lembrete_sms_24h",
    "templateData": {
      "patient_name": "João Silva",
      "event_date": "22/01/2025",
      "event_time": "14:00",
      "event_location": "Clínica Central"
    },
    "recipientPhone": "5511999999999",
    "testMode": true
  }'
```

### Testar WhatsApp
```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-whatsapp-vonage \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "lembrete_whatsapp_24h",
    "templateData": {
      "patient_name": "Maria Santos",
      "event_title": "Consulta Oftalmológica"
    },
    "recipientPhone": "5511888888888",
    "testMode": true
  }'
```

## 🚀 Deploy

1. **Configurar variáveis de ambiente**:
```bash
supabase secrets set VONAGE_API_KEY=sua_key
supabase secrets set VONAGE_API_SECRET=sua_secret
supabase secrets set VONAGE_FROM_NUMBER=ENXERGAR
```

2. **Deploy das funções**:
```bash
supabase functions deploy send-sms
supabase functions deploy send-whatsapp-vonage
```

3. **Aplicar migração do banco**:
```bash
supabase db push
```

## 📞 Suporte Vonage

- **Documentação**: [developer.vonage.com](https://developer.vonage.com)
- **Dashboard**: [dashboard.nexmo.com](https://dashboard.nexmo.com)
- **Suporte**: Através do dashboard ou email

## ⚠️ Considerações Importantes

1. **Compliance**: SMS e WhatsApp têm regulamentações específicas
2. **Opt-in**: Usuários devem consentir receber mensagens
3. **Rate Limits**: Vonage tem limites de envio por segundo
4. **Custos**: Monitore uso para controlar gastos
5. **Fallback**: Implemente fallback entre canais (SMS → WhatsApp → Email)

---

**Próximos Passos**:
1. Criar conta Vonage
2. Obter credenciais conforme este guia
3. Implementar Edge Functions
4. Testar em ambiente de desenvolvimento
5. Deploy em produção