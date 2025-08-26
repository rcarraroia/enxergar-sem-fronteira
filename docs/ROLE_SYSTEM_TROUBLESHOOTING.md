# Troubleshooting do Sistema de Roles

Este documento fornece soluções para problemas comuns relacionados ao sistema de
roles baseado em metadados.

## 🚨 Problemas Críticos

### 1. **Erro: "cannot drop function is_admin_user() because other objects depend on it"**

**Causa**: Muitas políticas RLS dependem da função `is_admin_user()`.

**Solução**:

```sql
-- NÃO tente fazer DROP da função
-- Em vez disso, apenas atualize a implementação:

CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.organizers
    WHERE id = auth.uid()
    AND role = 'admin'
    AND status = 'active'
  );
END;
$$;
```

### 2. **Admin perdeu acesso após migração**

**Causa**: Role não foi atribuído corretamente durante a migração.

**Solução**:

```sql
-- Verificar se usuário existe na tabela organizers
SELECT id, name, email, role, status
FROM public.organizers
WHERE email = 'seu-email@admin.enxergar';

-- Se não existir, criar:
INSERT INTO public.organizers (name, email, role, status)
VALUES ('Seu Nome', 'seu-email@admin.enxergar', 'admin', 'active');

-- Se existir mas role está errado, atualizar:
UPDATE public.organizers
SET role = 'admin', status = 'active'
WHERE email = 'seu-email@admin.enxergar';
```

### 3. **Função is_admin_user() retorna sempre false**

**Causa**: Usuário não está na tabela organizers ou auth.uid() não corresponde.

**Diagnóstico**:

```sql
-- Verificar auth.uid() atual
SELECT auth.uid() as current_user_id;

-- Verificar se existe na tabela organizers
SELECT * FROM public.organizers WHERE id = auth.uid();

-- Testar função manualmente
SELECT is_admin_user() as is_admin;
```

**Solução**:

```sql
-- Vincular usuário autenticado à tabela organizers
UPDATE public.organizers
SET id = auth.uid()
WHERE email = 'seu-email@admin.enxergar';
```

## ⚠️ Problemas Comuns

### 4. **Políticas RLS ainda usam verificação de email**

**Diagnóstico**:

```sql
-- Encontrar políticas que ainda usam email
SELECT schemaname, tablename, policyname, qual::text as policy_definition
FROM pg_policies
WHERE qual::text LIKE '%@admin%'
OR qual::text LIKE '%admin.%';
```

**Solução**:

```sql
-- Exemplo: Atualizar política para usar is_admin_user()
DROP POLICY IF EXISTS "Old email policy" ON table_name;
CREATE POLICY "New role policy" ON table_name
FOR ALL USING (is_admin_user());
```

### 5. **Frontend não reconhece novo sistema de roles**

**Causa**: Hook useAuth ainda usa verificação antiga.

**Solução**: Verificar se o hook foi atualizado:

```typescript
// Deve usar ID em vez de email
const { data: organizerData } = await supabase
  .from('organizers')
  .select('role, status')
  .eq('id', user.id) // ✅ Correto
  .eq('status', 'active');
```

### 6. **Edge Functions retornam erro de permissão**

**Causa**: Edge Function ainda usa verificação de email.

**Solução**: Atualizar para usar sistema de roles:

```typescript
// Antes (inseguro)
if (!user.email?.includes('@admin.enxergar')) {
  throw new Error('Access denied');
}

// Depois (seguro)
const { data: organizerData } = await supabase
  .from('organizers')
  .select('role, status')
  .eq('id', user.id)
  .eq('status', 'active')
  .single();

if (!organizerData || organizerData.role !== 'admin') {
  throw new Error('Access denied');
}
```

## 🔧 Comandos de Diagnóstico

### Verificar Status do Sistema

```sql
-- 1. Verificar se coluna role existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'organizers' AND column_name = 'role';

-- 2. Verificar distribuição de roles
SELECT role, COUNT(*) as count,
       COUNT(CASE WHEN status = 'active' THEN 1 END) as active
FROM public.organizers
GROUP BY role;

-- 3. Verificar função is_admin_user
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'is_admin_user';

-- 4. Testar função com usuário atual
SELECT
  auth.uid() as user_id,
  auth.email() as user_email,
  is_admin_user() as is_admin,
  get_user_role() as user_role;
```

### Verificar Políticas RLS

