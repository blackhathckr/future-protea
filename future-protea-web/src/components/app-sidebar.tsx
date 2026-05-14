/**
 * @fileoverview Cricket Admin Sidebar Navigation
 * @module components/app-sidebar
 *
 * @description
 * Cricket management admin navigation sidebar.
 */

import * as React from 'react';
import { useMemo } from 'react';

import {
  IconDashboard,
  IconTrophy,
  IconCalendar,
  IconShield,
  IconUsers,
  IconUser,
  IconChartBar,
  IconFileAnalytics,
  IconUserCog,
  IconLock,
  IconSettings,
  IconHelp,
  IconBell,
  IconSpeakerphone,
} from '@tabler/icons-react';

import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';

type NavItem = {
  title: string
  url: string
  icon?: React.ComponentType<any>
  items?: { title: string; url: string }[]
}

type SecondaryNavItem = {
  title: string
  url: string
  icon: React.ComponentType<any>
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', url: '/dashboard', icon: IconDashboard },
  { title: 'Matches', url: '/matches', icon: IconTrophy },
  { title: 'Tournaments', url: '/tournaments', icon: IconCalendar },
  { title: 'Teams', url: '/teams', icon: IconShield },
  { title: 'Players', url: '/players', icon: IconUsers },
  { title: 'Analytics', url: '/analytics', icon: IconChartBar },
  { title: 'Reports', url: '/reports', icon: IconFileAnalytics },
  { title: 'User Management', url: '/users', icon: IconUserCog },
  { title: 'Roles & Permissions', url: '/roles', icon: IconLock },
  { title: 'Announcements', url: '/announcements', icon: IconSpeakerphone },
  { title: 'Support', url: '/support', icon: IconHelp },
  { title: 'Notifications', url: '/notifications', icon: IconBell },
  { title: 'System Settings', url: '/settings', icon: IconSettings },
];

const secondaryNavItems: SecondaryNavItem[] = [
  { title: 'My Profile', url: '/profile', icon: IconUser },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  const userData = {
    name: user?.name ?? 'Admin',
    email: user?.email ?? '',
    avatar: '/avatars/user.jpg',
  };

  // All nav items are visible for cricket admin
  const filteredMainNav = useMemo(() => mainNavItems, []);
  const filteredSecondaryNav = useMemo(() => secondaryNavItems, []);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 p-2">
              <img src="/Future_Protea_Logo.png" alt="Future Protea" className="h-10 w-10" />
              <div className="text-lg font-bold text-primary">Future Protea</div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <NavMain items={filteredMainNav} />
        <SidebarSeparator className="my-2" />
        <NavSecondary items={filteredSecondaryNav} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
