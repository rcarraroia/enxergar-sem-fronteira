
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, loading, isAdmin } = useAuth()

  console.log('🛡️ ProtectedRoute verificando:', { 
    user: user?.email || 'Nenhum', 
    loading, 
    isAdmin, 
    requireAdmin 
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

  if (requireAdmin && !isAdmin) {
    console.log('⛔ ProtectedRoute: Usuário não é admin, acesso negado')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
          <p className="text-muted-foreground mt-2">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    )
  }

  console.log('✅ ProtectedRoute: Acesso permitido')
  return <>{children}</>
}
