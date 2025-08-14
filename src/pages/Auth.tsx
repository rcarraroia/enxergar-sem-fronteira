
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoginForm } from '@/components/auth/LoginForm'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { useAuth } from '@/hooks/useAuth'
import { getRedirectPath } from '@/utils/roleRedirect'
import { Loader2 } from 'lucide-react'

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true)
  const { user, loading, userRole } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    console.log('🔍 Auth page - Estado atual:', { 
      user: user?.email || 'Nenhum', 
      loading,
      userRole
    })
    
    if (user && !loading && userRole) {
      const redirectPath = getRedirectPath(userRole)
      console.log(`✅ Usuário autenticado (${userRole}), redirecionando para ${redirectPath}`)
      navigate(redirectPath, { replace: true })
    }
  }, [user, loading, userRole, navigate])

  if (loading) {
    console.log('⏳ Auth page: Carregando...')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    )
  }

  // Se usuário já está logado, não renderizar o formulário
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Redirecionando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {isLogin ? (
          <LoginForm onToggleMode={() => setIsLogin(false)} />
        ) : (
          <SignUpForm onToggleMode={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  )
}

export default Auth
