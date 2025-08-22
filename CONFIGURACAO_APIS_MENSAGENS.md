# 🔧 Configuração das APIs do Módulo de Mensagens

## 📧 **1. Configuração do Resend (Email)**

### Passo 1: Criar conta no Resend
1. Acesse: https://resend.com
2. Crie uma conta gratuita
3. Verifique seu email

### Passo 2: Obter API Key
1. No dashboard do Resend, vá em "API Keys"
2. Clique em "Create API Key"
3. Dê um nome (ex: "Enxergar Sem Fronteiras")
4. Copie a API Key gerada

### Passo 3: Configurar Domínio (Opcional)
1. Vá em "Domains" no dashboard
2. Adicione seu domínio (ex: enxergarsemfronteira.com.br)
3. Configure os registros DNS conforme instruções
4. Aguarde verificação

### Passo 4: Configurar no .env
```env
VITE_RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxx"
VITE_FROM_EMAIL="noreply@enxergarsemfronteira.com.br"
```

---

## 📱 **2. Configuração do Vonage (SMS)**

### Passo 1: Criar conta no Vonage
1. Acesse: https://dashboard.nexmo.com
2. Crie uma conta
3. Verifique seu telefone

### Passo 2: Obter credenciais
1. No dashboard, vá em "Getting Started"
2. Copie sua API Key e API Secret

### Passo 3: Configurar no .env
```env
VITE_VONAGE_API_KEY="xxxxxxxx"
VITE_VONAGE_API_SECRET="xxxxxxxxxxxxxxxx"
```

### Passo 4: Configurar Edge Function (Supabase)
Crie uma Edge Function no Supabase para SMS:

```typescript
// supabase/functions/send-sms/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const VONAGE_API_KEY = Deno.env.get('VONAGE_API_KEY')
const VONAGE_API_SECRET = Deno.env.get('VONAGE_API_SECRET')

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { to, text } = await req.json()

    const response = await fetch('https://rest.nexmo.com/sms/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        api_key: VONAGE_API_KEY!,
        api_secret: VONAGE_API_SECRET!,
        to: to,
        text: text,
        from: 'Enxergar'
      })
    })

    const result = await response.json()
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

---

## 💬 **3. WhatsApp (Futuro)**

### Meta Business API
```env
VITE_WHATSAPP_TOKEN="EAAxxxxxxxxxxxxxxxxxx"
VITE_WHATSAPP_PHONE_ID="xxxxxxxxxxxxxxxxxx"
```

---

## 🧪 **4. Testando as Configurações**

### Modo Simulação (Padrão)
- Sem configurar APIs, o sistema funciona em modo simulação
- Mensagens são logadas no console
- Ideal para desenvolvimento

### Modo Produção
- Configure as APIs no .env
- Reinicie o servidor de desenvolvimento
- Use o botão "Teste Rápido" no painel

### Verificação de Status
No painel de mensagens, você verá:
- ✅ **Configurado**: API configurada e funcionando
- 🔄 **Simulação**: Funcionando em modo de desenvolvimento

---

## 🔍 **5. Troubleshooting**

### Email não enviando
1. Verifique se VITE_RESEND_API_KEY está correto
2. Confirme se o domínio está verificado no Resend
3. Verifique logs no console do navegador

### SMS não enviando
1. Confirme credenciais do Vonage
2. Verifique se a Edge Function está deployada
3. Confirme formato do número de telefone (+55...)

### Variáveis de ambiente não carregando
1. Reinicie o servidor de desenvolvimento
2. Confirme que as variáveis começam com VITE_
3. Verifique se o arquivo .env está na raiz do projeto

---

## 📊 **6. Monitoramento**

### Logs de Desenvolvimento
```javascript
// No console do navegador
console.log('📧 Email enviado:', result)
console.log('📱 SMS enviado:', result)
```

### Logs de Produção
- Resend: Dashboard > Logs
- Vonage: Dashboard > SMS > Logs
- Supabase: Dashboard > Edge Functions > Logs

---

## 💰 **7. Custos Estimados**

### Resend (Email)
- **Gratuito**: 3.000 emails/mês
- **Pro**: $20/mês para 50.000 emails

### Vonage (SMS)
- **Preço**: ~$0.05 por SMS no Brasil
- **Crédito inicial**: $2 gratuitos

### Supabase (Edge Functions)
- **Gratuito**: 500.000 invocações/mês
- Suficiente para a maioria dos casos

---

## ✅ **8. Checklist de Configuração**

- [ ] Conta Resend criada
- [ ] API Key do Resend configurada
- [ ] Domínio verificado (opcional)
- [ ] Conta Vonage criada
- [ ] Credenciais Vonage configuradas
- [ ] Edge Function SMS deployada
- [ ] Variáveis de ambiente configuradas
- [ ] Servidor reiniciado
- [ ] Teste rápido executado com sucesso

---

## 🆘 **9. Suporte**

Se precisar de ajuda:
1. Verifique os logs no console
2. Teste com o "Teste Rápido"
3. Confirme configurações no .env
4. Reinicie o servidor de desenvolvimento