/**
 * ACTIVITY FEED V2 - Feed de atividades redesigned
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Clock,
  UserPlus, 
  CalendarPlus, 
  UserCheck, 
  RefreshCw
} from 'lucide-react'

// Mock data para demonstração
const mockActivities = [
  {
    id: '1',
    type: 'patient_registered',
    title: 'Novo paciente cadastrado',
    description: 'Maria Silva se cadastrou no sistema',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min atrás
  },
  {
    id: '2',
    type: 'event_created',
    title: 'Evento criado',
    description: 'Consulta Oftalmológica - São Paulo',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h atrás
  },
  {
    id: '3',
    type: 'registration_completed',
    title: 'Inscrição confirmada',
    description: 'João Santos confirmou presença',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4h atrás
  }
]

export const ActivityFeed: React.FC = () => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'patient_registered': return UserPlus
      case 'event_created': return CalendarPlus
      case 'registration_completed': return UserCheck
      case 'sync_completed': return RefreshCw
      default: return Clock
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'patient_registered': return 'text-blue-600'
      case 'event_created': return 'text-green-600'
      case 'registration_completed': return 'text-purple-600'
      case 'sync_completed': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min atrás`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h atrás`
    } else {
      return `${Math.floor(diffInMinutes / 1440)} dias atrás`
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {mockActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma atividade recente
          </p>
        ) : (
          <div className="space-y-4">
            {mockActivities.map((activity) => {
              const Icon = getIcon(activity.type)
              const iconColor = getIconColor(activity.type)
              
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`mt-0.5 ${iconColor}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {formatTimeAgo(activity.timestamp)}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}