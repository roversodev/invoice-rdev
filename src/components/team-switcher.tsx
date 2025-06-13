"use client"

import * as React from "react"
import { ChevronsUpDown, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAppContext } from "@/contexts/app-context"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { CreateCompanyModal } from "@/components/create-company-modal"

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string
    logo: React.ElementType
    plan: string
    id?: string
  }[]
}) {
  const { isMobile } = useSidebar()
  const { switchCompany, currentCompany } = useAppContext()
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = React.useState(false)

  // Encontrar o time ativo baseado na empresa atual
  const activeTeam = React.useMemo(() => {
    if (currentCompany && teams.length > 0) {
      const foundTeam = teams.find(team => team.id === currentCompany.id)
      return foundTeam || teams[0]
    }
    return teams[0]
  }, [currentCompany, teams])

  if (!activeTeam) {
    return null
  }

  const handleTeamSwitch = async (team: typeof teams[0]) => {
    if (team.id && team.id !== currentCompany?.id) {
      console.log('Switching from', currentCompany?.name, 'to', team.name)
      await switchCompany(team.id)
      // Atualizar a página após trocar de empresa
      router.refresh()
    }
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <activeTeam.logo className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{activeTeam.name}</span>
                  <span className="truncate text-xs">{activeTeam.plan}</span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Empresas
              </DropdownMenuLabel>
              {teams.map((team, index) => (
                <DropdownMenuItem
                  key={team.id || team.name}
                  onClick={() => handleTeamSwitch(team)}
                  className={`gap-2 p-2 ${
                    team.id === currentCompany?.id ? 'bg-accent' : ''
                  }`}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <team.logo className="size-3.5 shrink-0" />
                  </div>
                  {team.name}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="gap-2 p-2"
                onClick={() => setShowCreateModal(true)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">Criar empresa</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <CreateCompanyModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
      />
    </>
  )
}
