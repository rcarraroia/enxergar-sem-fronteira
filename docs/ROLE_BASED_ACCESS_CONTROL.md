# Sistema de Controle de Acesso Baseado em Roles (RBAC)

Este documento descreve o sistema de controle de acesso baseado em roles implementado para substituir a verificação insegura baseada em padrões de email.

## 🎯 Objetivo

Implementar um sistema seguro de controle de acesso que:
- Elimina vulnerabilidades de segurança baseadas em padrões de email
- Fornece controle granular de permissões
- Permite auditoria completa de mudanças de roles
- Facilita o gerenciamento de usuários

## 🏗️ Arquitetura do Sistema

### 1. **Estrutura de Roles**

```typescript
type UserRole = 'admin' | 'organizer' | 'viewer' | 'user'
```

#### **Admin**
- **Descrição**: Acesso completo ao sistema
- **Permissões**:
  - Gerenciar usuários e roles
  - Gerenciar eventos
  - Visualizar relatórios
  - Gerenciar configurações do sistema
  - Visualizar logs de auditoria
  - Atribuir roles a outros usuários

#### **Organizer**
- **Descrição**: Organizador de eventos
- **Permissões**:
  - Gerenciar seus próprios eventos
  - Visualizar relatórios de seus eventos
  - Gerenciar registros de pacientes de seus eventos

#### **Viewer**
- **Descrição**: Visualizador de dados
- **Permissões**:
  - Visualizar relatórios (somente leitura)
  - Visualizar eventos públicos

#### **User**
- **Descrição**: Usuário comum do sistema
- **Permissões**:
  - Acesso básico ao sistema
  - Visualizar eventos públicos

### 2. **Estrutura do Banco de Dados**

#### **Tabela `organizers`**
```sql
CREATE TABLE public.organizers (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text DEFAULT 'organizer' CHECK (role IN ('admin', 'organizer', 'viewer')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_login timestamp with time zone
);
```

#### **Tabela `role_audit_log`**
```sql
CREATE TABLE public.role_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.organizers(id),
  old_role text,
  new_role text,
  changed_by uuid REFERENCES public.organizers(id),
  changed_at timestamp with time zone DEFAULT now(),
  reason text
);
```

## 🔧 Implementação

### 1. **Funções de Segurança**

#### **`is_admin_user()`**
```sql
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

#### **`has_role(required_role text)`**
```sql
CREATE OR REPLACE FUNCTION has_role(required_role text)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.organizers
    WHERE id = auth.uid()
    AND role = required_role
    AND status = 'active'
  );
