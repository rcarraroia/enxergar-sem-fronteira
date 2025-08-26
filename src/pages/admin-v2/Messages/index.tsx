/**
 * ADMIN V2 - MÓDULO DE MENSAGENS
 * Dashboard principal do módulo de mensagens
 */

import { AdminLayout } from "@/components/admin-v2/shared/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAutomationRules, useMessages, useMessageStats, useMessageTemplates } from "@/hooks/messages/useMessages";
import { BarChart3, Clock, Mail, MessageSquare, Send, Settings, Smartphone, Users, Zap } from "lucide-react";
import { useState } from "react";
import { MessagesList } from "./components/MessagesList";
import { SendMessageDialog } from "./components/SendMessageDialog";
// BulkMessageDialog temporariamente removido devido a erro de dados
import { AutomationManager } from "./components/AutomationManager";
import { MessageStats } from "./components/MessageStats";
import { QuickTestDialog } from "./components/QuickTestDialog";
import { TemplatesManager } from "./components/TemplatesManager";

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  // const [bulkDialogOpen, setBulkDialogOpen] = useState(false) // Removido temporariamente
  const [quickTestOpen, setQuickTestOpen] = useState(false);

  // Hooks para dados
  const { data: messages = [], isLoading: messagesLoading } = useMessages();
  const { data: stats } = useMessageStats();
  const { data: templates = [] } = useMessageTemplates();
  const { data: automationRules = [] } = useAutomationRules();

  // Estatísticas rápidas
  const recentMessages = messages.slice(0, 5);
  const pendingMessages = messages.filter(m => m.status === "pending").length;
  const activeTemplates = templates.filter(t => t.is_active).length;
  const activeRules = automationRules.filter(r => r.is_active).length;

  return (
    <AdminLayout
      title="Mensagens"
      breadcrumbs={[
        { label: "Dashboard", path: "/admin" },
        { label: "Mensagens", path: "/admin/messages" }
      ]}
      actions={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickTestOpen(true)}
            className="w-full sm:w-auto"
          >
            <Zap className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Teste Rápido</span>
            <span className="sm:hidden">Teste</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("templates")}
            className="w-full sm:w-auto"
          >
            <Settings className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Configurar</span>
            <span className="sm:hidden">Config</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setActiveTab("bulk")}
            size="sm"
            className="w-full sm:w-auto"
          >
            <Users className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Envio em Massa</span>
            <span className="sm:hidden">Massa</span>
          </Button>
          <Button
            onClick={() => setSendDialogOpen(true)}
            size="sm"
            className="w-full sm:w-auto"
          >
            <Send className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Enviar Individual</span>
            <span className="sm:hidden">Individual</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">


        {/* Cards de estatísticas rápidas */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mensagens Hoje</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_sent || 0}</div>
              <p className="text-xs text-muted-foreground">
                {pendingMessages > 0 && `${pendingMessages} pendentes`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.delivery_rate ? `${stats.delivery_rate.toFixed(1)}%` : "0%"}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.total_delivered || 0} entregues
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Templates Ativos</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTemplates}</div>
              <p className="text-xs text-muted-foreground">
                {templates.length} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Automações</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeRules}</div>
              <p className="text-xs text-muted-foreground">
                regras ativas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs principais */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span className="hidden sm:inline">Envio em Massa</span>
              <span className="sm:hidden">Massa</span>
            </TabsTrigger>
            <TabsTrigger value="messages">Mensagens</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="automation">Automação</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {/* Mensagens recentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mensagens Recentes</CardTitle>
                  <CardDescription>
                    Últimas 5 mensagens enviadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {messagesLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                      ))}
                    </div>
                  ) : recentMessages.length > 0 ? (
                    <div className="space-y-3">
                      {recentMessages.map((message) => (
                        <div key={message.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-3">
                            {message.channel === "email" ? (
                              <Mail className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Smartphone className="h-4 w-4 text-green-500" />
                            )}
                            <div>
                              <p className="text-sm font-medium">{message.recipient_contact}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {message.subject || message.content}
                              </p>
                            </div>
                          </div>
                          <Badge variant={
                            message.status === "delivered" ? "default" :
                              message.status === "sent" ? "secondary" :
                                message.status === "failed" ? "destructive" : "outline"
                          }>
                            {message.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma mensagem enviada ainda</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Templates populares */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Templates Populares</CardTitle>
                  <CardDescription>
                    Templates mais utilizados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {templates.length > 0 ? (
                    <div className="space-y-3">
                      {templates.slice(0, 5).map((template) => (
                        <div key={template.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-3">
                            {template.channel === "email" ? (
                              <Mail className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Smartphone className="h-4 w-4 text-green-500" />
                            )}
                            <div>
                              <p className="text-sm font-medium">{template.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {template.channel.toUpperCase()}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {template.variables.length} vars
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum template criado ainda</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => setActiveTab("templates")}
                      >
                        Criar Template
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6">
            <BulkMessagingSection />
          </TabsContent>

          <TabsContent value="messages">
            <MessagesList />
          </TabsContent>

          <TabsContent value="templates">
            <TemplatesManager />
          </TabsContent>

          <TabsContent value="automation">
            <AutomationManager />
          </TabsContent>

          <TabsContent value="stats">
            <MessageStats />
          </TabsContent>
        </Tabs>

        {/* Dialog para enviar mensagem individual */}
        <SendMessageDialog
          open={sendDialogOpen}
          onOpenChange={setSendDialogOpen}
        />

        {/* Dialog para envio em massa - Temporariamente removido
            <BulkMessageDialog
                open={bulkDialogOpen}
                onOpenChange={setBulkDialogOpen}
            />
            */}

        {/* Dialog para teste rápido */}
        <QuickTestDialog
          open={quickTestOpen}
          onOpenChange={setQuickTestOpen}
        />
      </div>
    </AdminLayout>
  );
}

// Componente para a seção de envio em massa
const BulkMessagingSection = () => {
  const [bulkMode, setBulkMode] = useState("quick");

  return (
    <div className="space-y-6">
      {/* Header da seção */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Envio de Mensagens em Massa</h2>
          <p className="text-sm text-muted-foreground">
            Envie mensagens por email, SMS e WhatsApp para múltiplos pacientes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={bulkMode === "quick" ? "default" : "outline"}
            size="sm"
            onClick={() => setBulkMode("quick")}
          >
            <Zap className="h-4 w-4 mr-1" />
            Rápido
          </Button>
          <Button
            variant={bulkMode === "advanced" ? "default" : "outline"}
            size="sm"
            onClick={() => setBulkMode("advanced")}
          >
            <Settings className="h-4 w-4 mr-1" />
            Avançado
          </Button>
        </div>
      </div>

      {/* Cards informativos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Send className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Múltiplos Canais</div>
                <div className="text-xs text-muted-foreground">Email, SMS e WhatsApp</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Baseado em Eventos</div>
                <div className="text-xs text-muted-foreground">Selecione eventos específicos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="font-medium text-sm">Templates Dinâmicos</div>
                <div className="text-xs text-muted-foreground">Personalize suas mensagens</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo principal */}
      {bulkMode === "quick" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Envio Rápido
              <Badge variant="default">Recomendado</Badge>
            </CardTitle>
            <CardDescription>
              Interface simplificada para envios rápidos e diretos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuickBulkSender />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600" />
              Envio Avançado
              <Badge variant="secondary">Controle Total</Badge>
            </CardTitle>
            <CardDescription>
              Controle completo com filtros avançados e múltiplos eventos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BulkMessageSender />
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Como usar o Sistema de Mensagens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                Envio Rápido
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</div>
                  <div>Selecione um evento específico</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</div>
                  <div>Escolha os canais de envio</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</div>
                  <div>Digite ou selecione um template</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">4</div>
                  <div>Teste antes de enviar</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4 text-purple-600" />
                Envio Avançado
              </h4>
              <div className="space-y-2 text-sm">
                <div>• Seleção de múltiplos eventos</div>
                <div>• Filtros por cidade e status</div>
                <div>• Templates com variáveis dinâmicas</div>
                <div>• Relatórios detalhados de envio</div>
                <div>• Agendamento de mensagens</div>
                <div>• Controle de taxa de envio</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
