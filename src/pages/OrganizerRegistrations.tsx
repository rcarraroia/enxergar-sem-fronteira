
import React, { useState, useEffect } from 'react'
import { OrganizerLayout } from '@/components/organizer/OrganizerLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search,
  Filter,
  Download,
  Mail,
  Check,
  X,
  Calendar,
  Users,
  TrendingUp,
  FileText
} from 'lucide-react'
import { useOrganizerRegistrations } from '@/hooks/useOrganizerRegistrations'
import { useOrganizerEvents } from '@/hooks/useOrganizerEvents'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const OrganizerRegistrations = () => {
  const { 
    registrations, 
    loading, 
    stats,
    exportRegistrations,
    markAttendance,
    sendBulkNotification,
    fetchRegistrationsByOrganizer
  } = useOrganizerRegistrations()
  const { events } = useOrganizerEvents()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [eventFilter, setEventFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([])
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationSubject, setNotificationSubject] = useState('')

  const filteredRegistrations = registrations.filter(registration => {
    const matchesSearch = 
      registration.patient.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.patient.cpf.includes(searchTerm)
    
    const matchesEvent = eventFilter === 'all' || 
      registration.event_date.event.id === eventFilter
    
    const matchesStatus = statusFilter === 'all' || 
      registration.status === statusFilter
    
    return matchesSearch && matchesEvent && matchesStatus
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRegistrations(filteredRegistrations.map(r => r.id))
    } else {
      setSelectedRegistrations([])
    }
  }

  const handleSelectRegistration = (registrationId: string, checked: boolean) => {
    if (checked) {
      setSelectedRegistrations(prev => [...prev, registrationId])
    } else {
      setSelectedRegistrations(prev => prev.filter(id => id !== registrationId))
    }
  }

  const handleMarkAttendance = async (registrationId: string, attended: boolean) => {
    await markAttendance(registrationId, attended)
  }

  const handleExport = async (format: 'csv' | 'pdf' = 'csv') => {
    await exportRegistrations(format, eventFilter !== 'all' ? eventFilter : undefined)
  }

  const handleSendNotification = async () => {
    if (selectedRegistrations.length === 0) {
      return
    }
    
    await sendBulkNotification(selectedRegistrations, notificationMessage, notificationSubject)
    setSelectedRegistrations([])
    setNotificationMessage('')
    setNotificationSubject('')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="secondary">Confirmado</Badge>
      case 'attended':
        return <Badge variant="default">Presente</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <OrganizerLayout>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </OrganizerLayout>
    )
  }

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inscrições</h1>
          <p className="text-gray-600">Gerencie todas as inscrições dos seus eventos</p>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    Total de Inscrições
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.totalRegistrations}</div>
                <p className="text-sm text-muted-foreground">Todas as inscrições</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    Esta Semana
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.thisWeekRegistrations}</div>
                <p className="text-sm text-muted-foreground">Últimos 7 dias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    Taxa de Comparecimento
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.attendanceRate.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">Presença confirmada</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-600" />
                    Eventos Ativos
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {events.filter(e => e.status === 'open').length}
                </div>
                <p className="text-sm text-muted-foreground">Recebendo inscrições</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros e Ações */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome, email ou CPF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger className="w-full lg:w-[200px]">
                  <SelectValue placeholder="Filtrar por evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os eventos</SelectItem>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="confirmed">Confirmados</SelectItem>
                  <SelectItem value="attended">Presentes</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleExport('csv')}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>

                {selectedRegistrations.length > 0 && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Mail className="h-4 w-4 mr-2" />
                        Notificar ({selectedRegistrations.length})
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Enviar Notificação</DialogTitle>
                        <DialogDescription>
                          Enviar mensagem para {selectedRegistrations.length} pessoa(s) selecionada(s).
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="subject">Assunto</Label>
                          <Input
                            id="subject"
                            value={notificationSubject}
                            onChange={(e) => setNotificationSubject(e.target.value)}
                            placeholder="Assunto da mensagem"
                          />
                        </div>
                        <div>
                          <Label htmlFor="message">Mensagem</Label>
                          <Textarea
                            id="message"
                            value={notificationMessage}
                            onChange={(e) => setNotificationMessage(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            rows={4}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {
                          setNotificationMessage('')
                          setNotificationSubject('')
                        }}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSendNotification}>
                          Enviar Notificação
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Inscrições */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedRegistrations.length === filteredRegistrations.length && filteredRegistrations.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Inscrição</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedRegistrations.includes(registration.id)}
                        onCheckedChange={(checked) => 
                          handleSelectRegistration(registration.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{registration.patient.nome}</div>
                        <div className="text-sm text-gray-500">{registration.patient.email}</div>
                        <div className="text-sm text-gray-500">{registration.patient.telefone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{registration.event_date.event.title}</div>
                        <div className="text-sm text-gray-500">{registration.event_date.event.location}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{format(new Date(registration.event_date.date), 'dd/MM/yyyy', { locale: ptBR })}</div>
                        <div className="text-sm text-gray-500">
                          {registration.event_date.start_time} - {registration.event_date.end_time}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(registration.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {format(new Date(registration.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {registration.status !== 'attended' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAttendance(registration.id, true)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {registration.status === 'attended' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAttendance(registration.id, false)}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredRegistrations.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhuma inscrição encontrada
                </h3>
                <p className="text-gray-600">
                  {searchTerm || eventFilter !== 'all' || statusFilter !== 'all'
                    ? 'Tente ajustar os filtros para encontrar inscrições.'
                    : 'Ainda não há inscrições para seus eventos.'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OrganizerLayout>
  )
}

export default OrganizerRegistrations
