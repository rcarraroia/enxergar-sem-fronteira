/**
 * ACTIVITY FEED V2 - Feed de atividades com dados reais
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Clock,
  UserPlus, 
  CalendarPlus, 
  UserCheck, 
  RefreshCw,
  Loader2
} from 'lucide-react'
import { useRecentActivityV2 } from '@/hooks/admin-v2/useRecentActivity'

export const ActivityFeed: React.FC = () => {
  const { data: activities = [], isLoading, error } = useRecentActivityV2()
  const getIcon = (type: string) => {
    switch (type) {
      case 'patient_registered': return UserPlus
      case 'event_created': return CalendarPlus
      case 'registration_completed': return UserCheck
      case 'event_updated': return RefreshCw
      default: return Clock
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'patient_registered': return 'text-blue-600'
      case 'event_created': return 'text-green-600'
      case 'registration_completed': return 'text-purple-600'
      case 'event_updated': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) {
      return 'Agora mesmo'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} min atrás`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h atrás`
    } else {
      return `${Math.floor(diffInMinutes / 1440)} dias atrás`
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Erro ao carregar atividades
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Atividades Recentes
          <Badge variant="secondary" className="ml-auto">
            {activities.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma atividade recente
          </p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
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