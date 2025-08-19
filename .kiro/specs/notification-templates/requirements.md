# Requirements Document

## Introduction

Este documento define os requisitos para implementar um módulo completo de Gerenciamento de Templates de Comunicação no Painel Administrativo do sistema Enxergar sem Fronteiras. O objetivo é desacoplar o conteúdo das mensagens da lógica de envio, permitindo que administradores criem, editem e gerenciem templates de email e WhatsApp de forma dinâmica.

## Requirements

### Requirement 1

**User Story:** Como administrador do sistema, eu quero gerenciar templates de notificação através de uma interface dedicada, para que eu possa personalizar as mensagens enviadas aos pacientes sem depender de alterações no código.

#### Acceptance Criteria

1. WHEN o administrador acessa o painel administrativo THEN o sistema SHALL exibir um novo card "Gerenciar Notificações" na seção "Operações Principais"
2. WHEN o administrador clica no card de notificações THEN o sistema SHALL abrir uma interface com abas separadas para "Email" e "WhatsApp"
3. WHEN o administrador seleciona uma aba THEN o sistema SHALL exibir a lista de templates existentes para aquele canal
4. WHEN não existem templates THEN o sistema SHALL exibir uma mensagem informativa com botão para criar o primeiro template

### Requirement 2

**User Story:** Como administrador, eu quero criar novos templates de notificação com variáveis dinâmicas, para que eu possa personalizar mensagens para diferentes situações e canais de comunicação.

#### Acceptance Criteria

1. WHEN o administrador clica em "Novo Template" THEN o sistema SHALL abrir um formulário de criação
2. WHEN o administrador preenche o formulário THEN o sistema SHALL validar os campos obrigatórios (name, type, content)
3. WHEN o template é do tipo "email" THEN o sistema SHALL exigir o campo "subject"
4. WHEN o administrador salva um template válido THEN o sistema SHALL criar um registro na tabela notification_templates
5. WHEN o template é salvo com sucesso THEN o sistema SHALL exibir uma mensagem de confirmação e atualizar a lista
6. WHEN o administrador cancela a criação THEN o sistema SHALL descartar as alterações e retornar à lista

### Requirement 3

**User Story:** Como administrador, eu quero editar templates existentes, para que eu possa atualizar o conteúdo das mensagens conforme necessário.

#### Acceptance Criteria

1. WHEN o administrador clica em "Editar" em um template THEN o sistema SHALL abrir o formulário preenchido com os dados atuais
2. WHEN o administrador modifica os campos THEN o sistema SHALL permitir alterações em name, subject, content e is_active
3. WHEN o administrador salva as alterações THEN o sistema SHALL atualizar o registro no banco de dados
4. WHEN a atualização é bem-sucedida THEN o sistema SHALL exibir confirmação e atualizar a lista
5. WHEN há erro na validação THEN o sistema SHALL exibir mensagens de erro específicas

### Requirement 4

**User Story:** Como administrador, eu quero duplicar templates existentes, para que eu possa criar variações rapidamente sem começar do zero.

#### Acceptance Criteria

1. WHEN o administrador clica em "Duplicar" THEN o sistema SHALL criar uma cópia do template com nome modificado
2. WHEN o template é duplicado THEN o sistema SHALL adicionar sufixo " - Cópia" ao nome
3. WHEN a duplicação é concluída THEN o sistema SHALL abrir o formulário de edição da cópia
4. WHEN o administrador salva a cópia THEN o sistema SHALL criar um novo registro no banco

### Requirement 5

**User Story:** Como administrador, eu quero desativar ou excluir templates, para que eu possa gerenciar quais templates estão disponíveis para uso.

#### Acceptance Criteria

