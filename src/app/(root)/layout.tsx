'use client'

import { AppProvider } from "@/contexts/app-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      {children}
    </AppProvider>
  );
}