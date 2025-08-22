/**
 * TESTE PARA PÁGINA DE ORGANIZADORES
 */

import { AdminLayout } from '@/components/admin-v2/shared/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Loader2 } from 'lucide-react'
import { useOrganizersV2Simple } from '@/hooks/admin-v2/useOrganizersV2Simple'

export default function TestOrganizersPage() {
  const { data: organizers = [], isLoading, error } = useOrganizersV2Simple()

  return (
    <AdminLayout 
      title="Promotores (Teste)" 
      breadcrumbs={[
        { label: 'Dashboard', path: '/admin' },
        { label: 'Promotores', path: '/admin/organizers' }
      ]}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Teste de Carregamento de Promotores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Carregando promotores...</span>
              </div>
            ) : error ? (
              <div className="text-red-600">
                <p className="font-medium">Erro ao carregar:</p>
                <p className="text-sm">{error.message}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {organizers.length} promotores encontrados
                  </Badge>
                </div>
                
                {organizers.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="font-medium">Primeiros promotores:</h4>
                    {organizers.slice(0, 5).map((organizer) => (
                      <div key={organizer.id} className="p-3 border rounded">
                        <div className="font-medium">{organizer.nome}</div>
                        <div className="text-sm text-muted-foreground">{organizer.email}</div>
                        <div className="text-sm text-muted-foreground">{organizer.telefone}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhum promotor encontrado na tabela.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}