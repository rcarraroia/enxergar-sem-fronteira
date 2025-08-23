# Sistema de Envio de Mensagens em Massa

## Visão Geral

O Sistema de Envio de Mensagens em Massa permite que administradores enviem mensagens por email, SMS e WhatsApp para pacientes baseado em eventos específicos. O sistema é robusto, seguro e oferece múltiplas interfaces para diferentes necessidades.

## Funcionalidades Principais

### ✅ Canais de Comunicação
- **Email** - Mensagens HTML com templates dinâmicos
- **SMS** - Mensagens de texto via Vonage
- **WhatsApp** - Mensagens via API do WhatsApp

### ✅ Seleção de Destinatários
- **Por Eventos** - Selecione um ou múltiplos eventos
- **Por Datas** - Filtre por datas específicas de eventos
- **Por Status** - Filtre por status de pacientes e inscrições
- **Por Localização** - Filtre por cidade dos eventos

### ✅ Templates Dinâmicos
- **Templates Pré-configurados** - Use templates salvos no sistema
- **Mensagens Customizadas** - Digite mensagens personalizadas
- **Variáveis Dinâmicas** - Substitua automaticamente dados do paciente/evento
- **Preview** - Visualize como ficará a mensagem final

### ✅ Segurança e Controle
- **Acesso Restrito** - Apenas administradores podem enviar
- **Modo de Teste** - Teste antes do envio real
- **Auditoria** - Todas as mensagens são registradas
- **Rate Limiting** - Controle de velocidade de envio

## Interfaces Disponíveis

### 1. Envio Rápido (`/admin/bulk-messaging?tab=quick`)
Interface simplificada para envios rápidos:
- Selecione um evento
- Escolha os canais (email, SMS, WhatsApp)
- Use template ou mensagem customizada
- Envie imediatamente

### 2. Interface Avançada (`/admin/bulk-messaging?tab=advanced`)
Interface completa com todos os recursos:
- Seleção múltipla de eventos
- Filtros avançados por status, cidade, período
- Preview detalhado de destinatários
- Relatórios completos de entrega

### 3. Card no Dashboard (`/admin`)
Acesso rápido direto do painel administrativo:
- Estatísticas resumidas
- Links para interfaces
- Acesso aos templates

## Arquitetura Técnica

### Edge Functions
- **`send-bulk-messages`** - Função principal de processamento
- **`send-email`** - Envio de emails individuais
- **`send-sms`** - Envio de SMS via Vonage
- **`send-whatsapp`** - Envio via WhatsApp

### Componentes React
- **`BulkMessageSender`** - Interface avançada completa
- **`QuickBulkSender`** - Interface simplificada
- **`BulkMessagingPage`** - Página principal com abas
- **`BulkMessagingCard`** - Card para dashboard

### Hook Personalizado
- **`useBulkMessaging`** - Gerencia estado e operações
  - `sendBulkMessages()` - Envia mensagens
  - `getRecipientsPreview()` - Preview de destinatários
  - `sendTestMessage()` - Mensagens de teste

## Variáveis Disponíveis

As seguintes variáveis podem ser usadas nos templates:

```
{patient_name}      - Nome do paciente
{patient_email}     - Email do paciente
{event_title}       - Título do evento
{event_date}        - Data do evento (formato brasileiro)
{event_time}        - Horário do evento (HH:MM - HH:MM)
{event_location}    - Local do evento
{event_address}     - Endereço completo
{event_city}        - Cidade do evento
{events_count}      - Número de eventos (se múltiplos)
{events_list}       - Lista de títulos dos eventos
```

## Como Usar

### Envio Rápido
1. Acesse `/admin/bulk-messaging`
2. Selecione a aba "Envio Rápido"
3. Escolha um evento
4. Marque os canais desejados (email, SMS, WhatsApp)
5. Selecione um template ou digite mensagem customizada
6. Clique em "Teste" para verificar
7. Clique em "Enviar Agora" para envio real

### Envio Avançado
1. Acesse `/admin/bulk-messaging`
2. Selecione a aba "Avançado"
3. Marque múltiplos eventos se necessário
4. Configure filtros avançados
5. Escolha tipos de mensagem
6. Configure template ou mensagem
7. Use "Preview" para verificar destinatários
8. Use "Teste" para validar
9. Clique em "Enviar Mensagens" para envio real

## Relatórios e Monitoramento

Após cada envio, o sistema fornece:

- **Estatísticas Gerais**
  - Total de destinatários processados
  - Número de emails enviados
  - Número de SMS enviados
  - Número de WhatsApp enviados

- **Detalhes por Destinatário**
  - Nome e contatos do paciente
  - Status de envio por canal
  - Erros específicos se houver

- **Lista de Erros**
  - Erros detalhados para troubleshooting
  - Destinatários que falharam
  - Motivos das falhas

## Segurança e Boas Práticas

### Controle de Acesso
- Apenas usuários com role `admin` podem acessar
- Verificação de autenticação em todas as operações
- Logs de auditoria para todas as ações

### Modo de Teste
- Sempre use o modo de teste primeiro
- Teste com poucos destinatários inicialmente
- Verifique templates antes do envio em massa

### Rate Limiting
- Sistema inclui delays entre envios
- Evita sobrecarga dos provedores
- Respeita limites das APIs externas

### Validação de Dados
- Validação de emails e telefones
- Verificação de templates antes do envio
- Sanitização de conteúdo para evitar XSS

## Troubleshooting

### Problemas Comuns

**Erro: "Template não encontrado"**
- Verifique se o template está ativo
- Confirme o nome exato do template
- Use mensagem customizada como alternativa

**Erro: "Nenhum destinatário encontrado"**
- Verifique filtros aplicados
- Confirme se eventos têm inscrições confirmadas
- Verifique status dos pacientes

**Falhas de Envio**
- Verifique configuração das APIs (Vonage, WhatsApp)
- Confirme dados de contato dos pacientes
- Verifique logs da Edge Function

### Logs e Debugging
- Logs detalhados nas Edge Functions
- Console do navegador para erros de frontend
- Supabase Dashboard para logs de banco

## Manutenção

### Atualizações de Templates
- Templates são gerenciados em `/admin/notification-templates`
- Mudanças são aplicadas imediatamente
- Sempre teste após alterações

### Monitoramento de Performance
- Acompanhe métricas de entrega
- Monitore tempo de processamento
- Verifique uso de recursos

### Backup e Recuperação
- Templates são salvos no banco Supabase
- Logs de envio são mantidos para auditoria
- Configurações são versionadas no código

## Roadmap Futuro

### Melhorias Planejadas
- [ ] Agendamento de envios
- [ ] Segmentação avançada de audiência
- [ ] A/B testing de templates
- [ ] Métricas de engajamento
- [ ] Integração com analytics
- [ ] Templates visuais (drag & drop)

### Integrações Futuras
- [ ] Push notifications
- [ ] Telegram
- [ ] Slack para notificações internas
- [ ] CRM integration

---

**Desenvolvido para Enxergar sem Fronteiras**
Sistema de Mensagens em Massa v1.0
Última atualização: Agosto 2025
