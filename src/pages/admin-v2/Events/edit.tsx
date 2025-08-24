/**
 * ADMIN V2 - EDITAR EVENTO
 * Página para edição de eventos existentes
 */

import { useParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin-v2/shared/Layout";
import { EventForm } from "@/components/admin-v2/Events/EventForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const EditEventV2 = () => {
  const { eventId } = useParams<{ eventId: string }>();

  if (!eventId) {
    return (
      <AdminLayout 
        title="Editar Evento" 
        breadcrumbs={[
          { label: "Dashboard", path: "/admin-v2" },
          { label: "Eventos", path: "/admin-v2/events" },
          { label: "Editar Evento", path: "/admin-v2/events/edit" }
        ]}
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            ID do evento não encontrado. Verifique a URL e tente novamente.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Editar Evento" 
      breadcrumbs={[
        { label: "Dashboard", path: "/admin-v2" },
        { label: "Eventos", path: "/admin-v2/events" },
        { label: "Editar Evento", path: `/admin-v2/events/edit/${eventId}` }
      ]}
    >
      <EventForm mode="edit" eventId={eventId} />
    </AdminLayout>
  );
};

export default EditEventV2;