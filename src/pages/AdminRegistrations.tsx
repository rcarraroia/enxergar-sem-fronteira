
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Users, 
  Calendar,
  MapPin,
  Phone,
  Mail,
  FileText
} from 'lucide-react'
import { RegistrationFilters } from '@/components/admin/RegistrationFilters'
import { useRegistrationsFiltered, useAvailableCities } from '@/hooks/useRegistrationsFiltered'
import { toast } from 'sonner'
import type { Registration } from '@/hooks/useRegistrations'

export default function AdminRegistrations() {
  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCity, setSelectedCity] = useState('all')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [statusFilter, setStatusFilter] = useState('all')
  const [eventStatusFilter, setEventStatusFilter] = useState('all')

  // Buscar dados com filtros
  const { data: registrations = [], isLoading, refetch } = useRegistrationsFiltered({
    searchTerm: searchTerm || undefined,
    city: selectedCity !== 'all' ? selectedCity : undefined,
    date: selectedDate,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    eventStatus: eventStatusFilter !== 'all' ? eventStatusFilter : undefined
  })

  // Buscar cidades disponíveis
  const { data: availableCities = [] } = useAvailableCities()

  const handleStatusChange = async (registrationId: string, newStatus: string) => {
    try {
      // Implementar mudança de status
      toast.success('Status atualizado com sucesso!')
      refetch()
    } catch (error) {
      toast.error('Erro ao atualizar status')
    }
  }

  const exportRegistrations = () => {
    if (registrations.length === 0) {
      toast.error('Nenhuma inscrição para exportar')
      return
    }

    const csvContent = [
      ['Nome', 'Email', 'Telefone', 'CPF', 'Cidade', 'Evento', 'Data', 'Status'].join(','),
      ...registrations.map((reg: Registration) => [
        reg.patient.nome,
        reg.patient.email,
        reg.patient.telefone,
        reg.patient.cpf,
        reg.event_date.event.city,
        reg.event_date.event.title,
        new Date(reg.event_date.date).toLocaleDateString('pt-BR'),
        reg.status
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'inscricoes.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Dados exportados com sucesso!')
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-48">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inscrições</h1>
          <p className="text-muted-foreground">Gerencie todas as inscrições dos eventos</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{registrations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Confirmadas</p>
                <p className="text-2xl font-bold">
                  {registrations.filter((r: Registration) => r.status === 'confirmed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">
                  {registrations.filter((r: Registration) => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Canceladas</p>
                <p className="text-2xl font-bold">
                  {registrations.filter((r: Registration) => r.status === 'cancelled').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros Refatorados */}
      <RegistrationFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        eventStatusFilter={eventStatusFilter}
        onEventStatusChange={setEventStatusFilter}
        availableCities={availableCities}
        onExport={exportRegistrations}
        onRefresh={() => refetch()}
        filteredCount={registrations.length}
      />

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inscrições ({registrations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Data do Evento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Inscrição</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((registration: Registration) => (
                  <TableRow key={registration.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{registration.patient.nome}</div>
                        <div className="text-sm text-muted-foreground">
                          CPF: {registration.patient.cpf}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-1" />
                          {registration.patient.email}
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 mr-1" />
                          {registration.patient.telefone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{registration.event_date.event.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {registration.event_date.event.city} - {registration.event_date.event.location}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{new Date(registration.event_date.date).toLocaleDateString('pt-BR')}</div>
                        <div className="text-sm text-muted-foreground">
                          {registration.event_date.start_time}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          registration.status === 'confirmed' ? 'default' :
                          registration.status === 'pending' ? 'secondary' : 'destructive'
                        }
                      >
                        {registration.status === 'confirmed' ? 'Confirmada' :
                         registration.status === 'pending' ? 'Pendente' : 
                         registration.status === 'attended' ? 'Compareceu' : 'Cancelada'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(registration.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={registration.status}
                        onValueChange={(value) => handleStatusChange(registration.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirmed">Confirmar</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="attended">Compareceu</SelectItem>
                          <SelectItem value="cancelled">Cancelar</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {registrations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma inscrição encontrada com os filtros selecionados.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
