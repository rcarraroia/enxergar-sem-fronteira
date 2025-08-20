
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
                <ProtectedRoute requiredRole="admin">
                  <RoleBasedRedirect>
                    <Admin />
                  </RoleBasedRedirect>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/events" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminEvents />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/events/:id" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminEventDetails />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/registrations" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminRegistrations />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/organizers" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminOrganizers />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/patients" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPatients />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/donations" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDonations />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/payments" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPayments />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/settings" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminSettings />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/sync" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminSync />
                </ProtectedRoute>
              } />
              
              <Route path="/organizer" element={
                <ProtectedRoute requiredRole="organizer">
                  <RoleBasedRedirect>
                    <OrganizerDashboard />
                  </RoleBasedRedirect>
                </ProtectedRoute>
              } />
              
              <Route path="/organizer/events" element={
                <ProtectedRoute requiredRole="organizer">
                  <OrganizerEvents />
                </ProtectedRoute>
              } />
              
              <Route path="/organizer/registrations" element={
                <ProtectedRoute requiredRole="organizer">
                  <OrganizerRegistrations />
                </ProtectedRoute>
              } />
              
              <Route path="/organizer/events/new" element={
                <ProtectedRoute requiredRole="organizer">
                  <OrganizerEventForm />
                </ProtectedRoute>
              } />
              
              <Route path="/organizer/events/edit/:id" element={
                <ProtectedRoute requiredRole="organizer">
                  <OrganizerEventForm />
                </ProtectedRoute>
              } />
              
              <Route path="/organizer/profile" element={
                <ProtectedRoute requiredRole="organizer">
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
