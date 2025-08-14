
import React, { useState } from 'react'
import { useRegistrations } from '@/hooks/useRegistrations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  SelectValue
} from '@/components/ui/select'
import { 
  Users, 
  Search, 
  Download, 
  Calendar,
  Loader2,
  Mail,
  Phone,
  FileText
} from 'lucide-react'

interface RegistrationsListProps {
  eventId?: string
  showEventInfo?: boolean
}

export const RegistrationsList: React.FC<RegistrationsListProps> = ({ 
  eventId, 
  showEventInfo = false 
}) => {
  const { data: registrations, isLoading } = useRegistrations(eventId)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredRegistrations = registrations?.filter(registration => {
    const matchesSearch = 
      registration.patient.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.patient.cpf.includes(searchTerm.replace(/\D/g, ''))

    const matchesStatus = statusFilter === 'all' || registration.status === statusFilter

    return matchesSearch && matchesStatus
  }) || []

  const handleExportCSV = () => {
    if (!filteredRegistrations.length) return

    const headers = [
      'Nome',
      'CPF', 
      'Email',
      'Telefone',
      'Data Nascimento',
      'Diagnóstico',
      'Status',
      'Data Inscrição'
    ]

    if (showEventInfo) {
      headers.splice(-2, 0, 'Evento', 'Data Evento', 'Local')
    }

    const csvContent = [
      headers.join(','),
      ...filteredRegistrations.map(reg => {
        const baseRow = [
          `"${reg.patient.nome}"`,
          `"${reg.patient.cpf}"`,
          `"${reg.patient.email}"`,
          `"${reg.patient.telefone}"`,
          reg.patient.data_nascimento ? `"${new Date(reg.patient.data_nascimento).toLocaleDateString('pt-BR')}"` : '""',
          `"${reg.patient.diagnostico || ''}"`,
          `"${reg.status}"`,
          `"${new Date(reg.created_at).toLocaleDateString('pt-BR')}"`
        ]

        if (showEventInfo) {
          baseRow.splice(-2, 0, 
            `"${reg.event_date.event.title}"`,
            `"${new Date(reg.event_date.date + 'T00:00:00').toLocaleDateString('pt-BR')}"`,
            `"${reg.event_date.event.location}"`
          )
        }

        return baseRow.join(',')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `inscricoes_${eventId || 'todos'}_${new Date().getTime()}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default">Confirmado</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>
      case 'waiting':
        return <Badge variant="secondary">Lista de Espera</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando inscrições...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Inscrições {eventId ? 'do Evento' : 'Gerais'}
        </CardTitle>
        <CardDescription>
          {filteredRegistrations.length} inscrição(ões) encontrada(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
              <SelectItem value="waiting">Lista de Espera</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Tabela */}
        {filteredRegistrations.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? 'Nenhuma inscrição encontrada com estes filtros' 
                : 'Nenhuma inscrição encontrada'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participante</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Informações</TableHead>
                  {showEventInfo && <TableHead>Evento</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Data Inscrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((registration) => (
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
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {registration.patient.email}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {registration.patient.telefone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {registration.patient.data_nascimento && (
                          <div>
                            Nascimento: {new Date(registration.patient.data_nascimento).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                        {registration.patient.diagnostico && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {registration.patient.diagnostico.slice(0, 30)}
                            {registration.patient.diagnostico.length > 30 && '...'}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {showEventInfo && (
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{registration.event_date.event.title}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(registration.event_date.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {registration.event_date.event.location}
                          </div>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      {getStatusBadge(registration.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(registration.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
