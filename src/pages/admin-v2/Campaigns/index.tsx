
/**
 * ADMIN V2 - CAMPANHAS DE DOAÇÃO
 * Gestão de campanhas de arrecadação
 */

import { useState } from "react";
import { AdminLayout } from "@/components/admin-v2/shared/Layout";
import { DataTable } from "@/components/admin-v2/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  Edit,
  Eye,
  Heart,
  Plus,
  Target
} from "lucide-react";
import { type CampaignFilters, type CampaignV2, useCampaignsV2 } from "@/hooks/admin-v2/useCampaignsV2";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminCampaignsV2 = () => {
  const [filters, setFilters] = useState<CampaignFilters>({
    search: "",
    status: "all"
  });

  const { data: campaigns = [], isLoading, error } = useCampaignsV2(filters);

  const handleViewCampaign = (campaign: CampaignV2) => {
    console.log("Ver campanha:", campaign.id);
  };

  const handleEditCampaign = (campaign: CampaignV2) => {
    console.log("Editar campanha:", campaign.id);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const columns = [
    {
      key: "title",
      label: "Campanha",
      render: (value: string, campaign: CampaignV2) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">
            {campaign.description?.substring(0, 50)}...
          </div>
        </div>
      )
    },
    {
      key: "goal_amount",
      label: "Meta",
      render: (value: number, campaign: CampaignV2) => (
        <div>
          <div className="text-sm font-medium">{formatCurrency(value)}</div>
          <div className="text-xs text-muted-foreground">
            {formatCurrency(campaign.raised_amount || 0)} arrecadado
          </div>
        </div>
      )
    },
    {
      key: "progress",
      label: "Progresso",
      render: (value: number) => (
        <div className="text-center">
          <div className="text-sm font-medium">{value.toFixed(1)}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${Math.min(value, 100)}%` }}
            ></div>
          </div>
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <Badge variant={
          value === "active" ? "default" :
          value === "completed" ? "secondary" :
          value === "paused" ? "outline" : "destructive"
        }>
          {value === "active" ? "Ativa" :
           value === "completed" ? "Concluída" :
           value === "paused" ? "Pausada" : "Cancelada"}
        </Badge>
      )
    },
    {
      key: "end_date",
      label: "Prazo",
      render: (value: string) => (
        <span className="text-sm text-muted-foreground">
          {value ? format(new Date(value), "dd/MM/yyyy", { locale: ptBR }) : "Sem prazo"}
        </span>
      )
    }
  ];

  const actions = [
    {
      label: "Visualizar",
      onClick: handleViewCampaign,
      icon: Eye
    },
    {
      label: "Editar",
      onClick: handleEditCampaign,
      icon: Edit
    }
  ];

  if (error) {
    return (
      <AdminLayout 
        title="Campanhas de Doação" 
        breadcrumbs={[
          { label: "Dashboard", path: "/admin-v2" },
          { label: "Campanhas", path: "/admin-v2/campaigns" }
        ]}
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar campanhas. Verifique sua conexão e tente novamente.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Campanhas de Doação" 
      breadcrumbs={[
        { label: "Dashboard", path: "/admin" },
        { label: "Campanhas", path: "/admin/campaigns" }
      ]}
      actions={
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Campanha
        </Button>
      }
    >
      <DataTable
        data={campaigns}
        columns={columns}
        actions={actions}
        loading={isLoading}
        searchable={true}
        searchPlaceholder="Buscar campanhas..."
        onSearch={(search) => setFilters(prev => ({ ...prev, search }))}
        emptyMessage="Nenhuma campanha encontrada. Clique em 'Nova Campanha' para começar."
      />
    </AdminLayout>
  );
};

export default AdminCampaignsV2;
