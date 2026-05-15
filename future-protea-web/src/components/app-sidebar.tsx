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
            {/* Wrapper keeps the same h-12 footprint as the original layout so
                the sidebar header / nav below stays in place. The image is
                absolutely positioned and scaled up so it visually overflows
                the wrapper without affecting siblings. */}
            <div className="relative flex items-center justify-center h-12 overflow-visible">
              <img
                src="/images/web_logo.png"
                alt="Future Protea"
                className="absolute inset-0 m-auto h-12 w-auto scale-[2.6] origin-center pointer-events-none"
              />
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
