import { motion } from "framer-motion"
import { useLocation, Link } from "react-router-dom"
import { type Icon } from "@tabler/icons-react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

type NavItem = {
  title: string
  url: string
  icon?: Icon
  items?: { title: string; url: string; icon?: Icon }[]
}

export function NavMain({ items }: { items: NavItem[] }) {
  const location = useLocation()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item, index) => {
            const isActive = location.pathname === item.url
            const hasSubItems = item.items && item.items.length > 0
            const isSubActive = hasSubItems && item.items!.some((sub) => location.pathname === sub.url)

            if (hasSubItems) {
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <Collapsible defaultOpen={isActive || isSubActive} className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          className={cn(
                            "transition-all duration-200",
                            (isActive || isSubActive) && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                          )}
                        >
                          {item.icon && (
                            <item.icon
                              className={cn(
                                "transition-colors",
                                (isActive || isSubActive) ? "text-primary-foreground" : "text-muted-foreground"
                              )}
                            />
                          )}
                          <span className="font-medium">{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items!.map((subItem) => {
                            const isSubItemActive = location.pathname === subItem.url
                            return (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isSubItemActive}
                                >
                                  <Link to={subItem.url}>
                                    {subItem.icon && <subItem.icon className="text-muted-foreground" />}
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            )
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                </motion.div>
              )
            }

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className={cn(
                      "transition-all duration-200",
                      isActive && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    )}
                  >
                    <Link to={item.url}>
                      {item.icon && (
                        <item.icon
                          className={cn(
                            "transition-colors",
                            isActive ? "text-primary-foreground" : "text-muted-foreground"
                          )}
                        />
                      )}
                      <span className="font-medium">{item.title}</span>
                      {isActive && (
                        <motion.div
                          layoutId="active-nav-indicator"
                          className="absolute right-2 h-2 w-2 rounded-full bg-primary-foreground"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
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
