import { 
  Calculator, 
  History, 
  Home, 
  Settings, 
  Star, 
  Stethoscope, 
  Building2,
  Briefcase,
  Users,  
  LogOut,
  CalendarIcon
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/components/ui/sidebar";
import { Link } from "react-router-dom";

const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Cases",
    url: "/cases",
    icon: Briefcase,
  },
  {
    title: "Operations",
    url: "/operations",
    icon: Stethoscope,
  },
  {
    title: "Hospitals",
    url: "/hospitals",
    icon: Building2,
  },
  {
    title: "Colleagues",  
    url: "/colleagues",
    icon: Users,
  },

  {
  title: "Calendar",
  url: "/calendar",
  icon: CalendarIcon, // ya tienes este icono importado
},
  {
    title: "Calculator",
    url: "/calculator",
    icon: Calculator,
  },
  {
    title: "Favorites",
    url: "/favorites",
    icon: Star,
  },
  {
    title: "History",
    url: "/history",
    icon: History,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  { 
    title: "Logout", 
    url: "/logout", 
    icon: LogOut,
  }
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>MeDico</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}