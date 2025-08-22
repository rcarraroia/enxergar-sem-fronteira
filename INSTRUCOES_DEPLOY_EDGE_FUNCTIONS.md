# 🚀 INSTRUÇÕES PARA DEPLOY DAS EDGE FUNCTIONS

## ⚠️ **SITUAÇÃO ATUAL**
As Edge Functions foram criadas mas **NÃO foram deployadas** ainda. Por isso o sistema de mensagens está simulando os envios.

## 📋 **PASSOS PARA ATIVAR O SISTEMA REAL**

### 1. **Deploy das Edge Functions**

```bash
# Instalar Supabase CLI (se não tiver)
npm install -g @supabase/cli

# Fazer login no Supabase
supabase login

# Navegar para o projeto
cd /caminho/para/enxergar-sem-fronteira

# Deploy das funções
supabase functions deploy send-email
supabase functions deploy send-sms
```

### 2. **Configurar Secrets no Supabase**

No painel do Supabase (https://supabase.com/dashboard):

1. Vá em **Settings** → **Edge Functions** → **Secrets**
2. Adicione os seguintes secrets:

```
RESEND_API_KEY = [sua_chave_resend_aqui]
FROM_EMAIL = noreply@enxergarsemfronteiras.com
VONAGE_API_KEY = [sua_chave_vonage_aqui]
VONAGE_API_SECRET = [seu_secret_vonage_aqui]
```

### 3. **Ativar o Sistema Real**

Após o deploy, edite os arquivos:

**`src/services/messages/providers/EmailProvider.ts`:**
- Comente a linha: `return this.simulateSend(data)`
- Descomente o bloco de código da Edge Function

**`src/services/messages/providers/SMSProvider.ts`:**
- Comente a linha: `return this.simulateSend(data)`
- Descomente o bloco de código da Edge Function

### 4. **Testar o Sistema**

1. Acesse `/admin/messages`
2. Clique em "Enviar Mensagem"
3. Preencha os dados e envie
4. Verifique se o email/SMS foi recebido

## 🔍 **VERIFICAR SE FUNCIONOU**

### Logs de Sucesso:
```
✅ [EmailProvider] Email enviado: re_xxx
✅ [SMSProvider] SMS enviado: msg_xxx
```

### Logs de Erro (se ainda simulando):
```
⚠️ [EmailProvider] Edge Functions não deployadas ainda, simulando envio
⚠️ [SMSProvider] Edge Functions não deployadas ainda, simulando envio
```

## 📁 **Arquivos das Edge Functions**

- `supabase/functions/send-email/index.ts` - Função de email
- `supabase/functions/send-sms/index.ts` - Função de SMS
- `supabase/functions/_shared/cors.ts` - Configurações CORS

## 🎯 **RESULTADO ESPERADO**

Após o deploy:
- ✅ Emails reais enviados via Resend
- ✅ SMS reais enviados via Vonage
- ✅ Chaves de API seguras no servidor
- ✅ Frontend sem chaves expostas

## ❓ **PROBLEMAS COMUNS**

1. **"API key is invalid"** → Verificar secrets no Supabase
2. **"Function not found"** → Fazer deploy das funções
3. **"CORS error"** → Verificar arquivo cors.ts

---

**Status Atual: 🟢 EMAIL ATIVO / 🟡 SMS SIMULADO**
**Email:** ✅ Edge Function deployada e funcionando
**SMS:** ⚠️ Aguardando deploy da Edge Function send-sms