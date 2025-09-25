import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Organizer {
  id: string
  name: string
  email: string
  status: "active" | "inactive" | "pending"
  created_at: string
  invited_by?: string | null
  invitation_token?: string | null
  invitation_expires_at?: string | null
  asaas_api_key?: string | null
  events_count?: number
}

export const useOrganizers = () => {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      console.log("🔍 Buscando organizadores...");
      
      const { data, error } = await supabase
        .from("organizers")
        .select(`
          id,
          name,
          email,
          status,
          created_at,
          invited_by,
          invitation_token,
          invitation_expires_at,
          asaas_api_key
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Erro ao buscar organizadores:", error);
        throw error;
      }

      console.log("✅ Organizadores encontrados:", data?.length || 0);

      // Buscar contagem de eventos para cada organizador
      const organizersWithEventCount = await Promise.all(
        (data || []).map(async (org) => {
          const { count } = await supabase
            .from("events")
            .select("*", { count: "exact", head: true })
            .eq("organizer_id", org.id ?? "");

          return {
            ...org,
            status: ["active", "inactive", "pending"].includes(org.status || "") 
              ? org.status as "active" | "inactive" | "pending"
              : "active" as const,
            events_count: count || 0
          };
        })
      );

      setOrganizers(organizersWithEventCount);
    } catch (error) {
      console.error("❌ Erro ao buscar organizadores:", error);
      toast.error("Erro ao carregar organizadores");
    } finally {
      setLoading(false);
    }
  };

  const createOrganizer = async (organizerData: { name: string; email: string; password?: string }) => {
    try {
      console.log("🔨 Criando organizador:", organizerData);
      
      // Verificar se já existe um organizador com este email
      const { data: existingOrganizer } = await supabase
        .from("organizers")
        .select("id, email")
        .eq("email", organizerData.email)
        .single();

      if (existingOrganizer) {
        toast.error("Já existe um organizador com este email");
        throw new Error("Organizador já existe");
      }

      // Gerar token de convite
      const invitationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias para aceitar convite

      const { data, error } = await supabase
        .from("organizers")
        .insert({
          name: organizerData.name,
          email: organizerData.email,
          status: "active", // Criar como ativo para que possa fazer login imediatamente
          invitation_token: invitationToken,
          invitation_expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Erro ao criar organizador:", error);
        throw error;
      }

      console.log("✅ Organizador criado com sucesso:", data);
      
      if (organizerData.password) {
        toast.success('Organizador criado com sucesso! O organizador pode fazer login usando o email cadastrado e a opção "Esqueci minha senha" para definir uma nova senha.');
      } else {
        toast.success("Organizador criado com sucesso! O organizador pode fazer login usando o email cadastrado.");
      }

      await fetchOrganizers();
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      const errorCode = error && typeof error === "object" && "code" in error ? (error as { code: string }).code : null;
      
      console.error("❌ Erro ao criar organizador:", error);
      
      if (errorMessage === "Organizador já existe") {
        return; // Erro já foi mostrado
      }
      
      if (errorCode === "23505") {
        toast.error("Já existe um organizador com este email");
      } else {
        toast.error(`Erro ao criar organizador: ${  errorMessage}`);
      }
      throw error;
    }
  };

  const editOrganizer = async (id: string, data: { name: string; email: string; password?: string }) => {
    try {
      console.log("✏️ Editando organizador:", id, data);
      
      // Para atualização de senha, informar que deve ser feita pelo próprio usuário
      if (data.password) {
        toast.error("Por questões de segurança, a senha deve ser alterada pelo próprio organizador através do sistema de recuperação de senha.");
        return;
      }

      // Atualizar dados do organizador (sem a senha)
      const { password, ...organizerData } = data;
      const { error } = await supabase
        .from("organizers")
        .update(organizerData)
        .eq("id", id);

      if (error) {
        console.error("❌ Erro ao atualizar organizador:", error);
        throw error;
      }

      console.log("✅ Organizador atualizado com sucesso");
      await fetchOrganizers();
      toast.success("Organizador atualizado com sucesso!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("❌ Erro ao atualizar organizador:", error);
      toast.error(`Erro ao atualizar organizador: ${  errorMessage}`);
      throw error;
    }
  };

  const deleteOrganizer = async (id: string) => {
    try {
      console.log("🗑️ Excluindo organizador:", id);
      
      // Verificar se o organizador tem eventos associados
      const { count: eventsCount } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("organizer_id", id);

      if (eventsCount && eventsCount > 0) {
        toast.error(`Não é possível excluir este organizador pois ele possui ${eventsCount} evento(s) associado(s). Remova ou transfira os eventos primeiro.`);
        return;
      }

      const { error } = await supabase
        .from("organizers")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("❌ Erro ao excluir organizador:", error);
        throw error;
      }

      console.log("✅ Organizador excluído com sucesso");
      await fetchOrganizers();
      toast.success("Organizador excluído com sucesso!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("❌ Erro ao excluir organizador:", error);
      toast.error(`Erro ao excluir organizador: ${  errorMessage}`);
      throw error;
    }
  };

  const updateOrganizerStatus = async (id: string, status: "active" | "inactive") => {
    try {
      console.log("🔄 Atualizando status do organizador:", id, status);
      
      const { error } = await supabase
        .from("organizers")
        .update({ status })
        .eq("id", id);

      if (error) {
        console.error("❌ Erro ao atualizar status:", error);
        throw error;
      }

      console.log("✅ Status atualizado com sucesso");
      await fetchOrganizers();
      toast.success(`Organizador ${status === "active" ? "ativado" : "desativado"} com sucesso!`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("❌ Erro ao atualizar status do organizador:", error);
      toast.error(`Erro ao atualizar status: ${  errorMessage}`);
    }
  };

  const updateOrganizerApiKey = async (id: string, asaas_api_key: string) => {
    try {
      console.log("🔑 Atualizando API Key do organizador:", id);
      
      const { error } = await supabase
        .from("organizers")
        .update({ asaas_api_key })
        .eq("id", id);

      if (error) {
        console.error("❌ Erro ao atualizar API Key:", error);
        throw error;
      }

      console.log("✅ API Key atualizada com sucesso");
      await fetchOrganizers();
      toast.success("API Key do organizador atualizada!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("❌ Erro ao atualizar API Key:", error);
      toast.error(`Erro ao atualizar API Key: ${  errorMessage}`);
    }
  };

  const resendInvitation = async (id: string) => {
    try {
      console.log("📧 Reenviando convite para organizador:", id);
      
      const newToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error } = await supabase
        .from("organizers")
        .update({
          invitation_token: newToken,
          invitation_expires_at: expiresAt.toISOString()
        })
        .eq("id", id);

      if (error) {
        console.error("❌ Erro ao reenviar convite:", error);
        throw error;
      }

      console.log("📧 Novo convite gerado, Token:", newToken);

      await fetchOrganizers();
      toast.success("Convite reenviado!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("❌ Erro ao reenviar convite:", error);
      toast.error(`Erro ao reenviar convite: ${  errorMessage}`);
    }
  };

  useEffect(() => {
    fetchOrganizers();
  }, []);

  return {
    organizers,
    loading,
    createOrganizer,
    editOrganizer,
    deleteOrganizer,
    updateOrganizerStatus,
    updateOrganizerApiKey,
    resendInvitation,
    fetchOrganizers
  };
};