END;
$$;
```

#### **`assign_user_role(user_id uuid, new_role text)`**
```sql
CREATE OR REPLACE FUNCTION assign_user_role(
  user_id uuid,
  new_role text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only admins can assign roles
  IF NOT has_role('admin') THEN
    RAISE EXCEPTION 'Access denied: Only admins can assign roles';
  END IF;

  -- Validate role
  IF new_role NOT IN ('admin', 'organizer', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  -- Update user role
  UPDATE public.organizers
  SET role = new_role,
      updated_at = now()
  WHERE id = user_id;

  RETURN FOUND;
END;
$$;
```

### 2. **Políticas RLS (Row Level Security)**

#### **Organizers Table**
```sql
-- Organizers can manage their own data
CREATE POLICY "Organizers can manage their own data" ON public.organizers
FOR ALL USING (auth.uid() = id);

-- Admins can view all organizers
CREATE POLICY "Admins can view all organizers" ON public.organizers
FOR SELECT USING (has_role('admin'));

-- Admins can manage all organizers
CREATE POLICY "Admins can manage all organizers" ON public.organizers
FOR ALL USING (has_role('admin'));
```

#### **Events Table**
```sql
-- Organizers can manage their own events
CREATE POLICY "Organizers can manage their own events" ON public.events
FOR ALL USING (organizer_id = auth.uid());

-- Admins can manage all events
CREATE POLICY "Admins can manage all events" ON public.events
FOR ALL USING (has_role('admin'));

-- Public can view active events
CREATE POLICY "Public can view active events" ON public.events
FOR SELECT USING (status = 'active');
```

### 3. **Frontend Implementation**

#### **Hook `useRoles`**
```typescript
export function useRoles(): UseRolesReturn {
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  const hasRole = useCallback((role: UserRole | UserRole[]): boolean => {
    if (!userRole) return false

    if (Array.isArray(role)) {
      return role.includes(userRole)
    }

    return userRole === role
  }, [userRole])

  const hasPermission = useCallback((permission: keyof RolePermissions): boolean => {
    return permissions[permission]
  }, [permissions])

  // ... implementation
}
```

#### **Componente `ProtectedRoute`**
```typescript
export const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requireOrganizer = false,
  allowedRoles,
  requiredPermissions = []
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth()
  const { userRole, loading: roleLoading, hasRole, hasPermission } = useRoles()

  // Check permissions using secure role-based system
  if (requireAdmin && !hasRole('admin')) {
    return <Navigate to="/unauthorized" replace />
  }

  if (requireOrganizer && !hasRole(['admin', 'organizer'])) {
    return <Navigate to="/unauthorized" replace />
  }

  // ... implementation
}
```

## 🔐 Segurança

### 1. **Eliminação de Vulnerabilidades**

#### **Antes (Inseguro)**
```sql
-- VULNERÁVEL: Qualquer pessoa pode criar email com padrão @admin.*
auth.jwt() ->> 'email' LIKE '%@admin.%'
```

#### **Depois (Seguro)**
```sql
-- SEGURO: Verificação baseada em role na tabela organizers
EXISTS (
  SELECT 1
  FROM public.organizers
  WHERE id = auth.uid()
  AND role = 'admin'
  AND status = 'active'
)
```

### 2. **Auditoria Completa**

Todas as mudanças de roles são registradas na tabela `role_audit_log`:
- Quem mudou o role
- Quando foi mudado
- Role anterior e novo
- Motivo da mudança

### 3. **Validações de Segurança**

- Apenas admins podem alterar roles
- Roles são validados contra lista permitida
- Usuários inativos não têm acesso
- Funções usam `SECURITY DEFINER` para controle rigoroso

## 📱 Uso no Frontend

### 1. **Verificação de Roles**

```typescript
import { useRoles } from '@/hooks/useRoles'

function AdminPanel() {
  const { hasRole, hasPermission } = useRoles()

  if (!hasRole('admin')) {
    return <AccessDenied />
  }

  return (
    <div>
      {hasPermission('canManageUsers') && <UserManagement />}
      {hasPermission('canViewAuditLogs') && <AuditLogs />}
    </div>
  )
}
```

### 2. **Proteção de Rotas**

```typescript
// Rota que requer admin
<ProtectedRoute requireAdmin>
  <AdminDashboard />
</ProtectedRoute>

// Rota que requer organizador ou admin
<ProtectedRoute requireOrganizer>
  <EventManagement />
</ProtectedRoute>

// Rota com roles específicos
<ProtectedRoute allowedRoles={['admin', 'viewer']}>
  <Reports />
</ProtectedRoute>

// Rota com permissões específicas
<ProtectedRoute requiredPermissions={['canViewReports']}>
  <ReportsPage />
</ProtectedRoute>
```

### 3. **Gerenciamento de Roles**

```typescript
import { RoleManagement } from '@/components/admin/RoleManagement'

function AdminSettings() {
  return (
    <div>
      <h1>Configurações Administrativas</h1>
      <RoleManagement />
    </div>
  )
}
```

## 🚀 Migração

### 1. **Passos da Migração**

1. **Adicionar coluna `role`** à tabela `organizers`
2. **Migrar usuários existentes** baseado em padrões de email atuais
3. **Atualizar todas as políticas RLS** para usar sistema de roles
4. **Atualizar Edge Functions** para verificação segura
5. **Atualizar frontend** para usar novo sistema
6. **Remover verificações baseadas em email**

### 2. **Scripts de Migração**

- `20250823_implement_role_based_system.sql` - Implementa sistema completo (versão inicial)
- `20250823_fix_role_system_simple.sql` - Correção simplificada (recomendado)
- `20250823_migrate_existing_users_to_roles.sql` - Migra usuários existentes
- `validate_role_system.sql` - Script de validação completa pós-migração
- `quick_role_validation.sql` - Validação rápida e simples (recomendado para testes)

### 3. **Validação Pós-Migração**

```sql
-- Verificar que todos os usuários têm roles válidos
SELECT COUNT(*) FROM organizers WHERE role NOT IN ('admin', 'organizer', 'viewer');

-- Verificar que não há políticas baseadas em email
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE definition LIKE '%@admin%';
```

## 📊 Monitoramento

### 1. **Métricas de Segurança**

- Número de tentativas de acesso negado
- Mudanças de roles por período
- Usuários ativos por role
- Tempo de resposta das verificações de role

### 2. **Alertas de Segurança**

- Tentativas de elevação de privilégios
- Mudanças de role para admin
- Acessos de usuários inativos
- Falhas na verificação de roles

### 3. **Auditoria Regular**

- Revisão mensal de roles atribuídos
- Validação de usuários ativos
- Verificação de políticas RLS
- Teste de penetração em verificações de role

## 🔄 Manutenção

### 1. **Adição de Novos Roles**

1. Atualizar enum de roles no banco
2. Adicionar permissões no frontend
3. Atualizar políticas RLS se necessário
4. Documentar novo role

### 2. **Modificação de Permissões**

1. Atualizar `ROLE_PERMISSIONS` no frontend
2. Testar impacto em funcionalidades existentes
3. Atualizar documentação
4. Comunicar mudanças à equipe

### 3. **Backup e Recuperação**

- Backup regular da tabela `organizers`
- Backup dos logs de auditoria
- Procedimentos de recuperação de roles
- Testes de recuperação de desastre

## 📚 Recursos Adicionais

- [Troubleshooting do Sistema de Roles](./ROLE_SYSTEM_TROUBLESHOOTING.md)
- [Padrões de Código](./CODING_STANDARDS.md)
- [Guia de Segurança](./SECURITY_GUIDE.md)
- [Documentação de API](./API_DOCUMENTATION.md)
- [Guia de Testes](./TESTING_GUIDE.md)

## 🤝 Contribuindo

Ao modificar o sistema de roles:

1. **Teste localmente** todas as mudanças
2. **Valide segurança** das novas implementações
3. **Documente** mudanças neste arquivo
4. **Teste** impacto em funcionalidades existentes
5. **Revise** com equipe de segurança

## 📝 Changelog

### v1.0.0 - 2025-08-23
- ✅ Implementação inicial do sistema RBAC
- ✅ Migração de verificações baseadas em email
- ✅ Criação de funções de segurança
- ✅ Atualização de políticas RLS
- ✅ Implementação de auditoria de roles
- ✅ Criação de componentes de gerenciamento

### Próximas Versões
- 🔄 Implementação de roles temporários
- 🔄 Sistema de aprovação para mudanças de role
- 🔄 Integração com sistemas externos de autenticação
- 🔄 Dashboard de métricas de segurança
