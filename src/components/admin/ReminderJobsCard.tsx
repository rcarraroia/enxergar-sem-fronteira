import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  Play, 
  Pause, 
  RefreshCw,
  Plus,
  Calendar,
  MessageSquare
} from 'lucide-react'
import { useReminderJobs } from '@/hooks/useReminderJobs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export const ReminderJobsCard = () => {
  const { 
    reminderJobs, 
    isLoading, 
    triggerReminders, 
    processReminders, 
    isTriggering, 
    isProcessing 
  } = useReminderJobs()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [reminderType, setReminderType] = useState<'24h' | '48h' | 'confirmation'>('24h')

  // Estatísticas dos jobs
  const stats = reminderJobs ? {
    total: reminderJobs.length,
    pending: reminderJobs.filter(job => job.status === 'pending').length,
    processing: reminderJobs.filter(job => job.status === 'processing').length,
    sent: reminderJobs.filter(job => job.status === 'sent').length,
    failed: reminderJobs.filter(job => job.status === 'failed').length
  } : { total: 0, pending: 0, processing: 0, sent: 0, failed: 0 }

  const handleCreateReminders = async () => {
    try {
      await triggerReminders.mutateAsync({
        type: reminderType === 'confirmation' ? 'confirmation' : 'reminder',
        timestamp: new Date().toISOString(),
        reminderType: reminderType === 'confirmation' ? '24h' : reminderType
      })
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('Erro ao criar lembretes:', error)
    }
  }

  const handleProcessJobs = () => {
    processReminders.mutate({ batchSize: 10 })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Fila de Lembretes
          </div>
          <div className="flex gap-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Lembretes
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Lembretes</DialogTitle>
                  <DialogDescription>
                    Selecione o tipo de lembrete que deseja criar para todos os eventos ativos.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="reminderType">Tipo de Lembrete</Label>
                    <Select 
                      value={reminderType} 
                      onValueChange={(value: '24h' | '48h' | 'confirmation') => setReminderType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="48h">48 horas antes</SelectItem>
                        <SelectItem value="24h">24 horas antes</SelectItem>
                        <SelectItem value="confirmation">Confirmação de presença</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateReminders} disabled={isTriggering}>
                    {isTriggering ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Lembretes
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleProcessJobs}
              disabled={isProcessing || stats.pending === 0}
            >
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Carregando jobs...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">Pendentes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
                <div className="text-sm text-muted-foreground">Enviados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <div className="text-sm text-muted-foreground">Falhas</div>
              </div>
            </div>

            {/* Jobs recentes */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Jobs Recentes</h4>
              {reminderJobs?.slice(0, 3).map(job => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium text-sm">
                        {job.reminder_type} - {job.patient?.nome || 'Paciente'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(job.scheduled_for).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(job.status)}>
                    {job.status}
                  </Badge>
                </div>
              ))}
              
              {(!reminderJobs || reminderJobs.length === 0) && (
                <div className="text-center py-4">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum job de lembrete encontrado
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
