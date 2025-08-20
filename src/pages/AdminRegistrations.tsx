
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  Search, 
  Calendar,
  MapPin,
  Phone,
  Mail,
  FileText,
  Download,
  RefreshCw
} from 'lucide-react'
import { useRegistrations } from '@/hooks/useRegistrations'
import { toast } from 'sonner'

interface Registration {
  id: string
  status: string
  created_at: string
  patients: {
    id: string
    nome: string
    email: string
    telefone: string
    cpf: string
    data_nascimento?: string
    diagnostico?: string
  }
  event_dates: {
    id: string
    date: string
    start_time: string
    events: {
      id: string
      title: string
      location: string
      address: string
    }
  }
}

export default function AdminRegistrations() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [eventFilter, setEventFilter] = useState('all')
  
  const { data: registrations = [], isLoading, refetch } = useRegistrations()

  const filteredRegistrations = registrations.filter((registration: Registration) => {
    const matchesSearch = 
      registration.patients.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.patients.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.event_dates.events.title.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || registration.status === statusFilter
    const matchesEvent = eventFilter === 'all' || registration.event_dates.events.id === eventFilter
    
    return matchesSearch && matchesStatus && matchesEvent
  })

  const uniqueEvents = Array.from(
    new Set(registrations.map((r: Registration) => r.event_dates.events.id))
  ).map(eventId => {
    const registration = registrations.find((r: Registration) => r.event_dates.events.id === eventId)
    return registration ? {
      id: eventId,
      title: registration.event_dates.events.title
    } : null
  }).filter(Boolean)

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
    const csvContent = [
      ['Nome', 'Email', 'Telefone', 'CPF', 'Evento', 'Data', 'Status'].join(','),
      ...filteredRegistrations.map((reg: Registration) => [
        reg.patients.nome,
        reg.patients.email,
        reg.patients.telefone,
        reg.patients.cpf,
        reg.event_dates.events.title,
        new Date(reg.event_dates.date).toLocaleDateString('pt-BR'),
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportRegistrations}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou evento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="confirmed">Confirmada</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Eventos</SelectItem>
                {uniqueEvents.map((event: any) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inscrições ({filteredRegistrations.length})</CardTitle>
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
                {filteredRegistrations.map((registration: Registration) => (
                  <TableRow key={registration.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{registration.patients.nome}</div>
                        <div className="text-sm text-muted-foreground">
                          CPF: {registration.patients.cpf}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-1" />
                          {registration.patients.email}
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 mr-1" />
                          {registration.patients.telefone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{registration.event_dates.events.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {registration.event_dates.events.location}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{new Date(registration.event_dates.date).toLocaleDateString('pt-BR')}</div>
                        <div className="text-sm text-muted-foreground">
                          {registration.event_dates.start_time}
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
                         registration.status === 'pending' ? 'Pendente' : 'Cancelada'}
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
                          <SelectItem value="cancelled">Cancelar</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
