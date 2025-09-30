# Requirements Document

## Introduction

Esta funcionalidade implementa um sistema completo de controle de eventos com integração N8N, incluindo: confirmação automática de inscrições via WhatsApp, interface de controle para atendentes gerenciarem presenças e compras de óculos, e automação de fluxos de entrega e campanhas de doação.

O sistema gerencia todo o ciclo: Inscrição → Confirmação WhatsApp → Controle de Presença → Registro de Compras → Entrega de Óculos → Campanha de Doação.

**Infraestrutura Existente:**
- ✅ Tabela `registration_notifications` já existe com colunas necessárias
- ✅ Função `get_registration_details()` já implementada no banco
- ✅ Campos `delivery_date` e `delivery_status` já existem na tabela `registrations`
- ✅ Fluxo N8N de confirmação já configurado e testado

## Requirements

### Requirement 1 - Confirmação Automática de Inscrição

**User Story:** Como um paciente, eu quero receber automaticamente uma confirmação via WhatsApp após me inscrever em um evento, para que eu tenha certeza de que minha inscrição foi processada com sucesso.

#### Acceptance Criteria

1. WHEN um paciente completa uma inscrição com sucesso THEN o sistema SHALL disparar um webhook para o N8N usando a função get_registration_details() existente
2. WHEN o webhook é disparado THEN o sistema SHALL incluir registration_id, patient_name, phone, date, start_time, event_name, event_location e event_city no payload
3. WHEN o webhook falha THEN o sistema SHALL continuar funcionando normalmente sem bloquear a inscrição do usuário
4. WHEN o webhook é enviado THEN o sistema SHALL usar autenticação por token configurável via VITE_WEBHOOK_CONFIRMATION_URL

### Requirement 2 - Extensão da Tabela Registrations

**User Story:** Como desenvolvedor, eu quero que a tabela registrations tenha campos para controlar todo o processo do evento, para que eu possa rastrear presença, compras e entregas.

#### Acceptance Criteria

1. WHEN o sistema é atualizado THEN a tabela registrations SHALL incluir campos attendance_confirmed, attendance_confirmed_at, purchased_glasses, glasses_purchase_amount
2. WHEN o sistema é atualizado THEN a tabela registrations SHALL incluir campos delivery_date, delivery_status, process_completed, completed_at, attended_by
3. WHEN um registro é criado THEN os campos booleanos SHALL ter valores padrão FALSE
4. WHEN um registro é criado THEN o delivery_status SHALL ter valor padrão 'pending'

### Requirement 3 - Interface de Controle de Eventos

**User Story:** Como atendente no dia do evento, eu quero uma interface para controlar presenças e registrar compras de óculos, para que eu possa gerenciar o atendimento de forma eficiente.

#### Acceptance Criteria

1. WHEN acesso a rota /admin-v2/event-control THEN o sistema SHALL exibir interface de seleção de evento por data
2. WHEN seleciono um evento THEN o sistema SHALL listar todos os inscritos com status visual claro
3. WHEN clico em "Confirmar Presença" THEN o sistema SHALL atualizar attendance_confirmed=true e attendance_confirmed_at=now()
4. WHEN clico em "Registrar Óculos" THEN o sistema SHALL abrir modal para inserir valor e data de entrega
5. WHEN salvo dados dos óculos THEN o sistema SHALL atualizar purchased_glasses=true, glasses_purchase_amount e delivery_date
6. WHEN clico em "Finalizar" THEN o sistema SHALL atualizar process_completed=true e completed_at=now()

### Requirement 4 - Automação de Fluxos Adicionais

**User Story:** Como administrador, eu quero que o sistema dispare automaticamente fluxos de entrega de óculos e campanhas de doação, para que os pacientes recebam as comunicações adequadas no momento certo.

#### Acceptance Criteria

1. WHEN delivery_date é definida THEN o sistema SHALL disparar webhook para VITE_WEBHOOK_DELIVERY_URL com payload {registration_id, delivery_date}
2. WHEN delivery_status='delivered' THEN o sistema SHALL aguardar 48 horas e depois disparar webhook para VITE_WEBHOOK_DONATION_URL
3. WHEN process_completed=true AND purchased_glasses=false THEN o sistema SHALL aguardar 48 horas após completed_at e depois disparar webhook de doação
4. WHEN qualquer webhook de doação é agendado THEN o sistema SHALL registrar na tabela registration_notifications com status 'scheduled'
5. WHEN o timing de 48h é atingido THEN o sistema SHALL executar o webhook e atualizar status para 'sent' ou 'failed'

### Requirement 5 - Validações e Controles

**User Story:** Como atendente, eu quero que o sistema me impeça de fazer ações inválidas, para que eu mantenha a integridade dos dados.

#### Acceptance Criteria

1. WHEN tento finalizar um atendimento THEN o sistema SHALL exigir que attendance_confirmed seja true
2. WHEN insiro data de entrega THEN o sistema SHALL validar que a data é futura
3. WHEN insiro valor dos óculos THEN o sistema SHALL validar que o valor é positivo
4. WHEN realizo qualquer ação THEN o sistema SHALL registrar o attended_by com o nome do usuário logado

### Requirement 6 - Funcionalidades da Interface

**User Story:** Como atendente, eu quero filtros e busca na interface de controle, para que eu possa encontrar rapidamente os pacientes que preciso atender.

#### Acceptance Criteria

1. WHEN acesso a interface THEN o sistema SHALL oferecer filtros: Todos, Presentes, Ausentes, Com Óculos, Sem Óculos
2. WHEN uso a busca THEN o sistema SHALL permitir buscar por nome ou CPF
3. WHEN visualizo um inscrito THEN o sistema SHALL mostrar status visual: ⚪ Aguardando, ✅ Presente, 👓 Com Óculos, ✔️ Finalizado
4. WHEN há muitos registros THEN o sistema SHALL implementar paginação para performance

### Requirement 7 - Sistema de Avisos sobre Novos Eventos (Funcionalidade Futura)

**User Story:** Como administrador, eu quero enviar avisos sobre novos eventos para pacientes que já participaram anteriormente, para que eu possa manter engajamento contínuo e oferecer novos atendimentos.

#### Acceptance Criteria

1. WHEN um novo evento é criado THEN o sistema SHALL permitir selecionar público-alvo (todos os pacientes ou filtros específicos)
2. WHEN seleciono "Avisar pacientes anteriores" THEN o sistema SHALL listar pacientes que já participaram de eventos
3. WHEN configuro o aviso THEN o sistema SHALL permitir personalizar mensagem e agendar data/hora do envio
4. WHEN o aviso é enviado THEN o sistema SHALL usar webhook VITE_WEBHOOK_EVENT_REMINDER_URL
5. WHEN paciente responde positivamente THEN o sistema SHALL facilitar redirecionamento para página de inscrição
