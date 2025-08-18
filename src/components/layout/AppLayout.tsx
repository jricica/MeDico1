import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fine } from "@/lib/fine";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Calculator, 
  History, 
  Home, 
  LogOut, 
  Menu, 
  Settings, 
  Star, 
  Stethoscope, 
  X 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const { data: session } = fine.auth.useSession();

  const navItems = [
    { name: "Dashboard", path: "/", icon: Home },
    { name: "Operations", path: "/operations", icon: Stethoscope },
    { name: "Calculator", path: "/calculator", icon: Calculator },
    { name: "Favorites", path: "/favorites", icon: Star },
    { name: "History", path: "/history", icon: History },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar for desktop */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-primary text-primary-foreground transition-transform duration-300 ease-in-out",
          isMobile ? (sidebarOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center space-x-2">
            <Stethoscope className="h-6 w-6" />
            <span className="text-xl font-bold">MeDico</span>
          </Link>
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        <nav className="mt-6 px-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
                    location.pathname === item.path
                      ? "bg-primary-foreground text-primary"
                      : "hover:bg-primary-foreground/10"
                  )}
                  onClick={isMobile ? toggleSidebar : undefined}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/logout"
                className="flex items-center rounded-md px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-primary-foreground/10"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </Link>
            </li>
          </ul>
        </nav>
        
        {session?.user && (
          <div className="absolute bottom-0 left-0 right-0 border-t border-primary-foreground/10 p-4">
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground text-primary">
                {session.user.name?.charAt(0) || "U"}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{session.user.name}</p>
                <p className="text-xs opacity-70">{session.user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className={cn(
        "flex flex-1 flex-col",
        !isMobile && "ml-64"
      )}>
        {/* Mobile header */}
        {isMobile && (
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                <Menu className="h-5 w-5" />
              </Button>
              <span className="ml-3 text-lg font-bold">MeDico</span>
            </div>
          </header>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50" 
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}