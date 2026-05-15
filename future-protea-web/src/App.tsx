/**
 * @fileoverview Future Protea Cricket Admin Application
 * @module App
 *
 * @description
 * Root component with routing, providers, and layout.
 * Cricket management admin panel.
 */

import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Toaster } from '@/components/ui/sonner';

// ─────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────
import { LoginPage } from '@/Auth';

// ─────────────────────────────────────────────────────────────
// Cricket Admin Screens (lazy loaded)
// ─────────────────────────────────────────────────────────────
import { DashboardPage } from '@/Admin/Dashboard/DashboardPage';
import { MatchesPage } from '@/Admin/Matches';
import { CreateMatchPage } from '@/Admin/Matches/CreateMatchPage';
import { MatchDetailsPage } from '@/Admin/Matches/MatchDetailsPage';
import { EditMatchPage } from '@/Admin/Matches/EditMatchPage';
import { LiveScoringPage } from '@/Admin/Matches/LiveScoringPage';
import { TossPage } from '@/Admin/Matches/TossPage';
import { StartMatchPage } from '@/Admin/Matches/StartMatchPage';
import { SelectPlayingXIPage } from '@/Admin/Matches/SelectPlayingXIPage';
import { TournamentsPage } from '@/Admin/Tournaments';
import { CreateTournamentPage } from '@/Admin/Tournaments/CreateTournamentPage';
import { EditTournamentPage } from '@/Admin/Tournaments/EditTournamentPage';
import { TournamentDetailsPage } from '@/Admin/Tournaments/TournamentDetailsPage';
import { TournamentBracketPage } from '@/Admin/Tournaments/TournamentBracketPage';
import { TeamsPage } from '@/Admin/Teams';
import { CreateTeamPage } from '@/Admin/Teams/CreateTeamPage';
import { EditTeamPage } from '@/Admin/Teams/EditTeamPage';
import { TeamDetailsPage } from '@/Admin/Teams/TeamDetailsPage';
import { PlayersPage } from '@/Admin/Players';
import { RegisterPlayerPage } from '@/Admin/Players/RegisterPlayerPage';
import { EditPlayerPage } from '@/Admin/Players/EditPlayerPage';
import { PlayerJourneyPage } from '@/Admin/Players/PlayerJourneyPage';
import { ReportsPage } from '@/Admin/Reports';
import { AnalyticsPage } from '@/Admin/Analytics';
import { UserManagementPage } from '@/Admin/UserManagement';
import { RolesPermissionsPage } from '@/Admin/UserManagement/roles-page';
import { SystemSettingsPage } from '@/Admin/SystemSettings';
import { SupportPage } from '@/Admin/Support';
import { AnnouncementsPage } from '@/Admin/Announcements';
import { NotificationsPage } from '@/Admin/Notifications';
import { AdminProfilePage } from '@/Admin/AdminProfile';

// ─────────────────────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────────────────────

