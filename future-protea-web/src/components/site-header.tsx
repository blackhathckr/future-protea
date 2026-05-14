import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { ThemeDrawer, ThemeDrawerTrigger } from "@/components/theme-drawer"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { NotificationService } from "@/services/notification.service"

interface SiteHeaderProps {
  title?: string
}

export function SiteHeader({ title = "Dashboard" }: SiteHeaderProps) {
  const navigate = useNavigate()
  const [themeDrawerOpen, setThemeDrawerOpen] = useState(false)

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await NotificationService.getUnreadCount()
      return res.data?.count ?? 0
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />

        <motion.h1
          className="text-lg font-semibold hidden sm:block"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          key={title}
        >
          {title}
        </motion.h1>

        {/* Search bar */}
        {/* <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users, courses, sessions..."
              className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
        </div> */}

        <div className="ml-auto flex items-center gap-2">
          {/* Mobile search */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="h-5 w-5" />
          </Button>

          <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-6 hidden sm:block" />

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Theme customization drawer */}
          <ThemeDrawerTrigger onClick={() => setThemeDrawerOpen(true)} />
          <ThemeDrawer open={themeDrawerOpen} onOpenChange={setThemeDrawerOpen} />
        </div>
      </div>
    </header>
  )
}
