# Guia do Usuário - Templates de Notificação

## Visão Geral

O sistema de Templates de Notificação permite que administradores criem e gerenciem templates personalizados para emails e mensagens WhatsApp enviadas automaticamente pelo sistema Enxergar sem Fronteiras.

## Acessando o Sistema

1. Faça login como administrador no sistema
2. Navegue para a página **Admin**
3. Localize o card **"Templates de Notificação"** na seção "Operações Principais"
4. Clique no card para acessar o gerenciador de templates

## Tipos de Templates

### Templates de Email
- Usados para confirmações de inscrição e lembretes por email
- Requerem **assunto** e **conteúdo**
- Suportam formatação HTML básica
- Incluem cabeçalho e rodapé automáticos

### Templates de WhatsApp
- Usados para lembretes via WhatsApp
- Requerem apenas **conteúdo**
- Limitados a 4096 caracteres
- Suportam emojis e formatação simples

## Criando um Novo Template

### Passo 1: Acessar o Formulário
1. Clique na aba correspondente (Email ou WhatsApp)
2. Clique no botão **"Novo Template"**
3. O formulário de criação será exibido

### Passo 2: Preencher Informações Básicas
- **Nome do Template**: Identificador único (apenas letras, números, _ e -)
- **Assunto** (apenas email): Título do email que será enviado
- **Conteúdo**: Corpo da mensagem

### Passo 3: Usar Variáveis
Utilize as variáveis disponíveis para personalizar suas mensagens:

#### Variáveis de Paciente
- `{{patient_name}}` - Nome completo do paciente
- `{{patient_email}}` - Email do paciente

#### Variáveis de Evento
- `{{event_title}}` - Título do evento
- `{{event_date}}` - Data do evento (DD/MM/YYYY)
- `{{event_time}}` - Horário do evento (HH:MM - HH:MM)
- `{{event_location}}` - Nome do local
- `{{event_address}}` - Endereço completo
- `{{event_city}}` - Cidade do evento

#### Variáveis do Sistema
- `{{confirmation_link}}` - Link para confirmação
- `{{unsubscribe_link}}` - Link para descadastro

### Passo 4: Visualizar Preview
- O preview é atualizado em tempo real
- Mostra como a mensagem ficará para o destinatário
- Exibe erros de validação, se houver

### Passo 5: Salvar Template
1. Clique em **"Salvar"**
2. O template será criado e ativado automaticamente

## Editando Templates Existentes

1. Localize o template na lista
2. Clique no ícone de **edição** (lápis)
3. Modifique os campos desejados
4. Clique em **"Salvar"** para confirmar as alterações

## Gerenciando Status dos Templates

### Ativar/Desativar Templates
- Use o botão de toggle na lista de templates
- Templates inativos não são usados pelo sistema
- Mantenha apenas um template ativo por tipo quando possível

### Excluir Templates
1. Clique no ícone de **exclusão** (lixeira)
2. Confirme a exclusão no diálogo
3. **Atenção**: Esta ação não pode ser desfeita

## Exemplos de Templates

### Template de Confirmação de Email
```
Nome: confirmacao_inscricao
Assunto: Confirmação de Inscrição - {{event_title}}

Conteúdo:
Olá {{patient_name}}!

Sua inscrição foi confirmada com sucesso para:

📅 **Evento**: {{event_title}}
📅 **Data**: {{event_date}}
⏰ **Horário**: {{event_time}}
📍 **Local**: {{event_location}}
🏠 **Endereço**: {{event_address}}

**Informações importantes:**
- Chegue com 30 minutos de antecedência
- Traga documento de identidade
- Use roupas confortáveis

Aguardamos você!

Equipe Enxergar sem Fronteiras
```

### Template de Lembrete WhatsApp
```
Nome: lembrete_whatsapp_24h
Conteúdo:
🔔 *Lembrete - {{event_title}}*

Olá {{patient_name}}! 

Lembramos que você tem atendimento marcado para *amanhã*:

📅 Data: {{event_date}}
⏰ Horário: {{event_time}}
📍 Local: {{event_location}}
🏠 Endereço: {{event_address}}

⚠️ *Importante*:
• Chegue 30min antes
• Traga documento com foto
• Use roupas confortáveis

Nos vemos lá! 👁️✨
```

## Boas Práticas

### Nomenclatura de Templates
- Use nomes descritivos: `confirmacao_email`, `lembrete_whatsapp_48h`
- Inclua o tipo e timing: `_24h`, `_48h`, `_confirmacao`
- Use apenas letras minúsculas, números e underscores

### Conteúdo das Mensagens
- **Seja claro e objetivo**
- **Use linguagem amigável**
- **Inclua informações essenciais**
- **Adicione instruções importantes**
- **Use emojis com moderação**

### Variáveis Obrigatórias
- **Email**: Sempre inclua `{{patient_name}}` e `{{event_title}}`
- **WhatsApp**: Sempre inclua `{{patient_name}}` para personalização

### Formatação
- **Email**: Use **negrito** e *itálico* para destacar informações
- **WhatsApp**: Use *asteriscos* para negrito e _underscores_ para itálico
- **Quebras de linha**: Use para organizar o conteúdo

## Solução de Problemas

### Erro: "Variável desconhecida"
- Verifique se a variável está na lista de variáveis disponíveis
- Confirme a grafia: `{{patient_name}}` (não `{{nome_paciente}}`)

### Erro: "Nome deve conter apenas..."
- Use apenas letras, números, hífen (-) e underscore (_)
- Não use espaços ou caracteres especiais

### Erro: "Conteúdo muito longo"
- **Email**: Máximo 5000 caracteres
- **WhatsApp**: Máximo 4096 caracteres

### Template não aparece no envio
- Verifique se o template está **ativo**
- Confirme se não há erros de validação
- Verifique se o nome está correto

### Preview não atualiza
- Aguarde alguns segundos após digitar
- Verifique se há erros de sintaxe nas variáveis
- Recarregue a página se necessário

## Monitoramento

### Verificar Envios
1. Acesse **Dashboard Admin**
2. Verifique a seção **"Atividades Recentes"**
3. Procure por atividades de envio de templates

### Logs do Sistema
- Os envios são registrados automaticamente
- Erros são exibidos na interface administrativa
- Contate o suporte técnico em caso de problemas persistentes

## Suporte

Para dúvidas ou problemas:
1. Consulte este guia primeiro
2. Verifique a seção de solução de problemas
3. Entre em contato com a equipe técnica
4. Forneça detalhes específicos do erro ou dúvida

---

**Versão do Documento**: 1.0  
**Última Atualização**: Janeiro 2025  
**Sistema**: Enxergar sem Fronteiras - Templates de Notificação