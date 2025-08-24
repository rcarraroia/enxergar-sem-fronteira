import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigurationStatus } from "@/components/admin/ConfigurationStatus";
import { AlertTriangle, Settings, Shield, User } from "lucide-react";

/**
 * Componente de demonstração do sistema de roles seguro
 * Mostra como usar as verificações de segurança corretamente
 */
export const AdminPanel = () => {
  const { user, userRole, isOrganizer } = useAuth();
  const { isAdmin, isAdminVerified, isLoading } = useAdminCheck();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Verificando permissões...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Status de Autenticação Segura
          </CardTitle>
          <CardDescription>
            Sistema de roles baseado em metadados do banco de dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Usuário:</label>
              <p className="text-sm text-muted-foreground">{user?.email || "Não autenticado"}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Role Local:</label>
              <Badge variant={userRole === "admin" ? "default" : "secondary"}>
                {userRole || "Não definido"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Admin Verificado (RPC):</label>
              <Badge variant={isAdminVerified ? "default" : "destructive"}>
                {isAdminVerified ? "SIM" : "NÃO"}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium">Admin Final:</label>
              <Badge variant={isAdmin ? "default" : "destructive"}>
                {isAdmin ? "SIM" : "NÃO"}
              </Badge>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Permissões:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <Settings className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm">
                  Acesso Administrativo: {isAdmin ? "Permitido" : "Negado"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isOrganizer || isAdmin ? (
                  <User className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm">
                  Acesso de Organizador: {isOrganizer || isAdmin ? "Permitido" : "Negado"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações Seguras - Apenas para Admins */}
      {isAdmin && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">🔐 Área Administrativa</CardTitle>
              <CardDescription>
                Esta seção só é visível para administradores verificados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Aqui você pode acessar funcionalidades administrativas como:
              </p>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li>Gerenciar usuários e roles</li>
                <li>Configurar templates de notificação</li>
                <li>Visualizar métricas do sistema</li>
                <li>Acessar logs de auditoria</li>
              </ul>
            </CardContent>
          </Card>

          {/* Status das Configurações Seguras */}
          <ConfigurationStatus />
        </div>
      )}

      {isOrganizer && !isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">👤 Área do Organizador</CardTitle>
            <CardDescription>
              Funcionalidades disponíveis para organizadores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Como organizador, você pode:
            </p>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li>Gerenciar seus eventos</li>
              <li>Visualizar inscrições</li>
              <li>Enviar lembretes</li>
              <li>Acessar relatórios básicos</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};