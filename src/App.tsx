
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleBasedRedirect } from "@/components/RoleBasedRedirect";
import Index from "./pages/Index";
import Registration from "./pages/Registration";
import EventSelection from "./pages/EventSelection";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import AdminEvents from "./pages/AdminEvents";
import AdminEventDetails from "./pages/AdminEventDetails";
import AdminRegistrations from "./pages/AdminRegistrations";
import AdminOrganizers from "./pages/AdminOrganizers";
import AdminPatients from "./pages/AdminPatients";
import AdminDonations from "./pages/AdminDonations";
import AdminPayments from "./pages/AdminPayments";
import AdminSettings from "./pages/AdminSettings";
import AdminSync from "./pages/AdminSync";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import OrganizerEvents from "./pages/OrganizerEvents";
import OrganizerRegistrations from "./pages/OrganizerRegistrations";
import OrganizerEventForm from "./pages/OrganizerEventForm";
import OrganizerProfile from "./pages/OrganizerProfile";
import PatientAccess from "./pages/PatientAccess";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import LGPD from "./pages/LGPD";
import Cookies from "./pages/Cookies";
import NotFound from "./pages/NotFound";
import ReportsTemp from "./pages/ReportsTemp";
import "./App.css";

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
              <Route path="/reports-temp" element={<ReportsTemp />} />
              
              {/* Protected routes */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin={true}>
                  <RoleBasedRedirect>
                    <Admin />
                  </RoleBasedRedirect>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/events" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminEvents />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/events/:id" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminEventDetails />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/registrations" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminRegistrations />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/organizers" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminOrganizers />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/patients" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminPatients />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/donations" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDonations />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/payments" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminPayments />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/settings" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminSettings />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/sync" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminSync />
                </ProtectedRoute>
              } />
              
              <Route path="/organizer" element={
                <ProtectedRoute requireOrganizer={true}>
                  <RoleBasedRedirect>
                    <OrganizerDashboard />
                  </RoleBasedRedirect>
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
