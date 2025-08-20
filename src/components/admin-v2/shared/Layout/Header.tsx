/**
 * ADMIN HEADER V2 - Header do painel administrativo
 */

import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  LogOut, 
  Settings,
  Bell
} from 'lucide-react'

interface AdminHeaderProps {
  title: string
  actions?: React.ReactNode
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ title, actions }) => {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">
              Enxergar sem Fronteiras
            </h1>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              Admin V2 - Em Reconstrução
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}

          {/* Notifications */}
          <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4" />
          </Button>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.email || 'Admin'}
              </p>
              <p className="text-xs text-gray-500">Administrador</p>
            </div>
            
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}