/**
 * QUICK ACTIONS V2 - Ações rápidas do dashboard
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Users, 
  FileText, 
  Calendar,
  UserPlus,
  Settings
} from 'lucide-react'

export const QuickActions: React.FC = () => {
  const navigate = useNavigate()

  const handleCreateEvent = () => {
    console.log('🎯 [V2] Navegando para criação de evento')
    navigate('/admin-v2/events?action=create')
  }

  const handleCreateOrganizer = () => {
    console.log('🎯 [V2] Navegando para criação de organizador')
    navigate('/admin-v2/organizers?action=create')
  }

  const handleViewTodayRegistrations = () => {
    console.log('🎯 [V2] Navegando para inscrições de hoje')
    const today = new Date().toISOString().split('T')[0]
    navigate(`/admin-v2/registrations?date=${today}`)
  }

  const handleExportReports = () => {
    console.log('🎯 [V2] Iniciando exportação de relatórios')
    // TODO: Implementar exportação de relatórios
    alert('Funcionalidade de exportação será implementada na próxima fase')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Button 
            onClick={handleCreateEvent}
            className="w-full justify-start"
            variant="default"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Criar Novo Evento
          </Button>
          
          <Button 
            onClick={handleCreateOrganizer}
            className="w-full justify-start"
            variant="outline"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Criar Organizador Local
          </Button>

          <Button 
            onClick={handleViewTodayRegistrations}
            className="w-full justify-start"
            variant="outline"
          >
            <Users className="h-4 w-4 mr-2" />
            Inscrições de Hoje
          </Button>

          <Button 
            onClick={handleExportReports}
            className="w-full justify-start"
            variant="outline"
          >
            <FileText className="h-4 w-4 mr-2" />
            Exportar Relatórios
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}