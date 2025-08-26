/**
 * PÁGINA DE CHAT ADMINISTRATIVO
 * Integração completa do sistema de chat com n8n no painel admin
 */

import { AdminLayout } from '@/components/admin-v2/shared/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  MessageSquare,
  Mic,
  Settings,
  Users,
  Wifi,
  WifiOff
} from 'lucide-react';
import React, { useState } from 'react';

// Importar componentes de chat
import AdminChatPanel from '@/components/chat/AdminChatPanel';
import { ChatConfigPanel } from '@/components/chat/ChatConfigPanel';
import { ChatMetricsDashboard } from '@/components/chat/ChatMetricsDashboard';
import { ChatPerformanceMonitor } from '@/components/chat/ChatPerformanceMonitor';

const AdminChatPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <AdminLayout
      title="Sistema de Chat"
      breadcrumbs={[
        { label: "Dashboard", path: "/admin" },
        { label: "Chat", path: "/admin/chat" }
      ]}
    >
      {/* Header com Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sistema de Chat</h1>
            <p className="text-gray-600">Chat integrado com n8n para atendimento e captação de leads</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600 border-green-600">
              <Wifi className="h-3 w-3 mr-1" />
              Online
            </Badge>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              <Activity className="h-3 w-3 mr-1" />
              n8n Conectado
            </Badge>
          </div>
        </div>

        {/* Cards de Status Rápido */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Conversas Ativas</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Leads Hoje</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Tempo Resposta</p>
                  <p className="text-2xl font-bold">2.3s</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Taxa Conversão</p>
                  <p className="text-2xl font-bold">68%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs do Sistema de Chat */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Métricas
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Aba do Chat */}
        <TabsContent value="chat" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Painel de Chat Principal */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Chat Administrativo
                    <Badge variant="secondary">Integrado com n8n</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AdminChatPanel
                    webhookUrl={process.env.VITE_N8N_ADMIN_WEBHOOK_URL || 'https://demo.n8n.com/webhook/admin-chat'}
                    userId="admin-user"
                    enableMultipleSessions={true}
                    enableVoice={true}
                    theme="light"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Painel Lateral */}
            <div className="space-y-4">
              {/* Funcionalidades Disponíveis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Funcionalidades</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Chat em tempo real</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Integração n8n</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mic className="h-4 w-4 text-blue-600" />
                    <span>Entrada por voz</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <WifiOff className="h-4 w-4 text-orange-600" />
                    <span>Modo offline</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-purple-600" />
                    <span>Métricas em tempo real</span>
                  </div>
                </CardContent>
              </Card>

              {/* Ações Rápidas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Ver Leads do Chat
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Relatório Diário
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar n8n
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Aba de Métricas */}
        <TabsContent value="metrics" className="space-y-6">
          <ChatMetricsDashboard />
        </TabsContent>

        {/* Aba de Performance */}
        <TabsContent value="performance" className="space-y-6">
          <ChatPerformanceMonitor />
        </TabsContent>

        {/* Aba de Configurações */}
        <TabsContent value="config" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChatConfigPanel />

            {/* Instruções de Configuração */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  Configuração n8n
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p className="mb-3">Para configurar a integração com n8n:</p>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Configure as variáveis de ambiente</li>
                    <li>Crie os workflows no n8n</li>
                    <li>Configure os webhooks</li>
                    <li>Teste a integração</li>
                  </ol>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs font-mono text-gray-700">
                    VITE_N8N_ADMIN_WEBHOOK_URL=<br />
                    https://seu-n8n.com/webhook/admin-chat
                  </p>
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  Ver Documentação Completa
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout >
  );
};

export default AdminChatPage;
