/**
 * BulkMessagingCard - Card para acesso rápido ao sistema de mensagens em massa
 *
 * Componente para ser usado no painel administrativo principal,
 * fornecendo acesso rápido às funcionalidades de envio em massa.
 */

import React from 'react'
import { Link } from 'react-router-dom'

// UI Components
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Icons
import { ArrowRight, MessageSquare, Send, Users } from 'lucide-react'

// ============================================================================
// COMPONENT
// ============================================================================

export const BulkMessagingCard: React.FC = () => {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Mensagens em Massa</CardTitle>
              <CardDescription>
                Envie mensagens para múltiplos pacientes
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            Novo
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Features */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Send className="h-3 w-3 text-blue-600" />
            <span>Email + SMS + WhatsApp</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3 text-green-600" />
            <span>Por eventos</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600 mb-1">Recursos disponíveis:</div>
          <div className="text-sm space-y-1">
            <div>• Templates dinâmicos com variáveis</div>
            <div>• Envio para múltiplos eventos</div>
            <div>• Modo de teste antes do envio</div>
            <div>• Relatórios detalhados de entrega</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button asChild className="flex-1">
            <Link to="/admin/bulk-messaging">
              <Send className="h-4 w-4 mr-2" />
              Enviar Mensagens
            </Link>
          </Button>

          <Button asChild variant="outline" size="sm">
            <Link to="/admin/bulk-messaging">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Quick Access */}
        <div className="pt-2 border-t">
          <div className="text-xs text-gray-500 mb-2">Acesso rápido:</div>
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm" className="text-xs h-7">
              <Link to="/admin/bulk-messaging?tab=quick">
                Envio Rápido
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-xs h-7">
              <Link to="/admin/notification-templates">
                Templates
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default BulkMessagingCard
