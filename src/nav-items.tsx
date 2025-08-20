
import {
  HomeIcon,
  Users,
  Calendar,
  Settings,
  User,
  Heart,
  CreditCard,
  FileBarChart,
  Bell,
  Shield,
  Building2,
  BarChart3,
  FileText,
  Download
} from "lucide-react";

export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
  },
  {
    title: "Admin",
    to: "/admin",
    icon: <Shield className="h-4 w-4" />,
  },
  {
    title: "Organizadores",
    to: "/organizers",
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    title: "Relatórios Temp",
    to: "/reports-temp",
    icon: <Download className="h-4 w-4" />,
  },
];
