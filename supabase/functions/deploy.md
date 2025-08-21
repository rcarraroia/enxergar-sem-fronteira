# Deploy das Edge Functions

## Comandos para deploy

```bash
# Deploy da função de email
supabase functions deploy send-email

# Deploy da função de SMS
supabase functions deploy send-sms

# Deploy de todas as funções
supabase functions deploy
```

## Configuração dos Secrets no Supabase

Após o deploy, configure os seguintes secrets no painel do Supabase:

```bash
# Configurar secrets via CLI
supabase secrets set RESEND_API_KEY=your_resend_api_key_here
supabase secrets set FROM_EMAIL=noreply@enxergarsemfronteiras.com
supabase secrets set VONAGE_API_KEY=your_vonage_api_key_here
supabase secrets set VONAGE_API_SECRET=your_vonage_api_secret_here
```

Ou configure diretamente no painel do Supabase em:
Settings > Edge Functions > Secrets

## Variáveis necessárias:

- `RESEND_API_KEY`: Chave da API do Resend para envio de emails
- `FROM_EMAIL`: Email remetente padrão
- `VONAGE_API_KEY`: Chave da API do Vonage para SMS
- `VONAGE_API_SECRET`: Secret da API do Vonage para SMS

## URLs das funções:

- Email: `https://[project-id].supabase.co/functions/v1/send-email`
- SMS: `https://[project-id].supabase.co/functions/v1/send-sms`

## Teste das funções:

```bash
# Testar função de email
curl -X POST 'https://[project-id].supabase.co/functions/v1/send-email' \
  -H 'Authorization: Bearer [anon-key]' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "test@example.com",
    "subject": "Teste",
    "content": "Mensagem de teste"
  }'

# Testar função de SMS
curl -X POST 'https://[project-id].supabase.co/functions/v1/send-sms' \
  -H 'Authorization: Bearer [anon-key]' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "+5511999999999",
    "text": "Mensagem de teste SMS"
  }'
```