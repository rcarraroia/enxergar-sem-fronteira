
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useRegistrations } from '@/hooks/useRegistrations'
import { useEvents } from '@/hooks/useEvents'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { Search, Filter, Download, Users, Calendar, MapPin, Phone, Mail, AlertCircle } from 'lucide-react'
import { formatDate, formatTime } from '@/utils/timeFormat'

export default function AdminRegistrations() {
  const { data: registrations, isLoading: isLoadingRegistrations } = useRegistrations()
  const { data: events, isLoading: isLoadingEvents } = useEvents()
  const [searchTerm, setSearchTerm] = useState('')
  const [eventFilter, setEventFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const isLoading = isLoadingRegistrations || isLoadingEvents

  // Filtrar registrações
  const filteredRegistrations = registrations?.filter(registration => {
    const matchesSearch = !searchTerm || 
      registration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.phone.includes(searchTerm)

    const matchesEvent = !eventFilter || registration.event_date.event_id === eventFilter
    const matchesStatus = !statusFilter || registration.status === statusFilter

    return matchesSearch && matchesEvent && matchesStatus
  }) || []

  // Estatísticas
  const totalRegistrations = registrations?.length || 0
  const confirmedRegistrations = registrations?.filter(r => r.status === 'confirmed').length || 0
  const pendingRegistrations = registrations?.filter(r => r.status === 'pending').length || 0
  const cancelledRegistrations = registrations?.filter(r => r.status === 'cancelled').length || 0

  const getStatusBadge = (status: string) => {
    const variants = {
      'confirmed': 'default',
      'pending': 'secondary',
      'cancelled': 'destructive',
      'completed': 'outline'
    } as const

    const labels = {
      'confirmed': 'Confirmado',
      'pending': 'Pendente',
      'cancelled': 'Cancelado',
      'completed': 'Concluído'
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const handleExportCSV = () => {
    if (!filteredRegistrations.length) return

    const headers = [
      'Nome', 'CPF', 'Email', 'Telefone', 'Cidade', 'Estado',
      'Evento', 'Data do Evento', 'Horário', 'Status', 'Data de Inscrição'
    ]

    const csvData = filteredRegistrations.map(registration => {
      // Find the event that contains this event_date
      const event = events?.find(e => 
        e.event_dates.some(ed => ed.id === registration.event_date.id)
      )
      
      return [
        registration.name,
        registration.cpf,
        registration.email || '',
        registration.phone,
        registration.city,
        registration.state,
        event?.city || 'Evento não encontrado',
        formatDate(registration.event_date.date),
        `${formatTime(registration.event_date.start_time)} - ${formatTime(registration.event_date.end_time)}`,
        registration.status,
        formatDate(registration.created_at)
      ]
    })

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `registracoes_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} variant="card" />
          ))}
        </div>
        <LoadingSkeleton variant="table" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Gerenciar Inscrições</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todas as inscrições dos eventos
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Inscrições</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegistrations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{confirmedRegistrations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingRegistrations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{cancelledRegistrations}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar por evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os eventos</SelectItem>
                {events?.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleExportCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Inscrições */}
      <Card>
        <CardHeader>
          <CardTitle>Inscrições ({filteredRegistrations.length})</CardTitle>
          <CardDescription>
            Lista de todas as inscrições cadastradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRegistrations.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">Nenhuma inscrição encontrada</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm || eventFilter || statusFilter 
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Não há inscrições cadastradas ainda.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Data/Horário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Inscrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.map((registration) => {
                    // Find the event that contains this event_date
                    const event = events?.find(e => 
                      e.event_dates.some(ed => ed.id === registration.event_date.id)
                    )
                    
                    return (
                      <TableRow key={registration.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{registration.name}</div>
                            <div className="text-sm text-muted-foreground">
                              CPF: {registration.cpf}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {registration.city}, {registration.state}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {registration.phone}
                            </div>
                            {registration.email && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {registration.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {event?.city || 'Evento não encontrado'}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {event?.location}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {formatDate(registration.event_date.date)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatTime(registration.event_date.start_time)} - {formatTime(registration.event_date.end_time)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {getStatusBadge(registration.status)}
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(registration.created_at)}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
