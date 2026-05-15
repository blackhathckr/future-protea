// =============================================================================
// COACH / TEAM SELECTOR HOME
// =============================================================================
// Read-only role per BRD §6.7 + user story US-08:
//   • Stats, Super Stars, Scorecard, Player Profile / Career Stats
//   • Cricinfo-style terminology: Wagon Wheel, Run Rate, Strike Rate, Economy
//   • No scoring or editing actions.
//
// The coach lands on a bottom-nav with four sections that map directly to the
// BRD-listed "Screens owned":
//   1. Matches  → tap a match → MatchDetailScreen exposes Stats / Stars /
//      Scorecard / Balls tabs (incl. Wagon Wheel).
//   2. Players  → tap a player → PlayerDetailScreen shows career aggregates.
//   3. Teams    → squad-level stats.
//   4. Tournaments → competition-wide top performers.
// =============================================================================

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../models/match.dart';
import '../../services/api_service.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import '../../shared/widgets/loading_state.dart';
import '../../shared/widgets/empty_state.dart';
import '../../widgets/notification_bell.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/theme_toggle.dart';
import '../auth/login_screen.dart';
import '../players/players_home_screen.dart';
import '../teams/teams_home_screen.dart';
import '../tournaments/tournament_home_screen.dart';
import '../viewer/match_detail_screen.dart';
import '../profile/profile_screen.dart';

class CoachHome extends StatefulWidget {
  const CoachHome({super.key});

  @override
  State<CoachHome> createState() => _CoachHomeState();
}

class _CoachHomeState extends State<CoachHome> {
  int _navIndex = 0;

  @override
  Widget build(BuildContext context) {
    final isDark = AppTheme.isDark(context);

    return Scaffold(
      bottomNavigationBar: NavigationBar(
        selectedIndex: _navIndex,
        onDestinationSelected: (i) => setState(() => _navIndex = i),
        backgroundColor: isDark ? AppTheme.darkCardBg : Colors.white,
        indicatorColor: AppTheme.upcomingBlue.withValues(alpha: 0.15),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        height: 70,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.insights_outlined),
            selectedIcon: Icon(Icons.insights, color: AppTheme.upcomingBlue),
            label: 'Analytics',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people, color: AppTheme.upcomingBlue),
            label: 'Players',
          ),
          NavigationDestination(
            icon: Icon(Icons.shield_outlined),
            selectedIcon: Icon(Icons.shield, color: AppTheme.upcomingBlue),
            label: 'Teams',
          ),
          NavigationDestination(
            icon: Icon(Icons.emoji_events_outlined),
            selectedIcon:
                Icon(Icons.emoji_events, color: AppTheme.upcomingBlue),
            label: 'Tournaments',
          ),
        ],
      ),
      body: SafeArea(
        top: false,
        child: IndexedStack(
          index: _navIndex,
          children: const [
            _CoachAnalyticsTab(),
            PlayersHomeScreen(),
            TeamsHomeScreen(),
            TournamentHomeScreen(),
          ],
        ),
      ),
    );
  }
}

// =============================================================================
// ANALYTICS TAB — landing page that exposes the screens the BRD lists as
// "owned" by the Coach: Stats / Super Stars / Scorecard / Player Profile.
// =============================================================================

class _CoachAnalyticsTab extends StatefulWidget {
  const _CoachAnalyticsTab();

  @override
  State<_CoachAnalyticsTab> createState() => _CoachAnalyticsTabState();
}

