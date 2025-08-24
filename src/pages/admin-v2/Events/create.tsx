/**
 * ADMIN V2 - CRIAR EVENTO
 * Página para criação de novos eventos
 */

import { AdminLayout } from "@/components/admin-v2/shared/Layout";
import { EventForm } from "@/components/admin-v2/Events/EventForm";

const CreateEventV2 = () => {
  return (
    <AdminLayout 
      title="Criar Novo Evento" 
      breadcrumbs={[
        { label: "Dashboard", path: "/admin-v2" },
        { label: "Eventos", path: "/admin-v2/events" },
        { label: "Criar Evento", path: "/admin-v2/events/create" }
      ]}
    >
      <EventForm mode="create" />
    </AdminLayout>
  );
};

export default CreateEventV2;