
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Registration from "./pages/Registration";
import EventSelection from "./pages/EventSelection";
import PatientAccess from "./pages/PatientAccess";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import LGPD from "./pages/LGPD";
import Cookies from "./pages/Cookies";
import Admin from "./pages/Admin";
import AdminPatients from "./pages/AdminPatients";
import AdminEvents from "./pages/AdminEvents";
import AdminEventDetails from "./pages/AdminEventDetails";
import AdminRegistrations from "./pages/AdminRegistrations";
import AdminOrganizers from "./pages/AdminOrganizers";
import AdminSettings from "./pages/AdminSettings";
import AdminSync from "./pages/AdminSync";
import AdminPayments from "./pages/AdminPayments";
import AdminDonations from "./pages/AdminDonations";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import OrganizerEvents from "./pages/OrganizerEvents";
import OrganizerEventForm from "./pages/OrganizerEventForm";
import OrganizerRegistrations from "./pages/OrganizerRegistrations";
import OrganizerProfile from "./pages/OrganizerProfile";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./hooks/useAuth";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/events" element={<EventSelection />} />
              <Route path="/registration" element={<Registration />} />
              <Route path="/patient-access" element={<PatientAccess />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-use" element={<TermsOfUse />} />
              <Route path="/lgpd" element={<LGPD />} />
              <Route path="/cookies" element={<Cookies />} />
              
              {/* Protected Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <Admin />
                </ProtectedRoute>
              } />
              <Route path="/admin/patients" element={
                <ProtectedRoute requireAdmin>
                  <AdminPatients />
                </ProtectedRoute>
              } />
              <Route path="/admin/events" element={
                <ProtectedRoute requireAdmin>
                  <AdminEvents />
                </ProtectedRoute>
              } />
              <Route path="/admin/events/:eventId" element={
                <ProtectedRoute requireAdmin>
                  <AdminEventDetails />
                </ProtectedRoute>
              } />
              <Route path="/admin/registrations" element={
                <ProtectedRoute requireAdmin>
                  <AdminRegistrations />
                </ProtectedRoute>
              } />
              <Route path="/admin/organizers" element={
                <ProtectedRoute requireAdmin>
                  <AdminOrganizers />
                </ProtectedRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedRoute requireAdmin>
                  <AdminSettings />
                </ProtectedRoute>
              } />
              <Route path="/admin/sync" element={
                <ProtectedRoute requireAdmin>
                  <AdminSync />
                </ProtectedRoute>
              } />
              <Route path="/admin/payments" element={
                <ProtectedRoute requireAdmin>
                  <AdminPayments />
                </ProtectedRoute>
              } />
              <Route path="/admin/donations" element={
                <ProtectedRoute requireAdmin>
                  <AdminDonations />
                </ProtectedRoute>
              } />

              {/* Protected Organizer Routes */}
              <Route path="/organizer" element={
                <ProtectedRoute requireOrganizer>
                  <OrganizerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/organizer/events" element={
                <ProtectedRoute requireOrganizer>
                  <OrganizerEvents />
                </ProtectedRoute>
              } />
              <Route path="/organizer/events/new" element={
                <ProtectedRoute requireOrganizer>
                  <OrganizerEventForm />
                </ProtectedRoute>
              } />
              <Route path="/organizer/events/:eventId/edit" element={
                <ProtectedRoute requireOrganizer>
                  <OrganizerEventForm />
                </ProtectedRoute>
              } />
              <Route path="/organizer/registrations" element={
                <ProtectedRoute requireOrganizer>
                  <OrganizerRegistrations />
                </ProtectedRoute>
              } />
              <Route path="/organizer/profile" element={
                <ProtectedRoute requireOrganizer>
                  <OrganizerProfile />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
