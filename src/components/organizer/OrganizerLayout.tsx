
import React, { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  User, 
  LogOut, 
  Menu,
  X,
  Home
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSystemSettings } from '@/hooks/useSystemSettings'

export const OrganizerLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, signOut } = useAuth()
  const { settings } = useSystemSettings()
  const location = useLocation()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/organizer',
      icon: LayoutDashboard,
      current: location.pathname === '/organizer'
    },
    {
      name: 'Meus Eventos',
      href: '/organizer/events',
      icon: Calendar,
      current: location.pathname.startsWith('/organizer/events')
    },
    {
      name: 'Inscrições',
      href: '/organizer/registrations',
      icon: Users,
      current: location.pathname === '/organizer/registrations'
    },
    {
      name: 'Perfil',
      href: '/organizer/profile',
      icon: User,
      current: location.pathname === '/organizer/profile'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar para desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            {settings.logo_header ? (
              <img 
                src={settings.logo_header} 
                alt={settings.project_name || 'Logo'} 
                className="h-8 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">O</span>
              </div>
            )}
            <h1 className="ml-3 text-lg font-medium text-gray-900">
              Organizador
            </h1>
          </div>
          
          <div className="mt-5 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      item.current
                        ? 'bg-primary text-primary-foreground'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors'
                    )}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {user?.email}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-xs text-gray-500 hover:text-gray-700 p-0 h-auto"
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4 py-5">
                {settings.logo_header ? (
                  <img 
                    src={settings.logo_header} 
                    alt={settings.project_name || 'Logo'} 
                    className="h-8 w-auto"
                  />
                ) : (
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">O</span>
                  </div>
                )}
                <h1 className="ml-3 text-lg font-medium text-gray-900">
                  Organizador
                </h1>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        item.current
                          ? 'bg-primary text-primary-foreground'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                      )}
                    >
                      <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Header mobile */}
        <div className="sticky top-0 z-10 lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
          <button
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Breadcrumbs */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700 flex items-center">
              <Home className="h-4 w-4 mr-1" />
              Início
            </Link>
            <span>/</span>
            <span className="text-gray-900">Organizador</span>
            {location.pathname !== '/organizer' && (
              <>
                <span>/</span>
                <span className="text-gray-900 capitalize">
                  {location.pathname.split('/').pop()?.replace('-', ' ')}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
