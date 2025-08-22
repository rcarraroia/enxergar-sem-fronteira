/**
 * VERSÃO SIMPLIFICADA DA PÁGINA DE MENSAGENS
 * Para identificar onde está o erro
 */

import { AdminLayout } from '@/components/admin-v2/shared/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'

export default function SimpleMessagesPage() {
  return (
    <AdminLayout 
      title="Mensagens" 
      breadcrumbs={[
        { label: 'Dashboard', path: '/admin' },
        { label: 'Mensagens', path: '/admin/messages' }
      ]}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Sistema de Mensagens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Página de mensagens carregada com sucesso!</p>
            <p className="text-sm text-muted-foreground mt-2">
              Esta é uma versão simplificada para testar os componentes.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}