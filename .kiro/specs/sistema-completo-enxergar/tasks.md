# Plano de Implementação - Finalização do Sistema Enxergar Sem Fronteira

## Cronograma de Desenvolvimento

**Executor:** Lovable (Plataforma de desenvolvimento especializada em frontend e integrações Supabase)

**Objetivo:** Completar todas as funcionalidades críticas faltantes para tornar o sistema totalmente operacional.

---

## Fase 1: Correções e Melhorias Críticas

- [x] 1. Corrigir nomenclatura do sistema de doações



  - **Executor:** Lovable
  - **Descrição:** Alterar toda terminologia de "pagamentos" para "doações/campanhas"
  - Renomear `AdminPayments.tsx` para `AdminDonations.tsx`
  - Renomear `PaymentForm.tsx` para `DonationForm.tsx`
  - Renomear `useAsaasPayment.ts` para `useAsaasDonation.ts`
  - Atualizar todas as referências na interface para "Campanhas de Doação"
  - Atualizar textos e descrições para refletir propósito social
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 2. Adicionar card de Organizadores no painel administrativo



  - **Executor:** Lovable
  - **Descrição:** Criar card de acesso rápido à gestão de organizadores
  - Adicionar card "Organizadores Locais" no `Admin.tsx`
  - Incluir métricas resumidas dos organizadores
  - Destacar organizadores pendentes visualmente
  - Implementar navegação direta para `/admin/organizers`
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 3. Configurar API Keys das entidades fixas



  - **Executor:** Lovable
  - **Descrição:** Implementar configuração das 3 API Keys fixas no AdminSettings
  - Adicionar nova aba "API Keys Asaas" no `AdminSettings.tsx`
  - Criar campos para ONG Coração Valente, Projeto Visão, Renum
  - Implementar criptografia das API Keys antes do armazenamento
  - Adicionar validação das chaves API
  - Atualizar `useSystemSettings.ts` para suportar novas configurações
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4. Melhorar formulário de organizadores com API Key



  - **Executor:** Lovable
  - **Descrição:** Adicionar campo API Key e botão para criar conta Asaas
  - Adicionar campo `asaas_api_key` no formulário de criação de organizadores
  - Implementar botão "Criar conta no Asaas" com link de referência
  - Adicionar coluna na tabela para mostrar status da API Key
  - Implementar opção no menu para editar API Key de organizadores existentes
  - Atualizar `useOrganizers.ts` para gerenciar API Keys
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

## Fase 2: Painel Completo do Organizador

- [x] 5. Criar estrutura base do painel do organizador




  - **Executor:** Lovable
  - **Descrição:** Implementar layout e navegação para organizadores
  - Criar `OrganizerLayout` component com sidebar
  - Implementar redirecionamento automático para organizadores logados
  - Criar sistema de proteção de rotas específico para organizadores
  - Implementar navegação entre páginas do organizador
  - _Requirements: 1.1, 1.2_

- [x] 6. Implementar dashboard do organizador


  - **Executor:** Lovable
  - **Descrição:** Dashboard personalizado com métricas do organizador
  - Criar página `/organizer/dashboard`
  - Implementar métricas específicas do organizador (eventos, inscrições)
  - Criar widgets de KPIs personalizados
  - Adicionar gráficos e visualizações de dados próprios
  - Implementar filtros por período
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 7. Criar gestão de eventos do organizador



  - **Executor:** Lovable
  - **Descrição:** CRUD completo de eventos para organizadores
  - Criar página `/organizer/events` com listagem de eventos próprios
  - Implementar página `/organizer/events/new` para criar eventos
  - Criar página `/organizer/events/:id/edit` para editar eventos
  - Implementar validações e permissões (apenas eventos próprios)
  - Adicionar upload de imagens e integração com Google Maps
  - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [-] 8. Implementar gestão de inscrições do organizador


  - **Executor:** Lovable
  - **Descrição:** Visualização e gestão de inscrições dos eventos próprios
  - Criar página `/organizer/events/:id/registrations`
  - Implementar listagem de inscritos com filtros e busca
  - Adicionar exportação de listas em PDF/CSV
  - Implementar ações para gerenciar inscrições individuais
  - Criar sistema de comunicação com inscritos
  - _Requirements: 1.3, 1.4_

- [ ] 9. Criar perfil e configurações do organizador

  - **Executor:** Lovable
  - **Descrição:** Página de perfil pessoal do organizador
  - Criar página `/organizer/profile`
  - Implementar edição de dados pessoais
  - Adicionar configuração de API Key do Asaas
  - Implementar alteração de senha
  - Criar configurações de notificações
  - _Requirements: 1.1, 1.5_

## Fase 3: Páginas Detalhadas de Eventos Públicos

