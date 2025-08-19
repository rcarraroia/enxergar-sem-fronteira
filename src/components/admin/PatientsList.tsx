
import React, { useState } from 'react'
import { usePatients } from '@/hooks/usePatients'
import { useRegistrations } from '@/hooks/useRegistrations'
import { useEvents } from '@/hooks/useEvents'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  TableRow 
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Users, 
  Search, 
  Download, 
  Loader2,
  Mail,
  Phone,
  FileText,
  Calendar,
  Trash2,
  MapPin,
  Clock,
  Filter,
  FileDown
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export const PatientsList: React.FC = () => {
  const { data: patients, isLoading, refetch } = usePatients()
  const { data: registrations, isLoading: registrationsLoading } = useRegistrations()
  const { data: events, isLoading: eventsLoading } = useEvents()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCity, setSelectedCity] = useState<string>('all')
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const [selectedDate, setSelectedDate] = useState<string>('all')
  const [deletingPatient, setDeletingPatient] = useState<string | null>(null)

  // Debug logs
  React.useEffect(() => {
    console.log('🔍 Dados carregados - Patients:', patients?.length || 0, 'Registrations:', registrations?.length || 0, 'Events:', events?.length || 0)
  }, [patients, registrations, events])

  // Extrair cidades únicas dos eventos
  const cities = React.useMemo(() => {
    if (!events) return []
    const uniqueCities = [...new Set(events.map(event => event.city).filter(Boolean))]
    console.log('🏙️ Cidades encontradas:', uniqueCities)
    return uniqueCities.sort()
  }, [events])

  // Extrair eventos únicos
  const eventOptions = React.useMemo(() => {
    if (!events) return []
    const options = events.map(event => ({
      id: event.id,
      title: event.title,
      city: event.city
    }))
    console.log('📅 Eventos encontrados:', options)
    return options
  }, [events])

  // Extrair datas únicas baseadas no evento selecionado
  const eventDates = React.useMemo(() => {
    if (!registrations || selectedEvent === 'all') return []
    
    const datesForEvent = registrations
      .filter(reg => reg.event_date?.event?.id === selectedEvent)
      .map(reg => ({
        id: reg.event_date.id,
        date: reg.event_date.date,
        start_time: reg.event_date.start_time,
        end_time: reg.event_date.end_time
      }))
    
    // Remover duplicatas
    const uniqueDates = datesForEvent.filter((date, index, self) => 
      index === self.findIndex(d => d.id === date.id)
    )
    
    return uniqueDates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [registrations, selectedEvent])

  // Criar mapa de pacientes com suas inscrições
  const patientsWithRegistrations = React.useMemo(() => {
    if (!patients || !registrations) return []
    
    const result = patients.map(patient => {
      const patientRegistrations = registrations.filter(reg => reg.patient?.id === patient.id)
      return {
        ...patient,
        registrations: patientRegistrations
      }
    })
    
    console.log('👥 Pacientes com inscrições:', result.length)
    console.log('🔍 Exemplo de registração completa:', registrations[0])
    
    // Log detalhado da estrutura
    if (registrations[0]) {
      console.log('📋 Estrutura da registração:')
      console.log('- patient:', registrations[0].patient)
      console.log('- event_date:', registrations[0].event_date)
      console.log('- event_date.event:', registrations[0].event_date?.event)
      console.log('- event_date.event.city:', registrations[0].event_date?.event?.city)
    }
    
    // Log de paciente com registrações
    const patientWithRegs = result.find(p => p.registrations.length > 0)
    if (patientWithRegs) {
      console.log('👤 Paciente com registrações:', patientWithRegs.nome)
      console.log('📝 Suas registrações:', patientWithRegs.registrations.length)
      console.log('🏙️ Cidade da primeira registração:', patientWithRegs.registrations[0]?.event_date?.event?.city)
    }
    
    return result
  }, [patients, registrations])

  // Filtrar pacientes baseado nos critérios selecionados
  const filteredPatients = React.useMemo(() => {
    let filtered = patientsWithRegistrations

    console.log('🔍 Iniciando filtros com', filtered.length, 'pacientes')
    console.log('Filtros ativos:', { searchTerm, selectedCity, selectedEvent, selectedDate })

    // Filtro por texto
    if (searchTerm) {
      const beforeCount = filtered.length
      filtered = filtered.filter(patient => 
        patient.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.cpf.includes(searchTerm.replace(/\D/g, ''))
      )
      console.log(`📝 Filtro por texto: ${beforeCount} → ${filtered.length}`)
    }

    // Filtro por cidade
    if (selectedCity !== 'all') {
      const beforeCount = filtered.length
      filtered = filtered.filter(patient => {
        const hasCity = patient.registrations.some(reg => {
          const eventCity = reg.event_date?.event?.city
          console.log(`Comparando cidade: "${eventCity}" === "${selectedCity}"`)
          return eventCity === selectedCity
        })
        return hasCity
      })
      console.log(`🏙️ Filtro por cidade "${selectedCity}": ${beforeCount} → ${filtered.length}`)
    }

    // Filtro por evento
    if (selectedEvent !== 'all') {
      const beforeCount = filtered.length
      filtered = filtered.filter(patient => {
        const hasEvent = patient.registrations.some(reg => {
          const eventId = reg.event_date?.event?.id
          return eventId === selectedEvent
        })
        return hasEvent
      })
      console.log(`📅 Filtro por evento "${selectedEvent}": ${beforeCount} → ${filtered.length}`)
    }

    // Filtro por data específica
    if (selectedDate !== 'all') {
      const beforeCount = filtered.length
      filtered = filtered.filter(patient => {
        const hasDate = patient.registrations.some(reg => {
          const dateId = reg.event_date?.id
          return dateId === selectedDate
        })
        return hasDate
      })
      console.log(`📆 Filtro por data "${selectedDate}": ${beforeCount} → ${filtered.length}`)
    }

    console.log('✅ Resultado final dos filtros:', filtered.length, 'pacientes')
    return filtered
  }, [patientsWithRegistrations, searchTerm, selectedCity, selectedEvent, selectedDate])

  const handleDeletePatient = async (patientId: string, patientName: string) => {
    try {
      setDeletingPatient(patientId)
      console.log('🗑️ Excluindo paciente:', patientId, patientName)

      // Primeiro, deletar todas as inscrições do paciente
      const { error: registrationsError } = await supabase
        .from('registrations')
        .delete()
        .eq('patient_id', patientId)

      if (registrationsError) {
        console.error('❌ Erro ao excluir inscrições:', registrationsError)
        throw registrationsError
      }

      // Depois, deletar o paciente
      const { error: patientError } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId)

      if (patientError) {
        console.error('❌ Erro ao excluir paciente:', patientError)
        throw patientError
      }

      console.log('✅ Paciente e inscrições excluídos com sucesso')
      toast.success(`Paciente ${patientName} e suas inscrições foram excluídos com sucesso`)
      
      // Atualizar a lista
      refetch()
    } catch (error: any) {
      console.error('❌ Erro ao excluir paciente:', error)
      toast.error('Erro ao excluir paciente: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setDeletingPatient(null)
    }
  }

  const handleExportPDF = () => {
    if (!filteredPatients.length) return

    // Criar conteúdo HTML para o PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Lista de Pacientes</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .filters { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .patient-name { font-weight: bold; }
          .registration { margin-bottom: 5px; font-size: 10px; }
          .badge { padding: 2px 6px; border-radius: 3px; font-size: 10px; }
          .badge-confirmed { background: #d4edda; color: #155724; }
          .badge-pending { background: #f8d7da; color: #721c24; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Lista de Pacientes - Enxergar sem Fronteiras</h1>
          <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
        
        <div class="filters">
          <strong>Filtros aplicados:</strong>
          ${selectedCity !== 'all' ? `Cidade: ${selectedCity} | ` : ''}
          ${selectedEvent !== 'all' ? `Evento específico | ` : ''}
          ${selectedDate !== 'all' ? `Data específica | ` : ''}
          ${searchTerm ? `Busca: "${searchTerm}" | ` : ''}
          <strong>Total: ${filteredPatients.length} paciente(s)</strong>
        </div>

        <table>
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Contato</th>
              <th>Data Nasc.</th>
              <th>Inscrições</th>
              <th>LGPD</th>
              <th>Cadastro</th>
            </tr>
          </thead>
          <tbody>
            ${filteredPatients.map(patient => `
              <tr>
                <td>
                  <div class="patient-name">${patient.nome}</div>
                  <div>CPF: ${patient.cpf}</div>
                </td>
                <td>
                  <div>📧 ${patient.email}</div>
                  <div>📞 ${patient.telefone}</div>
                </td>
                <td>
                  ${patient.data_nascimento ? new Date(patient.data_nascimento).toLocaleDateString('pt-BR') : '-'}
                  ${patient.diagnostico ? `<br><small>${patient.diagnostico.slice(0, 50)}${patient.diagnostico.length > 50 ? '...' : ''}</small>` : ''}
                </td>
                <td>
                  ${patient.registrations.length === 0 ? 'Nenhuma inscrição' : 
                    patient.registrations.map(reg => `
                      <div class="registration">
                        <strong>${reg.event_date?.event?.title || 'N/A'}</strong><br>
                        📍 ${reg.event_date?.event?.city?.trim() || 'N/A'}<br>
                        📅 ${reg.event_date?.date ? new Date(reg.event_date.date).toLocaleDateString('pt-BR') : 'N/A'} 
                        ⏰ ${reg.event_date?.start_time?.slice(0, 5) || ''}-${reg.event_date?.end_time?.slice(0, 5) || ''}<br>
                        <span class="badge ${reg.status === 'confirmed' ? 'badge-confirmed' : 'badge-pending'}">
                          ${reg.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                        </span>
                      </div>
                    `).join('')
                  }
                </td>
                <td>
                  <span class="badge ${patient.consentimento_lgpd ? 'badge-confirmed' : 'badge-pending'}">
                    ${patient.consentimento_lgpd ? 'Aceito' : 'Pendente'}
                  </span>
                </td>
                <td>${new Date(patient.created_at).toLocaleDateString('pt-BR')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Documento gerado automaticamente pelo sistema Enxergar sem Fronteiras</p>
          <p>Total de registros: ${filteredPatients.length}</p>
        </div>
      </body>
      </html>
    `

    // Criar e baixar o PDF
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      
      // Aguardar o carregamento e imprimir
      printWindow.onload = () => {
        printWindow.print()
        printWindow.close()
      }
    }
  }

  const handleExportCSV = () => {
    if (!filteredPatients.length) return

    const headers = [
      'Nome',
      'CPF', 
      'Email',
      'Telefone',
      'Data Nascimento',
      'Diagnóstico',
      'LGPD',
      'Data Cadastro',
      'Inscrições'
    ]

    const csvContent = [
      headers.join(','),
      ...filteredPatients.map(patient => {
        const inscricoes = patient.registrations.map(reg => 
          `${reg.event_date?.event?.title} - ${reg.event_date?.event?.city?.trim()} - ${new Date(reg.event_date?.date || '').toLocaleDateString('pt-BR')} ${reg.event_date?.start_time?.slice(0, 5)}-${reg.event_date?.end_time?.slice(0, 5)}`
        ).join('; ')
        
        return [
          `"${patient.nome}"`,
          `"${patient.cpf}"`,
          `"${patient.email}"`,
          `"${patient.telefone}"`,
          patient.data_nascimento ? `"${new Date(patient.data_nascimento).toLocaleDateString('pt-BR')}"` : '""',
          `"${patient.diagnostico || ''}"`,
          `"${patient.consentimento_lgpd ? 'Sim' : 'Não'}"`,
          `"${new Date(patient.created_at).toLocaleDateString('pt-BR')}"`,
          `"${inscricoes}"`
        ].join(',')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    
    // Nome do arquivo mais descritivo baseado nos filtros
    let fileName = 'pacientes'
    if (selectedCity !== 'all') fileName += `_${selectedCity}`
    if (selectedEvent !== 'all') fileName += '_evento'
    if (selectedDate !== 'all') fileName += '_data'
    fileName += `_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`
    
    link.setAttribute('download', fileName)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading || registrationsLoading || eventsLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando dados...</span>
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
          Gestão de Pacientes
        </CardTitle>
        <CardDescription>
          Visualize e gerencie pacientes por cidade, evento e data específica
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            Filtros
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as cidades</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      {city}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedEvent} onValueChange={(value) => {
              setSelectedEvent(value)
              setSelectedDate('all') // Reset date when event changes
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os eventos</SelectItem>
                {eventOptions.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    <div className="flex flex-col">
                      <span>{event.title}</span>
                      <span className="text-xs text-muted-foreground">{event.city}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={selectedDate} 
              onValueChange={setSelectedDate}
              disabled={selectedEvent === 'all'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as datas</SelectItem>
                {eventDates.map(date => (
                  <SelectItem key={date.id} value={date.id}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <div className="flex flex-col">
                        <span>{new Date(date.date).toLocaleDateString('pt-BR')}</span>
                        <span className="text-xs text-muted-foreground">
                          {date.start_time.slice(0, 5)} - {date.end_time.slice(0, 5)}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {filteredPatients.length} paciente(s) encontrado(s)
              {(selectedCity !== 'all' || selectedEvent !== 'all' || selectedDate !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCity('all')
                    setSelectedEvent('all')
                    setSelectedDate('all')
                    setSearchTerm('')
                  }}
                  className="ml-2 h-6 px-2 text-xs"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button onClick={handleExportPDF} variant="outline" size="sm">
                <FileDown className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg text-sm">
          <h4 className="font-medium mb-2">Debug Info:</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p>Pacientes: {patients?.length || 0}</p>
              <p>Registrações: {registrations?.length || 0}</p>
              <p>Eventos: {events?.length || 0}</p>
            </div>
            <div>
              <p>Cidades: {cities.length}</p>
              <p>Pacientes filtrados: {filteredPatients.length}</p>
              <p>Filtros ativos: {[selectedCity !== 'all', selectedEvent !== 'all', selectedDate !== 'all', searchTerm !== ''].filter(Boolean).length}</p>
            </div>
          </div>
        </div>

        {/* Tabela */}
        {filteredPatients.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || selectedCity !== 'all' || selectedEvent !== 'all' || selectedDate !== 'all'
                ? 'Nenhum paciente encontrado com estes filtros' 
                : 'Nenhum paciente cadastrado ainda'}
            </p>
            {patients && patients.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Existem {patients.length} pacientes no total, mas nenhum corresponde aos filtros aplicados.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Data de Nasc.</TableHead>
                  <TableHead>Inscrições</TableHead>
                  <TableHead>LGPD</TableHead>
                  <TableHead>Data Cadastro</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{patient.nome}</div>
                        <div className="text-sm text-muted-foreground">
                          CPF: {patient.cpf}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {patient.email}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {patient.telefone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {patient.data_nascimento && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(patient.data_nascimento).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                        {patient.diagnostico && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {patient.diagnostico.slice(0, 30)}
                            {patient.diagnostico.length > 30 && '...'}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {patient.registrations.length === 0 ? (
                          <span className="text-xs text-muted-foreground">Nenhuma inscrição</span>
                        ) : (
                          patient.registrations.slice(0, 2).map((reg, index) => (
                            <div key={reg.id} className="text-xs space-y-1">
                              <div className="font-medium">{reg.event_date?.event?.title}</div>
                              <div className="text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-2 w-2" />
                                {reg.event_date?.event?.city?.trim()}
                              </div>
                              <div className="text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-2 w-2" />
                                {new Date(reg.event_date?.date || '').toLocaleDateString('pt-BR')}
                                <span className="mx-1">•</span>
                                <Clock className="h-2 w-2" />
                                {reg.event_date?.start_time?.slice(0, 5)} - {reg.event_date?.end_time?.slice(0, 5)}
                              </div>
                              <Badge 
                                variant={reg.status === 'confirmed' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {reg.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                              </Badge>
                            </div>
                          ))
                        )}
                        {patient.registrations.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{patient.registrations.length - 2} mais
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={patient.consentimento_lgpd ? "default" : "destructive"}>
                        {patient.consentimento_lgpd ? 'Aceito' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(patient.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={deletingPatient === patient.id}
                            >
                              {deletingPatient === patient.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o paciente <strong>{patient.nome}</strong>?
                                <br /><br />
                                <span className="text-destructive font-medium">
                                  ⚠️ Esta ação irá excluir permanentemente:
                                </span>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                  <li>Todos os dados do paciente</li>
                                  <li>Todas as inscrições em eventos</li>
                                  <li>Histórico de registros</li>
                                </ul>
                                <br />
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePatient(patient.id, patient.nome)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir Permanentemente
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
