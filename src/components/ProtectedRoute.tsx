
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireOrganizer?: boolean
  allowedRoles?: ('admin' | 'organizer' | 'user')[]
}

export const ProtectedRoute = ({ 
  children, 
  requireAdmin = false, 
  requireOrganizer = false,
  allowedRoles 
}: ProtectedRouteProps) => {
  const { user, loading, userRole, isAdmin, isOrganizer } = useAuth()

  console.log('🛡️ ProtectedRoute verificando:', { 
    user: user?.email || 'Nenhum', 
    loading, 
    userRole,
    isAdmin,
    isOrganizer,
    requireAdmin,
    requireOrganizer,
    allowedRoles
  })

  if (loading) {
    console.log('⏳ ProtectedRoute: Carregando...')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-muted-foreground">Verificando autenticação...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log('🔒 ProtectedRoute: Usuário não autenticado, redirecionando para /auth')
    return <Navigate to="/auth" replace />
  }

  // Verificar se tem as permissões necessárias
  const hasPermission = () => {
    if (requireAdmin && !isAdmin) return false
    if (requireOrganizer && !isOrganizer && !isAdmin) return false
    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) return false
    return true
  }

  if (!hasPermission()) {
    console.log('⛔ ProtectedRoute: Usuário não tem permissão, acesso negado')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
          <p className="text-muted-foreground mt-2">
            Você não tem permissão para acessar esta página.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Seu papel atual: {userRole || 'Não definido'}
          </p>
        </div>
      </div>
    )
  }

  console.log('✅ ProtectedRoute: Acesso permitido')
  return <>{children}</>
}