- [ ] 10. Criar página de detalhes do evento

  - **Executor:** Lovable
  - **Descrição:** Página individual para cada evento com informações completas
  - Criar página `/events/:id` com layout responsivo
  - Implementar exibição de todas as informações do evento
  - Adicionar seção hero com título e status do evento
  - Criar seção de detalhes (data, horário, local, vagas)
  - Implementar seção de informações importantes
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 11. Integrar Google Maps na página do evento

  - **Executor:** Lovable
  - **Descrição:** Mapa interativo com localização do evento
  - Integrar Google Maps API na página de detalhes
  - Implementar geocoding automático de endereços
  - Adicionar marcador personalizado no local do evento
  - Criar botão "Como chegar" com direções
  - Implementar componente reutilizável para mapas
  - _Requirements: 2.2, 2.3, 2.4_

- [ ] 12. Implementar botão de inscrição direto

  - **Executor:** Lovable
  - **Descrição:** Inscrição direta a partir da página do evento
  - Criar botão de inscrição principal na página do evento
  - Implementar modal ou redirecionamento para formulário
  - Adicionar validação de vagas disponíveis em tempo real
  - Implementar feedback visual para diferentes estados (disponível/lotado)
  - _Requirements: 2.3, 2.4, 2.5_

## Fase 4: Área Completa do Usuário Final

- [ ] 13. Implementar sistema de autenticação de usuários

  - **Executor:** Lovable
  - **Descrição:** Login e registro para usuários finais
  - Melhorar página `/auth` para suportar usuários finais
  - Implementar registro de usuários com validação
  - Criar sistema de roles para usuários finais
  - Implementar redirecionamento baseado no tipo de usuário
  - _Requirements: 3.1, 3.2_

- [ ] 14. Criar perfil do usuário

  - **Executor:** Lovable
  - **Descrição:** Página de perfil pessoal do usuário
  - Criar página `/profile` para usuários finais
  - Implementar edição de dados pessoais
  - Adicionar validação de CPF e outros campos
  - Criar seção de preferências de notificação
  - Implementar alteração de senha
  - _Requirements: 3.1, 3.2_

- [ ] 15. Implementar "Minhas Inscrições"

  - **Executor:** Lovable
  - **Descrição:** Histórico e gestão de inscrições do usuário
  - Criar página `/my-registrations`
  - Implementar listagem de inscrições com filtros
  - Adicionar detalhes de cada evento inscrito
  - Criar cards informativos para cada inscrição
  - Implementar status das inscrições (confirmada, cancelada, etc.)
  - _Requirements: 3.2, 3.3, 3.4_

- [ ] 16. Implementar cancelamento de inscrições

  - **Executor:** Lovable
  - **Descrição:** Sistema de cancelamento com liberação automática de vagas
  - Adicionar botão de cancelamento nas inscrições
  - Implementar confirmação de cancelamento
  - Criar lógica para liberar vaga automaticamente
  - Implementar notificação para próximo da lista de espera
  - Adicionar logs de auditoria para cancelamentos
  - _Requirements: 3.3, 3.4, 3.5_

## Fase 5: Sistema de Lista de Espera

- [ ] 17. Criar estrutura da lista de espera

  - **Executor:** Lovable
  - **Descrição:** Banco de dados e lógica para lista de espera
  - Criar tabela `waiting_list` no banco de dados
  - Implementar triggers para gerenciar posições na fila
  - Criar Edge Functions para processamento automático
  - Implementar sistema de expiração de notificações
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 18. Implementar interface da lista de espera

  - **Executor:** Lovable
  - **Descrição:** Interface para usuários entrarem na lista de espera
  - Adicionar opção de lista de espera quando evento está lotado
  - Implementar formulário de entrada na lista
  - Criar feedback visual da posição na fila
  - Implementar notificações de mudança de posição
  - _Requirements: 6.1, 6.2, 6.4_

- [ ] 19. Implementar notificações automáticas da lista

  - **Executor:** Lovable
  - **Descrição:** Sistema automático de notificação quando vaga é liberada
  - Criar Edge Function para processar liberação de vagas
  - Implementar notificação automática do próximo da lista
  - Adicionar prazo para confirmação de interesse
  - Implementar passagem automática para próximo se prazo expirar
  - _Requirements: 6.2, 6.3, 6.4, 6.5_

## Fase 6: Melhorias no Sistema de Validação

- [ ] 20. Implementar validação de usuário único por evento

  - **Executor:** Lovable
  - **Descrição:** Garantir que usuário não se inscreva em múltiplos eventos ativos
  - Adicionar validação no formulário de inscrição
  - Implementar verificação por CPF em eventos ativos
  - Criar mensagem informativa para usuário
  - Implementar exceções para casos especiais
  - _Requirements: 7.1, 7.2_

- [ ] 21. Melhorar sistema de controle de vagas

  - **Executor:** Lovable
  - **Descrição:** Atualização em tempo real e liberação automática
  - Implementar atualização de contadores em tempo real
  - Criar sistema de liberação automática no cancelamento
  - Implementar locks para evitar condições de corrida
  - Adicionar logs de auditoria para mudanças de vagas
  - _Requirements: 7.2, 7.3, 7.4, 7.5_

