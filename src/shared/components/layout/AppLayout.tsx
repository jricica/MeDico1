// src/shared/components/layout/AppLayout.tsx

import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from "@/shared/components/ui/sidebar";
import { AppSidebar } from "@/shared/components/layout/Sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header con el botón para abrir/cerrar sidebar */}
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center px-4">
              <SidebarTrigger />
              <div className="ml-4 flex-1">
                <h2 className="text-lg font-semibold">MeDico</h2>
              </div>
            </div>
          </header>

          {/* Main content con padding bottom para el sticky banner */}
          <main className="flex-1 container mx-auto px-4 py-6 pb-20 md:pb-16">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}