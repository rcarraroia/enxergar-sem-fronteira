# Análise de Segurança das Políticas RLS - Supabase

## 🚨 Problemas Críticos Identificados

### 1. **Políticas Públicas Excessivamente Permissivas**

#### Events Table

```sql
-- PROBLEMA: Acesso público total para leitura
CREATE POLICY "Events are public for reading" ON public.events
    FOR SELECT USING (true);
```

**Risco**: Qualquer pessoa pode acessar todos os eventos, incluindo informações
sensíveis.

#### Registrations Table

```sql
-- PROBLEMA: Acesso público total para leitura
CREATE POLICY "Registrations are public for reading" ON public.registrations
    FOR SELECT USING (true);
```

**Risco**: Dados de inscrições de pacientes expostos publicamente.

### 2. **Autenticação Baseada em Padrão de Email (Vulnerável)**

```sql
-- PROBLEMA: Verificação de admin baseada em padrão de email
auth.jwt() ->> 'email' LIKE '%@admin.%'
```

**Risco**: Qualquer pessoa pode criar um email com padrão @admin.\* e obter
acesso administrativo.

### 3. **Chaves de API Armazenadas no Banco**

Na tabela `organizers`:

- `asaas_api_key` - Chave da API de pagamentos
- `whatsapp_api_key` - Chave da API do WhatsApp

**Risco**: Chaves sensíveis expostas no banco de dados.

### 4. **Falta de Coluna `role` na Tabela Organizers**

Analisando o schema TypeScript, a tabela `organizers` não possui a coluna `role`
que foi adicionada nas migrações.

## 🔧 Correções Necessárias

### 1. **Implementar Políticas RLS Restritivas**

#### Para Events:

```sql
-- Substituir política pública por política baseada em contexto
DROP POLICY "Events are public for reading" ON public.events;

CREATE POLICY "Public can view active events basic info" ON public.events
    FOR SELECT USING (
        status = 'active' AND
        -- Apenas campos não sensíveis
        true
    );

CREATE POLICY "Organizers can view own events" ON public.events
    FOR SELECT USING (
        organizer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.organizers
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

#### Para Registrations:

```sql
-- Remover acesso público total
DROP POLICY "Registrations are public for reading" ON public.registrations;

CREATE POLICY "Organizers can view own event registrations" ON public.registrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = event_date_id
            AND (
                e.organizer_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.organizers
                    WHERE id = auth.uid() AND role = 'admin'
                )
            )
        )
    );
```

### 2. **Implementar Sistema de Roles Seguro**

```sql
-- Adicionar coluna role se não existir
ALTER TABLE public.organizers
ADD COLUMN IF NOT EXISTS role text DEFAULT 'organizer'
CHECK (role IN ('admin', 'organizer', 'viewer'));

-- Atualizar usuários admin existentes
UPDATE public.organizers
SET role = 'admin'
WHERE email IN ('rcarraro@admin.enxergar');
```

### 3. **Mover Chaves de API para Variáveis de Ambiente**

```sql
-- Remover chaves sensíveis do banco
ALTER TABLE public.organizers
DROP COLUMN IF EXISTS asaas_api_key,
DROP COLUMN IF EXISTS whatsapp_api_key;

-- Criar tabela de configurações criptografadas (se necessário)
CREATE TABLE IF NOT EXISTS encrypted_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id uuid REFERENCES organizers(id),
    setting_key text NOT NULL,
    encrypted_value text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

### 4. **Implementar Função de Verificação de Admin Segura**

```sql
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organizers
        WHERE id = auth.uid()
        AND role = 'admin'
        AND status = 'active'
    );
END;
$$;
```

## 📋 Plano de Implementação

### Fase 1: Correções Críticas Imediatas

1. ✅ Adicionar coluna `role` à tabela organizers
2. ✅ Atualizar usuários admin existentes
3. ✅ Implementar função `is_admin_user()` segura

### Fase 2: Políticas RLS Restritivas

1. 🔄 Substituir políticas públicas por políticas baseadas em roles
2. 🔄 Implementar políticas granulares para cada tabela
3. 🔄 Testar acesso com diferentes tipos de usuário

### Fase 3: Segurança de Dados Sensíveis

1. ⏳ Mover chaves de API para variáveis de ambiente
2. ⏳ Implementar criptografia para dados sensíveis restantes
3. ⏳ Criar sistema de auditoria de acesso

## 🧪 Testes de Validação

### Cenários de Teste:

1. **Usuário não autenticado**: Deve ter acesso mínimo apenas a eventos públicos
2. **Organizador comum**: Deve acessar apenas seus próprios dados
3. **Admin**: Deve ter acesso completo conforme necessário
4. **Tentativa de escalação**: Verificar se padrões de email não funcionam mais

### Comandos de Teste:

```sql
-- Testar acesso não autenticado
SET ROLE anon;
SELECT * FROM events; -- Deve retornar apenas eventos públicos básicos

-- Testar acesso de organizador
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "organizer-uuid", "email": "organizer@test.com"}';
SELECT * FROM events; -- Deve retornar apenas eventos próprios

-- Testar acesso admin
SET request.jwt.claims TO '{"sub": "admin-uuid", "email": "admin@test.com"}';
SELECT * FROM events; -- Deve retornar todos os eventos
```

## 🎯 Próximos Passos

1. **Executar migrações de segurança**
2. **Atualizar código frontend** para usar novo sistema de roles
3. **Implementar testes automatizados** para políticas RLS
4. **Configurar monitoramento** de tentativas de acesso não autorizado
5. **Documentar** novas políticas de segurança

---

**Status**: 🔴 CRÍTICO - Implementação imediata necessária **Prioridade**:
ALTA - Vulnerabilidades de segurança ativas **Impacto**: Sistema de produção
exposto a riscos de segurança
