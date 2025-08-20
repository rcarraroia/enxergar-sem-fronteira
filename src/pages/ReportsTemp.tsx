import React, { useState } from 'react'
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
import { Calendar, FileDown, Search } from 'lucide-react'
import { useRegistrationsFiltered, useAvailableCities } from '@/hooks/useRegistrationsFiltered'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Registration } from '@/hooks/useRegistrations'
import { formatDate } from '@/utils/dateUtils'

const ReportsTemp = () => {
  const [selectedCity, setSelectedCity] = useState<string>('all')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Buscar cidades disponíveis
  const { data: availableCities = [] } = useAvailableCities()

  // Buscar dados com filtros
  const { data: registrations = [], isLoading } = useRegistrationsFiltered({
    city: selectedCity !== 'all' ? selectedCity : undefined,
    date: selectedDate ? new Date(selectedDate) : undefined
  })

  const generatePDF = () => {
    if (registrations.length === 0) {
      toast.error('Nenhum agendamento encontrado para os filtros selecionados')
      return
    }

    setIsGenerating(true)
    
    try {
      const doc = new jsPDF()
      
      // Título do relatório
      const title = 'RELATÓRIO DE AGENDAMENTOS'
      
      // Usar a função formatDate corrigida
      const dateDisplayText = selectedDate ? formatDate(selectedDate) : 'Todas as Datas'
      
      const subtitle = `${selectedCity !== 'all' ? selectedCity : 'Todas as Cidades'} - ${dateDisplayText}`
      
      doc.setFontSize(16)
      doc.text(title, 14, 20)
      
      doc.setFontSize(12)
      doc.text(subtitle, 14, 30)
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 40)
      doc.text(`Total de registros: ${registrations.length}`, 14, 50)

      // Preparar dados para a tabela
      const tableData = registrations.map((reg: Registration) => [
        reg.patient.nome,
        reg.patient.cpf,
        reg.patient.telefone,
        reg.patient.email,
        reg.event_date.event.city,
        formatDate(reg.event_date.date),
        reg.event_date.start_time,
        reg.status === 'confirmed' ? 'Confirmado' :
        reg.status === 'pending' ? 'Pendente' :
        reg.status === 'attended' ? 'Compareceu' : 'Cancelado',
        new Date(reg.created_at).toLocaleDateString('pt-BR')
      ])

      // Cabeçalhos da tabela
      const headers = [
        'Nome',
        'CPF',
        'Telefone', 
        'Email',
        'Cidade',
        'Data Evento',
        'Horário',
        'Status',
        'Agendado em'
      ]

      // Gerar tabela
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 60,
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 25 }, // Nome
          1: { cellWidth: 20 }, // CPF
          2: { cellWidth: 20 }, // Telefone
          3: { cellWidth: 30 }, // Email
          4: { cellWidth: 20 }, // Cidade
          5: { cellWidth: 20 }, // Data
          6: { cellWidth: 15 }, // Horário
          7: { cellWidth: 20 }, // Status
          8: { cellWidth: 20 }  // Agendado em
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      })

      // Nome do arquivo
      const cityName = selectedCity !== 'all' ? selectedCity.replace(/\s+/g, '_') : 'todas_cidades'
      const dateStr = selectedDate ? selectedDate.replace(/-/g, '_') : new Date().toISOString().split('T')[0].replace(/-/g, '_')
      const filename = `relatorio_agendamentos_${cityName}_${dateStr}.pdf`

      // Salvar PDF
      doc.save(filename)
      
      toast.success(`Relatório gerado: ${filename}`)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar relatório PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gerador de Relatórios - Agendamentos
          </h1>
          <p className="text-gray-600">
            Solução provisória para exportar relatórios em PDF
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros do Relatório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma cidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Cidades</SelectItem>
                    {availableCities.map(city => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data do Evento</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultados e Geração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5" />
              Gerar Relatório PDF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-blue-600">Total de Registros</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {isLoading ? '...' : registrations.length}
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-green-600">Confirmados</div>
                  <div className="text-2xl font-bold text-green-900">
                    {isLoading ? '...' : registrations.filter((r: Registration) => r.status === 'confirmed').length}
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-yellow-600">Pendentes</div>
                  <div className="text-2xl font-bold text-yellow-900">
                    {isLoading ? '...' : registrations.filter((r: Registration) => r.status === 'pending').length}
                  </div>
                </div>
              </div>

              {/* Preview */}
              {registrations.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Preview dos dados (primeiros 5 registros):</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-2 py-1 text-left">Nome</th>
                          <th className="border border-gray-300 px-2 py-1 text-left">Cidade</th>
                          <th className="border border-gray-300 px-2 py-1 text-left">Data</th>
                          <th className="border border-gray-300 px-2 py-1 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrations.slice(0, 5).map((reg: Registration) => (
                          <tr key={reg.id}>
                            <td className="border border-gray-300 px-2 py-1">{reg.patient.nome}</td>
                            <td className="border border-gray-300 px-2 py-1">{reg.event_date.event.city}</td>
                            <td className="border border-gray-300 px-2 py-1">
                              {formatDate(reg.event_date.date)}
                            </td>
                            <td className="border border-gray-300 px-2 py-1">
                              {reg.status === 'confirmed' ? 'Confirmado' : 
                               reg.status === 'pending' ? 'Pendente' : 
                               reg.status === 'attended' ? 'Compareceu' : 'Cancelado'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {registrations.length > 5 && (
                      <p className="text-sm text-gray-600 mt-2">
                        ... e mais {registrations.length - 5} registros
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Botão de gerar */}
              <Button
                onClick={generatePDF}
                disabled={isGenerating || isLoading || registrations.length === 0}
                className="w-full md:w-auto"
                size="lg"
              >
                <FileDown className="h-4 w-4 mr-2" />
                {isGenerating ? 'Gerando PDF...' : 'Gerar Relatório PDF'}
              </Button>

              {registrations.length === 0 && !isLoading && (
                <p className="text-gray-600 text-center py-4">
                  Nenhum agendamento encontrado para os filtros selecionados.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instruções */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-2">Instruções de uso:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Selecione os filtros desejados (cidade e/ou data)</li>
              <li>• Visualize o preview dos dados que serão incluídos no relatório</li>
              <li>• Clique em "Gerar Relatório PDF" para fazer o download</li>
              <li>• O arquivo será baixado automaticamente com nome descritivo</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ReportsTemp
