
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  Plus,
  Settings,
  Eye
} from 'lucide-react'
import { useNotificationTemplates } from '@/hooks/useNotificationTemplates'
import { useAdminMetrics } from '@/hooks/useAdminMetrics'
import { useNavigate } from 'react-router-dom'

export const NotificationTemplatesCard = () => {
  const { templates } = useNotificationTemplates()
  const { data: metrics } = useAdminMetrics()
  const navigate = useNavigate()

  const handleManageAll = () => {
    navigate('/admin/settings?tab=templates')
  }

  const handleCreateTemplate = () => {
    navigate('/admin/settings?tab=templates&action=create')
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail
      case 'sms': return Phone
      case 'whatsapp': return MessageSquare
      default: return Mail
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'text-blue-600'
      case 'sms': return 'text-green-600'
      case 'whatsapp': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gerenciar Notificações
          </div>
          <Button variant="outline" size="sm" onClick={handleManageAll}>
            <Eye className="h-4 w-4 mr-2" />
            Gerenciar todos
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {metrics?.emailTemplates || 0}
            </div>
            <div className="text-sm text-muted-foreground">Email</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {templates?.filter(t => t.type === 'sms').length || 0}
            </div>
            <div className="text-sm text-muted-foreground">SMS</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {metrics?.whatsappTemplates || 0}
            </div>
            <div className="text-sm text-muted-foreground">WhatsApp</div>
          </div>
        </div>

        {/* Templates recentes */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Templates Recentes</h4>
          {templates?.slice(0, 3).map(template => {
            const Icon = getTypeIcon(template.type)
            const colorClass = getTypeColor(template.type)
            
            return (
              <div key={template.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${colorClass}`} />
                  <span className="text-sm font-medium">{template.name}</span>
                </div>
                <Badge variant={template.is_active ? 'default' : 'secondary'}>
                  {template.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            )
          })}
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <Button className="flex-1" onClick={handleCreateTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
