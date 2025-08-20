/**
 * ADMIN NAVIGATION V2 - Navegação lateral do painel
 */

import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard,
  Users,
  Calendar,
  UserCheck,
  Settings,
  RefreshCw,
  CreditCard,
  Heart,
  UserCog
} from 'lucide-react'

interface NavigationItem {
  id: string
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/admin-v2',
    icon: LayoutDashboard
  },
  {
    id: 'events',
    label: 'Eventos',
    path: '/admin-v2/events',
    icon: Calendar
  },
  {
    id: 'patients',
    label: 'Pacientes',
    path: '/admin-v2/patients',
    icon: Users
  },
  {
    id: 'registrations',
    label: 'Inscrições',
    path: '/admin-v2/registrations',
    icon: UserCheck
  },
  {
    id: 'organizers',
    label: 'Organizadores',
    path: '/admin-v2/organizers',
    icon: UserCog
  },
  {
    id: 'payments',
    label: 'Pagamentos',
    path: '/admin-v2/payments',
    icon: CreditCard
  },
  {
    id: 'donations',
    label: 'Doações',
    path: '/admin-v2/donations',
    icon: Heart
  },
  {
    id: 'sync',
    label: 'Sincronização',
    path: '/admin-v2/sync',
    icon: RefreshCw
  },
  {
    id: 'settings',
    label: 'Configurações',
    path: '/admin-v2/settings',
    icon: Settings
  }
]

export const AdminNavigation: React.FC = () => {
  const location = useLocation()

  return (
    <nav className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.id}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {item.badge && (
                  <span className="ml-auto bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
      
      {/* Status da Reconstrução */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-blue-900">
              Reconstrução Ativa
            </span>
          </div>
          <p className="text-xs text-blue-700">
            Sistema isolado do ambiente de produção
          </p>
        </div>
      </div>
    </nav>
  )
}