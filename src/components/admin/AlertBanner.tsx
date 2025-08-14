
import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react'
import { SystemAlert } from '@/hooks/useSystemAlerts'

interface AlertBannerProps {
  alert: SystemAlert
  onDismiss?: (alertId: string) => void
  onAction?: (actionUrl: string) => void
}

export const AlertBanner = ({ alert, onDismiss, onAction }: AlertBannerProps) => {
  const getIcon = () => {
    switch (alert.type) {
      case 'error': return XCircle
      case 'warning': return AlertTriangle
      case 'success': return CheckCircle
      default: return Info
    }
  }

  const getVariant = () => {
    switch (alert.type) {
      case 'error': return 'destructive'
      case 'warning': return 'default'
      default: return 'default'
    }
  }

  const Icon = getIcon()

  return (
    <Alert variant={getVariant() as any} className="relative">
      <Icon className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>{alert.title}</span>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1"
            onClick={() => onDismiss(alert.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="flex items-center justify-between">
          <span>{alert.message}</span>
          {alert.actionLabel && alert.actionUrl && onAction && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction(alert.actionUrl!)}
            >
              {alert.actionLabel}
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
