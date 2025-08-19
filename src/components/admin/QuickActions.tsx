
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Users, 
  FileText, 
  Calendar,
  UserPlus
} from 'lucide-react'

interface QuickActionsProps {
  onCreateEvent: () => void
  onViewTodayRegistrations: () => void
  onExportReports: () => void
  onCreateOrganizer?: () => void
}

export const QuickActions = ({ 
  onCreateEvent, 
  onViewTodayRegistrations, 
  onExportReports,
  onCreateOrganizer 
}: QuickActionsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          onClick={onCreateEvent}
          className="w-full justify-start"
          variant="default"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Criar Novo Evento
        </Button>
        
        <Button 
          onClick={onCreateOrganizer || (() => {})}
          className="w-full justify-start"
          variant="outline"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Criar Organizador Local
        </Button>

        <Button 
          onClick={onViewTodayRegistrations}
          className="w-full justify-start"
          variant="outline"
        >
          <Users className="h-4 w-4 mr-2" />
          Inscrições de Hoje
        </Button>

        <Button 
          onClick={onExportReports}
          className="w-full justify-start"
          variant="outline"
        >
          <FileText className="h-4 w-4 mr-2" />
          Exportar Relatórios
        </Button>
      </CardContent>
    </Card>
  )
}
