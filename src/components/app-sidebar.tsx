import * as React from "react"
import {
  FileText,
  Users,
  PlusCircle,
  BarChart3,
  Settings,
  Home,
  Clock,
  DollarSign,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAppContext } from "@/contexts/app-context"


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, profile, companies, loading } = useAppContext()

  // Prepare user data for NavUser component
  const userData = {
    name: profile?.full_name || user?.email?.split('@')[0] || 'Usuário',
    email: user?.email || '',
    avatar: profile?.avatar_url || '',
  }

  // Prepare teams data from companies - with fallback data
  const teamsData = companies && companies.length > 0 
    ? companies.map(company => ({
        name: company.name,
        logo: Home,
        plan: "Enterprise",
        id: company.id  // Adicionar o ID da empresa
      }))
    : [
        {
          name: "Carregando...",
          logo: Home,
          plan: "...",
        }
      ]

  const data = {
    teams: teamsData,
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
        isActive: true,
        items: [
          {
            title: "Ir para o dashboard",
            url: "/dashboard",
          },
        ],
      },
      {
        title: "Faturas",
        url: "/invoices",
        icon: FileText,
        items: [
          {
            title: "Todas as Faturas",
            url: "/invoices",
          },
          {
            title: "Nova Fatura",
            url: "/invoices/new",
          },
        ],
      },
      {
        title: "Clientes",
        url: "/clients",
        icon: Users,
        items: [
          {
            title: "Todos os Clientes",
            url: "/clients",
          },
        ],
      },
      {
        title: "Relatórios",
        url: "/reports",
        icon: BarChart3,
      },
      {
        title: "Configurações",
        url: "/settings",
        icon: Settings,
        items: [
          {
            title: "Geral",
            url: "/settings",
          },
          {
            title: "Empresa",
            url: "/settings/company",
          },
          {
            title: "Faturamento",
            url: "/settings/billing",
          },
        ],
      },
    ],
    projects: [
      {
        name: "Ações Rápidas",
        url: "#",
        icon: PlusCircle,
      },
      {
        name: "Faturas Pendentes",
        url: "/invoices?status=pending",
        icon: Clock,
      },
      {
        name: "Receita do Mês",
        url: "/reports/monthly",
        icon: DollarSign,
      },
    ],
  }
  // Add loading state check
  if (loading) {
    return (
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <div className="p-4">Carregando...</div>
        </SidebarHeader>
      </Sidebar>
    )
  }

  console.log('companies:', companies)
  console.log('teams:', data.teams)
  
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
