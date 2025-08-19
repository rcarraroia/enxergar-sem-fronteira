-- Migration: Insert default notification templates
-- Description: Add default email and WhatsApp templates with dynamic variables
-- Date: 2025-01-19

-- Insert default email confirmation template
INSERT INTO notification_templates (name, type, subject, content, is_active) VALUES
('confirmacao_cadastro_email', 'email', 'Confirmação de Cadastro - {{event_title}}', 
'Olá {{patient_name}},

Sua inscrição para o evento "{{event_title}}" foi confirmada com sucesso! 🎉

📋 **DETALHES DO SEU ATENDIMENTO:**

📅 **Data:** {{event_date}}
⏰ **Horário:** {{event_time}}
📍 **Local:** {{event_location}}
🏠 **Endereço:** {{event_address}}

⚠️ **INSTRUÇÕES IMPORTANTES:**
• Chegue com 30 minutos de antecedência
• Traga um documento com foto (RG, CNH ou Carteira de Trabalho)
• Traga seus óculos atuais (se possuir)
• Em caso de chuva, o evento será mantido

❓ **Dúvidas?**
Entre em contato conosco através do WhatsApp ou email.

{{#confirmation_link}}
🔗 **Confirme sua presença:** {{confirmation_link}}
{{/confirmation_link}}

Atenciosamente,
**Equipe Enxergar sem Fronteiras** 👁️

---
*Este é um email automático. Por favor, não responda.*', true),

-- Insert default WhatsApp reminder template (48h before)
('lembrete_whatsapp_48h', 'whatsapp', NULL,
'🔔 *LEMBRETE IMPORTANTE*

Olá *{{patient_name}}*! 👋

Lembramos que você tem um atendimento oftalmológico agendado:

📅 *{{event_date}}* às *{{event_time}}*
📍 *{{event_location}}*
🏠 {{event_address}}

⚠️ *IMPORTANTE:*
• Chegue com *30 minutos* de antecedência
• Traga *documento com foto*
• Traga seus *óculos atuais* (se tiver)

🌧️ Em caso de chuva, o evento será mantido normalmente.

Nos vemos lá! 😊

_Enxergar sem Fronteiras_ 👁️', true),

-- Insert default WhatsApp reminder template (24h before)
('lembrete_whatsapp_24h', 'whatsapp', NULL,
'⏰ *LEMBRETE - AMANHÃ É O DIA!*

Oi *{{patient_name}}*! 

Seu atendimento oftalmológico é *AMANHÃ*:

📅 *{{event_date}}* às *{{event_time}}*
📍 *{{event_location}}*

✅ *CHECKLIST:*
□ Documento com foto
□ Óculos atuais (se tiver)
□ Chegar 30min antes

Estamos ansiosos para te atender! 🤗

_Enxergar sem Fronteiras_ 👁️', true),

-- Insert default email reminder template
('lembrete_email_24h', 'email', 'Lembrete: Seu atendimento é amanhã - {{event_title}}',
'Olá {{patient_name}},

Este é um lembrete amigável de que seu atendimento oftalmológico é **AMANHÃ**! 

📋 **DETALHES DO SEU ATENDIMENTO:**

📅 **Data:** {{event_date}}
⏰ **Horário:** {{event_time}}
📍 **Local:** {{event_location}}
🏠 **Endereço:** {{event_address}}

✅ **CHECKLIST PARA AMANHÃ:**
- [ ] Documento com foto (RG, CNH ou Carteira de Trabalho)
- [ ] Óculos atuais (se possuir)
- [ ] Chegar com 30 minutos de antecedência

🌧️ **Importante:** Em caso de chuva, o evento será mantido normalmente.

Estamos ansiosos para te atender e cuidar da sua visão! 

Até amanhã! 👋

**Equipe Enxergar sem Fronteiras** 👁️

---
*Este é um email automático. Por favor, não responda.*', true),

-- Insert default WhatsApp confirmation template
('confirmacao_whatsapp', 'whatsapp', NULL,
'✅ *INSCRIÇÃO CONFIRMADA!*

Parabéns *{{patient_name}}*! 🎉

Sua inscrição para o atendimento oftalmológico foi confirmada:

📅 *{{event_date}}* às *{{event_time}}*
📍 *{{event_location}}*
🏠 {{event_address}}

📝 *ANOTE ESSAS INFORMAÇÕES:*
• Chegue *30 minutos antes*
• Traga *documento com foto*
• Traga seus *óculos* (se tiver)

Enviaremos lembretes próximo à data! 📲

_Enxergar sem Fronteiras_ 👁️', true);

-- Verify templates were inserted correctly
DO $$
DECLARE
    template_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO template_count FROM notification_templates;
    
    IF template_count >= 5 THEN
        RAISE NOTICE 'Successfully inserted % default templates', template_count;
    ELSE
        RAISE EXCEPTION 'Failed to insert all default templates. Only % found', template_count;
    END IF;
END $$;