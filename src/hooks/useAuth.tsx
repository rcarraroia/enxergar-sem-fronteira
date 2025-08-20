
import React, { useState, useEffect, createContext, useContext } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  loading: boolean
  userRole: 'admin' | 'organizer' | 'user' | 'superadmin' | null
  isAdmin: boolean
  isOrganizer: boolean
  isSuperAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, role?: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const determineUserRole = async (email: string): Promise<'admin' | 'organizer' | 'user' | 'superadmin'> => {
  try {
    // Primeiro, verificar se o usuário atual é super admin via is_super_admin
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.is_super_admin) {
      console.log('🔐 Usuário identificado como SUPERADMIN via is_super_admin')
      return 'superadmin'
    }

    // Depois, verificar se a coluna role existe tentando buscar apenas id e status
    const { data: organizerData, error: organizerError } = await supabase
      .from('organizers')
      .select('id, status')
      .eq('email', email)
      .eq('status', 'active')
      .maybeSingle()

    if (organizerError) {
      console.error('Erro ao verificar organizador:', organizerError)
      return determineRoleByEmailFallback(email)
    }

    // Se o organizador existe, tentar buscar o role
    if (organizerData) {
      try {
        const { data: roleData, error: roleError } = await supabase
          .from('organizers')
          .select('role')
          .eq('email', email)
          .eq('status', 'active')
          .maybeSingle()

        // Verificar se não há erro E se roleData existe E se tem a propriedade role
        if (!roleError && roleData && 'role' in roleData && roleData.role) {
          console.log('🔐 Usuário identificado como:', roleData.role, 'via tabela organizers')
          return roleData.role as 'admin' | 'organizer' | 'superadmin'
        }
        
        // Se há erro relacionado à coluna role, usar fallback
        if (roleError && roleError.message?.includes('role')) {
          console.warn('⚠️ Coluna role não existe ainda, usando fallback de email')
          return determineRoleByEmailFallback(email)
        }
      } catch (error) {
        console.warn('⚠️ Erro ao buscar role, usando fallback de email:', error)
      }
      
      // Se chegou até aqui, o organizador existe mas não conseguimos acessar o role
      // Usar fallback baseado no email
      return determineRoleByEmailFallback(email)
    }

  } catch (error) {
    console.error('Erro ao determinar papel do usuário:', error)
  }
  
  return 'user'
}

const determineRoleByEmailFallback = (email: string): 'admin' | 'organizer' | 'user' | 'superadmin' => {
  // Verificação específica para superadmin
  if (email === 'rcarraro@admin.enxergar') {
    console.log('🔐 Usuário identificado como SUPERADMIN via fallback de email')
    return 'superadmin'
  }

  // Verificação para admins
  if (email.includes('@admin.enxergar')) {
    console.log('🔐 Usuário identificado como ADMIN via fallback de email')
    return 'admin'
  }

  return 'user'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'admin' | 'organizer' | 'user' | 'superadmin' | null>(null)

  const isAdmin = userRole === 'admin' || userRole === 'superadmin'
  const isOrganizer = userRole === 'organizer'
  const isSuperAdmin = userRole === 'superadmin'

  useEffect(() => {
    console.log('🔍 AuthProvider: Inicializando verificação de sessão...')
    
    // Configurar listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Mudança de autenticação:', event, session?.user?.email || 'Nenhuma')
        
        setTimeout(async () => {
          setUser(session?.user ?? null)
          
          if (session?.user) {
            const role = await determineUserRole(session.user.email || '')
            console.log('🔍 Determinando role por email:', session.user.email, '-> Role:', role)
            setUserRole(role)

            // Atualizar last_login se for organizador
            if (role === 'organizer' || role === 'admin' || role === 'superadmin') {
              updateLastLogin(session.user.id)
            }
          } else {
            setUserRole(null)
          }
          
          setLoading(false)
        }, 0)
      }
    )

    // Verificar sessão atual
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Erro ao verificar sessão:', error)
          setLoading(false)
          return
        }
        
        console.log('📊 Sessão atual:', session?.user?.email || 'Nenhuma')
        setUser(session?.user ?? null)
        
        if (session?.user) {
          const role = await determineUserRole(session.user.email || '')
          console.log('🔍 Determinando role por email:', session.user.email, '-> Role:', role)
          setUserRole(role)

          // Atualizar last_login se for organizador
          if (role === 'organizer' || role === 'admin' || role === 'superadmin') {
            updateLastLogin(session.user.id)
          }
        }
        
        setLoading(false)
      } catch (error) {
        console.error('❌ Erro crítico na verificação de sessão:', error)
        setLoading(false)
      }
    }

    checkSession()

    return () => subscription.unsubscribe()
  }, [])

  const updateLastLogin = async (userId: string) => {
    try {
      await supabase
        .from('organizers')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId)
    } catch (error) {
      console.error('Erro ao atualizar last_login:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Tentando fazer login com:', email)
      setLoading(true)
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ Erro no login:', error)
        toast.error('Erro ao fazer login: ' + error.message)
        throw error
      }

      console.log('✅ Login realizado com sucesso!')
      toast.success('Login realizado com sucesso!')
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signUp = async (email: string, password: string, name: string, role?: string) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      })

      if (error) {
        toast.error('Erro ao criar conta: ' + error.message)
        throw error
      }

      if (data.user) {
        // Criar perfil na tabela organizers se for organizador
        const userRole = role || await determineUserRole(email)
        if (userRole === 'organizer' || userRole === 'admin' || userRole === 'superadmin') {
          try {
            const { error: profileError } = await supabase
              .from('organizers')
              .insert({
                id: data.user.id,
                name,
                email,
                status: 'active'
              })

            if (profileError) {
              console.warn('⚠️ Erro ao criar perfil de organizador:', profileError)
            }
          } catch (profileError) {
            console.warn('⚠️ Erro ao criar perfil de organizador:', profileError)
          }
        }
      }

      toast.success('Conta criada com sucesso! Verifique seu email.')
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast.error('Erro ao fazer logout: ' + error.message)
        throw error
      }
      
      // Corrigir bug: limpar estados locais imediatamente
      setUser(null)
      setUserRole(null)
      
      toast.success('Logout realizado com sucesso!')
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const value = {
    user,
    loading,
    userRole,
    isAdmin,
    isOrganizer,
    isSuperAdmin,
    signIn,
    signUp,
    signOut,
  }

  console.log('🎯 AuthProvider estado atual:', { 
    user: user?.email || 'Nenhum', 
    loading, 
    userRole,
    isAdmin,
    isOrganizer,
    isSuperAdmin
  })

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
