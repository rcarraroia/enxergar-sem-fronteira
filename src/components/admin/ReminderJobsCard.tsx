
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useReminderJobs, type ReminderJob } from '@/hooks/useReminderJobs'
import { 
  Clock, 
  Send, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Trash2,
  Play,
  RefreshCw,
  Calendar,
  User,
  Mail,
  MessageSquare,
  Phone
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const getStatusIcon = (status: ReminderJob['status']) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />
    case 'processing':
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
    case 'sent':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'cancelled':
      return <AlertCircle className="h-4 w-4 text-gray-500" />
    default:
      return null
  }
}

const getStatusBadge = (status: ReminderJob['status']) => {
  const variants = {
    pending: 'secondary',
    processing: 'default',
    sent: 'default',
    failed: 'destructive',
    cancelled: 'outline'
  } as const

  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    sent: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  }

  return (
    <Badge variant={variants[status]} className={colors[status]}>
      <div className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status === 'pending' && 'Pendente'}
        {status === 'processing' && 'Processando'}
        {status === 'sent' && 'Enviado'}
        {status === 'failed' && 'Falhou'}
        {status === 'cancelled' && 'Cancelado'}
      </div>
    </Badge>
  )
}

const getReminderTypeLabel = (type: ReminderJob['reminder_type']) => {
  switch (type) {
    case '24h':
      return '24h antes'
    case '48h':
      return '48h antes'
    case 'confirmation':
      return 'Confirmação'
    default:
      return type
  }
}

export const ReminderJobsCard = () => {
  const [activeTab, setActiveTab] = useState('all')
  const { 
    reminderJobs, 
    isLoading, 
    triggerReminders, 
    processReminders,
    deleteReminderJob,
    isTriggering,
    isProcessing
  } = useReminderJobs()

  const filteredJobs = reminderJobs?.filter(job => {
    if (activeTab === 'all') return true
    return job.status === activeTab
  }) || []

  const handleTriggerReminders = () => {
    triggerReminders.mutate({
      type: 'reminder',
      timestamp: new Date().toISOString()
    })
  }

  const handleProcessReminders = () => {
    processReminders.mutate({
      batchSize: 50,
      testMode: false
    })
  }

  const getChannelsSent = (job: ReminderJob) => {
    const channels = []
    if (job.email_sent) channels.push(<Mail key="email" className="h-3 w-3 text-blue-500" />)
    if (job.whatsapp_sent) channels.push(<MessageSquare key="whatsapp" className="h-3 w-3 text-green-500" />)
    if (job.sms_sent) channels.push(<Phone key="sms" className="h-3 w-3 text-purple-500" />)
    return channels
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fila de Lembretes</CardTitle>
          <CardDescription>Carregando jobs de lembrete...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Fila de Lembretes
            </CardTitle>
            <CardDescription>
              Gerenciar e monitorar jobs de envio de lembretes
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleTriggerReminders}
              disabled={isTriggering}
              size="sm"
            >
              {isTriggering ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              Criar Lembretes
            </Button>
            <Button 
              onClick={handleProcessReminders}
              disabled={isProcessing}
              variant="outline"
              size="sm"
            >
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Processar Fila
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="processing">Processando</TabsTrigger>
            <TabsTrigger value="sent">Enviados</TabsTrigger>
            <TabsTrigger value="failed">Falharam</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelados</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {activeTab === 'all' 
                  ? 'Nenhum job de lembrete encontrado'
                  : `Nenhum job ${activeTab} encontrado`
                }
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Agendado para</TableHead>
                      <TableHead>Canais</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{job.patient?.nome}</div>
                              <div className="text-sm text-muted-foreground">
                                {job.patient?.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {job.event_date?.event?.title}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {job.event_date?.date && format(new Date(job.event_date.date), 'dd/MM/yyyy', { locale: ptBR })} - {job.event_date?.start_time?.slice(0, 5)}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant="outline">
                            {getReminderTypeLabel(job.reminder_type)}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          {getStatusBadge(job.status)}
                          {job.error_message && (
                            <div className="text-xs text-red-600 mt-1">
                              {job.error_message}
                            </div>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(job.scheduled_for), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(job.scheduled_for), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex gap-1">
                            {getChannelsSent(job)}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir este job de lembrete? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteReminderJob.mutate(job.id)}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
