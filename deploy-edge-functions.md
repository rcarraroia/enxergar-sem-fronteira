# Deploy Manual das Edge Functions

Como você já tem os secrets configurados no Supabase, agora precisa fazer o deploy das funções.

## Opção 1: Deploy via Interface Web (Recomendado)

### 1. Acesse o Supabase Dashboard
- Vá para: https://supabase.com/dashboard/project/uoermayoxjaaomzjmuhp
- Clique em "Edge Functions" na sidebar

### 2. Deploy da função send-email
1. Clique em "Create Function" ou edite se já existir
2. Nome: `send-email`
3. Cole o código completo de `supabase/functions/send-email/index.ts`
4. Clique em "Deploy"

### 3. Deploy da função send-sms
1. Clique em "Create Function" ou edite se já existir
2. Nome: `send-sms`
3. Cole o código completo de `supabase/functions/send-sms/index.ts`
4. Clique em "Deploy"

## Opção 2: Instalar CLI e fazer deploy via terminal

Se preferir usar o terminal, instale o Supabase CLI:

```bash
# Para Windows (usando Chocolatey)
choco install supabase

# Ou baixe o executável diretamente:
# https://github.com/supabase/cli/releases

# Depois faça login e deploy
supabase login
supabase functions deploy send-email
supabase functions deploy send-sms
```

## Verificar se funcionou

Após o deploy, teste as funções:

### Teste send-email:
```bash
curl -X POST 'https://uoermayoxjaaomzjmuhp.supabase.co/functions/v1/send-email' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZXJtYXlveGphYW9temptdWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjIwMjMsImV4cCI6MjA3MDY5ODAyM30.6MC0Vw5ZSmtvUc060hxnk20MrzXB-PhPdTVSPDoshTc' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "seu-email@teste.com",
    "subject": "Teste Edge Function",
    "content": "Mensagem de teste da Edge Function"
  }'
```

### Teste send-sms:
```bash
curl -X POST 'https://uoermayoxjaaomzjmuhp.supabase.co/functions/v1/send-sms' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZXJtYXlveGphYW9temptdWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjIwMjMsImV4cCI6MjA3MDY5ODAyM30.6MC0Vw5ZSmtvUc060hxnk20MrzXB-PhPdTVSPDoshTc' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "+5511999999999",
    "text": "Teste SMS da Edge Function"
  }'
```

## Status Atual

✅ **Secrets configurados** - RESEND_API_KEY, VONAGE_API_KEY, VONAGE_API_SECRET
✅ **Código refatorado** - Frontend não expõe mais chaves sensíveis
✅ **Edge Functions criadas** - Arquivos prontos para deploy
🔄 **Deploy pendente** - Precisa fazer upload das funções

Após o deploy, a refatoração de segurança estará 100% completa!