class _CoachAnalyticsTabState extends State<_CoachAnalyticsTab> {
  List<CricketMatch> _live = [];
  List<CricketMatch> _completed = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        ApiService.getMatches(status: 'live'),
        ApiService.getMatches(status: 'completed'),
      ]);
      _live = results[0];
      _completed = results[1].take(20).toList();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final userName = auth.user?.name.split(' ').first ?? 'Coach';

    return Column(
      children: [
        // ── Header ─────────────────────────────────────────────────────
        Stack(
          children: [
            const ProteaHeader(height: 150),
            Positioned(
              top: MediaQuery.of(context).padding.top + 6,
              left: 8,
              child: GestureDetector(
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const ProfileScreen()),
                ),
                child: Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border:
                        Border.all(color: AppTheme.accentGold, width: 2.5),
                  ),
                  child: CircleAvatar(
                    radius: 22,
                    backgroundColor: Colors.white,
                    backgroundImage: auth.user?.photoUrl != null &&
                            auth.user!.photoUrl!.isNotEmpty
                        ? NetworkImage(
                            ApiService.getPhotoUrl(auth.user!.photoUrl!))
                        : null,
                    child: auth.user?.photoUrl == null ||
                            auth.user!.photoUrl!.isEmpty
                        ? Text(
                            userName[0].toUpperCase(),
                            style: GoogleFonts.poppins(
                              color: AppTheme.primaryGreen,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          )
                        : null,
                  ),
                ),
              ),
            ),
            Positioned(
              top: MediaQuery.of(context).padding.top + 6,
              right: 4,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const NotificationBell(iconSize: 22),
                  const ThemeToggleButton(),
                  IconButton(
                    icon: const Icon(Icons.logout,
                        color: Colors.white, size: 22),
                    onPressed: () => _confirmLogout(context),
                  ),
                ],
              ),
            ),
          ],
        ),

        // ── Greeting + role pill ───────────────────────────────────────
        Padding(
          padding: const EdgeInsets.only(top: 4, bottom: 6),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Hi $userName',
                  style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.tp(context))),
              const SizedBox(width: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF1976D2), Color(0xFF0D47A1)],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text('COACH',
                    style: GoogleFonts.poppins(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                        letterSpacing: 0.5)),
              ),
            ],
          ),
        ),

        // ── Body ───────────────────────────────────────────────────────
        Expanded(
          child: _loading
              ? const LoadingState(label: 'Loading match analytics…')
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                    children: [
                      _SectionTitle(
                        title: 'Analytics modules',
                        subtitle:
                            'Wagon Wheel, Run Rate, Top Scorers, Super Stars, Career Stats',
                      ),
                      const SizedBox(height: 8),
                      _modulesGrid(context),
                      const SizedBox(height: 22),

                      if (_live.isNotEmpty) ...[
                        _SectionTitle(
                          title: 'Live now',
                          subtitle:
                              'Open a live match to view Stats, Super Stars, Scorecard, Balls',
                        ),
                        const SizedBox(height: 8),
                        ..._live.map((m) => _MatchAnalyticsTile(
                              match: m,
                              live: true,
                              onTap: () => _openMatch(m),
                            )),
                        const SizedBox(height: 22),
                      ],

                      _SectionTitle(
                        title: 'Recent matches',
                        subtitle:
                            'Review past matches for debrief & selection',
                      ),
                      const SizedBox(height: 8),
                      if (_completed.isEmpty)
                        const EmptyState(
                          message: 'No completed matches yet',
                          subtitle:
                              'Match reviews will appear here once a result is final.',
                        )
                      else
                        ..._completed.map((m) => _MatchAnalyticsTile(
                              match: m,
                              live: false,
                              onTap: () => _openMatch(m),
                            )),
                    ],
                  ),
                ),
        ),
      ],
    );
  }

  Widget _modulesGrid(BuildContext context) {
    final modules = <_Module>[
      _Module(
        title: 'Stats',
        subtitle: 'Run Rate · Wagon Wheel · Top Scorers · Extras',
        icon: Icons.bar_chart_rounded,
        color: AppTheme.upcomingBlue,
        onTap: () => _scrollToLive(context),
      ),
      _Module(
        title: 'Super Stars',
        subtitle: 'Composite Bat · Bowl · Field ranking',
        icon: Icons.star_rounded,
        color: AppTheme.accentAmber,
        onTap: () => _scrollToLive(context),
      ),
      _Module(
        title: 'Scorecard',
        subtitle: 'Batting · Bowling · Fall of Wickets · Partnerships',
        icon: Icons.assignment_outlined,
        color: AppTheme.primaryGreen,
        onTap: () => _scrollToLive(context),
      ),
      _Module(
        title: 'Player Profiles',
        subtitle: 'Career aggregates · Statsguru-style',
        icon: Icons.person_search_rounded,
        color: AppTheme.team2Color,
        onTap: () {
          // Hand off to Players tab (handled by parent bottom-nav).
          final state =
              context.findAncestorStateOfType<_CoachHomeState>();
          state?.setState(() => state._navIndex = 1);
        },
      ),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.35,
      ),
      itemCount: modules.length,
      itemBuilder: (_, i) {
        final m = modules[i];
        return Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: m.onTap,
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.surface(context),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: m.color.withValues(alpha: 0.25),
                ),
                boxShadow: [
                  BoxShadow(
                    color: m.color.withValues(alpha: 0.08),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: m.color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(m.icon, color: m.color, size: 22),
                  ),
                  const SizedBox(height: 6),
                  Text(m.title,
                      style: GoogleFonts.poppins(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.tp(context))),
                  Text(m.subtitle,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.poppins(
                          fontSize: 11,
                          color: AppTheme.ts(context),
                          height: 1.3)),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _scrollToLive(BuildContext context) {
    if (_live.isNotEmpty) {
      _openMatch(_live.first);
    } else if (_completed.isNotEmpty) {
      _openMatch(_completed.first);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text(
                'No matches to open yet. Analytics will appear once a match starts.')),
      );
    }
  }

  void _openMatch(CricketMatch m) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => MatchDetailScreen(matchId: m.id),
      ),
    );
  }

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final navigator = Navigator.of(context);
              navigator.pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
              await context.read<AuthProvider>().logout();
            },
            child: const Text('Logout',
                style: TextStyle(color: AppTheme.wicketRed)),
          ),
        ],
      ),
    );
  }
}

