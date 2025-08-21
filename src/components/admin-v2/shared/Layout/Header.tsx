
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
  const { user, signOut } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 lg:gap-4 min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-lg lg:text-xl font-semibold text-gray-900 truncate">
              Enxergar sem Fronteiras
            </h1>
            <Badge variant="outline" className="hidden sm:inline-flex text-xs bg-blue-50 text-blue-700 border-blue-200 flex-shrink-0">
              Admin V2
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
          {/* Actions - Hidden on mobile if too many */}
          {actions && (
            <div className="hidden sm:flex items-center gap-2">
              {actions}
            </div>
          )}

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="flex-shrink-0">
            <Bell className="h-4 w-4" />
          </Button>

          {/* User Menu */}
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                {user?.email || 'Admin'}
              </p>
              <p className="text-xs text-gray-500">Administrador</p>
            </div>
            
            <Button variant="ghost" size="sm" className="flex-shrink-0">
              <User className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={signOut} className="flex-shrink-0">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
