import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/protea_header.dart';
import '../players/players_home_screen.dart';
import '../teams/teams_home_screen.dart';
import '../matches/match_home_screen.dart';
import '../tournaments/tournament_home_screen.dart';
import '../profile/profile_screen.dart';
import '../auth/login_screen.dart';
import '../viewer/viewer_home_screen.dart';
import '../player_profile/player_home.dart';
import '../feeder/feeder_home.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final role = auth.role;

    // Not authenticated — send back to login
    if (!auth.isLoggedIn || role.isEmpty) {
      return const LoginScreen();
    }

    // Show player-focused screen for players
    if (role == 'player') {
      return const PlayerHome();
    }

    // Show viewer-focused screen for viewers
    if (role == 'viewer') {
      return const ViewerHomeScreen();
    }

    // Show feeder-focused screen for feeders
    if (role == 'feeder') {
      return const FeederHome();
    }
    
    final userName = auth.user?.name.split(' ').first ?? 'User';
    final isViewer = role == 'viewer';

    return Scaffold(
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            // Header with logo
            Stack(
              children: [
                const ProteaHeader(height: 185),
                // Profile avatar on left
                Positioned(
                  top: MediaQuery.of(context).padding.top + 8,
                  left: 8,
                  child: GestureDetector(
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ProfileScreen()),
                    ),
                    child: Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppTheme.accentGold,
                          width: 3,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.2),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: CircleAvatar(
                        radius: 24,
                        backgroundColor: Colors.white,
                        backgroundImage: auth.user?.photoUrl != null && auth.user!.photoUrl!.isNotEmpty
                            ? NetworkImage(ApiService.getPhotoUrl(auth.user!.photoUrl!))
                            : null,
                        child: auth.user?.photoUrl == null || auth.user!.photoUrl!.isEmpty
                            ? Text(
                                userName[0].toUpperCase(),
                                style: GoogleFonts.poppins(
                                  color: AppTheme.primaryGreen,
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                              )
                            : null,
                      ),
                    ),
                  ),
                ),
                // Theme toggle and logout on right
                Positioned(
                  top: MediaQuery.of(context).padding.top + 8,
                  right: 8,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Consumer<ThemeProvider>(
                        builder: (context, theme, _) => IconButton(
                          icon: Icon(
                            theme.isDark ? Icons.light_mode : Icons.dark_mode,
                            color: Colors.white,
                          ),
                          tooltip: theme.isDark ? 'Switch to light mode' : 'Switch to dark mode',
                          onPressed: () => theme.toggle(),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.logout, color: Colors.white),
                        onPressed: () => _confirmLogout(context),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            // Greeting
            Padding(
              padding: const EdgeInsets.only(top: 8, bottom: 4),
              child: Text(
                'Hi $userName,',
                style: GoogleFonts.poppins(
                  fontSize: 26,
                  fontWeight: FontWeight.w700,
                  color: Theme.of(context).textTheme.bodyLarge?.color,
                ),
              ),
            ),
            // Role badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: _roleColor(role).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                _roleLabel(role),
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: _roleColor(role),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Menu buttons
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  children: [
                    _MenuButton(
                      label: 'PLAYER',
                      icon: Icons.person,
                      color: AppTheme.buttonGreen,
                      textColor: Colors.white,
                      subtitle: isViewer ? 'View players' : 'View, add & edit players',
                      onTap: () => Navigator.push(context,
                          MaterialPageRoute(builder: (_) => const PlayersHomeScreen())),
                    ),
                    const SizedBox(height: 14),
                    _MenuButton(
                      label: 'TEAM',
                      icon: Icons.shield,
                      color: AppTheme.buttonYellow,
                      textColor: AppTheme.textPrimary,
                      subtitle: isViewer ? 'View teams' : 'Manage teams',
                      onTap: () => Navigator.push(context,
                          MaterialPageRoute(builder: (_) => const TeamsHomeScreen())),
                    ),
                    const SizedBox(height: 14),
                    _MenuButton(
                      label: 'MATCH',
                      icon: Icons.sports_cricket,
                      color: AppTheme.buttonGreen,
                      textColor: Colors.white,
                      subtitle: isViewer ? 'View matches' : 'Create & score matches',
                      onTap: () => Navigator.push(context,
                          MaterialPageRoute(builder: (_) => const MatchHomeScreen())),
                    ),
                    const SizedBox(height: 14),
                    _MenuButton(
                      label: 'TOURNAMENT',
                      icon: Icons.emoji_events,
                      color: AppTheme.buttonYellow,
                      textColor: AppTheme.textPrimary,
                      subtitle: isViewer ? 'View tournaments' : 'Manage tournaments',
                      onTap: () => Navigator.push(context,
                          MaterialPageRoute(builder: (_) => const TournamentHomeScreen())),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _roleColor(String role) {
    switch (role) {
      case 'feeder': return AppTheme.primaryGreen;
      case 'player': return AppTheme.upcomingBlue;
      case 'viewer': return AppTheme.accentAmber;
      default: return AppTheme.textSecondary;
    }
  }

  String _roleLabel(String role) {
    switch (role) {
      case 'feeder': return 'Score Feeder';
      case 'player': return 'Player';
      case 'viewer': return 'Viewer';
      default: return role;
    }
  }

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final navigator = Navigator.of(context);
              navigator.popUntil((route) => route.isFirst);
              await context.read<AuthProvider>().logout();
            },
            child: const Text('Logout', style: TextStyle(color: AppTheme.wicketRed)),
          ),
        ],
      ),
    );
  }
}

class _MenuButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final Color textColor;
  final String? subtitle;
  final VoidCallback onTap;

  const _MenuButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.textColor,
    this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 64,
      child: ElevatedButton(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: textColor,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 3,
          padding: const EdgeInsets.symmetric(horizontal: 24),
        ),
        child: Row(
          children: [
            Icon(icon, size: 28, color: textColor),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 2,
                      color: textColor,
                    ),
                  ),
                  if (subtitle != null)
                    Text(
                      subtitle!,
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        color: textColor.withValues(alpha: 0.7),
                      ),
                    ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: textColor.withValues(alpha: 0.6)),
          ],
        ),
      ),
    );
  }
}
