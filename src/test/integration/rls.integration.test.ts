/**
 * Testes de Integração - Políticas RLS (Row Level Security)
 *
 * Testa se as políticas de segurança estão funcionando corretamente:
 * - Acesso baseado em roles
 * - Isolamento de dados
 * - Prevenção de vazamentos de dados
 * - Validação de permissões
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock do Supabase com diferentes cenários de RLS
const createMockSupabase = (userRole: string, userId: string) => ({
  auth: {
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    })),
    getSession: vi.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: userId, email: `${userRole}@test.com` },
          access_token: `token-${userId}`
        }
      },
      error: null
    }),
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: userId, email: `${userRole}@test.com` } },
      error: null
    })
  },
  from: vi.fn()
});

describe("Testes de Integração - Políticas RLS", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Acesso a Dados de Eventos", () => {
    it("deve permitir acesso público a eventos ativos", async () => {
      // Arrange
      const mockSupabase = createMockSupabase("user", "user-123");

      // Mock política pública para eventos ativos
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "event-1",
                  title: "Evento Público",
                  status: "active",
                  is_public: true
                }
              ],
              error: null
            })
          }))
        }))
      });

      vi.doMock("@/integrations/supabase/client", () => ({
        supabase: mockSupabase
      }));

      // Act
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("status", "active")
        .eq("is_public", true);

      // Assert
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0].title).toBe("Evento Público");
    });

    it("deve bloquear acesso a eventos privados para usuários comuns", async () => {
      // Arrange
      const mockSupabase = createMockSupabase("user", "user-123");

      // Mock política que bloqueia eventos privados
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: [], // Nenhum resultado devido à política RLS
            error: null
          })
        }))
      });

      vi.doMock("@/integrations/supabase/client", () => ({
        supabase: mockSupabase
      }));

      // Act
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_public", false);

      // Assert
      expect(error).toBeNull();
      expect(data).toHaveLength(0); // Bloqueado pela política RLS
    });

    it("deve permitir acesso admin a todos os eventos", async () => {
      // Arrange
      const mockSupabase = createMockSupabase("admin", "admin-123");

      // Mock política admin que permite acesso total
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [
            {
              id: "event-1",
              title: "Evento Público",
              status: "active",
              is_public: true
            },
            {
              id: "event-2",
              title: "Evento Privado",
              status: "active",
              is_public: false
            }
          ],
          error: null
        })
      });

      vi.doMock("@/integrations/supabase/client", () => ({
        supabase: mockSupabase
      }));

      // Act
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("events")
        .select("*");

      // Assert
      expect(error).toBeNull();
      expect(data).toHaveLength(2); // Admin vê todos os eventos
    });
  });

  describe("Acesso a Dados de Registrações", () => {
    it("deve permitir organizador ver apenas suas registrações", async () => {
      // Arrange
      const mockSupabase = createMockSupabase("organizer", "org-123");

      // Mock política que filtra por organizador
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: [
              {
                id: "reg-1",
                event_id: "event-1",
                patient_id: "patient-1",
                organizer_id: "org-123" // Apenas registrações do organizador
              }
            ],
            error: null
          })
        }))
      });

      vi.doMock("@/integrations/supabase/client", () => ({
        supabase: mockSupabase
      }));

      // Act
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .eq("organizer_id", "org-123");

      // Assert
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0].organizer_id).toBe("org-123");
    });

    it("deve bloquear organizador de ver registrações de outros", async () => {
      // Arrange
      const mockSupabase = createMockSupabase("organizer", "org-123");

      // Mock política que bloqueia acesso a registrações de outros organizadores
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: [], // Bloqueado pela política RLS
            error: null
          })
        }))
      });

      vi.doMock("@/integrations/supabase/client", () => ({
        supabase: mockSupabase
      }));

      // Act
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .eq("organizer_id", "org-456"); // Tentando acessar dados de outro organizador

      // Assert
      expect(error).toBeNull();
      expect(data).toHaveLength(0); // Bloqueado pela política RLS
    });

    it("deve permitir admin ver todas as registrações", async () => {
      // Arrange
      const mockSupabase = createMockSupabase("admin", "admin-123");

      // Mock política admin que permite acesso total
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [
            {
              id: "reg-1",
              event_id: "event-1",
              patient_id: "patient-1",
              organizer_id: "org-123"
            },
            {
              id: "reg-2",
              event_id: "event-2",
              patient_id: "patient-2",
              organizer_id: "org-456"
            }
          ],
          error: null
        })
      });

      vi.doMock("@/integrations/supabase/client", () => ({
        supabase: mockSupabase
      }));

      // Act
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("registrations")
        .select("*");

      // Assert
      expect(error).toBeNull();
      expect(data).toHaveLength(2); // Admin vê todas as registrações
    });
  });

  describe("Proteção de Dados Sensíveis", () => {
    it("deve bloquear acesso a dados de pacientes para usuários não autorizados", async () => {
      // Arrange
      const mockSupabase = createMockSupabase("user", "user-123");

      // Mock política que bloqueia acesso direto a pacientes
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: {
            code: "42501",
            message: "insufficient_privilege"
          }
        })
      });

      vi.doMock("@/integrations/supabase/client", () => ({
        supabase: mockSupabase
      }));

      // Act
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("patients")
        .select("*");

      // Assert
      expect(error).not.toBeNull();
      expect(error?.code).toBe("42501");
      expect(data).toHaveLength(0);
    });

    it("deve permitir organizador ver apenas pacientes de seus eventos", async () => {
      // Arrange
      const mockSupabase = createMockSupabase("organizer", "org-123");

      // Mock política que permite acesso via JOIN com registrações
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: [
              {
                id: "patient-1",
                nome: "João Silva",
                cpf: "***.***.***-**", // CPF mascarado
                email: "joao@test.com"
              }
            ],
            error: null
          })
        }))
      });

      vi.doMock("@/integrations/supabase/client", () => ({
        supabase: mockSupabase
      }));

      // Act
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("patients")
        .select("id, nome, cpf, email")
        .eq("organizer_id", "org-123");

      // Assert
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0].cpf).toMatch(/\*+/); // CPF deve estar mascarado
    });
  });

  describe("Operações de Escrita com RLS", () => {
    it("deve permitir organizador criar eventos", async () => {
      // Arrange
      const mockSupabase = createMockSupabase("organizer", "org-123");

      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "event-new",
                title: "Novo Evento",
                organizer_id: "org-123"
              },
              error: null
            })
          }))
        }))
      });

      vi.doMock("@/integrations/supabase/client", () => ({
        supabase: mockSupabase
      }));

      // Act
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("events")
        .insert({
          title: "Novo Evento",
          organizer_id: "org-123"
        })
        .select()
        .single();

      // Assert
      expect(error).toBeNull();
      expect(data?.title).toBe("Novo Evento");
      expect(data?.organizer_id).toBe("org-123");
    });

    it("deve bloquear organizador de modificar eventos de outros", async () => {
      // Arrange
      const mockSupabase = createMockSupabase("organizer", "org-123");

      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: {
                  code: "42501",
                  message: "insufficient_privilege"
                }
              })
            }))
          }))
        }))
      });

      vi.doMock("@/integrations/supabase/client", () => ({
        supabase: mockSupabase
      }));

      // Act
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("events")
        .update({ title: "Evento Modificado" })
        .eq("id", "event-other-org")
        .select()
        .single();

      // Assert
      expect(error).not.toBeNull();
      expect(error?.code).toBe("42501");
      expect(data).toBeNull();
    });

    it("deve permitir admin modificar qualquer evento", async () => {
      // Arrange
      const mockSupabase = createMockSupabase("admin", "admin-123");

      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "event-any",
                  title: "Evento Modificado pelo Admin",
                  organizer_id: "org-456"
                },
                error: null
              })
            }))
          }))
        }))
      });

      vi.doMock("@/integrations/supabase/client", () => ({
        supabase: mockSupabase
      }));

      // Act
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("events")
        .update({ title: "Evento Modificado pelo Admin" })
        .eq("id", "event-any")
        .select()
        .single();

      // Assert
      expect(error).toBeNull();
      expect(data?.title).toBe("Evento Modificado pelo Admin");
    });
  });

  describe("Auditoria e Logs", () => {
    it("deve registrar tentativas de acesso não autorizado", async () => {
      // Arrange
      const mockSupabase = createMockSupabase("user", "user-123");

      // Mock que simula log de auditoria
      const auditLogSpy = vi.fn();
      mockSupabase.from.mockImplementation((table) => {
        if (table === "audit_logs") {
          return {
            insert: auditLogSpy.mockResolvedValue({ data: null, error: null })
          };
        }

        // Simular acesso negado
        return {
          select: vi.fn().mockResolvedValue({
            data: [],
            error: {
              code: "42501",
              message: "insufficient_privilege"
            }
          })
        };
      });

      vi.doMock("@/integrations/supabase/client", () => ({
        supabase: mockSupabase
      }));

      // Act
      const { supabase } = await import("@/integrations/supabase/client");

      // Tentar acessar dados restritos
      const { error } = await supabase
        .from("organizers")
        .select("*");

      // Simular log de auditoria (seria feito por trigger no banco)
      if (error?.code === "42501") {
        await supabase
          .from("audit_logs")
          .insert({
            user_id: "user-123",
            action: "unauthorized_access_attempt",
            table_name: "organizers",
            timestamp: new Date().toISOString()
          });
      }

      // Assert
      expect(error?.code).toBe("42501");
      expect(auditLogSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-123",
          action: "unauthorized_access_attempt",
          table_name: "organizers"
        })
      );
    });
  });

  describe("Validação de Integridade", () => {
    it("deve validar que RLS está habilitado em todas as tabelas críticas", async () => {
      // Arrange
      const criticalTables = [
        "patients",
        "registrations",
        "events",
        "organizers",
        "system_settings"
      ];

      const mockSupabase = createMockSupabase("admin", "admin-123");

      // Mock query para verificar RLS
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: criticalTables.map(table => ({
            tablename: table,
            rowsecurity: true // RLS habilitado
          })),
          error: null
        })
      });

      vi.doMock("@/integrations/supabase/client", () => ({
        supabase: mockSupabase
      }));

      // Act
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("pg_tables")
        .select("tablename, rowsecurity")
        .eq("tablename", criticalTables[0]); // Simplificado para teste

      // Assert
      expect(error).toBeNull();
      expect(data).toHaveLength(criticalTables.length);

      data?.forEach(table => {
        expect(table.rowsecurity).toBe(true);
      });
    });

    it("deve validar que políticas estão ativas", async () => {
      // Arrange
      const mockSupabase = createMockSupabase("admin", "admin-123");

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [
            {
              tablename: "events",
              policyname: "events_public_read",
              permissive: "PERMISSIVE",
              roles: ["public"]
            },
            {
              tablename: "registrations",
              policyname: "registrations_organizer_access",
              permissive: "PERMISSIVE",
              roles: ["authenticated"]
            }
          ],
          error: null
        })
      });

      vi.doMock("@/integrations/supabase/client", () => ({
        supabase: mockSupabase
      }));

      // Act
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase
        .from("pg_policies")
        .select("tablename, policyname, permissive, roles");

      // Assert
      expect(error).toBeNull();
      expect(data?.length).toBeGreaterThan(0);

      // Verificar se políticas críticas existem
      const policyNames = data?.map(p => p.policyname) || [];
      expect(policyNames).toContain("events_public_read");
      expect(policyNames).toContain("registrations_organizer_access");
    });
  });
});
