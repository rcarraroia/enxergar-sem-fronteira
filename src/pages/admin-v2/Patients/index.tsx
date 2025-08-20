/**
 * ADMIN V2 - GESTÃO DE PACIENTES
 * Sistema completo com filtros avançados e geração de PDF
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
  Users, 
  Search,
  FileDown,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Filter
} from 'lucide-react'
import { usePatientsV2, type PatientV2, type PatientFilters } from '@/hooks/admin-v2/usePatientsV2'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const AdminPatientsV2 = () => {
  const [filters, setFilters] = useState<PatientFilters>({
    search: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'city' | 'created_at'>('name')
  const [isGenerating, setIsGenerating] = useState(false)

  const { data: patients = [], isLoading, error } = usePatientsV2(filters)

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 'N/A'
    const today = new Date()
    const birth = new Date(birthDate)
    const age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1
    }
    return age
  }

  // Filtrar e ordenar pacientes
  const filteredAndSortedPatients = patients
    .filter(patient => {
      if (!searchTerm) return true
      const search = searchTerm.toLowerCase()
      return (
        patient.name?.toLowerCase().includes(search) ||
        patient.email?.toLowerCase().includes(search) ||
        patient.city?.toLowerCase().includes(search) ||
        patient.phone?.toLowerCase().includes(search)
      )
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '')
        case 'city':
          return (a.city || '').localeCompare(b.city || '')
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchTerm }))
  }

  const generatePDF = () => {
    if (filteredAndSortedPatients.length === 0) {
      toast.error('Nenhum paciente encontrado para gerar o relatório')
      return
    }

    setIsGenerating(true)
    
    try {
      const doc = new jsPDF()
      
      // Título do relatório
      doc.setFontSize(16)
      doc.text('RELATÓRIO DE PACIENTES CADASTRADOS', 20, 20)
      
      // Informações do relatório
      doc.setFontSize(10)
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 20, 30)
      doc.text(`Total de pacientes: ${filteredAndSortedPatients.length}`, 20, 35)
      if (searchTerm) {
        doc.text(`Filtro aplicado: ${searchTerm}`, 20, 40)
      }
      
      // Preparar dados para a tabela
      const tableData = filteredAndSortedPatients.map((patient, index) => [
        index + 1,
        patient.name || 'N/A',
        calculateAge(patient.birth_date || ''),
        patient.email || 'N/A',
        patient.phone || 'N/A',
        patient.city && patient.state ? `${patient.city}, ${patient.state}` : 'N/A',
        format(new Date(patient.created_at), 'dd/MM/yyyy', { locale: ptBR })
      ])

      // Gerar tabela
      autoTable(doc, {
        head: [['#', 'Nome', 'Idade', 'Email', 'Telefone', 'Cidade', 'Cadastrado em']],
        body: tableData,
        startY: searchTerm ? 50 : 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
      })

      // Salvar PDF
      const fileName = `pacientes_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`
      doc.save(fileName)
      
      toast.success(`Relatório gerado com sucesso: ${fileName}`)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar relatório PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  if (error) {
    return (
      <AdminLayout 
        title="Gestão de Pacientes" 
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin-v2' },
          { label: 'Pacientes', path: '/admin-v2/patients' }
        ]}
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar pacientes. Verifique sua conexão e tente novamente.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout 
      title="Gestão de Pacientes" 
      breadcrumbs={[
        { label: 'Dashboard', path: '/admin-v2' },
        { label: 'Pacientes', path: '/admin-v2/patients' }
      ]}
    >
      {/* Filtros do Relatório */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">Buscar Paciente</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Nome, email, telefone ou cidade..."
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
              <Label htmlFor="sortBy">Ordenar por</Label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nome (A-Z)</SelectItem>
                  <SelectItem value="city">Cidade (A-Z)</SelectItem>
                  <SelectItem value="created_at">Data de Cadastro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={generatePDF}
                disabled={isGenerating || filteredAndSortedPatients.length === 0}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{filteredAndSortedPatients.length}</div>
                <div className="text-sm text-muted-foreground">
                  {searchTerm ? 'Pacientes Filtrados' : 'Total de Pacientes'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Pacientes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pacientes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAndSortedPatients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum paciente encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Paciente</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Idade</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Telefone</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedPatients.map((patient) => (
                    <tr key={patient.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{patient.name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">
                          {patient.city && patient.state ? `${patient.city}, ${patient.state}` : 'Localização N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">
                          {calculateAge(patient.birth_date || '')} anos
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="text-sm">{patient.email || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span className="text-sm">{patient.phone || 'N/A'}</span>
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

export default AdminPatientsV2