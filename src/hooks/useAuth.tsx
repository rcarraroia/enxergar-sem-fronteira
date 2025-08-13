import { useState, useEffect, createContext, useContext } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    console.log('🔍 AuthProvider: Inicializando verificação de sessão...')
    
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ Erro ao verificar sessão:', error)
      }
      
      console.log('📊 Sessão atual:', session?.user?.email || 'Nenhuma')
      setUser(session?.user ?? null)
      
      if (session?.user) {
        checkAdminStatus(session.user.id)
      }
      setLoading(false)
    })

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Mudança de autenticação:', event, session?.user?.email || 'Nenhuma')
        setUser(session?.user ?? null)
        if (session?.user) {
          await checkAdminStatus(session.user.id)
        } else {
          setIsAdmin(false)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const checkAdminStatus = async (userId: string) => {
    try {
      console.log('🔍 Verificando status de admin para:', userId)
      const { data, error } = await supabase
        .from('organizers')
        .select('email')
        .eq('id', userId)
        .single()

      if (!error && data?.email?.includes('@admin.')) {
        console.log('✅ Usuário é admin:', data.email)
        setIsAdmin(true)
      } else {
        console.log('👤 Usuário não é admin:', data?.email || 'Email não encontrado')
        setIsAdmin(false)
      }
    } catch (error) {
      console.log('❌ Erro ao verificar status admin:', error)
      setIsAdmin(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Tentando fazer login com:', email)
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
      throw error
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        toast.error('Erro ao criar conta: ' + error.message)
        throw error
      }

      if (data.user) {
        // Criar perfil do organizador
        const { error: profileError } = await supabase
          .from('organizers')
          .insert({
            id: data.user.id,
            name,
            email,
          })

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError)
        }
      }

      toast.success('Conta criada com sucesso! Verifique seu email.')
    } catch (error) {
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast.error('Erro ao fazer logout: ' + error.message)
        throw error
      }
      toast.success('Logout realizado com sucesso!')
    } catch (error) {
      throw error
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
  }

  console.log('🎯 AuthProvider estado atual:', { 
    user: user?.email || 'Nenhum', 
    loading, 
    isAdmin 
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
