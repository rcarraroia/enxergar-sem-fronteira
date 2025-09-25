/**
 * Hook for managing notification templates
 */

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { 
  NotificationTemplate, 
  NotificationTemplateInput, 
  TemplateError,
  TemplateFilters,
  UseNotificationTemplatesReturn
} from "@/types/notificationTemplates";
import { 
  TemplateErrorType
} from "@/types/notificationTemplates";
import { validateTemplate } from "@/utils/templateProcessor";
import { toast } from "sonner";

const QUERY_KEY = "notification-templates";

/**
 * Hook for managing notification templates
 */
export const useNotificationTemplates = (filters?: TemplateFilters): UseNotificationTemplatesReturn => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<TemplateError | null>(null);

  // Fetch templates with optional filtering
  const { data: templates = [], isLoading: loading, refetch } = useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: async () => {
      console.log("🔍 Fetching notification templates...", filters);
      
      let query = supabase
        .from("notification_templates")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters?.type && filters.type !== "all") {
        query = query.eq("type", filters.type);
      }
      
      if (filters?.status && filters.status !== "all") {
        const isActive = filters.status === "active";
        query = query.eq("is_active", isActive);
      }
      
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("❌ Error fetching templates:", error);
        throw new Error(`Failed to fetch templates: ${error.message}`);
      }

      console.log(`✅ Fetched ${data?.length || 0} templates`);
      return data as NotificationTemplate[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Set up real-time subscription
  useEffect(() => {
    console.log("🔄 Setting up real-time subscription for templates...");
    
    const channel = supabase
      .channel("notification-templates-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notification_templates"
        },
        (payload) => {
          console.log("📡 Template change detected:", payload);
          
          // Invalidate and refetch templates
          queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
          
          // Show toast notification based on event type
          switch (payload.eventType) {
            case "INSERT":
              toast.success("Novo template criado");
              break;
            case "UPDATE":
              toast.success("Template atualizado");
              break;
            case "DELETE":
              toast.success("Template excluído");
              break;
          }
        }
      )
      .subscribe();

    return () => {
      console.log("🔌 Cleaning up template subscription");
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (template: NotificationTemplateInput): Promise<NotificationTemplate> => {
      console.log("📝 Creating template:", template.name);
      
      // Validate template before creating
      const validationErrors = validateTemplate(template);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0]?.message || "Erro de validação");
      }

      const { data, error } = await supabase
        .from("notification_templates")
        .insert([template])
        .select()
        .single();

      if (error) {
        console.error("❌ Error creating template:", error);
        
        if (error.code === "23505") { // Unique constraint violation
          throw new Error("Já existe um template com este nome");
        }
        
        throw new Error(`Erro ao criar template: ${error.message}`);
      }

      console.log("✅ Template created successfully:", data.id);
      return data as NotificationTemplate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(`Template "${data.name}" criado com sucesso`);
      setError(null);
    },
    onError: (error) => {
      console.error("❌ Create template error:", error);
      const templateError: TemplateError = {
        type: TemplateErrorType.PROCESSING_ERROR,
        message: error instanceof Error ? error.message : "Erro ao criar template"
      };
      setError(templateError);
      toast.error(templateError.message);
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, template }: { id: string; template: Partial<NotificationTemplateInput> }): Promise<NotificationTemplate> => {
      console.log("📝 Updating template:", id);
      
      // If updating content or structure, validate
      if (template.content || template.subject || template.name) {
        const fullTemplate = { ...templates.find(t => t.id === id), ...template } as NotificationTemplateInput;
        const validationErrors = validateTemplate(fullTemplate);
        if (validationErrors.length > 0) {
          throw new Error(validationErrors[0]?.message || "Erro de validação");
        }
      }

      const { data, error } = await supabase
        .from("notification_templates")
        .update(template)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("❌ Error updating template:", error);
        
        if (error.code === "23505") { // Unique constraint violation
          throw new Error("Já existe um template com este nome");
        }
        
        throw new Error(`Erro ao atualizar template: ${error.message}`);
      }

      console.log("✅ Template updated successfully:", data.id);
      return data as NotificationTemplate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(`Template "${data.name}" atualizado com sucesso`);
      setError(null);
    },
    onError: (error) => {
      console.error("❌ Update template error:", error);
      const templateError: TemplateError = {
        type: TemplateErrorType.PROCESSING_ERROR,
        message: error instanceof Error ? error.message : "Erro ao atualizar template"
      };
      setError(templateError);
      toast.error(templateError.message);
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      console.log("🗑️ Deleting template:", id);
      
      const { error } = await supabase
        .from("notification_templates")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("❌ Error deleting template:", error);
        throw new Error(`Erro ao excluir template: ${error.message}`);
      }

      console.log("✅ Template deleted successfully");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success("Template excluído com sucesso");
      setError(null);
    },
    onError: (error) => {
      console.error("❌ Delete template error:", error);
      const templateError: TemplateError = {
        type: TemplateErrorType.PROCESSING_ERROR,
        message: error instanceof Error ? error.message : "Erro ao excluir template"
      };
      setError(templateError);
      toast.error(templateError.message);
    }
  });

  // Duplicate template mutation
  const duplicateTemplateMutation = useMutation({
    mutationFn: async (id: string): Promise<NotificationTemplate> => {
      console.log("📋 Duplicating template:", id);
      
      const originalTemplate = templates.find(t => t.id === id);
      if (!originalTemplate) {
        throw new Error("Template não encontrado");
      }

      // Create duplicate with modified name
      const duplicateTemplate: NotificationTemplateInput = {
        name: `${originalTemplate.name}_copia`,
        type: originalTemplate.type,
        subject: originalTemplate.subject,
        content: originalTemplate.content,
        is_active: false // Start as inactive
      };

      const { data, error } = await supabase
        .from("notification_templates")
        .insert([duplicateTemplate])
        .select()
        .single();

      if (error) {
        console.error("❌ Error duplicating template:", error);
        
        if (error.code === "23505") { // Unique constraint violation
          // Try with timestamp suffix
          duplicateTemplate.name = `${originalTemplate.name}_copia_${Date.now()}`;
          
          const { data: retryData, error: retryError } = await supabase
            .from("notification_templates")
            .insert([duplicateTemplate])
            .select()
            .single();
            
          if (retryError) {
            throw new Error(`Erro ao duplicar template: ${retryError.message}`);
          }
          
          return retryData as NotificationTemplate;
        }
        
        throw new Error(`Erro ao duplicar template: ${error.message}`);
      }

      console.log("✅ Template duplicated successfully:", data.id);
      return data as NotificationTemplate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(`Template duplicado como "${data.name}"`);
      setError(null);
    },
    onError: (error) => {
      console.error("❌ Duplicate template error:", error);
      const templateError: TemplateError = {
        type: TemplateErrorType.PROCESSING_ERROR,
        message: error instanceof Error ? error.message : "Erro ao duplicar template"
      };
      setError(templateError);
      toast.error(templateError.message);
    }
  });

  // Toggle template active status
  const toggleTemplateMutation = useMutation({
    mutationFn: async (id: string): Promise<NotificationTemplate> => {
      console.log("🔄 Toggling template status:", id);
      
      const template = templates.find(t => t.id === id);
      if (!template) {
        throw new Error("Template não encontrado");
      }

      const { data, error } = await supabase
        .from("notification_templates")
        .update({ is_active: !template.is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("❌ Error toggling template:", error);
        throw new Error(`Erro ao alterar status do template: ${error.message}`);
      }

      console.log("✅ Template status toggled successfully");
      return data as NotificationTemplate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      const status = data.is_active ? "ativado" : "desativado";
      toast.success(`Template ${status} com sucesso`);
      setError(null);
    },
    onError: (error) => {
      console.error("❌ Toggle template error:", error);
      const templateError: TemplateError = {
        type: TemplateErrorType.PROCESSING_ERROR,
        message: error instanceof Error ? error.message : "Erro ao alterar status do template"
      };
      setError(templateError);
      toast.error(templateError.message);
    }
  });

  // Wrapper functions
  const createTemplate = useCallback(
    (template: NotificationTemplateInput) => createTemplateMutation.mutateAsync(template),
    [createTemplateMutation]
  );

  const updateTemplate = useCallback(
    (id: string, template: Partial<NotificationTemplateInput>) => 
      updateTemplateMutation.mutateAsync({ id, template }),
    [updateTemplateMutation]
  );

  const deleteTemplate = useCallback(
    (id: string) => deleteTemplateMutation.mutateAsync(id),
    [deleteTemplateMutation]
  );

  const duplicateTemplate = useCallback(
    (id: string) => duplicateTemplateMutation.mutateAsync(id),
    [duplicateTemplateMutation]
  );

  const toggleTemplate = useCallback(
    (id: string) => toggleTemplateMutation.mutateAsync(id),
    [toggleTemplateMutation]
  );

  const refetchTemplates = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    toggleTemplate,
    refetch: refetchTemplates
  };
};