```sql
-- Listar todas as políticas que usam is_admin_user
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE qual LIKE '%is_admin_user%'
ORDER BY tablename;

-- Verificar políticas problemáticas
SELECT schemaname, tablename, policyname, qual::text as policy_definition
FROM pg_policies
WHERE qual::text LIKE '%@admin%'
ORDER BY tablename;
```

## 🛠️ Scripts de Correção

### Script 1: Corrigir Usuário Admin

```sql
-- Corrigir usuário admin principal
DO $$
DECLARE
  admin_email text := 'rcarraro@admin.enxergar';
  current_uid uuid;
BEGIN
  -- Obter UUID do usuário atual (se logado)
  SELECT auth.uid() INTO current_uid;

  -- Se usuário não existe na tabela organizers, criar
  IF NOT EXISTS (SELECT 1 FROM public.organizers WHERE email = admin_email) THEN
    INSERT INTO public.organizers (id, name, email, role, status)
    VALUES (current_uid, 'Admin User', admin_email, 'admin', 'active');
    RAISE NOTICE 'Admin user created';
  ELSE
    -- Atualizar role e status
    UPDATE public.organizers
    SET role = 'admin', status = 'active', id = COALESCE(id, current_uid)
    WHERE email = admin_email;
    RAISE NOTICE 'Admin user updated';
  END IF;
END $$;
```

### Script 2: Migrar Políticas Restantes

```sql
-- Encontrar e listar políticas que precisam ser atualizadas
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname, qual::text as policy_definition
    FROM pg_policies
    WHERE qual::text LIKE '%@admin%'
  LOOP
    RAISE NOTICE 'Policy needs update: %.% - %',
      policy_record.schemaname,
      policy_record.tablename,
      policy_record.policyname;
  END LOOP;
END $$;
```

### Script 3: Validação Completa

```sql
-- Executar validação completa do sistema
\i supabase/validate_role_system.sql
```

## 📱 Problemas no Frontend

### 1. **useAuth não atualiza role**

**Solução**:

```typescript
// Forçar refresh do role
const { refreshRole } = useRoles();
await refreshRole();
```

### 2. **ProtectedRoute não funciona**

**Verificar**:

- Hook useRoles está sendo usado
- Roles estão sendo verificados corretamente
- Loading states estão sendo tratados

### 3. **Componente RoleManagement não carrega**

**Verificar**:

- Usuário tem role admin
- Políticas RLS permitem acesso à tabela organizers
- Função assign_user_role existe e tem permissões

## 🔍 Logs e Monitoramento

### Habilitar Logs Detalhados

```sql
-- Habilitar logs de RLS
SET log_statement = 'all';
SET log_min_messages = 'debug1';

-- Testar política específica
SELECT * FROM public.organizers; -- Deve mostrar logs RLS
```

### Monitorar Mudanças de Role

```sql
-- Ver últimas mudanças de role
SELECT
  ral.*,
  u.name as user_name,
  cb.name as changed_by_name
FROM public.role_audit_log ral
LEFT JOIN public.organizers u ON ral.user_id = u.id
LEFT JOIN public.organizers cb ON ral.changed_by = cb.id
ORDER BY ral.changed_at DESC
LIMIT 10;
```

## 🚨 Recuperação de Emergência

### Se perdeu acesso admin completamente:

1. **Acesso direto ao banco**:

```sql
-- Conectar como superuser do banco
UPDATE public.organizers
SET role = 'admin', status = 'active'
WHERE email = 'seu-email@admin.enxergar';
```

2. **Recriar função is_admin_user**:

```sql
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN
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

3. **Verificar auth.uid()**:

```sql
-- Se auth.uid() não corresponde, atualizar
UPDATE public.organizers
SET id = (SELECT id FROM auth.users WHERE email = 'seu-email@admin.enxergar')
WHERE email = 'seu-email@admin.enxergar';
```

## 📞 Suporte

Se os problemas persistirem:

1. Execute o script de validação completo
2. Colete logs de erro específicos
3. Verifique se todas as migrações foram aplicadas
4. Teste em ambiente de desenvolvimento primeiro

## 📚 Recursos Relacionados

- [Sistema de Roles](./ROLE_BASED_ACCESS_CONTROL.md)
- [Padrões de Segurança](./SECURITY_GUIDE.md)
- [Guia de Migração](./MIGRATION_GUIDE.md)
