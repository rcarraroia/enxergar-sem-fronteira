
export const cleanupAuthState = () => {
  console.log("🧹 Limpando estado de autenticação...");
  
  // Remove standard auth tokens
  localStorage.removeItem("supabase.auth.token");
  
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("supabase.auth.") || key.includes("sb-")) {
      localStorage.removeItem(key);
      console.log(`🗑️ Removido: ${key}`);
    }
  });
  
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith("supabase.auth.") || key.includes("sb-")) {
      sessionStorage.removeItem(key);
      console.log(`🗑️ Removido de session: ${key}`);
    }
  });
};

export const forceAuthRefresh = async () => {
  try {
    cleanupAuthState();
    // Force page reload for clean state
    window.location.href = "/auth";
  } catch (error) {
    console.error("Erro ao forçar refresh:", error);
    window.location.reload();
  }
};
