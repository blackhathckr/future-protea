import * as React from "react"
import { motion } from "framer-motion"
import { Link, useLocation } from "react-router-dom"
import { type Icon } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  className,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: Icon
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const location = useLocation()

  return (
    <SidebarGroup className={className} {...props}>
      <SidebarGroupLabel>Account</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item, index) => {
            const isActive = location.pathname === item.url
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className={cn(
                      "transition-all duration-200",
                      isActive && "bg-accent text-accent-foreground"
                    )}
                  >
                    <Link to={item.url}>
                      <item.icon className={cn("text-muted-foreground", isActive && "text-primary")} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </motion.div>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
