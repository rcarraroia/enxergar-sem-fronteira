
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
  eventDateId?: string
  showEventInfo?: boolean
}

export const RegistrationsList: React.FC<RegistrationsListProps> = ({ 
  eventId,
  eventDateId, 
  showEventInfo = false 
}) => {
  const { data: registrations, isLoading } = useRegistrations(eventId, eventDateId)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredRegistrations = registrations?.filter(registration => {
    const matchesSearch = 
      registration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (registration.email && registration.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      registration.cpf.includes(searchTerm.replace(/\D/g, ''))

    const matchesStatus = statusFilter === 'all' || registration.status === statusFilter

    return matchesSearch && matchesStatus
  }) || []

  const handleExportPDF = async () => {
    if (!filteredRegistrations.length) {
      alert('Nenhuma inscrição para exportar')
      return
    }

    try {
      // Preparar dados para PDF
      const pdfData = {
        titulo: 'Relatório de Inscrições',
        data: new Date().toLocaleDateString('pt-BR'),
        filtros: {
          evento: eventId || 'Todos os eventos',
          status: statusFilter === 'all' ? 'Todos os status' : statusFilter,
          busca: searchTerm || 'Sem filtro'
        },
        total: filteredRegistrations.length,
        pacientes: filteredRegistrations.map(reg => ({
          nome: reg.name,
          cpf: reg.cpf,
          email: reg.email || '',
          telefone: reg.phone,
          status: reg.status,
          inscricao: new Date(reg.created_at).toLocaleDateString('pt-BR'),
          evento: showEventInfo ? reg.event_date.event.city : '',
          dataEvento: showEventInfo ? 
            new Date(reg.event_date.date + 'T00:00:00').toLocaleDateString('pt-BR') : '',
          local: showEventInfo ? reg.event_date.event.location : ''
        }))
      }

      // Criar HTML para PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${pdfData.titulo}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .filters { background: #f5f5f5; padding: 15px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${pdfData.titulo}</h1>
            <p>Gerado em: ${pdfData.data}</p>
          </div>
          
          <div class="filters">
            <h3>Filtros Aplicados:</h3>
            <p><strong>Evento:</strong> ${pdfData.filtros.evento}</p>
            <p><strong>Status:</strong> ${pdfData.filtros.status}</p>
            <p><strong>Busca:</strong> ${pdfData.filtros.busca}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>Status</th>
                <th>Data Inscrição</th>
                ${showEventInfo ? '<th>Evento</th><th>Data Evento</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${pdfData.pacientes.map(p => `
                <tr>
                  <td>${p.nome}</td>
                  <td>${p.cpf}</td>
                  <td>${p.email}</td>
                  <td>${p.telefone}</td>
                  <td>${p.status}</td>
                  <td>${p.inscricao}</td>
                  ${showEventInfo ? `<td>${p.evento}</td><td>${p.dataEvento}</td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total">
            <p>Total de inscrições: ${pdfData.total}</p>
          </div>
        </body>
        </html>
      `

      // Abrir em nova janela para impressão/PDF
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
      }

    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar PDF. Tente novamente.')
    }
  }

  const handleExportCSV = () => {
    if (!filteredRegistrations.length) return

    const headers = [
      'Nome',
      'CPF', 
      'Email',
      'Telefone',
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
          `"${reg.name}"`,
          `"${reg.cpf}"`,
          `"${reg.email || ''}"`,
          `"${reg.phone}"`,
          `"${reg.status}"`,
          `"${new Date(reg.created_at).toLocaleDateString('pt-BR')}"`
        ]

        if (showEventInfo) {
          baseRow.splice(-2, 0, 
            `"${reg.event_date.event.city}"`,
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
          <Button onClick={handleExportPDF} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
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
                        <div className="font-medium">{registration.name}</div>
                        <div className="text-sm text-muted-foreground">
                          CPF: {registration.cpf}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {registration.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {registration.email}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {registration.phone}
                        </div>
                      </div>
                    </TableCell>
                    {showEventInfo && (
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{registration.event_date.event.city}</div>
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
