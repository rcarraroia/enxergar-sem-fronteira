
import React, { useState } from 'react'
import { usePatients } from '@/hooks/usePatients'
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
  Users, 
  Search, 
  Download, 
  Loader2,
  Mail,
  Phone,
  FileText,
  Calendar
} from 'lucide-react'

export const PatientsList: React.FC = () => {
  const { data: patients, isLoading } = usePatients()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPatients = patients?.filter(patient => 
    patient.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.cpf.includes(searchTerm.replace(/\D/g, ''))
  ) || []

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
      'Data Cadastro'
    ]

    const csvContent = [
      headers.join(','),
      ...filteredPatients.map(patient => [
        `"${patient.nome}"`,
        `"${patient.cpf}"`,
        `"${patient.email}"`,
        `"${patient.telefone}"`,
        patient.data_nascimento ? `"${new Date(patient.data_nascimento).toLocaleDateString('pt-BR')}"` : '""',
        `"${patient.diagnostico || ''}"`,
        `"${patient.consentimento_lgpd ? 'Sim' : 'Não'}"`,
        `"${new Date(patient.created_at).toLocaleDateString('pt-BR')}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `pacientes_${new Date().getTime()}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando pacientes...</span>
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
          Lista de Pacientes
        </CardTitle>
        <CardDescription>
          {filteredPatients.length} paciente(s) encontrado(s)
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
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Tabela */}
        {filteredPatients.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm 
                ? 'Nenhum paciente encontrado com estes filtros' 
                : 'Nenhum paciente cadastrado ainda'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Informações</TableHead>
                  <TableHead>LGPD</TableHead>
                  <TableHead>Data Cadastro</TableHead>
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
                      <Badge variant={patient.consentimento_lgpd ? "default" : "destructive"}>
                        {patient.consentimento_lgpd ? 'Aceito' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(patient.created_at).toLocaleDateString('pt-BR')}
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
