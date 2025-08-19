# Requisitos - Finalização do Sistema Enxergar Sem Fronteira

## Introdução

Esta especificação define os requisitos para completar a implementação do sistema Enxergar Sem Fronteira, focando nas funcionalidades críticas que estão faltando para tornar o sistema totalmente funcional para todos os tipos de usuários.

## Requisitos

### Requisito 1: Painel Completo do Organizador

**User Story:** Como organizador local, eu quero ter meu próprio painel para gerenciar meus eventos e inscrições, para que eu possa trabalhar de forma independente sem depender dos administradores.

#### Acceptance Criteria

1. QUANDO o organizador faz login ENTÃO o sistema SHALL redirecioná-lo para `/organizer/dashboard`
2. QUANDO o organizador acessa seu dashboard ENTÃO o sistema SHALL exibir apenas seus próprios eventos e métricas
3. QUANDO o organizador cria um evento ENTÃO o sistema SHALL associá-lo automaticamente como proprietário
4. QUANDO o organizador visualiza inscrições ENTÃO o sistema SHALL mostrar apenas inscrições de seus eventos
5. QUANDO o organizador gera relatório ENTÃO o sistema SHALL incluir apenas dados de seus eventos

### Requisito 2: Páginas Detalhadas de Eventos Públicos

**User Story:** Como usuário interessado em um evento, eu quero ver todos os detalhes do evento em uma página específica, para que eu possa tomar uma decisão informada sobre minha participação.

#### Acceptance Criteria

1. QUANDO o usuário clica em um evento ENTÃO o sistema SHALL redirecioná-lo para `/events/:id`
2. QUANDO o usuário acessa a página do evento ENTÃO o sistema SHALL exibir todas as informações detalhadas
3. QUANDO o usuário visualiza o endereço ENTÃO o sistema SHALL mostrar mapa interativo do Google Maps
4. QUANDO o usuário quer se inscrever ENTÃO o sistema SHALL fornecer botão direto para inscrição
5. QUANDO o evento está lotado ENTÃO o sistema SHALL exibir opção de lista de espera

### Requisito 3: Área Completa do Usuário Final

**User Story:** Como usuário cadastrado, eu quero gerenciar meu perfil e minhas inscrições, para que eu possa controlar minha participação nos eventos.

#### Acceptance Criteria

1. QUANDO o usuário faz login ENTÃO o sistema SHALL permitir acesso à área pessoal
2. QUANDO o usuário acessa seu perfil ENTÃO o sistema SHALL permitir edição de dados pessoais
3. QUANDO o usuário visualiza suas inscrições ENTÃO o sistema SHALL mostrar histórico completo
4. QUANDO o usuário quer cancelar inscrição ENTÃO o sistema SHALL permitir cancelamento e liberar vaga
5. QUANDO o usuário cancela ENTÃO o sistema SHALL notificar próximo da lista de espera

### Requisito 4: Correção da Nomenclatura do Sistema de Doações

**User Story:** Como usuário do sistema, eu quero que a interface reflita corretamente o propósito de arrecadação de doações, para que eu entenda claramente a finalidade das transações.

#### Acceptance Criteria

1. QUANDO o sistema se refere a transações ENTÃO SHALL usar terminologia de "doações" ou "campanhas"
2. QUANDO o administrador acessa gestão financeira ENTÃO SHALL ver "Campanhas de Doação"
3. QUANDO uma campanha é criada ENTÃO SHALL ser apresentada como "Nova Campanha de Doação"
4. QUANDO relatórios são gerados ENTÃO SHALL usar terminologia de arrecadação
5. QUANDO usuário vê interface ENTÃO SHALL entender o propósito social das contribuições

### Requisito 5: Configuração Completa das API Keys Asaas

**User Story:** Como administrador do sistema, eu quero configurar todas as API Keys das entidades envolvidas no split, para que as doações sejam distribuídas automaticamente entre os 4 participantes.

#### Acceptance Criteria

