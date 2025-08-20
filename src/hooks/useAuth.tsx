import React, { useState, useEffect, createContext, useContext } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  loading: boolean
  userRole: 'admin' | 'organizer' | 'user' | null
  isAdmin: boolean
  isOrganizer: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, role?: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const determineUserRole = async (email: string): Promise<'admin' | 'organizer' | 'user'> => {
  // Verificar se é admin (mantém a lógica baseada em email)
  if (email.includes('@admin.')) return 'admin'
  
  try {
    // Verificar se é organizador consultando a tabela organizers
    const { data, error } = await supabase
      .from('organizers')
      .select('id')
      .eq('email', email)
      .eq('status', 'active')
      .maybeSingle()

    if (error) {
      console.error('Erro ao verificar organizador:', error)
      return 'user'
    }

    if (data) {
      return 'organizer'
    }
  } catch (error) {
    console.error('Erro ao determinar papel do usuário:', error)
  }
  
  return 'user'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'admin' | 'organizer' | 'user' | null>(null)

  const isAdmin = userRole === 'admin'
  const isOrganizer = userRole === 'organizer'

  useEffect(() => {
    console.log('🔍 AuthProvider: Inicializando verificação de sessão...')
    
    // Configurar listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Mudança de autenticação:', event, session?.user?.email || 'Nenhuma')
        
        // IMPORTANTE: Remover qualquer redirecionamento automático aqui
        // O redirecionamento deve ser controlado pelos componentes específicos
        
        setTimeout(async () => {
          setUser(session?.user ?? null)
          
          if (session?.user) {
            const role = await determineUserRole(session.user.email || '')
            console.log('🔍 Determinando role por email:', session.user.email, '-> Role:', role)
            setUserRole(role)

            // Atualizar last_login se for organizador
            if (role === 'organizer') {
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
          if (role === 'organizer') {
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
        if (userRole === 'organizer') {
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
    signIn,
    signUp,
    signOut,
  }

  console.log('🎯 AuthProvider estado atual:', { 
    user: user?.email || 'Nenhum', 
    loading, 
    userRole,
    isAdmin,
    isOrganizer
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
