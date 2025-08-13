# Requisitos do Sistema - Projeto Enxergar Sem Fronteira

## Introdução

O Projeto Enxergar Sem Fronteira é uma plataforma web para gerenciar atendimentos oftalmológicos itinerantes, permitindo que usuários se cadastrem para consultas gratuitas, organizadores gerenciem eventos, e equipes administrativas controlem todo o processo. O sistema deve integrar com APIs externas para pagamentos e sincronização de dados.

## Requisitos

### Requisito 1: Sistema de Cadastro de Usuários

**User Story:** Como um usuário que precisa de atendimento oftalmológico, eu quero me cadastrar em um evento específico, para que eu possa garantir minha vaga na consulta gratuita.

#### Acceptance Criteria

1. QUANDO o usuário acessa a página de um evento ENTÃO o sistema SHALL exibir um formulário de cadastro
2. QUANDO o usuário preenche o formulário ENTÃO o sistema SHALL validar CPF, email e telefone
3. QUANDO o usuário já está cadastrado em outro evento ativo ENTÃO o sistema SHALL impedir novo cadastro
4. QUANDO o evento está lotado ENTÃO o sistema SHALL exibir mensagem de vagas esgotadas
5. QUANDO o cadastro é realizado com sucesso ENTÃO o sistema SHALL enviar confirmação por email e WhatsApp

### Requisito 2: Painel Administrativo para Organizadores

**User Story:** Como organizador de eventos, eu quero gerenciar meus eventos e visualizar inscrições, para que eu possa organizar os atendimentos de forma eficiente.

#### Acceptance Criteria

1. QUANDO o organizador faz login ENTÃO o sistema SHALL exibir dashboard com seus eventos
2. QUANDO o organizador cria um evento ENTÃO o sistema SHALL solicitar data, horário, local e número de vagas
3. QUANDO o organizador visualiza um evento ENTÃO o sistema SHALL mostrar lista de inscritos
4. QUANDO o organizador solicita relatório ENTÃO o sistema SHALL gerar PDF com lista de participantes
5. QUANDO o organizador edita um evento ENTÃO o sistema SHALL atualizar informações e notificar inscritos

### Requisito 3: Painel de Gestão para Equipes

**User Story:** Como membro da equipe do Instituto Coração Valente ou Projeto Visão Itinerante, eu quero visualizar todos os eventos e relatórios, para que eu possa acompanhar e coordenar as atividades.

#### Acceptance Criteria

1. QUANDO a equipe acessa o painel ENTÃO o sistema SHALL exibir todos os eventos cadastrados
2. QUANDO a equipe seleciona um evento ENTÃO o sistema SHALL mostrar detalhes completos e inscrições
3. QUANDO a equipe gera relatório ENTÃO o sistema SHALL criar PDF com dados consolidados
4. QUANDO a equipe visualiza dashboard ENTÃO o sistema SHALL exibir métricas e estatísticas
5. QUANDO a equipe exporta dados ENTÃO o sistema SHALL gerar arquivo CSV com informações dos usuários

### Requisito 4: Sistema de Notificações

**User Story:** Como usuário cadastrado, eu quero receber lembretes sobre minha consulta, para que eu não perca o atendimento agendado.

#### Acceptance Criteria

1. QUANDO o usuário se cadastra ENTÃO o sistema SHALL enviar email de confirmação imediatamente
2. QUANDO faltam 48 horas para o evento ENTÃO o sistema SHALL enviar lembrete por email e WhatsApp
3. QUANDO faltam 2 horas para o evento ENTÃO o sistema SHALL enviar lembrete final com localização
4. QUANDO o evento é cancelado ENTÃO o sistema SHALL notificar todos os inscritos
5. QUANDO há mudanças no evento ENTÃO o sistema SHALL informar os participantes

### Requisito 5: Integração com Instituto Coração Valente

**User Story:** Como administrador do sistema, eu quero que os dados dos usuários sejam sincronizados com o Instituto Coração Valente, para que campanhas de captação possam ser realizadas.

#### Acceptance Criteria