- [ ] 22. Implementar notificações de mudanças em eventos

  - **Executor:** Lovable
  - **Descrição:** Notificar inscritos sobre alterações nos eventos
  - Criar sistema de detecção de mudanças em eventos
  - Implementar notificação automática para todos os inscritos
  - Adicionar templates específicos para diferentes tipos de mudança
  - Implementar sistema de opt-out para notificações
  - _Requirements: 7.4, 7.5_

## Fase 7: Sistema de Recuperação de Senha

- [ ] 23. Implementar "Esqueci minha senha"

  - **Executor:** Lovable
  - **Descrição:** Sistema seguro de recuperação de senha
  - Adicionar link "Esqueci minha senha" na página de login
  - Criar página `/auth/forgot-password`
  - Implementar envio de email com link seguro
  - Criar tokens temporários com expiração
  - _Requirements: 8.1, 8.2_

- [ ] 24. Criar página de redefinição de senha

  - **Executor:** Lovable
  - **Descrição:** Interface para criar nova senha
  - Criar página `/auth/reset-password`
  - Implementar validação de token de recuperação
  - Adicionar formulário de nova senha com validações
  - Implementar invalidação automática do token após uso
  - Criar confirmação por email da alteração
  - _Requirements: 8.2, 8.3, 8.4, 8.5_

## Fase 8: Integração Twilio (WhatsApp e SMS)

- [ ] 25. Configurar integração base com Twilio

  - **Executor:** Lovable
  - **Descrição:** Setup inicial da integração Twilio
  - Adicionar configurações Twilio no `system_settings`
  - Criar Edge Functions para comunicação com Twilio API
  - Implementar autenticação e configuração de credenciais
  - Criar sistema de templates de mensagens
  - _Requirements: 9.1, 9.2_

- [ ] 26. Implementar envio de WhatsApp

  - **Executor:** Lovable
  - **Descrição:** Sistema de notificações via WhatsApp Business
  - Criar função para envio de mensagens WhatsApp
  - Implementar templates para diferentes tipos de notificação
  - Adicionar sistema de opt-in/opt-out
  - Implementar logs de entrega e status
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 27. Implementar envio de SMS

  - **Executor:** Lovable
  - **Descrição:** Sistema de notificações via SMS
  - Criar função para envio de SMS
  - Implementar templates específicos para SMS (limite de caracteres)
  - Adicionar validação de números de telefone
  - Implementar sistema de retry para falhas
  - _Requirements: 9.1, 9.2, 9.4_

- [ ] 28. Integrar notificações nos fluxos existentes

  - **Executor:** Lovable
  - **Descrição:** Adicionar WhatsApp e SMS aos fluxos de notificação
  - Atualizar confirmação de cadastro para incluir WhatsApp e SMS
  - Implementar lembretes 48h e 2h antes via ambos os canais
  - Adicionar notificações de cancelamento via WhatsApp e SMS
  - Implementar notificações de mudanças via ambos os canais
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

## Fase 9: Testes e Otimizações Finais

- [ ] 29. Implementar testes automatizados críticos

  - **Executor:** Lovable
  - **Descrição:** Cobertura de testes para fluxos principais
  - Criar testes unitários para componentes críticos
  - Implementar testes de integração para fluxos de inscrição
  - Adicionar testes para sistema de lista de espera
  - Criar testes para validações de negócio
  - _Requirements: Todos os requisitos_

- [ ] 30. Otimizar performance e experiência do usuário

  - **Executor:** Lovable
  - **Descrição:** Melhorias finais de performance e UX
  - Implementar lazy loading em componentes pesados
  - Adicionar estados de loading e feedback visual
  - Otimizar queries do banco de dados
  - Implementar cache inteligente
  - Adicionar indicadores de progresso
  - _Requirements: Todos os requisitos_

---

## Observações Importantes

**Metodologia de Trabalho:**
- Cada fase deve ser desenvolvida sequencialmente
- Testes devem ser realizados ao final de cada fase
- Feedback do usuário deve ser coletado durante o desenvolvimento
- Documentação deve ser atualizada conforme implementação

**Prioridades:**
1. **Crítico:** Fases 1-4 (funcionalidades essenciais)
2. **Alto:** Fases 5-7 (melhorias importantes)
3. **Médio:** Fase 8 (integrações avançadas)
4. **Baixo:** Fase 9 (otimizações)

**Entregáveis por Fase:**
- Código funcional e testado
- Banco de dados atualizado
- Edge Functions implementadas
- Interface responsiva
- Documentação atualizada

**Estimativa de Tempo:**
- Fases 1-4: 2-3 semanas (crítico)
- Fases 5-7: 1-2 semanas (importante)
- Fase 8: 1 semana (avançado)
- Fase 9: 1 semana (otimização)

**Total Estimado:** 5-7 semanas para implementação completa