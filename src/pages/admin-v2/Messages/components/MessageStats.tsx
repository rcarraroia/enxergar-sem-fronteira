/**
 * ESTATÍSTICAS DE MENSAGENS
 */

import { useState } from 'react'
import { Calendar, TrendingUp, Mail, Smartphone, MessageSquare, Users, BarChart3, PieChart } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useMessageStats } from '@/hooks/messages/useMessages'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function MessageStats() {
  const [dateRange, setDateRange] = useState('7d')
  
  // Calcular range de datas
  const getDateRange = (range: string) => {
    const now = new Date()
    switch (range) {
      case '1d':
        return { from: format(startOfDay(now), 'yyyy-MM-dd'), to: format(endOfDay(now), 'yyyy-MM-dd') }
      case '7d':
        return { from: format(subDays(now, 7), 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') }
      case '30d':
        return { from: format(subDays(now, 30), 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') }
      case '90d':
        return { from: format(subDays(now, 90), 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') }
      default:
        return undefined
    }
  }

  const { data: stats, isLoading } = useMessageStats(getDateRange(dateRange))

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4 text-blue-500" />
      case 'sms':
        return <Smartphone className="h-4 w-4 text-green-500" />
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4 text-green-600" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getRecipientIcon = (type: string) => {
    return <Users className="h-4 w-4 text-purple-500" />
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Estatísticas</h2>
          <p className="text-muted-foreground">
            Análise detalhada do desempenho das mensagens
          </p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">Hoje</SelectItem>
            <SelectItem value="7d">7 dias</SelectItem>
            <SelectItem value="30d">30 dias</SelectItem>
            <SelectItem value="90d">90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enviadas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_sent || 0}</div>
            <p className="text-xs text-muted-foreground">
              mensagens enviadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.delivery_rate ? `${stats.delivery_rate.toFixed(1)}%` : '0%'}
            </div>
            <Progress 
              value={stats?.delivery_rate || 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregues</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.total_delivered || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              mensagens entregues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Falharam</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.total_failed || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.failure_rate ? `${stats.failure_rate.toFixed(1)}% de falha` : '0% de falha'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Estatísticas por canal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Por Canal</CardTitle>
            <CardDescription>
              Desempenho por canal de comunicação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.by_channel && Object.entries(stats.by_channel).map(([channel, data]) => (
                <div key={channel} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getChannelIcon(channel)}
                      <span className="font-medium capitalize">{channel}</span>
                    </div>
                    <Badge variant="outline">
                      {data.sent} enviadas
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="font-medium text-green-700">{data.delivered}</div>
                      <div className="text-xs text-green-600">Entregues</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <div className="font-medium text-yellow-700">{data.pending}</div>
                      <div className="text-xs text-yellow-600">Pendentes</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="font-medium text-red-700">{data.failed}</div>
                      <div className="text-xs text-red-600">Falharam</div>
                    </div>
                  </div>
                  
                  {data.sent > 0 && (
                    <Progress 
                      value={(data.delivered / data.sent) * 100} 
                      className="h-2"
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas por tipo de destinatário */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Por Tipo de Destinatário</CardTitle>
            <CardDescription>
              Distribuição por tipo de usuário
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.by_recipient_type && Object.entries(stats.by_recipient_type).map(([type, data]) => (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getRecipientIcon(type)}
                      <span className="font-medium capitalize">
                        {type === 'patient' ? 'Pacientes' :
                         type === 'promoter' ? 'Promotores' :
                         type === 'donor' ? 'Doadores' : 'Administradores'}
                      </span>
                    </div>
                    <Badge variant="outline">
                      {data.sent} enviadas
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="font-medium text-green-700">{data.delivered}</div>
                      <div className="text-xs text-green-600">Entregues</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded">
                      <div className="font-medium text-yellow-700">{data.pending}</div>
                      <div className="text-xs text-yellow-600">Pendentes</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded">
                      <div className="font-medium text-red-700">{data.failed}</div>
                      <div className="text-xs text-red-600">Falharam</div>
                    </div>
                  </div>
                  
                  {data.sent > 0 && (
                    <Progress 
                      value={(data.delivered / data.sent) * 100} 
                      className="h-2"
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo geral */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo do Período</CardTitle>
          <CardDescription>
            Visão geral das métricas de {dateRange === '1d' ? 'hoje' : 
                                        dateRange === '7d' ? 'últimos 7 dias' :
                                        dateRange === '30d' ? 'últimos 30 dias' : 'últimos 90 dias'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats?.total_sent || 0}</div>
              <div className="text-sm text-muted-foreground">Total Enviadas</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats?.total_delivered || 0}</div>
              <div className="text-sm text-muted-foreground">Entregues</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats?.total_pending || 0}</div>
              <div className="text-sm text-muted-foreground">Pendentes</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats?.total_failed || 0}</div>
              <div className="text-sm text-muted-foreground">Falharam</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}