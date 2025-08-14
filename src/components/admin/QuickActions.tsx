
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Download, 
  Mail, 
  Calendar,
  Users,
  FileText,
  Send
} from 'lucide-react'

interface QuickActionsProps {
  onCreateEvent: () => void
  onViewTodayRegistrations: () => void
  onExportReports: () => void
  onSendReminders: () => void
  className?: string
}

export const QuickActions = ({ 
  onCreateEvent,
  onViewTodayRegistrations,
  onExportReports,
  onSendReminders,
  className 
}: QuickActionsProps) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={onCreateEvent}
            className="flex items-center gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Novo Evento
          </Button>
          
          <Button 
            onClick={onViewTodayRegistrations}
            variant="outline"
            className="flex items-center gap-2"
            size="sm"
          >
            <Users className="h-4 w-4" />
            Inscrições Hoje
          </Button>
          
          <Button 
            onClick={onExportReports}
            variant="outline"
            className="flex items-center gap-2"
            size="sm"
          >
            <Download className="h-4 w-4" />
            Exportar Dados
          </Button>
          
          <Button 
            onClick={onSendReminders}
            variant="outline"
            className="flex items-center gap-2"
            size="sm"
          >
            <Mail className="h-4 w-4" />
            Enviar Lembretes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
