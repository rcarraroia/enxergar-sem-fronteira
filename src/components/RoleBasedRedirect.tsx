import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export const RoleBasedRedirect = () => {
  const { user, userRole, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user && userRole) {
      console.log('🔄 Redirecionando baseado no papel:', userRole)
      
      switch (userRole) {
        case 'admin':
          navigate('/admin', { replace: true })
          break
        case 'organizer':
          navigate('/organizer', { replace: true })
          break
        case 'user':
          navigate('/', { replace: true })
          break
        default:
          navigate('/', { replace: true })
      }
    }
  }, [user, userRole, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Redirecionando...</span>
        </div>
      </div>
    )
  }

  return null
}