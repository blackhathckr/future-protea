import { useState } from "react"
import { motion } from "framer-motion"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { ThemeDrawer, ThemeDrawerTrigger } from "@/components/theme-drawer"
import { NotificationBell } from "@/components/notification-bell"

interface SiteHeaderProps {
  title?: string
}

export function SiteHeader({ title = "Dashboard" }: SiteHeaderProps) {
  const [themeDrawerOpen, setThemeDrawerOpen] = useState(false)

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

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="h-5 w-5" />
          </Button>

          <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-6 hidden sm:block" />

          <NotificationBell />
          <ThemeToggle />
          <ThemeDrawerTrigger onClick={() => setThemeDrawerOpen(true)} />
          <ThemeDrawer open={themeDrawerOpen} onOpenChange={setThemeDrawerOpen} />
        </div>
      </div>
    </header>
  )
}
