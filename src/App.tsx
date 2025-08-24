
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Admin from "./pages/Admin";
import AdminDonations from "./pages/AdminDonations";
import AdminEventDetails from "./pages/AdminEventDetails";
import AdminEvents from "./pages/AdminEvents";
import AdminOrganizers from "./pages/AdminOrganizers";
import AdminPatients from "./pages/AdminPatients";
import AdminPayments from "./pages/AdminPayments";
import AdminRegistrations from "./pages/AdminRegistrations";
import AdminSettings from "./pages/AdminSettings";
import AdminSync from "./pages/AdminSync";
import Auth from "./pages/Auth";
import EventSelection from "./pages/EventSelection";
import Index from "./pages/Index";
import Registration from "./pages/Registration";
// ADMIN V2 - Nova versão reconstruída
import "./App.css";
import AdminCampaignsV2 from "./pages/admin-v2/Campaigns";
import AdminDashboardV2 from "./pages/admin-v2/Dashboard/simple";
import AdminDonationsV2 from "./pages/admin-v2/Donations";
import AdminEventsV2 from "./pages/admin-v2/Events";
import CreateEventV2 from "./pages/admin-v2/Events/create";
import EditEventV2 from "./pages/admin-v2/Events/edit";
import AdminMessagesV2 from "./pages/admin-v2/Messages";
import AdminOrganizersV2 from "./pages/admin-v2/Organizers";
import AdminPatientsV2 from "./pages/admin-v2/Patients";
import AdminPaymentsV2 from "./pages/admin-v2/Payments";
import AdminRegistrationsV2 from "./pages/admin-v2/Registrations";
import AdminReportsV2 from "./pages/admin-v2/Reports";
import AdminSettingsV2 from "./pages/admin-v2/Settings";
import AdminSyncV2 from "./pages/admin-v2/Sync";
import BulkMessagingPage from "./pages/BulkMessagingPage";
import Cookies from "./pages/Cookies";
import LGPD from "./pages/LGPD";
import NotFound from "./pages/NotFound";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import OrganizerEventForm from "./pages/OrganizerEventForm";
import OrganizerEvents from "./pages/OrganizerEvents";
import OrganizerProfile from "./pages/OrganizerProfile";
import OrganizerRegistrations from "./pages/OrganizerRegistrations";
import PatientAccess from "./pages/PatientAccess";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ReportsTemp from "./pages/ReportsTemp";
import TermsOfUse from "./pages/TermsOfUse";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/registro" element={<Registration />} />
              <Route path="/eventos" element={<EventSelection />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/acesso-paciente" element={<PatientAccess />} />
              <Route path="/politica-privacidade" element={<PrivacyPolicy />} />
              <Route path="/termos-uso" element={<TermsOfUse />} />
              <Route path="/lgpd" element={<LGPD />} />
              <Route path="/cookies" element={<Cookies />} />
              <Route path="/reports-temp" element={
                <ProtectedRoute requireAdmin={true}>
                  <ReportsTemp />
                </ProtectedRoute>
              } />

              {/* Rotas antigas do admin v1 - redirecionamento */}
              <Route path="/admin-old" element={
                <ProtectedRoute requireAdmin={true}>
                  <Admin />
                </ProtectedRoute>
              } />

              <Route path="/admin-old/events" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminEvents />
                </ProtectedRoute>
              } />

              <Route path="/admin-old/events/:id" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminEventDetails />
                </ProtectedRoute>
              } />

              <Route path="/admin-old/registrations" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminRegistrations />
                </ProtectedRoute>
              } />

              <Route path="/admin-old/organizers" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminOrganizers />
                </ProtectedRoute>
              } />

              <Route path="/admin-old/patients" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminPatients />
                </ProtectedRoute>
              } />

              <Route path="/admin-old/donations" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDonations />
                </ProtectedRoute>
              } />

              <Route path="/admin-old/payments" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminPayments />
                </ProtectedRoute>
              } />

              <Route path="/admin-old/settings" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminSettings />
                </ProtectedRoute>
              } />

              <Route path="/admin-old/sync" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminSync />
                </ProtectedRoute>
              } />

              {/* ADMIN V2 - Nova versão em produção */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboardV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin-v2" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboardV2 />
                </ProtectedRoute>
              } />
              {/* Rotas Admin V2 - Produção */}
              <Route path="/admin/events" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminEventsV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin/events/create" element={
                <ProtectedRoute requireAdmin={true}>
                  <CreateEventV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin/events/edit/:eventId" element={
                <ProtectedRoute requireAdmin={true}>
                  <EditEventV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin/patients" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminPatientsV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin/registrations" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminRegistrationsV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin/organizers" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminOrganizersV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin/messages" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminMessagesV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin/bulk-messaging" element={
                <ProtectedRoute requireAdmin={true}>
                  <BulkMessagingPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/campaigns" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminCampaignsV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin/reports" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminReportsV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminSettingsV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin/payments" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminPaymentsV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin/donations" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDonationsV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin/sync" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminSyncV2 />
                </ProtectedRoute>
              } />

              {/* Manter rotas admin-v2 para compatibilidade */}
              <Route path="/admin-v2/events" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminEventsV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin-v2/events/create" element={
                <ProtectedRoute requireAdmin={true}>
                  <CreateEventV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin-v2/events/edit/:eventId" element={
                <ProtectedRoute requireAdmin={true}>
                  <EditEventV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin-v2/patients" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminPatientsV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin-v2/registrations" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminRegistrationsV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin-v2/organizers" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminOrganizersV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin-v2/messages" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminMessagesV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin-v2/bulk-messaging" element={
                <ProtectedRoute requireAdmin={true}>
                  <BulkMessagingPage />
                </ProtectedRoute>
              } />
              <Route path="/admin-v2/campaigns" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminCampaignsV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin-v2/reports" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminReportsV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin-v2/settings" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminSettingsV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin-v2/payments" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminPaymentsV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin-v2/donations" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDonationsV2 />
                </ProtectedRoute>
              } />
              <Route path="/admin-v2/sync" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminSyncV2 />
                </ProtectedRoute>
              } />
              {/* Rota catch-all removida - causava conflito com rotas específicas */}

              {/* Protected Organizer Routes */}
              <Route path="/organizer" element={
                <ProtectedRoute requireOrganizer={true}>
                  <OrganizerDashboard />
                </ProtectedRoute>
              } />

              <Route path="/organizer/events" element={
                <ProtectedRoute requireOrganizer={true}>
                  <OrganizerEvents />
                </ProtectedRoute>
              } />

              <Route path="/organizer/registrations" element={
                <ProtectedRoute requireOrganizer={true}>
                  <OrganizerRegistrations />
                </ProtectedRoute>
              } />

              <Route path="/organizer/events/new" element={
                <ProtectedRoute requireOrganizer={true}>
                  <OrganizerEventForm />
                </ProtectedRoute>
              } />

              <Route path="/organizer/events/edit/:id" element={
                <ProtectedRoute requireOrganizer={true}>
                  <OrganizerEventForm />
                </ProtectedRoute>
              } />

              <Route path="/organizer/profile" element={
                <ProtectedRoute requireOrganizer={true}>
                  <OrganizerProfile />
                </ProtectedRoute>
              } />

              {/* Catch all route - must be last */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
