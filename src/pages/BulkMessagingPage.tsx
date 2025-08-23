/**
 * BulkMessagingPage - Página dedicada para envio de mensagens em massa
 *
 * Página completa com todas as funcionalidades de envio em massa,
 * incluindo interface simples e avançada.
 */

import React, { useState } from 'react'

// Components
import { BulkMessageSender } from '@/components/admin/BulkMessageSender'
import { QuickBulkSender } from '@/components/admin/QuickBulkSender'
import { ProtectedRoute } from '@/components/ProtectedRoute'

// UI Components
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Icons
import { Info, MessageSquare, Send, Settings, Users, Zap } from 'lucide-react'

// ============================================================================
// COMPONENT
// ============================================================================

export const BulkMessagingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('quick')

  return (
    <ProtectedRoute requireAdmin>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Mensagens em Massa
              </h1>
              <p className="text-gray-600">
                Envie mensagens por email, SMS e WhatsApp para pacientes de eventos
              </p>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Send className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="font-semibold">Múltiplos Canais</div>
                    <div className="text-sm text-gray-600">Email, SMS e WhatsApp</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-green-600" />
                  <div>
                    <div className="font-semibold">Baseado em Eventos</div>
                    <div className="text-sm text-gray-600">Selecione eventos específicos</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Settings className="h-8 w-8 text-purple-600" />
                  <div>
                    <div className="font-semibold">Templates Dinâmicos</div>
                    <div className="text-sm text-gray-600">Use templates ou mensagens customizadas</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Important Notice */}
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> As mensagens serão enviadas para todos os pacientes com inscrições confirmadas nos eventos selecionados.
              Use o modo de teste primeiro para verificar o alcance antes do envio real.
            </AlertDescription>
          </Alert>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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

          <TabsContent value="quick" className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="default">Recomendado</Badge>
              <span className="text-sm text-gray-600">
                Interface simplificada para envios rápidos
              </span>
            </div>

            <QuickBulkSender />

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Como usar o Envio Rápido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <div>
                      <strong>Selecione um evento</strong> - Escolha o evento cujos pacientes receberão as mensagens
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <div>
                      <strong>Escolha os canais</strong> - Marque email, SMS e/ou WhatsApp conforme necessário
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <div>
                      <strong>Defina a mensagem</strong> - Use um template existente ou digite uma mensagem customizada
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</div>
                    <div>
                      <strong>Teste primeiro</strong> - Use o botão "Teste" para verificar antes do envio real
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">Avançado</Badge>
              <span className="text-sm text-gray-600">
                Controle completo com filtros e múltiplos eventos
              </span>
            </div>

            <BulkMessageSender />

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recursos Avançados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">Seleção Múltipla</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Selecione múltiplos eventos</li>
                      <li>• Combine diferentes tipos de evento</li>
                      <li>• Visualize estimativa de destinatários</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Filtros Avançados</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Filtrar por cidade</li>
                      <li>• Status de pacientes</li>
                      <li>• Período de eventos</li>
                      <li>• Status de inscrições</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Templates</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Use templates pré-configurados</li>
                      <li>• Variáveis dinâmicas</li>
                      <li>• Preview antes do envio</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Relatórios</h4>
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

        {/* Footer */}
        <div className="mt-12 pt-8 border-t">
          <div className="text-center text-sm text-gray-500">
            <p>
              Sistema de Mensagens em Massa - Enxergar sem Fronteiras
            </p>
            <p className="mt-1">
              Use com responsabilidade. Todas as mensagens são registradas para auditoria.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default BulkMessagingPage
