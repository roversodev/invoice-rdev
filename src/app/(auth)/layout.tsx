import { AppProvider } from "@/contexts/app-context";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <AppProvider>
      {children}
      </AppProvider>
    </div>
  );
}