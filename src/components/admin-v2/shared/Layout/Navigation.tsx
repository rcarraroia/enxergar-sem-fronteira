/**
 * ADMIN NAVIGATION V2 - Navegação lateral do painel
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Calendar,
  CreditCard,
  Heart,
  LayoutDashboard,
  MessageSquare,
  RefreshCw,
  Settings,
  UserCheck,
  UserCog,
  Users
} from "lucide-react";

interface NavigationItem {
  id: string
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const navigationItems: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard
  },
  {
    id: "events",
    label: "Eventos",
    path: "/admin/events",
    icon: Calendar
  },
  {
    id: "patients",
    label: "Pacientes",
    path: "/admin/patients",
    icon: Users
  },
  {
    id: "registrations",
    label: "Inscrições",
    path: "/admin/registrations",
    icon: UserCheck
  },
  {
    id: "organizers",
    label: "Promotores",
    path: "/admin/organizers",
    icon: UserCog
  },
  {
    id: "messages",
    label: "Mensagens",
    path: "/admin/messages",
    icon: MessageSquare
  },
  {
    id: "campaigns",
    label: "Campanhas",
    path: "/admin/campaigns",
    icon: Heart
  },
  {
    id: "sync",
    label: "Sincronização",
    path: "/admin/sync",
    icon: RefreshCw
  },
  {
    id: "settings",
    label: "Configurações",
    path: "/admin/settings",
    icon: Settings
  }
];

export const AdminNavigation: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md bg-white border border-gray-200 shadow-sm"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Navigation */}
      <nav className={cn(
        "bg-white border-r border-gray-200 min-h-screen transition-transform duration-300 ease-in-out",
        "lg:w-64 lg:translate-x-0 lg:static lg:block",
        "fixed top-0 left-0 z-50 w-64",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Menu items */}
        <div className="p-4 overflow-y-auto">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full flex-shrink-0">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
};