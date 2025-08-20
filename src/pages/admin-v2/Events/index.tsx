/**
 * ADMIN V2 - EVENTOS
 * Página temporária para navegação
 */

import React from 'react'
import { AdminLayout } from '@/components/admin-v2/shared/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Construction } from 'lucide-react'

const AdminEventsV2 = () => {
  return (
    <AdminLayout 
      title="Gestão de Eventos" 
      breadcrumbs={[
        { label: 'Dashboard', path: '/admin-v2' },
        { label: 'Eventos', path: '/admin-v2/events' }
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Construction className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Página em Desenvolvimento
              </h3>
              <p className="text-muted-foreground">
                Esta funcionalidade será implementada na Fase 2 da reconstrução.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  )
}

export default AdminEventsV2