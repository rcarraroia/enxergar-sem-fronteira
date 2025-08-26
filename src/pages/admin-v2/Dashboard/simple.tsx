/**
 * DASHBOARD SIMPLES - Versão ultra-robusta para teste
 */

import { AdminLayout } from "@/components/admin-v2/shared/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  Calendar,
  MessageSquare,
  UserCheck,
  UserPlus,
  Users
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const SimpleDashboard = () => {
  const navigate = useNavigate();

  return (
    <AdminLayout
      title="Dashboard Administrativo"
      breadcrumbs={[{ label: "Dashboard", path: "/admin" }]}
    >
      {/* Métricas Básicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              Total de Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              Inscrições
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <UserCheck className="h-4 w-4" />
              Pacientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4" />
              Taxa de Ocupação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--%</div>
            <p className="text-xs text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => navigate("/admin/events/create")}
              className="w-full justify-start"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Criar Novo Evento
            </Button>

            <Button
              onClick={() => navigate("/admin/organizers?action=create")}
              className="w-full justify-start"
              variant="outline"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Criar Organizador
            </Button>

            <Button
              onClick={() => navigate("/admin/chat")}
              className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Sistema de Chat
            </Button>

            <Button
              onClick={() => navigate("/admin/bulk-messaging")}
              className="w-full justify-start"
              variant="outline"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Mensagens em Massa
            </Button>
          </CardContent>
        </Card>

        {/* Card de Sistema de Chat - NOVO */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <MessageSquare className="h-5 w-5" />
              Sistema de Chat
              <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">NOVO</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-800 mb-4">
              Chat integrado com n8n para atendimento e captação de leads
            </p>
            <div className="space-y-2 text-sm text-green-700 mb-4">
              <div>• Chat público para leads</div>
              <div>• Chat administrativo</div>
              <div>• Integração com n8n</div>
              <div>• Entrada por voz</div>
              <div>• Sistema offline</div>
            </div>
            <Button
              onClick={() => navigate("/admin/chat")}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Acessar Chat
            </Button>
          </CardContent>
        </Card>

        {/* Card de Mensagens em Massa */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <MessageSquare className="h-5 w-5" />
              Sistema de Mensagens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-800 mb-4">
              Envie mensagens em massa para pacientes por email, SMS e WhatsApp
            </p>
            <div className="space-y-2 text-sm text-blue-700 mb-4">
              <div>• Templates dinâmicos</div>
              <div>• Filtros por eventos</div>
              <div>• Modo de teste</div>
              <div>• Relatórios detalhados</div>
            </div>
            <Button
              onClick={() => navigate("/admin/bulk-messaging")}
              className="w-full"
            >
              Acessar Sistema
            </Button>
          </CardContent>
        </Card>

        {/* Informações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Sistema</span>
                <span className="text-green-600 text-sm">✅ Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Banco de Dados</span>
                <span className="text-green-600 text-sm">✅ Conectado</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Mensagens</span>
                <span className="text-blue-600 text-sm">🔄 Disponível</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default SimpleDashboard;
