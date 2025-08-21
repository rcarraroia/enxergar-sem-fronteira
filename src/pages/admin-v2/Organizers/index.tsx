
/**
 * ADMIN V2 - ORGANIZADORES
 * Gestão de promotores/organizadores de eventos
 */

import { useState } from 'react'
import { AdminLayout } from '@/components/admin-v2/shared/Layout'
import { DataTable } from '@/components/admin-v2/shared/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  Plus, 
  Edit, 
  Eye,
  Mail,
  Phone,
  MapPin,
  AlertCircle
} from 'lucide-react'
import { useOrganizersV2, type OrganizerV2, type OrganizerFilters } from '@/hooks/admin-v2/useOrganizersV2'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const AdminOrganizersV2 = () => {
  const [filters, setFilters] = useState<OrganizerFilters>({
    search: '',
    status: 'all'
  })

  const { data: organizers = [], isLoading, error } = useOrganizersV2(filters)

  const handleViewOrganizer = (organizer: OrganizerV2) => {
    // Implementar visualização
    console.log('Ver organizador:', organizer.id)
  }

  const handleEditOrganizer = (organizer: OrganizerV2) => {
    // Implementar edição
    console.log('Editar organizador:', organizer.id)
  }

  const columns = [
    {
      key: 'nome',
      label: 'Nome',
      render: (value: string, organizer: OrganizerV2) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {organizer.email}
          </div>
        </div>
      )
    },
    {
      key: 'telefone',
      label: 'Contato',
      render: (value: string, organizer: OrganizerV2) => (
        <div>
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            <span className="text-sm">{value}</span>
          </div>
          {organizer.cidade && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              <span className="text-sm text-muted-foreground">{organizer.cidade}</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'total_events',
      label: 'Eventos',
      render: (value: number) => (
        <div className="text-center">
          <div className="text-sm font-medium">{value || 0}</div>
          <div className="text-xs text-muted-foreground">eventos</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'active' ? 'default' : 'secondary'}>
          {value === 'active' ? 'Ativo' : 'Inativo'}
        </Badge>
      )
    },
    {
      key: 'created_at',
      label: 'Cadastrado em',
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })}
        </span>
      )
    }
  ]

  const actions = [
    {
      label: 'Visualizar',
      onClick: handleViewOrganizer,
      icon: Eye
    },
    {
      label: 'Editar',
      onClick: handleEditOrganizer,
      icon: Edit
    }
  ]

  if (error) {
    return (
      <AdminLayout 
        title="Gestão de Organizadores" 
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin-v2' },
          { label: 'Organizadores', path: '/admin-v2/organizers' }
        ]}
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar organizadores. Verifique sua conexão e tente novamente.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout 
      title="Gestão de Organizadores" 
      breadcrumbs={[
        { label: 'Dashboard', path: '/admin-v2' },
        { label: 'Organizadores', path: '/admin-v2/organizers' }
      ]}
      actions={
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Organizador
        </Button>
      }
    >
      <DataTable
        data={organizers}
        columns={columns}
        actions={actions}
        loading={isLoading}
        searchable={true}
        searchPlaceholder="Buscar organizadores..."
        onSearch={(search) => setFilters(prev => ({ ...prev, search }))}
        emptyMessage="Nenhum organizador encontrado."
      />
    </AdminLayout>
  )
}

export default AdminOrganizersV2
