# Implementation Plan

## ⚠️ REGRA CRÍTICA DE PRODUÇÃO ⚠️

**SITE EM PRODUÇÃO COM INSCRIÇÕES ATIVAS - MÁXIMA CAUTELA NECESSÁRIA**

### ✅ PERMITIDO (Fase 1 - Imediata):
- Apenas ALTER TABLE com `IF NOT EXISTS` e valores padrão
- Índices simples que não afetam dados existentes
- Interface de controle (nova rota que não interfere no fluxo atual)
- Webhook de confirmação (adicionar sem modificar fluxo existente)

### ❌ PROIBIDO até após o evento atual:
- Criar/modificar políticas RLS
- Alterar Edge Functions
- Modificar triggers existentes
- Qualquer mudança em tabelas críticas (patients, events)
- Sistema de agendamento complexo

### 🔒 Backup Obrigatório:
Sempre fazer backup antes de qualquer alteração no banco:
```sql
CREATE TABLE registrations_backup_$(date) AS SELECT * FROM registrations ;
```

- [x] 1. Implementar extensão da tabela registrations


  - Criar migração SQL para adicionar novos campos na tabela registrations
  - Adicionar campos: attendance_confirmed, attendance_confirmed_at, purchased_glasses, glasses_purchase_amount, delivery_date, delivery_status, process_completed, completed_at, attended_by
  - Definir valores padrão e constraints apropriados
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 2. Criar serviço de webhook
  - [x] 2.1 Implementar WebhookService base



    - Criar classe WebhookService com métodos para os três tipos de webhook
    - Implementar tratamento de erros não-bloqueante
    - Adicionar logging para auditoria
    - _Requirements: 1.1, 1.3, 4.3_



  - [ ] 2.2 Implementar webhook de confirmação de inscrição
    - Integrar chamada webhook no fluxo de inscrição existente
    - Usar função get_registration_details() para obter dados
    - Configurar payload com registration_id, patient_name, phone, date, start_time, event_name, event_location, event_city

    - _Requirements: 1.1, 1.2, 1.4_

  - [ ] 2.3 Implementar webhooks de entrega e doação
    - Criar webhook para notificação de entrega (VITE_WEBHOOK_DELIVERY_URL)
    - Implementar sistema de agendamento para webhook de doação com delay de 48h
    - Criar tabela scheduled_webhooks para controle de timing
    - Implementar job scheduler para executar webhooks agendados


    - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [ ] 3. Criar endpoints da API para controle de eventos
  - [ ] 3.1 Implementar endpoint de listagem de registros
    - Criar GET /api/admin/events/{eventId}/registrations

    - Implementar filtros: todos, presentes, ausentes, com óculos, sem óculos
    - Adicionar busca por nome e CPF
    - Implementar paginação para performance
    - _Requirements: 3.2, 6.1, 6.2, 6.4_


  - [ ] 3.2 Implementar endpoint de confirmação de presença
    - Criar PUT /api/admin/registrations/{id}/confirm-attendance
    - Atualizar attendance_confirmed=true e attendance_confirmed_at=now()
    - Registrar attended_by com usuário logado
    - _Requirements: 3.3, 5.4_


  - [ ] 3.3 Implementar endpoint de registro de óculos
    - Criar PUT /api/admin/registrations/{id}/register-glasses
    - Validar valor positivo e data futura
    - Atualizar purchased_glasses, glasses_purchase_amount, delivery_date
    - Disparar webhook de entrega automaticamente
    - _Requirements: 3.4, 3.5, 4.1, 5.2, 5.3_

  - [ ] 3.4 Implementar endpoint de finalização de atendimento
    - Criar PUT /api/admin/registrations/{id}/complete-process
    - Validar que attendance_confirmed=true
    - Atualizar process_completed=true e completed_at=now()
    - Agendar webhook de doação para 48h depois se purchased_glasses=false
    - _Requirements: 3.6, 4.2, 4.3, 5.1_



  - [ ] 3.5 Implementar endpoints de agendamento de webhooks
    - Criar POST /api/admin/webhooks/schedule-donation
    - Criar GET /api/admin/webhooks/scheduled
    - Criar POST /api/admin/webhooks/execute-scheduled
    - Implementar validações de timing e fuso horário brasileiro


    - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [ ] 4. Desenvolver interface de controle de eventos
  - [x] 4.1 Criar página EventControlPage


    - Implementar rota /admin-v2/event-control
    - Criar layout responsivo com seletor de evento
    - Integrar com sistema de autenticação existente
    - _Requirements: 3.1_

  - [x] 4.2 Implementar componente EventSelector


    - Criar dropdown para seleção de evento por data
    - Carregar lista de eventos disponíveis
    - Filtrar eventos por data atual/futura
    - _Requirements: 3.1_

  - [x] 4.3 Desenvolver componente RegistrationList


    - Implementar lista paginada de inscritos
    - Mostrar informações: nome, CPF, telefone, status
    - Integrar com filtros e busca
    - _Requirements: 3.2, 6.1, 6.2, 6.4_

  - [x] 4.4 Criar componente RegistrationCard



    - Implementar card individual para cada inscrito
    - Adicionar botões de ação: Confirmar Presença, Registrar Óculos, Finalizar
    - Implementar status visual com ícones: ⚪ Aguardando, ✅ Presente, 👓 Com Óculos, ✔️ Finalizado

    - _Requirements: 3.3, 3.4, 3.5, 3.6, 6.3_

  - [ ] 4.5 Implementar componente GlassesModal
    - Criar modal para registro de compra de óculos
    - Adicionar campos: valor (R$) e data/hora de entrega
    - Implementar validações: valor positivo, data futura

    - _Requirements: 3.4, 3.5, 5.2, 5.3_

  - [ ] 4.6 Desenvolver FilterBar e busca
    - Implementar filtros: Todos, Presentes, Ausentes, Com Óculos, Sem Óculos
    - Adicionar campo de busca por nome ou CPF

    - Implementar debouncing na busca para performance
    - _Requirements: 6.1, 6.2_

