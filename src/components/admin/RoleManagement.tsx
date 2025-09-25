/**
 * RoleManagement - Componente para gerenciar roles de usuários
 *
 * Permite que administradores visualizem e modifiquem roles de usuários
 * no sistema. Inclui auditoria de mudanças e validações de segurança.
 *
 * @component
 * @example
 * ```tsx
 * <RoleManagement />
 * ```
 */

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// UI Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Icons
import { AlertTriangle, Eye, History, Settings, Shield, Users } from "lucide-react";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Organizer data with role information
 */
interface OrganizerWithRole {
  id: string
  name: string
  email: string
  role: "admin" | "organizer" | "viewer"
  status: "active" | "inactive" | "pending"
  created_at: string
  updated_at: string
  last_login?: string
}

/**
 * Role audit log entry
 */
interface RoleAuditLog {
  id: string
  user_id: string
  old_role: string
  new_role: string
  changed_by: string
  changed_at: string
  reason: string
  user_name?: string
  changed_by_name?: string
}

/**
 * Role change request
 */
interface RoleChangeRequest {
  userId: string
  newRole: "admin" | "organizer" | "viewer"
  reason: string
}

// ============================================================================
// COMPONENT IMPLEMENTATION
// ============================================================================

/**
 * RoleManagement implementation
 */
export const RoleManagement: React.FC = () => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [organizers, setOrganizers] = useState<OrganizerWithRole[]>([]);
  const [auditLogs, setAuditLogs] = useState<RoleAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showAuditLog, setShowAuditLog] = useState(false);

  // ============================================================================
  // HOOKS
  // ============================================================================

  const { user, isAdmin } = useAuth();

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const loadOrganizers = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("organizers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const mapped = (data || []).map((o: any) => ({
        id: o.id,
        name: o.name || o.email,
        email: o.email,
        role: (o.role as "admin" | "organizer" | "viewer") || "organizer",
        status: (o.status as "active" | "inactive" | "pending") || "active",
        created_at: o.created_at,
        updated_at: o.updated_at,
        last_login: o.last_login || undefined,
      }));

      setOrganizers(mapped);
    } catch (error) {
      console.error("Erro ao carregar organizadores:", error);
      toast.error("Erro ao carregar lista de usuários");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAuditLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("role_audit_log" as any)
        .select(`
          *,
          user:organizers!role_audit_log_user_id_fkey(name),
          changed_by_user:organizers!role_audit_log_changed_by_fkey(name)
        `)
        .order("changed_at", { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      const logsWithNames = data?.map((log: any) => ({
        ...log,
        user_name: log.user?.name || "Usuário removido",
        changed_by_name: log.changed_by_user?.name || "Sistema"
      })) || [];

      setAuditLogs(logsWithNames);
    } catch (error) {
      console.error("Erro ao carregar logs de auditoria:", error);
      toast.error("Erro ao carregar histórico de mudanças");
    }
  }, []);

  const handleRoleChange = useCallback(async (request: RoleChangeRequest) => {
    if (!isAdmin) {
      toast.error("Acesso negado: Apenas administradores podem alterar roles");
      return;
    }

    try {
      setUpdating(request.userId);

      // Call the secure function to assign role
      const { error } = await supabase.rpc("is_admin_user" as any, {
        user_id: request.userId,
        new_role: request.newRole
      });

      if (error) {
        throw error;
      }

      toast.success("Role atualizado com sucesso!");

      // Reload data
      await loadOrganizers();
      await loadAuditLogs();

    } catch (error) {
      console.error("Erro ao atualizar role:", error);
      toast.error(`Erro ao atualizar role: ${  (error as Error).message}`);
    } finally {
      setUpdating(null);
    }
  }, [isAdmin, loadOrganizers, loadAuditLogs]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (isAdmin) {
      loadOrganizers();
      loadAuditLogs();
    }
  }, [isAdmin, loadOrganizers, loadAuditLogs]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "organizer":
        return <Users className="h-4 w-4" />;
      case "viewer":
        return <Eye className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "organizer":
        return "default";
      case "viewer":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "pending":
        return "outline";
      default:
        return "outline";
    }
  };

  const renderOrganizerCard = (organizer: OrganizerWithRole) => {
    const isCurrentUser = organizer.id === user?.id;
    const canChangeRole = isAdmin && !isCurrentUser;

    return (
      <Card key={organizer.id} className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {getRoleIcon(organizer.role)}
                <div>
                  <h3 className="font-semibold">{organizer.name}</h3>
                  <p className="text-sm text-gray-600">{organizer.email}</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Badge variant={getRoleBadgeVariant(organizer.role)}>
                  {organizer.role}
                </Badge>
                <Badge variant={getStatusBadgeVariant(organizer.status)}>
                  {organizer.status}
                </Badge>
                {isCurrentUser && (
                  <Badge variant="outline">Você</Badge>
                )}
              </div>
            </div>

            {canChangeRole && (
              <div className="flex items-center space-x-2">
                <Select
                  value={organizer.role}
                  onValueChange={(newRole) => {
                    if (newRole !== organizer.role) {
                      handleRoleChange({
                        userId: organizer.id,
                        newRole: newRole as "admin" | "organizer" | "viewer",
                        reason: "Role alterado via interface administrativa"
                      });
                    }
                  }}
                  disabled={updating === organizer.id}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="organizer">Organizer</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>

                {updating === organizer.id && (
                  <div className="text-sm text-gray-500">Atualizando...</div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 text-xs text-gray-500">
            <div>Criado em: {new Date(organizer.created_at).toLocaleString("pt-BR")}</div>
            {organizer.last_login && (
              <div>Último login: {new Date(organizer.last_login).toLocaleString("pt-BR")}</div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAuditLog = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <History className="h-5 w-5" />
          <span>Histórico de Mudanças</span>
        </CardTitle>
        <CardDescription>
          Registro de todas as alterações de roles no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {auditLogs.map((log) => (
            <div key={log.id} className="border-l-2 border-gray-200 pl-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{log.user_name}</p>
                  <p className="text-sm text-gray-600">
                    {log.old_role} → {log.new_role}
                  </p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <div>{new Date(log.changed_at).toLocaleString("pt-BR")}</div>
                  <div>por {log.changed_by_name}</div>
                </div>
              </div>
              {log.reason && (
                <p className="text-sm text-gray-500 mt-1">{log.reason}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Acesso negado: Apenas administradores podem gerenciar roles</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Carregando usuários...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Gerenciamento de Roles</span>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAuditLog(!showAuditLog)}
            >
              <History className="h-4 w-4 mr-2" />
              {showAuditLog ? "Ocultar" : "Ver"} Histórico
            </Button>
          </CardTitle>
          <CardDescription>
            Gerencie roles e permissões dos usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {organizers.map(renderOrganizerCard)}
          </div>
        </CardContent>
      </Card>

      {showAuditLog && renderAuditLog()}
    </div>
  );
};

export default RoleManagement;
