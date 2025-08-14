
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  UserPlus, 
  CalendarPlus, 
  UserCheck, 
  RefreshCw,
  Clock
} from 'lucide-react'
import { ActivityItem } from '@/hooks/useRecentActivity'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ActivityFeedProps {
  activities: ActivityItem[]
  className?: string
}

export const ActivityFeed = ({ activities, className }: ActivityFeedProps) => {
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

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Atividade Recente
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
                      {formatDistanceToNow(new Date(activity.timestamp), { 
                        addSuffix: true,
                        locale: ptBR 
                      })}
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