- [ ] 5. Implementar sistema de auditoria e logging
  - [ ] 5.1 Integrar com tabela registration_notifications
    - Registrar todos os webhooks enviados na tabela existente
    - Salvar status: 'sent', 'failed', 'pending'
    - Incluir detalhes de erro quando webhook falha


    - _Requirements: 4.3, 4.4_

  - [ ] 5.2 Implementar logging de ações do usuário
    - Registrar todas as ações na interface com timestamp
    - Salvar usuário responsável em attended_by
    - Criar log de auditoria para mudanças de estado
    - _Requirements: 5.4_


- [ ] 6. Adicionar validações e tratamento de erros
  - [ ] 6.1 Implementar validações no frontend
    - Validar campos obrigatórios antes de enviar
    - Mostrar feedback visual para erros
    - Implementar confirmações para ações críticas
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 6.2 Implementar validações no backend
    - Validar regras de negócio em todos os endpoints
    - Validar delivery_date deve ser no mínimo D+1 (não no mesmo dia do evento)
    - Implementar timezone awareness para fuso horário brasileiro
    - Validar formato R$ XX,XX e converter para decimal corretamente
    - Retornar mensagens de erro claras e implementar rollback em caso de falha

    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 7. Configurar variáveis de ambiente e deploy
  - [ ] 7.1 Adicionar variáveis de ambiente
    - Configurar VITE_WEBHOOK_CONFIRMATION_URL

    - Configurar VITE_WEBHOOK_DELIVERY_URL
    - Configurar VITE_WEBHOOK_DONATION_URL
    - Configurar VITE_WEBHOOK_EVENT_REMINDER_URL
    - Adicionar WEBHOOK_DONATION_DELAY_HOURS=48
    - Adicionar configurações de timeout, retry e rate limiting


    - _Requirements: 1.4, 4.1, 4.2, 7.4_

  - [ ] 7.2 Executar migração de banco de dados
    - Aplicar migração SQL em ambiente de desenvolvimento
    - Testar migração com dados existentes
    - Preparar script de rollback se necessário
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 7.3 Implementar sistema de agendamento de webhooks
    - Criar tabela scheduled_webhooks para controle de timing
    - Implementar job scheduler para executar webhooks agendados
    - Criar interface para visualizar webhooks pendentes
    - Implementar retry logic com backoff exponencial (1s, 3s, 9s)
    - Implementar circuit breaker para parar tentativas se N8N estiver indisponível por mais de 15 minutos
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [ ] 8. Implementar testes
  - [ ] 8.1 Criar testes unitários para WebhookService
    - Testar envio de webhooks com mock do N8N
    - Testar tratamento de erros e retry logic
    - Testar formatação correta dos payloads
    - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2_

  - [ ] 8.2 Criar testes de integração para endpoints
    - Testar fluxo completo de cada endpoint da API
    - Testar validações e tratamento de erros
    - Testar integração com banco de dados
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ] 8.3 Criar testes E2E para interface
    - Testar fluxo completo: seleção evento → ações → webhooks
    - Testar todos os filtros e busca
    - Testar responsividade e usabilidade
    - _Requirements: 3.1, 3.2, 6.1, 6.2, 6.3, 6.4_

  - [ ] 8.4 Implementar funcionalidade de avisos de eventos (Funcionalidade Futura)
    - Criar interface para seleção de público-alvo
    - Implementar filtros: todos pacientes, por evento anterior, por cidade
    - Criar sistema de templates de mensagens personalizáveis
    - Implementar agendamento de envio de avisos
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
