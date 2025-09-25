import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { navItems } from "./nav-items";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Cookies from "./pages/Cookies";
import LGPD from "./pages/LGPD";
import NotFound from "./pages/NotFound";
import PatientAccess from "./pages/PatientAccess";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ReportsTemp from "./pages/ReportsTemp";
import TermsOfUse from "./pages/TermsOfUse";
import Auth from "./pages/Auth";
import EventSelection from "./pages/EventSelection";
import Index from "./pages/Index";
import Registration from "./pages/Registration";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <Routes>
              {/* Rotas públicas */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/eventos" element={<EventSelection />} />
              <Route path="/inscricao" element={<Registration />} />
              <Route path="/sucesso" element={<Registration />} />
              <Route path="/privacidade" element={<PrivacyPolicy />} />
              <Route path="/termos" element={<TermsOfUse />} />
              <Route path="/cookies" element={<Cookies />} />
              <Route path="/lgpd" element={<LGPD />} />
              <Route path="/acesso-paciente" element={<PatientAccess />} />
              <Route path="/relatorios-temp" element={<ReportsTemp />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <Toaster />
          <Sonner />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;