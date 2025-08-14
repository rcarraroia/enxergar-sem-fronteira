
import Admin from "./pages/Admin";
import AdminPatients from "./pages/AdminPatients";
import AdminEvents from "./pages/AdminEvents";
import AdminRegistrations from "./pages/AdminRegistrations";
import AdminSync from "./pages/AdminSync";
import AdminDonations from "./pages/AdminDonations";
import AdminEventDetails from "./pages/AdminEventDetails";
import AdminOrganizers from "./pages/AdminOrganizers";
import AdminSettings from "./pages/AdminSettings";

export const navItems = [
  {
    title: "Dashboard",
    to: "/admin",
    icon: "home",
    page: <Admin />,
  },
  {
    title: "Pacientes",
    to: "/admin/patients",
    icon: "users",
    page: <AdminPatients />,
  },
  {
    title: "Eventos",
    to: "/admin/events",
    icon: "calendar",
    page: <AdminEvents />,
  },
  {
    title: "Inscrições",
    to: "/admin/registrations",
    icon: "clipboard-list",
    page: <AdminRegistrations />,
  },
  {
    title: "Organizadores",
    to: "/admin/organizers",
    icon: "user-cog",
    page: <AdminOrganizers />,
  },
  {
    title: "Configurações",
    to: "/admin/settings",
    icon: "settings",
    page: <AdminSettings />,
  },
  {
    title: "Sincronização",
    to: "/admin/sync",
    icon: "refresh-cw",
    page: <AdminSync />,
  },
  {
    title: "Campanhas de Arrecadação",
    to: "/admin/donations",
    icon: "heart",
    page: <AdminDonations />,
  },
];
