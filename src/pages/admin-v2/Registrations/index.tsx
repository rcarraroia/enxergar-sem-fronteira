/**
 * ADMIN V2 - GESTÃO DE INSCRIÇÕES
 * Sistema completo para gerenciar agendamentos e inscrições em eventos
 */

import { useState } from 'react'
import { AdminLayout } from '@/components/admin-v2/shared/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar,
  Search,
  FileDown,
  Phone,
  Mail,
  MapPin,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  UserCheck
} from 'lucide-react'
import { 
  useRegistrationsV2, 
  useRegistrationStatsV2,
  useUpdateRegistrationStatusV2,
  type RegistrationV2, 
  type RegistrationFilters 
} from '@/hooks/admin-v2/useRegistrationsV2'
import { useEventsV2 } from '@/hooks/admin-v2/useEventsV2'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const AdminRegistrationsV2 = () => {
  const [filters, setFilters] = useState<RegistrationFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Hooks
  const { data: registrations = [], isLoading, error } = useRegistrationsV2(filters)
  const { data: events = [] } = useEventsV2({})
  const { data: stats } = useRegistrationStatsV2()
  const updateStatusMutation = useUpdateRegistrationStatusV2()

  const handleSearch = () => {
    setFilters({
      search: searchTerm || undefined,
      event_id: selectedEvent !== 'all' ? selectedEvent : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined
    })
  }

  const handleStatusChange = async (registrationId: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        registrationId,
        status: newStatus
      })
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Confirmado</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pendente</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Cancelado</Badge>
      case 'attended':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Compareceu</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const generatePDF = () => {
    if (registrations.length === 0) {
      toast.error('Nenhuma inscrição encontrada para gerar o relatório')
      return
    }

    setIsGenerating(true)
    
    try {
      const doc = new jsPDF()
      
      // Título do relatório
      doc.setFontSize(16)
      doc.text('RELATÓRIO DE INSCRIÇÕES', 14, 20)
      
      // Informações do relatório
      doc.setFontSize(12)
      const eventName = selectedEvent !== 'all' ? 
        events.find(e => e.id === selectedEvent)?.title || 'Evento não encontrado' : 
        'Todos os Eventos'
      
      doc.text(`Evento: ${eventName}`, 14, 30)
      doc.text(`Status: ${selectedStatus !== 'all' ? selectedStatus : 'Todos'}`, 14, 40)
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 50)
      doc.text(`Total de inscrições: ${registrations.length}`, 14, 60)

      // Preparar dados para a tabela
      const tableData = registrations.map((registration, index) => [
        index + 1,
        registration.patient?.nome || 'N/A',
        registration.patient?.telefone || 'N/A',
        registration.event?.title || 'N/A',
        registration.event_date?.date ? format(new Date(registration.event_date.date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A',
        registration.event_date?.start_time || 'N/A',
        registration.status === 'confirmed' ? 'Confirmado' :
        registration.status === 'pending' ? 'Pendente' :
        registration.status === 'cancelled' ? 'Cancelado' :
        registration.status === 'attended' ? 'Compareceu' : registration.status,
        format(new Date(registration.created_at), 'dd/MM/yyyy', { locale: ptBR })
      ])

      // Gerar tabela
      autoTable(doc, {
        head: [['#', 'Paciente', 'Telefone', 'Evento', 'Data', 'Horário', 'Status', 'Inscrito em']],
        body: tableData,
        startY: 70,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
      })

      // Salvar PDF
      const fileName = `inscricoes_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`
      doc.save(fileName)
      
      toast.success(`Relatório gerado com sucesso: ${fileName}`)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar relatório PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <AdminLayout 
      title="Gestão de Inscrições" 
      breadcrumbs={[
        { label: 'Dashboard', path: '/admin-v2' },
        { label: 'Inscrições', path: '/admin-v2/registrations' }
      ]}
    >
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar inscrições. Verifique sua conexão e tente novamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Nome do paciente ou evento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="event">Evento</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Eventos</SelectItem>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="attended">Compareceu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateFrom">Data Início</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dateTo">Data Fim</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button 
              onClick={generatePDF}
              disabled={isGenerating || registrations.length === 0}
              variant="outline"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Gerando...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 mr-2" />
                  Gerar PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats?.totalRegistrations || 0}</div>
                <div className="text-sm text-muted-foreground">Total de Inscrições</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{stats?.statusCounts?.confirmed || 0}</div>
                <div className="text-sm text-muted-foreground">Confirmadas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{stats?.statusCounts?.pending || 0}</div>
                <div className="text-sm text-muted-foreground">Pendentes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{stats?.recentRegistrations || 0}</div>
                <div className="text-sm text-muted-foreground">Últimos 7 dias</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Inscrições */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Inscrições ({registrations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma inscrição encontrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Paciente</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Evento</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Data/Hora</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((registration) => (
                    <tr key={registration.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{registration.patient?.nome || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {registration.patient?.telefone || 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {registration.patient?.email || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{registration.event?.title || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {registration.event?.location || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span className="text-sm">
                            {registration.event_date?.date ? 
                              format(new Date(registration.event_date.date), 'dd/MM/yyyy', { locale: ptBR }) : 
                              'N/A'
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className="text-sm">{registration.event_date?.start_time || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(registration.status)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {registration.status !== 'confirmed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(registration.id, 'confirmed')}
                              disabled={updateStatusMutation.isPending}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                          {registration.status !== 'cancelled' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(registration.id, 'cancelled')}
                              disabled={updateStatusMutation.isPending}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          )}
                          {registration.status === 'confirmed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(registration.id, 'attended')}
                              disabled={updateStatusMutation.isPending}
                            >
                              <UserCheck className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  )
}

export default AdminRegistrationsV2