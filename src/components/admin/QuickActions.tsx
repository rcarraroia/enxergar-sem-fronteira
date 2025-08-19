
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Download, 
  Mail, 
  Calendar,
  Users,
  FileText,
  Send,
  Loader2
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface QuickActionsProps {
  onCreateEvent: () => void
  onViewTodayRegistrations: () => void
  onExportReports: () => void
  onSendReminders?: () => void // Made optional since we'll handle it internally
  className?: string
}

export const QuickActions = ({ 
  onCreateEvent,
  onViewTodayRegistrations,
  onExportReports,
  onSendReminders,
  className 
}: QuickActionsProps) => {
  const [sendingReminders, setSendingReminders] = useState(false)

  const handleSendReminders = async () => {
    try {
      setSendingReminders(true)
      console.log('🔄 Iniciando envio de lembretes via Edge Function...')
      
      // Call the trigger-reminders Edge Function
      const { data, error } = await supabase.functions.invoke('trigger-reminders', {
        body: {
          type: 'reminder',
          timestamp: new Date().toISOString()
        }
      })

      if (error) {
        console.error('❌ Erro ao enviar lembretes:', error)
        throw error
      }

      console.log('✅ Lembretes enviados com sucesso:', data)
      toast.success('Lembretes enviados com sucesso!')
      
      // Call the original handler if provided (for backward compatibility)
      if (onSendReminders) {
        onSendReminders()
      }
      
    } catch (error) {
      console.error('❌ Erro ao enviar lembretes:', error)
      toast.error('Erro ao enviar lembretes. Tente novamente.')
    } finally {
      setSendingReminders(false)
    }
  }

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
            onClick={handleSendReminders}
            variant="outline"
            className="flex items-center gap-2"
            size="sm"
            disabled={sendingReminders}
          >
            {sendingReminders ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            {sendingReminders ? 'Enviando...' : 'Enviar Lembretes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
