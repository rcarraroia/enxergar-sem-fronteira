
import { HomeIcon, InfoIcon, CalendarIcon } from "lucide-react";
import Index from "./pages/Index.tsx";

export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
  },
];
