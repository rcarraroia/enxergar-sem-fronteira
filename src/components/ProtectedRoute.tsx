
import { useAuth } from "@/hooks/useAuth";
import { useRoles, type UserRole } from "@/hooks/useRoles";
import { Loader2 } from "lucide-react";
import React from "react";
import { Navigate } from "react-router-dom";

/**
 * Props para o componente ProtectedRoute
 * @interface ProtectedRouteProps
 */
interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireOrganizer?: boolean
  allowedRoles?: UserRole[]
  requiredPermissions?: string[]
}

/**
 * Componente que protege rotas baseado em autenticação e permissões de usuário
 * Verifica se o usuário está autenticado e possui as permissões necessárias
 *
 * @param children - Componentes filhos a serem renderizados se o acesso for permitido
 * @param requireAdmin - Se true, requer que o usuário seja admin
 * @param requireOrganizer - Se true, requer que o usuário seja organizador ou admin
 * @param allowedRoles - Array de roles permitidos para acessar a rota
 * @param requiredPermissions - Array de permissões específicas necessárias
 *
 * @example
 * ```tsx
 * // Rota que requer admin
 * <ProtectedRoute requireAdmin>
 *   <AdminPanel />
 * </ProtectedRoute>
 *
 * // Rota com roles específicos
 * <ProtectedRoute allowedRoles={['admin', 'organizer']}>
 *   <EventManagement />
 * </ProtectedRoute>
 * ```
 */
export const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requireOrganizer = false,
  allowedRoles,
  requiredPermissions = []
}: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { userRole, loading: roleLoading, hasRole, hasPermission } = useRoles();

  console.log("🛡️ ProtectedRoute verificando (role-based):", {
    user: user?.email || "Nenhum",
    authLoading,
    roleLoading,
    userRole,
    requireAdmin,
    requireOrganizer,
    allowedRoles,
    requiredPermissions
  });

  // Show loading while checking authentication and roles
  if (authLoading || roleLoading) {
    console.log("⏳ ProtectedRoute: Carregando verificações de segurança...");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-muted-foreground">Verificando permissões...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log("🔒 ProtectedRoute: Usuário não autenticado, redirecionando para /auth");
    return <Navigate to="/auth" replace />;
  }

  // Check permissions using secure role-based system
  const checkPermissions = (): boolean => {
    // Check admin requirement using secure role system
    if (requireAdmin && !hasRole("admin")) {
      console.log("⛔ ProtectedRoute: Admin requerido, mas usuário não é admin");
      return false;
    }

    // Check organizer requirement using secure role system
    if (requireOrganizer && !hasRole(["admin", "organizer"])) {
      console.log("⛔ ProtectedRoute: Organizador requerido, mas usuário não é organizador nem admin");
      return false;
    }

    // Check allowed roles using secure role system
    if (allowedRoles && !hasRole(allowedRoles)) {
      console.log("⛔ ProtectedRoute: Role não permitido:", userRole, "Permitidos:", allowedRoles);
      return false;
    }

    // Check required permissions
    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(permission =>
        hasPermission(permission as any)
      );

      if (!hasAllPermissions) {
        console.log("⛔ ProtectedRoute: Permissões insuficientes:", requiredPermissions);
        return false;
      }
    }

    return true;
  };

  if (!checkPermissions()) {
    console.log("⛔ ProtectedRoute: Acesso negado - verificação de permissões falhou");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
          <p className="text-muted-foreground mt-2">
            Você não tem permissão para acessar esta página.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Seu papel atual: {userRole || "Não definido"}
          </p>
          {requireAdmin && (
            <p className="text-xs text-muted-foreground mt-2">
              Esta página requer privilégios de administrador.
            </p>
          )}
          {requireOrganizer && (
            <p className="text-xs text-muted-foreground mt-2">
              Esta página requer privilégios de organizador ou superior.
            </p>
          )}
        </div>
      </div>
    );
  }

  console.log("✅ ProtectedRoute: Acesso permitido via sistema de roles seguro");
  return <>{children}</>;
};
