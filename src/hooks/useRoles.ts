/**
 * useRoles - Hook para gerenciar verificações de roles de forma segura
 *
 * Fornece funções utilitárias para verificar roles de usuários
 * usando o sistema baseado em metadados da tabela organizers.
 *
 * @hook
 * @example
 * ```tsx
 * const { hasRole, isAdmin, isOrganizer, userRole, loading } = useRoles()
 *
 * if (hasRole('admin')) {
 *   // Renderizar conteúdo admin
 * }
 * ```
 */

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useCallback, useEffect, useState } from "react";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Available user roles in the system
 */
export type UserRole = "admin" | "organizer" | "viewer" | "user"

/**
 * Role permissions mapping
 */
export interface RolePermissions {
  canManageUsers: boolean
  canManageEvents: boolean
  canViewReports: boolean
  canManageSettings: boolean
  canViewAuditLogs: boolean
  canAssignRoles: boolean
}

/**
 * Hook return type
 */
export interface UseRolesReturn {
  userRole: UserRole | null
  loading: boolean
  hasRole: (role: UserRole | UserRole[]) => boolean
  hasPermission: (permission: keyof RolePermissions) => boolean
  isAdmin: boolean
  isOrganizer: boolean
  isViewer: boolean
  permissions: RolePermissions
  refreshRole: () => Promise<void>
}

// ============================================================================
// ROLE PERMISSIONS CONFIGURATION
// ============================================================================

/**
 * Define permissions for each role
 */
const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canManageUsers: true,
    canManageEvents: true,
    canViewReports: true,
    canManageSettings: true,
    canViewAuditLogs: true,
    canAssignRoles: true,
  },
  organizer: {
    canManageUsers: false,
    canManageEvents: true,
    canViewReports: true,
    canManageSettings: false,
    canViewAuditLogs: false,
    canAssignRoles: false,
  },
  viewer: {
    canManageUsers: false,
    canManageEvents: false,
    canViewReports: true,
    canManageSettings: false,
    canViewAuditLogs: false,
    canAssignRoles: false,
  },
  user: {
    canManageUsers: false,
    canManageEvents: false,
    canViewReports: false,
    canManageSettings: false,
    canViewAuditLogs: false,
    canAssignRoles: false,
  },
};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * useRoles hook implementation
 */
export function useRoles(): UseRolesReturn {
  // ============================================================================
  // STATE
  // ============================================================================

  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // ============================================================================
  // HOOKS
  // ============================================================================

  const { user, userRole: authUserRole } = useAuth();

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const permissions = userRole ? ROLE_PERMISSIONS[userRole] : ROLE_PERMISSIONS.user;
  const isAdmin = userRole === "admin";
  const isOrganizer = userRole === "organizer";
  const isViewer = userRole === "viewer";

  // ============================================================================
  // FUNCTIONS
  // ============================================================================

  /**
   * Check if user has specific role(s)
   */
  const hasRole = useCallback((role: UserRole | UserRole[]): boolean => {
    if (!userRole) {return false;}

    if (Array.isArray(role)) {
      return role.includes(userRole);
    }

    return userRole === role;
  }, [userRole]);

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback((permission: keyof RolePermissions): boolean => {
    return permissions[permission];
  }, [permissions]);

  /**
   * Refresh user role from database
   */
  const refreshRole = useCallback(async (): Promise<void> => {
    if (!user) {
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get role from organizers table using secure method
      const { data, error } = await supabase
        .from("organizers")
        .select("role, status")
        .eq("id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (error) {
        console.error("Erro ao verificar role do usuário:", error);
        setUserRole("user");
        return;
      }

      if (data && data.role) {
        // Map database roles to frontend roles
        const mappedRole = mapDatabaseRoleToFrontend(data.role);
        setUserRole(mappedRole);
      } else {
        // User not found in organizers table = regular user
        setUserRole("user");
      }

    } catch (error) {
      console.error("Erro ao atualizar role:", error);
      setUserRole("user");
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Map database role to frontend role
   */
  const mapDatabaseRoleToFrontend = (dbRole: string): UserRole => {
    switch (dbRole) {
      case "admin":
        return "admin";
      case "organizer":
        return "organizer";
      case "viewer":
        return "viewer";
      default:
        return "user";
    }
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    // Use role from auth context if available, otherwise refresh from database
    if (authUserRole) {
      const mappedRole = mapDatabaseRoleToFrontend(authUserRole);
      setUserRole(mappedRole);
      setLoading(false);
    } else {
      refreshRole();
    }
  }, [authUserRole, refreshRole]);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    userRole,
    loading,
    hasRole,
    hasPermission,
    isAdmin,
    isOrganizer,
    isViewer,
    permissions,
    refreshRole,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if user has admin role (utility function)
 */
export function checkIsAdmin(role: UserRole | null): boolean {
  return role === "admin";
}

/**
 * Check if user has organizer role or higher (utility function)
 */
export function checkIsOrganizerOrHigher(role: UserRole | null): boolean {
  return role === "admin" || role === "organizer";
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case "admin":
      return "Administrador";
    case "organizer":
      return "Organizador";
    case "viewer":
      return "Visualizador";
    case "user":
      return "Usuário";
    default:
      return "Desconhecido";
  }
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  switch (role) {
    case "admin":
      return "Acesso completo ao sistema, pode gerenciar usuários e configurações";
    case "organizer":
      return "Pode criar e gerenciar eventos, visualizar relatórios";
    case "viewer":
      return "Pode apenas visualizar relatórios e dados";
    case "user":
      return "Acesso básico ao sistema";
    default:
      return "Role desconhecido";
  }
}

/**
 * Check if role change is allowed
 */
export function canChangeRole(currentUserRole: UserRole, targetRole: UserRole): boolean {
  // Only admins can change roles
  if (currentUserRole !== "admin") {
    return false;
  }

  // Admins can change any role
  return true;
}

export default useRoles;
