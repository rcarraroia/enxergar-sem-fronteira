/**
 * BulkMessagingTab - Aba de envio em massa integrada ao painel de mensagens
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Send,
  Users,
  Settings,
  Zap,
  Info,
  MessageSquare,
  Mail,
  Smartphone,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

// Importar componentes de bulk messaging
import { BulkMessageSender } from '@/components/admin/BulkMessageSender';
import { QuickBulkSender } from '@/components/admin/QuickBulkSender';

export const BulkMessagingTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState('quick');

  return (
    <div className="space-y-6">
      {/* Header da seção */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Envio em Massa</h2>
          <p className="text-gray-600">
            Envie mensagens por email, SMS e WhatsApp para múltiplos pacientes
          </p>
        </div>
        <Badge variant="outline" className="text-blue-600 border-blue-600">
          <MessageSquare className="h-3 w-3 mr-1" />
          Múltiplos Canais
        </Badge>
      </div>

      {/* Cards de estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Send className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Enviadas Hoje</p>
                <p className="text-2xl font-bold">247</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa Entrega</p>
                <p className="text-2xl font-bold">94.2%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Na Fila</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Falhas</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aviso importante */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> As mensagens serão enviadas para todos os pacientes com inscrições confirmadas nos eventos selecionados.
          Use sempre o modo de teste primeiro para verificar o alcance antes do envio real.
        </AlertDescription>
      </Alert>

      {/* Tabs de envio */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="quick" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Envio Rápido
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Avançado
          </TabsTrigger>
        </TabsList>

        {/* Aba de Envio Rápido */}
        <TabsContent value="quick" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="default">Recomendado</Badge>
            <span className="text-sm text-gray-600">
              Interface simplificada para envios rápidos
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulário de envio rápido */}
            <div className="lg:col-span-2">
              <QuickBulkSender />
            </div>

            {/* Painel lateral com informações */}
            <div className="space-y-4">
              {/* Canais disponíveis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Canais Disponíveis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span>Email</span>
                    <Badge variant="outline" className="ml-auto">Ativo</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Smartphone className="h-4 w-4 text-green-600" />
                    <span>SMS</span>
                    <Badge variant="outline" className="ml-auto">Ativo</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    <span>WhatsApp</span>
                    <Badge variant="outline" className="ml-auto" ge
          </div>
                </CardContent>
              </Card>

              {/* Guia rápido */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Como usar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                      <div>Selecione um evento</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                      <div>Escolha os canais</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                      <div>Defina a mensagem</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</div>
                      <div>Teste antes de enviar</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Estatísticas recentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Últimos Envios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Consultas SP - Centro</span>
                      <Badge variant="outline" className="text-xs">156 enviadas</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Lembrete Exames</span>
                      <Badge variant="outline" className="text-xs">89 enviadas</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Confirmação Agendamento</span>
                      <Badge variant="outline" className="text-xs">234 enviadas</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Aba Avançada */}
        <TabsContent value="advanced" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">Avançado</Badge>
            <span className="text-sm text-gray-600">
              Controle completo com filtros e múltiplos eventos
            </span>
          </div>

          <BulkMessageSender />

          {/* Recursos avançados */}
          <Card>
            <CardHeader>
              <CardTitle>Recursos Avançados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Seleção Múltipla
                  </h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Selecione múltiplos eventos</li>
                    <li>• Combine diferentes tipos de evento</li>
                    <li>• Visualize estimativa de destinatários</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Filtros Avançados
                  </h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Filtrar por cidade</li>
                    <li>• Status de pacientes</li>
                    <li>• Período de eventos</li>
                    <li>• Status de inscrições</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Templates
                  </h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Use templates pré-configurados</li>
                    <li>• Variáveis dinâmicas</li>
                    <li>• Preview antes do envio</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Relatórios
                  </h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Estatísticas detalhadas</li>
                    <li>• Lista de erros</li>
                    <li>• Status por destinatário</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BulkMessagingTab;