// =============================================================================
// SUPPORTING WIDGETS
// =============================================================================

class _Module {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  _Module({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onTap,
  });
}

class _SectionTitle extends StatelessWidget {
  final String title;
  final String? subtitle;
  const _SectionTitle({required this.title, this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title,
            style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppTheme.tp(context))),
        if (subtitle != null) ...[
          const SizedBox(height: 2),
          Text(subtitle!,
              style: GoogleFonts.poppins(
                  fontSize: 11, color: AppTheme.ts(context))),
        ],
      ],
    );
  }
}

class _MatchAnalyticsTile extends StatelessWidget {
  final CricketMatch match;
  final bool live;
  final VoidCallback onTap;
  const _MatchAnalyticsTile({
    required this.match,
    required this.live,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final result =
        match.winner != null ? '${match.winner} won' : 'Result pending';
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: AppTheme.surface(context),
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: live
                    ? AppTheme.liveRed.withValues(alpha: 0.4)
                    : Colors.black.withValues(alpha: 0.06),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: live
                        ? AppTheme.liveRed
                        : AppTheme.primaryGreen.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    live ? 'LIVE' : 'DONE',
                    style: GoogleFonts.poppins(
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                        color:
                            live ? Colors.white : AppTheme.primaryGreen,
                        letterSpacing: 0.8),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${match.team1Name} vs ${match.team2Name}',
                          style: GoogleFonts.poppins(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.tp(context)),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 2),
                      Text(
                        live
                            ? '${match.team1Score}/${match.team1Wickets} · ${match.team2Score}/${match.team2Wickets}'
                            : result,
                        style: GoogleFonts.poppins(
                            fontSize: 11,
                            color: AppTheme.ts(context)),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right,
                    color: AppTheme.ts(context), size: 22),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