1. QUANDO um usuário se cadastra ENTÃO o sistema SHALL enviar dados para API do Instituto
2. QUANDO os dados são enviados ENTÃO o sistema SHALL incluir tag "visao_itinerante" para identificação
3. QUANDO a integração falha ENTÃO o sistema SHALL tentar reenvio automático
4. QUANDO há erro persistente ENTÃO o sistema SHALL alertar administradores
5. QUANDO dados são sincronizados ENTÃO o sistema SHALL registrar log de auditoria

### Requisito 6: Sistema de Pagamentos e Split

**User Story:** Como afiliado do projeto, eu quero que doações geradas através dos meus links sejam divididas corretamente, para que eu receba minha parte dos recursos captados.

#### Acceptance Criteria

1. QUANDO uma doação é processada ENTÃO o sistema SHALL aplicar split de 25% para cada ente
2. QUANDO o pagamento é confirmado ENTÃO o sistema SHALL distribuir valores automaticamente
3. QUANDO há falha no split ENTÃO o sistema SHALL registrar erro e tentar novamente
4. QUANDO afiliado gera link ENTÃO o sistema SHALL rastrear origem da doação
5. QUANDO há disputa ENTÃO o sistema SHALL manter logs detalhados para auditoria

### Requisito 7: Sistema de Controle de Vagas

**User Story:** Como organizador, eu quero controlar o número de vagas disponíveis, para que não haja superlotação nos atendimentos.

#### Acceptance Criteria

1. QUANDO um evento é criado ENTÃO o sistema SHALL definir limite máximo de vagas
2. QUANDO um usuário se cadastra ENTÃO o sistema SHALL decrementar contador de vagas
3. QUANDO as vagas se esgotam ENTÃO o sistema SHALL desabilitar cadastros
4. QUANDO um usuário cancela ENTÃO o sistema SHALL liberar vaga automaticamente
5. QUANDO há lista de espera ENTÃO o sistema SHALL notificar próximo da fila

### Requisito 8: Dashboard e Relatórios

**User Story:** Como gestor do projeto, eu quero visualizar métricas e relatórios, para que eu possa tomar decisões baseadas em dados.

#### Acceptance Criteria

1. QUANDO o gestor acessa dashboard ENTÃO o sistema SHALL exibir estatísticas em tempo real
2. QUANDO o gestor solicita relatório ENTÃO o sistema SHALL gerar dados por período
3. QUANDO há tendências importantes ENTÃO o sistema SHALL destacar insights relevantes
4. QUANDO dados são exportados ENTÃO o sistema SHALL manter formatação adequada
5. QUANDO relatório é gerado ENTÃO o sistema SHALL incluir gráficos e visualizações

### Requisito 9: Sistema de Autenticação e Autorização

**User Story:** Como usuário do sistema, eu quero ter acesso seguro às funcionalidades, para que minhas informações estejam protegidas.

#### Acceptance Criteria

1. QUANDO usuário faz login ENTÃO o sistema SHALL validar credenciais
2. QUANDO usuário tem perfil específico ENTÃO o sistema SHALL mostrar funcionalidades apropriadas
3. QUANDO sessão expira ENTÃO o sistema SHALL solicitar nova autenticação
4. QUANDO há tentativa de acesso não autorizado ENTÃO o sistema SHALL bloquear e registrar
5. QUANDO senha é esquecida ENTÃO o sistema SHALL permitir recuperação segura

### Requisito 10: Agente de IA para Suporte

**User Story:** Como usuário com dúvidas, eu quero ter suporte automatizado, para que eu possa obter respostas rápidas sobre o projeto.

#### Acceptance Criteria

1. QUANDO usuário acessa chat ENTÃO o sistema SHALL apresentar agente de IA da Renum
2. QUANDO usuário faz pergunta ENTÃO o sistema SHALL fornecer resposta contextualizada
3. QUANDO IA não consegue responder ENTÃO o sistema SHALL encaminhar para atendimento humano
4. QUANDO atendimento termina ENTÃO o sistema SHALL solicitar feedback
5. QUANDO há feedback negativo ENTÃO o sistema SHALL melhorar respostas futuras