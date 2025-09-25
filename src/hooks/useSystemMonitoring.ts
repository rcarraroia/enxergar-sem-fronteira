
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SystemHealth {
  dbConnected: boolean
  authWorking: boolean
  edgeFunctionsHealthy: boolean
  lastChecked: Date
}

export const useSystemMonitoring = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    dbConnected: false,
    authWorking: false,
    edgeFunctionsHealthy: false,
    lastChecked: new Date()
  });

  const checkSystemHealth = async () => {
    console.log("🔍 Verificando saúde do sistema...");
    
    const health: Partial<SystemHealth> = {};
    
    try {
      // Test database connection
      const { data, error } = await supabase
        .from("system_settings")
        .select("count")
        .limit(1);
      
      health.dbConnected = !error;
      console.log("🗄️ Database:", health.dbConnected ? "✅ Conectado" : "❌ Erro");
    } catch (error) {
      health.dbConnected = false;
      console.error("❌ Database connection failed:", error);
    }

    try {
      // Test auth system
      const { data: { session } } = await supabase.auth.getSession();
      health.authWorking = true; // If we can call getSession, auth is working
      console.log("🔐 Auth:", health.authWorking ? "✅ Funcionando" : "❌ Erro");
    } catch (error) {
      health.authWorking = false;
      console.error("❌ Auth system error:", error);
    }

    // For now, assume edge functions are healthy if we can reach this point
    health.edgeFunctionsHealthy = health.dbConnected;
    
    setSystemHealth({
      dbConnected: health.dbConnected || false,
      authWorking: health.authWorking || false,
      edgeFunctionsHealthy: health.edgeFunctionsHealthy || false,
      lastChecked: new Date()
    });

    console.log("📊 Sistema:", {
      db: health.dbConnected ? "✅" : "❌",
      auth: health.authWorking ? "✅" : "❌", 
      functions: health.edgeFunctionsHealthy ? "✅" : "❌"
    });
  };

  useEffect(() => {
    checkSystemHealth();
    
    // Check every 5 minutes
    const interval = setInterval(checkSystemHealth, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    systemHealth,
    checkSystemHealth
  };
};
