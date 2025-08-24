/**
 * ADMIN V2 - DOAÇÕES
 * Página temporária para navegação
 */

import { AdminLayout } from "@/components/admin-v2/shared/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction, Heart } from "lucide-react";

const AdminDonationsV2 = () => {
  return (
    <AdminLayout 
      title="Gestão de Doações" 
      breadcrumbs={[
        { label: "Dashboard", path: "/admin-v2" },
        { label: "Doações", path: "/admin-v2/donations" }
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Doações
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

export default AdminDonationsV2;