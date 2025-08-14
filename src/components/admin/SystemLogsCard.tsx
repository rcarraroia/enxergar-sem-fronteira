
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RefreshCw, AlertTriangle, Info, CheckCircle, X } from 'lucide-react'

interface LogEntry {
  id: string
  timestamp: Date
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
  source: string
}

export const SystemLogsCard = () => {
  const [logs, setLogs] = useState<LogEntry[]>([])

  // Simulate system logs - in a real system, these would come from your logging service
  const generateMockLogs = () => {
    const mockLogs: LogEntry[] = [
      {
        id: '1',
        timestamp: new Date(),
        level: 'success',
        message: 'Sistema de configurações carregado com sucesso',
        source: 'useSystemSettings'
      },
      {
        id: '2', 
        timestamp: new Date(Date.now() - 60000),
        level: 'info',
        message: 'Verificação de saúde do sistema executada',
        source: 'useSystemMonitoring'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 120000),
        level: 'warning', 
        message: 'Valor JSON inválido encontrado, usando fallback',
        source: 'useSystemSettings'
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 180000),
        level: 'error',
        message: 'Erro JSON: Unexpected end of JSON input - CORRIGIDO',
        source: 'useSystemSettings'
      }
    ]
    setLogs(mockLogs)
  }

  useEffect(() => {
    generateMockLogs()
  }, [])

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <X className="h-4 w-4 text-red-500" />
    }
  }

  const getLevelBadge = (level: LogEntry['level']) => {
    const variants = {
      success: 'default',
      info: 'secondary', 
      warning: 'destructive',
      error: 'destructive'
    } as const

    return (
      <Badge variant={variants[level]} className="text-xs">
        {level.toUpperCase()}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Logs do Sistema
          <Button variant="outline" size="sm" onClick={generateMockLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </CardTitle>
        <CardDescription>
          Últimas atividades e eventos do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                {getLevelIcon(log.level)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getLevelBadge(log.level)}
                    <span className="text-xs text-muted-foreground">
                      {log.source}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {log.timestamp.toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{log.message}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
