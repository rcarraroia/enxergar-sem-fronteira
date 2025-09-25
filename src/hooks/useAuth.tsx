import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Contexto de autenticação que gerencia o estado do usuário logado
 * @interface AuthContextType
 */
interface AuthContextType {
  user: User | null
  loading: boolean
  userRole: "admin" | "organizer" | "user" | "superadmin" | null
  isAdmin: boolean
  isOrganizer: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, role?: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Determina o papel (role) do usuário baseado nos dados da tabela organizers
 * @param user - Objeto User do Supabase Auth
 * @returns Promise com o role do usuário ("admin" | "organizer" | "user" | "superadmin")
 */
const determineUserRole = async (user: User): Promise<"admin" | "organizer" | "user" | "superadmin"> => {
  console.log("🔍 Determinando role para usuário:", user.id, user.email);

  try {
    // SISTEMA SEGURO: Verificar role na tabela organizers usando ID do usuário
    const { data: organizerData, error: organizerError } = await supabase
      .from("organizers")
      .select("id, status, role")
      .eq("id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (organizerError) {
      console.error("Erro ao verificar organizador:", organizerError);
      return "user";
    }

    if (organizerData) {
      const role = organizerData.role || "organizer"; // Default para organizer se role não estiver definido
      console.log("🔐 Usuário identificado via tabela organizers - Role:", role);

      // Mapear roles do banco para roles do frontend
      switch (role) {
        case "admin":
          return "admin";
        case "organizer":
          return "organizer";
        case "viewer":
          return "user";
        default:
          return "organizer"; // Default seguro
      }
    }

    // Se não encontrou na tabela organizers, é usuário comum
    console.log("👤 Usuário não encontrado na tabela organizers - Role: user");
    return "user";

  } catch (error) {
    console.error("Erro ao determinar papel do usuário:", error);
    return "user";
  }
};

/**
 * Provider de autenticação que gerencia o estado global de autenticação
 * Fornece contexto para toda a aplicação sobre o usuário logado e suas permissões
 * @param children - Componentes filhos que terão acesso ao contexto de autenticação
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"admin" | "organizer" | "user" | "superadmin" | null>(null);

  const isAdmin = userRole === "admin" || userRole === "superadmin";
  const isOrganizer = userRole === "organizer";

  useEffect(() => {
    console.log("🔍 AuthProvider: Inicializando verificação de sessão...");

    // Configurar listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔄 Mudança de autenticação:", event, session?.user?.email || "Nenhuma");

        setTimeout(async () => {
          setUser(session?.user ?? null);

          if (session?.user) {
            const role = await determineUserRole(session.user);
            console.log("🔍 Role determinado:", role);
            setUserRole(role);

            // Atualizar last_login se for organizador
            if (role === "organizer") {
              updateLastLogin(session.user.id);
            }
          } else {
            setUserRole(null);
          }

          setLoading(false);
        }, 0);
      }
    );

    // Verificar sessão atual
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("❌ Erro ao verificar sessão:", error);
          setLoading(false);
          return;
        }

        console.log("📊 Sessão atual:", session?.user?.email || "Nenhuma");
        setUser(session?.user ?? null);

        if (session?.user) {
          const role = await determineUserRole(session.user);
          console.log("🔍 Role determinado:", role);
          setUserRole(role);

          // Atualizar last_login se for organizador
          if (role === "organizer") {
            updateLastLogin(session.user.id);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("❌ Erro crítico na verificação de sessão:", error);
        setLoading(false);
      }
    };

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const updateLastLogin = async (userId: string) => {
    try {
      await supabase
        .from("organizers")
        .update({ last_login: new Date().toISOString() })
        .eq("id", userId);
    } catch (error) {
      console.error("Erro ao atualizar last_login:", error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log("🔐 Tentando fazer login com:", email);
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ Erro no login:", error);
        toast.error(`Erro ao fazer login: ${error.message}`);
        throw error;
      }

      console.log("✅ Login realizado com sucesso!");
      toast.success("Login realizado com sucesso!");
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string, role?: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast.error(`Erro ao criar conta: ${error.message}`);
        throw error;
      }

      if (data.user) {
        // Criar perfil na tabela organizers se for organizador
        const userRole = role || await determineUserRole(data.user);
        if (userRole === "organizer") {
          try {
            const { error: profileError } = await supabase
              .from("organizers")
              .insert({
                id: data.user.id,
                name,
                email,
                status: "active"
              });

            if (profileError) {
              console.warn("⚠️ Erro ao criar perfil de organizador:", profileError);
            }
          } catch (profileError) {
            console.warn("⚠️ Erro ao criar perfil de organizador:", profileError);
          }
        }
      }

      toast.success("Conta criada com sucesso! Verifique seu email.");
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(`Erro ao fazer logout: ${error.message}`);
        throw error;
      }

      // Limpar estados locais imediatamente
      setUser(null);
      setUserRole(null);

      toast.success("Logout realizado com sucesso!");
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    userRole,
    isAdmin,
    isOrganizer,
    signIn,
    signUp,
    signOut,
  };

  console.log("🎯 AuthProvider estado atual:", {
    user: user?.email || "Nenhum",
    loading,
    userRole,
    isAdmin,
    isOrganizer
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook personalizado para acessar o contexto de autenticação
 * Fornece acesso ao usuário logado, seu papel, estado de carregamento e funções de autenticação
 * @returns Objeto com dados e funções de autenticação
 * @throws Error se usado fora do AuthProvider
 *
 * @example
 * ```tsx
 * const { user, userRole, isAdmin, signIn, signOut } = useAuth();
 *
 * if (isAdmin) {
 *   // Renderizar interface de admin
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
