import type { Metadata } from "next"
import { Sora } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Sora({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Invoice Roverso",
  description: "Sistema de gestão de orçamentos ou faturas para freelancers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning
        className={`${geistSans.variable} antialiased`}
      >
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
          >
          {children}
          <Toaster />
          </ThemeProvider>
      </body>
    </html>
  );
}
