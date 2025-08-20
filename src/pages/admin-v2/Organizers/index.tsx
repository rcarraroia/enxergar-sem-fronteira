/**
 * ADMIN V2 - ORGANIZADORES
 * Página temporária para navegação
 */

import { AdminLayout } from '@/components/admin-v2/shared/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Construction } from 'lucide-react'

const AdminOrganizersV2 = () => {
  return (
    <AdminLayout 
      title="Gestão de Organizadores" 
      breadcrumbs={[
        { label: 'Dashboard', path: '/admin-v2' },
        { label: 'Organizadores', path: '/admin-v2/organizers' }
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Organizadores
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

export default AdminOrganizersV2