1. QUANDO o administrador acessa configurações ENTÃO SHALL ver seção "API Keys Asaas"
2. QUANDO o administrador configura as 3 entidades fixas ENTÃO SHALL poder inserir chaves criptografadas
3. QUANDO um organizador é criado ENTÃO SHALL poder inserir sua API Key do Asaas
4. QUANDO organizador não tem conta ENTÃO SHALL ver botão para criar conta com link de referência
5. QUANDO todas as chaves estão configuradas ENTÃO SHALL funcionar split automático de 25% cada

### Requisito 6: Sistema de Lista de Espera

**User Story:** Como usuário interessado em evento lotado, eu quero entrar na lista de espera, para que eu seja notificado se uma vaga for liberada.

#### Acceptance Criteria

1. QUANDO evento está lotado ENTÃO o sistema SHALL oferecer opção de lista de espera
2. QUANDO usuário entra na lista ENTÃO o sistema SHALL registrar posição na fila
3. QUANDO vaga é liberada ENTÃO o sistema SHALL notificar próximo da lista automaticamente
4. QUANDO usuário da lista é notificado ENTÃO SHALL ter prazo para confirmar interesse
5. QUANDO prazo expira ENTÃO o sistema SHALL passar para próximo da lista

### Requisito 7: Melhorias no Sistema de Validação

**User Story:** Como administrador do sistema, eu quero garantir que as regras de negócio sejam aplicadas corretamente, para que não haja problemas de duplicidade ou inconsistências.

#### Acceptance Criteria

1. QUANDO usuário tenta se cadastrar ENTÃO o sistema SHALL validar se já está inscrito em evento ativo
2. QUANDO usuário cancela inscrição ENTÃO o sistema SHALL liberar vaga automaticamente
3. QUANDO vaga é liberada ENTÃO o sistema SHALL atualizar contadores em tempo real
4. QUANDO evento é editado ENTÃO o sistema SHALL notificar todos os inscritos
5. QUANDO evento é cancelado ENTÃO o sistema SHALL notificar e processar reembolsos se aplicável

### Requisito 8: Sistema de Recuperação de Senha

**User Story:** Como usuário que esqueceu a senha, eu quero poder recuperá-la de forma segura, para que eu possa acessar minha conta novamente.

#### Acceptance Criteria

1. QUANDO usuário esquece senha ENTÃO o sistema SHALL oferecer opção "Esqueci minha senha"
2. QUANDO usuário solicita recuperação ENTÃO o sistema SHALL enviar email com link seguro
3. QUANDO usuário clica no link ENTÃO o sistema SHALL permitir criação de nova senha
4. QUANDO nova senha é criada ENTÃO o sistema SHALL invalidar link de recuperação
5. QUANDO processo é concluído ENTÃO o sistema SHALL confirmar alteração por email

### Requisito 9: Integração Twilio para WhatsApp e SMS

**User Story:** Como usuário cadastrado, eu quero receber notificações por WhatsApp e SMS, para que eu tenha múltiplas formas de ser comunicado sobre meus eventos.

#### Acceptance Criteria

1. QUANDO usuário se cadastra ENTÃO o sistema SHALL enviar confirmação por WhatsApp e SMS
2. QUANDO faltam 48h para evento ENTÃO o sistema SHALL enviar lembrete por ambos os canais
3. QUANDO faltam 2h para evento ENTÃO o sistema SHALL enviar lembrete final com localização
4. QUANDO evento é cancelado ENTÃO o sistema SHALL notificar por WhatsApp e SMS
5. QUANDO há mudanças no evento ENTÃO o sistema SHALL informar por ambos os canais

### Requisito 10: Card de Organizadores no Painel Admin

**User Story:** Como administrador, eu quero ter acesso rápido à gestão de organizadores no painel principal, para que eu possa gerenciar facilmente os parceiros locais.

#### Acceptance Criteria

1. QUANDO administrador acessa painel principal ENTÃO SHALL ver card "Organizadores Locais"
2. QUANDO administrador clica no card ENTÃO SHALL ser redirecionado para gestão de organizadores
3. QUANDO card é exibido ENTÃO SHALL mostrar informações resumidas dos organizadores
4. QUANDO há organizadores pendentes ENTÃO SHALL destacar visualmente no card
5. QUANDO card é atualizado ENTÃO SHALL refletir dados em tempo real