
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export const RoleBasedRedirect = () => {
  const { user, userRole, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user && userRole) {
      console.log('🔄 Redirecionando baseado no papel:', userRole)
      
      // REMOVIDO: Lógica de redirecionamento automático
      // O redirecionamento agora é feito apenas quando o usuário faz login
      // Não fazemos redirecionamento automático na navegação normal
      
      switch (userRole) {
        case 'admin':
          // Admin pode navegar livremente, sem redirecionamento forçado
          break
        case 'organizer':
          // Organizador pode navegar livremente, sem redirecionamento forçado
          break
        case 'user':
          // Usuário comum pode navegar livremente, sem redirecionamento forçado
          break
        default:
          // Não fazer nada - deixar o usuário na página atual
          break
      }
    }
  }, [user, userRole, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Carregando...</span>
        </div>
      </div>
    )
  }

  return null
}
