# 🚨 GUIA DE MIGRAÇÃO SEGURA - PRODUÇÃO ATIVA

## ⚠️ CONTEXTO CRÍTICO
- Site em produção com inscrições ativas
- Qualquer erro pode impactar pacientes tentando se inscrever
- Migração adiciona apenas novos campos (não modifica existentes)

## 🔍 VALIDAÇÃO PRÉ-MIGRAÇÃO

### 1. Executar script de validação:
```bash
python scripts/validate_migration.py
```

### 2. Verificar manualmente no Supabase Dashboard:
- Acessar tabela `registrations`
- Confirmar que campos novos não existem
- Verificar se há inscrições recentes

## 🛡️ APLICAÇÃO SEGURA DA MIGRAÇÃO

### Opção 1: Via Supabase Dashboard (RECOMENDADO)
1. Acessar Supabase Dashboard → SQL Editor
2. Copiar conteúdo de `supabase/migrations/20250928000001_add_event_control_fields_to_registrations.sql`
3. Executar comando por comando (não tudo de uma vez)
4. Verificar cada comando antes de executar o próximo

### Opção 2: Via CLI (apenas se ambiente local configurado)
```bash
npx supabase db push
```

## 🔒 COMANDOS SEGUROS DA MIGRAÇÃO

```sql
-- 1. BACKUP (EXECUTAR PRIMEIRO)
CREATE TABLE registrations_backup_20250928 AS
SELECT * FROM registrations LIMIT 0;

-- 2. ADICIONAR CAMPOS (um por vez)
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS attendance_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS attendance_confirmed_at TIMESTAMP;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS purchased_glasses BOOLEAN DEFAULT FALSE;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS glasses_purchase_amount DECIMAL(10,2);
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS process_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS attended_by VARCHAR(255);

-- 3. ÍNDICES (opcional, pode ser feito depois)
CREATE INDEX IF NOT EXISTS idx_registrations_attendance_confirmed ON registrations(attendance_confirmed);
CREATE INDEX IF NOT EXISTS idx_registrations_purchased_glasses ON registrations(purchased_glasses);
CREATE INDEX IF NOT EXISTS idx_registrations_process_completed ON registrations(process_completed);
```

## ✅ VERIFICAÇÃO PÓS-MIGRAÇÃO

### 1. Verificar se campos foram adicionados:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'registrations'
AND column_name IN ('attendance_confirmed', 'purchased_glasses', 'process_completed');
```

### 2. Verificar se dados existentes não foram afetados:
```sql
SELECT COUNT(*) FROM registrations;
SELECT COUNT(*) FROM registrations WHERE attendance_confirmed IS NULL;
```

### 3. Testar uma inscrição nova:
- Fazer uma inscrição de teste
- Verificar se processo continua funcionando normalmente

## 🚨 PLANO DE ROLLBACK

Se algo der errado:

```sql
-- REMOVER CAMPOS ADICIONADOS (CUIDADO!)
ALTER TABLE registrations DROP COLUMN IF EXISTS attendance_confirmed;
ALTER TABLE registrations DROP COLUMN IF EXISTS attendance_confirmed_at;
ALTER TABLE registrations DROP COLUMN IF EXISTS purchased_glasses;
ALTER TABLE registrations DROP COLUMN IF EXISTS glasses_purchase_amount;
ALTER TABLE registrations DROP COLUMN IF EXISTS process_completed;
ALTER TABLE registrations DROP COLUMN IF EXISTS completed_at;
ALTER TABLE registrations DROP COLUMN IF EXISTS attended_by;

-- REMOVER ÍNDICES
DROP INDEX IF EXISTS idx_registrations_attendance_confirmed;
DROP INDEX IF EXISTS idx_registrations_purchased_glasses;
DROP INDEX IF EXISTS idx_registrations_process_completed;
```

## 📞 CONTATOS DE EMERGÊNCIA
- Monitorar site após migração
- Ter backup da base de dados
- Testar fluxo de inscrição imediatamente após migração

## ⏰ MELHOR HORÁRIO PARA APLICAR
- Madrugada (menor tráfego)
- Fora do horário de pico de inscrições
- Com equipe disponível para monitoramento