1. WHEN o administrador clica no toggle de ativação THEN o sistema SHALL alterar o status is_active do template
2. WHEN o administrador clica em "Excluir" THEN o sistema SHALL exibir confirmação de exclusão
3. WHEN a exclusão é confirmada THEN o sistema SHALL remover o template do banco de dados
4. WHEN o template está sendo usado THEN o sistema SHALL exibir aviso antes da exclusão
5. WHEN a operação é concluída THEN o sistema SHALL atualizar a lista automaticamente

### Requirement 6

**User Story:** Como administrador, eu quero visualizar variáveis dinâmicas disponíveis, para que eu possa criar templates personalizados corretamente.

#### Acceptance Criteria

1. WHEN o administrador está criando/editando um template THEN o sistema SHALL exibir uma lista de variáveis disponíveis
2. WHEN o administrador clica em uma variável THEN o sistema SHALL inserir a variável no campo content na posição do cursor
3. WHEN o template é do tipo "email" THEN o sistema SHALL mostrar variáveis específicas para email
4. WHEN o template é do tipo "whatsapp" THEN o sistema SHALL mostrar variáveis específicas para WhatsApp
5. WHEN o administrador passa o mouse sobre uma variável THEN o sistema SHALL exibir uma descrição da variável

### Requirement 7

**User Story:** Como administrador, eu quero que o botão "Enviar Lembretes" use os templates configurados, para que as mensagens enviadas reflitam o conteúdo personalizado.

#### Acceptance Criteria

1. WHEN o administrador clica em "Enviar Lembretes" THEN o sistema SHALL chamar a Edge Function trigger-reminders
2. WHEN a Edge Function é executada THEN o sistema SHALL buscar templates ativos na tabela notification_templates
3. WHEN templates são encontrados THEN o sistema SHALL substituir variáveis dinâmicas pelos dados reais
4. WHEN as mensagens são enviadas THEN o sistema SHALL usar o conteúdo dos templates configurados
5. WHEN não há templates ativos THEN o sistema SHALL exibir erro informativo

### Requirement 8

**User Story:** Como sistema, eu preciso garantir segurança no acesso aos templates, para que apenas administradores possam gerenciar as notificações.

#### Acceptance Criteria

1. WHEN um usuário não-admin tenta acessar templates THEN o sistema SHALL negar o acesso
2. WHEN políticas RLS são aplicadas THEN o sistema SHALL permitir apenas operações autorizadas
3. WHEN um admin faz login THEN o sistema SHALL permitir acesso completo aos templates
4. WHEN há tentativa de acesso não autorizado THEN o sistema SHALL registrar o evento para auditoria
5. WHEN operações são realizadas THEN o sistema SHALL validar permissões em tempo real

### Requirement 9

**User Story:** Como desenvolvedor, eu quero que as Edge Functions busquem templates dinamicamente, para que o sistema seja flexível e não dependa de código hardcoded.

#### Acceptance Criteria

1. WHEN uma Edge Function de email é executada THEN o sistema SHALL buscar template por name na tabela
2. WHEN uma Edge Function de WhatsApp é executada THEN o sistema SHALL buscar template correspondente
3. WHEN variáveis são processadas THEN o sistema SHALL substituir {{variable}} pelos dados reais
4. WHEN template não é encontrado THEN o sistema SHALL usar template padrão ou retornar erro
5. WHEN dados do paciente/evento são necessários THEN o sistema SHALL buscar nas tabelas relacionadas

### Requirement 10

**User Story:** Como administrador, eu quero preview das mensagens com dados de exemplo, para que eu possa visualizar como ficará a mensagem final antes de salvar.

#### Acceptance Criteria

1. WHEN o administrador está editando um template THEN o sistema SHALL oferecer opção de preview
2. WHEN o preview é solicitado THEN o sistema SHALL mostrar a mensagem com variáveis substituídas por dados de exemplo
3. WHEN o template tem erros de sintaxe THEN o sistema SHALL destacar os problemas no preview
4. WHEN variáveis inválidas são usadas THEN o sistema SHALL exibir avisos no preview
5. WHEN o preview é atualizado THEN o sistema SHALL refletir mudanças em tempo real