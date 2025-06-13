"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppProvider, useAppContext } from "@/contexts/app-context";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header fixo com SidebarTrigger e ThemeToggleButton */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />

          {/* Espaço flexível para empurrar o ThemeToggleButton para a direita */}
          <div className="flex-1" />

          {/* ThemeToggleButton na direita */}
          <ThemeToggleButton variant="circle-blur" start="top-right" />
        </header>

        {/* Conteúdo das páginas */}
        <div className="flex-1 overflow-auto">
          <AppProvider>
            {children}
          </AppProvider>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}