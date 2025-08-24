/**
 * ADMIN V2 - SINCRONIZAÇÃO
 * Página temporária para navegação
 */

import { AdminLayout } from "@/components/admin-v2/shared/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction, RefreshCw } from "lucide-react";

const AdminSyncV2 = () => {
  return (
    <AdminLayout 
      title="Sincronização de Dados" 
      breadcrumbs={[
        { label: "Dashboard", path: "/admin-v2" },
        { label: "Sincronização", path: "/admin-v2/sync" }
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sincronização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Construction className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Página em Desenvolvimento
              </h3>
              <p className="text-muted-foreground">
                Esta funcionalidade será implementada na Fase 2 da reconstrução.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminSyncV2;