function AdminLayout({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <SidebarProvider
      style={{
        '--sidebar-width': '16rem',
        '--header-height': '3.5rem',
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title={title} />
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function ProtectedPage({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <ProtectedRoute>
      <AdminLayout title={title}>{children}</AdminLayout>
    </ProtectedRoute>
  );
}


// ─────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          }>
          <Routes>
            {/* Auth */}
            <Route path="/" element={<LoginPage />} />

            {/* Cricket Admin Screens */}
            <Route path="/dashboard" element={<ProtectedPage title="Dashboard"><DashboardPage /></ProtectedPage>} />
            
            {/* Matches */}
            <Route path="/matches" element={<ProtectedPage title="Matches"><MatchesPage /></ProtectedPage>} />
            <Route path="/matches/create" element={<ProtectedPage title="Create Match"><CreateMatchPage /></ProtectedPage>} />
            <Route path="/matches/:id" element={<ProtectedPage title="Match Details"><MatchDetailsPage /></ProtectedPage>} />
            <Route path="/matches/:id/edit" element={<ProtectedPage title="Edit Match"><EditMatchPage /></ProtectedPage>} />
            <Route path="/matches/:id/toss" element={<ProtectedPage title="Toss"><TossPage /></ProtectedPage>} />
            <Route path="/matches/:id/start" element={<ProtectedPage title="Start Match"><StartMatchPage /></ProtectedPage>} />
            <Route path="/matches/:id/playing-xi" element={<ProtectedPage title="Playing XI"><SelectPlayingXIPage /></ProtectedPage>} />
            <Route path="/matches/:id/score" element={<ProtectedPage title="Live Scoring"><LiveScoringPage /></ProtectedPage>} />

            {/* Tournaments */}
            <Route path="/tournaments" element={<ProtectedPage title="Tournaments"><TournamentsPage /></ProtectedPage>} />
            <Route path="/tournaments/create" element={<ProtectedPage title="Create Tournament"><CreateTournamentPage /></ProtectedPage>} />
            <Route path="/tournaments/:id" element={<ProtectedPage title="Tournament Details"><TournamentDetailsPage /></ProtectedPage>} />
            <Route path="/tournaments/:id/edit" element={<ProtectedPage title="Edit Tournament"><EditTournamentPage /></ProtectedPage>} />
            <Route path="/tournaments/:id/bracket" element={<ProtectedPage title="Tournament Bracket"><TournamentBracketPage /></ProtectedPage>} />
            
            {/* Teams */}
            <Route path="/teams" element={<ProtectedPage title="Teams"><TeamsPage /></ProtectedPage>} />
            <Route path="/teams/create" element={<ProtectedPage title="Create Team"><CreateTeamPage /></ProtectedPage>} />
            <Route path="/teams/:id" element={<ProtectedPage title="Team Details"><TeamDetailsPage /></ProtectedPage>} />
            <Route path="/teams/:id/edit" element={<ProtectedPage title="Edit Team"><EditTeamPage /></ProtectedPage>} />
            
            {/* Players */}
            <Route path="/players" element={<ProtectedPage title="Players"><PlayersPage /></ProtectedPage>} />
            <Route path="/players/register" element={<ProtectedPage title="Register Player"><RegisterPlayerPage /></ProtectedPage>} />
            <Route path="/players/:id/journey" element={<ProtectedPage title="Player Journey"><PlayerJourneyPage /></ProtectedPage>} />
            <Route path="/players/:id/edit" element={<ProtectedPage title="Edit Player"><EditPlayerPage /></ProtectedPage>} />
            
            {/* Analytics & Reports */}
            <Route path="/analytics" element={<ProtectedPage title="Analytics"><AnalyticsPage /></ProtectedPage>} />
            <Route path="/reports" element={<ProtectedPage title="Reports"><ReportsPage /></ProtectedPage>} />
            
            {/* User Management */}
            <Route path="/users" element={<ProtectedPage title="User Management"><UserManagementPage /></ProtectedPage>} />
            <Route path="/roles" element={<ProtectedPage title="Roles & Permissions"><RolesPermissionsPage /></ProtectedPage>} />
            
            {/* Communication */}
            <Route path="/announcements" element={<ProtectedPage title="Announcements"><AnnouncementsPage /></ProtectedPage>} />
            <Route path="/notifications" element={<ProtectedPage title="Notifications"><NotificationsPage /></ProtectedPage>} />
            
            {/* Profile */}
            <Route path="/profile" element={<ProtectedPage title="My Profile"><AdminProfilePage /></ProtectedPage>} />

            {/* Support & Settings */}
            <Route path="/support" element={<ProtectedPage title="Support"><SupportPage /></ProtectedPage>} />
            <Route path="/settings" element={<ProtectedPage title="System Settings"><SystemSettingsPage /></ProtectedPage>} />

            {/* Fallback */}
            <Route path="*" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
          </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
