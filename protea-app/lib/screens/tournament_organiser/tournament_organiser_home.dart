// =============================================================================
// TOURNAMENT ORGANISER HOME — Event Admin
// =============================================================================
// Per BRD §6.8 + role spec — the Tournament Organiser owns:
//   • Create Tournament
//   • Tournaments Dashboard
//   • View Tournaments (list + filters)
//   • Tournament Detail
//   • Points Table  (P / W / L / NR / NRR / Pts)
//   • Fixtures (group / league / semi-final / final)
//   • Tournament-wide stats: top run-scorers, top wicket-takers, best bowling
//
// This home page surfaces all of those entry points in a single screen and
// dispatches to the existing screens already implemented in lib/screens/
// tournaments/. NRR formula and group-stage / knockout support are handled
// inside those screens.
// =============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/tournament.dart';
import '../../services/api_service.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import '../../shared/widgets/loading_state.dart';
import '../../shared/widgets/empty_state.dart';
import '../../widgets/notification_bell.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/theme_toggle.dart';
import '../auth/login_screen.dart';
import '../profile/profile_screen.dart';
import '../tournaments/create_tournament_screen.dart';
import '../tournaments/tournament_detail_screen.dart';
import '../tournaments/view_tournaments_screen.dart';

class TournamentOrganiserHome extends StatefulWidget {
  const TournamentOrganiserHome({super.key});

  @override
  State<TournamentOrganiserHome> createState() =>
      _TournamentOrganiserHomeState();
}

class _TournamentOrganiserHomeState extends State<TournamentOrganiserHome> {
  List<Tournament> _tournaments = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _tournaments = await ApiService.getTournaments();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final firstName = (auth.user?.name ?? 'Organiser').split(' ').first;

    final current =
        _tournaments.where((t) => t.status == 'in_progress').toList();
    final upcoming =
        _tournaments.where((t) => t.status == 'upcoming').toList();
    final completed =
        _tournaments.where((t) => t.status == 'completed').toList();

    return Scaffold(
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            // ── Header ─────────────────────────────────────────────
            Stack(
              children: [
                const ProteaHeader(height: 150),
                Positioned(
                  top: MediaQuery.of(context).padding.top + 6,
                  left: 8,
                  child: GestureDetector(
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (_) => const ProfileScreen()),
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
                                firstName.isNotEmpty
                                    ? firstName[0].toUpperCase()
                                    : 'O',
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

            // ── Greeting + role pill ────────────────────────────────
            Padding(
              padding: const EdgeInsets.only(top: 4, bottom: 6),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Hi $firstName',
                      style: GoogleFonts.poppins(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.tp(context))),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 2),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFE65100), Color(0xFFBF360C)],
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text('TOURNAMENT ORGANISER',
                        style: GoogleFonts.poppins(
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                            letterSpacing: 0.5)),
                  ),
                ],
              ),
            ),

            // ── Body ────────────────────────────────────────────────
            Expanded(
              child: _loading
                  ? const LoadingState(label: 'Loading tournaments…')
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                        children: [
                          // KPIs
                          _SummaryRow(
                            current: current.length,
                            upcoming: upcoming.length,
                            completed: completed.length,
                          ),
                          const SizedBox(height: 18),

                          // Owned-screen quick actions
                          _SectionTitle(
                            title: 'Manage your competitions',
                            subtitle:
                                'Fixtures · Points Table · NRR · Group Stage · Knockouts',
                          ),
                          const SizedBox(height: 8),
                          _actionsGrid(context),
                          const SizedBox(height: 22),

                          // In-progress
                          if (current.isNotEmpty) ...[
                            _SectionTitle(
                              title: 'In progress',
                              subtitle:
                                  'Tap to monitor live fixtures and points table',
                            ),
                            const SizedBox(height: 6),
                            ...current.map((t) => _TournamentTile(
                                  tournament: t,
                                  status: 'IN PROGRESS',
                                  color: AppTheme.liveRed,
                                  onTap: () => _open(t),
                                )),
                            const SizedBox(height: 18),
                          ],

                          // Upcoming
                          if (upcoming.isNotEmpty) ...[
                            _SectionTitle(
                              title: 'Upcoming',
                              subtitle:
                                  'Schedule fixtures, allocate groups, finalise rosters',
                            ),
                            const SizedBox(height: 6),
                            ...upcoming.map((t) => _TournamentTile(
                                  tournament: t,
                                  status: 'UPCOMING',
                                  color: AppTheme.upcomingBlue,
                                  onTap: () => _open(t),
                                )),
                            const SizedBox(height: 18),
                          ],

                          // Completed
                          if (completed.isNotEmpty) ...[
                            _SectionTitle(
                              title: 'Completed',
                              subtitle:
                                  'Final standings, tournament-wide stats',
                            ),
                            const SizedBox(height: 6),
                            ...completed.map((t) => _TournamentTile(
                                  tournament: t,
                                  status: 'COMPLETED',
                                  color: AppTheme.primaryGreen,
                                  onTap: () => _open(t),
                                )),
                          ],

                          if (_tournaments.isEmpty)
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: 30),
                              child: EmptyState(
                                message: 'No tournaments yet',
                                subtitle:
                                    'Tap "New tournament" below to create your first competition.',
                              ),
                            ),
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'organiser_create_tournament',
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const CreateTournamentScreen()),
          );
          if (result == true) _load();
        },
        backgroundColor: AppTheme.accentGold,
        foregroundColor: AppTheme.textPrimary,
        icon: const Icon(Icons.add),
        label: Text('New tournament',
            style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
      ),
    );
  }

  Widget _actionsGrid(BuildContext context) {
    final actions = <_Action>[
      _Action(
        title: 'Create',
        subtitle: 'New tournament',
        icon: Icons.add_circle_outline,
        color: AppTheme.accentAmber,
        onTap: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const CreateTournamentScreen()),
          );
          if (result == true) _load();
        },
      ),
      _Action(
        title: 'View all',
        subtitle: 'Filter · All / Current / Upcoming / Completed',
        icon: Icons.view_list_outlined,
        color: AppTheme.upcomingBlue,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const ViewTournamentsScreen()),
        ),
      ),
      _Action(
        title: 'Fixtures',
        subtitle: 'Group · League · Semis · Finals',
        icon: Icons.event_outlined,
        color: AppTheme.primaryGreen,
        onTap: () => _openLatestTab(initialTab: 1),
      ),
      _Action(
        title: 'Points Table',
        subtitle: 'P · W · L · NR · NRR · Pts',
        icon: Icons.leaderboard_outlined,
        color: AppTheme.team1Color,
        onTap: () => _openLatestTab(initialTab: 2),
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
      itemCount: actions.length,
      itemBuilder: (_, i) {
        final a = actions[i];
        return Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: a.onTap,
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.surface(context),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                    color: a.color.withValues(alpha: 0.25)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: a.color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(a.icon, color: a.color, size: 22),
                  ),
                  const SizedBox(height: 6),
                  Text(a.title,
                      style: GoogleFonts.poppins(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.tp(context))),
                  Text(a.subtitle,
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

  /// Helper: open the most relevant tournament (in-progress > upcoming > any)
  /// and jump into its detail screen. The detail screen exposes Fixtures /
  /// Points Table / Stats tabs internally.
  void _openLatestTab({required int initialTab}) {
    Tournament? target;
    if (_tournaments.any((t) => t.status == 'in_progress')) {
      target = _tournaments.firstWhere((t) => t.status == 'in_progress');
    } else if (_tournaments.any((t) => t.status == 'upcoming')) {
      target = _tournaments.firstWhere((t) => t.status == 'upcoming');
    } else if (_tournaments.isNotEmpty) {
      target = _tournaments.first;
    }

    if (target == null) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const ViewTournamentsScreen()),
      );
      return;
    }
    _open(target);
  }

  void _open(Tournament t) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => TournamentDetailScreen(tournamentId: t.id),
      ),
    ).then((_) => _load());
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

class _Action {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  _Action({
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

class _SummaryRow extends StatelessWidget {
  final int current;
  final int upcoming;
  final int completed;
  const _SummaryRow({
    required this.current,
    required this.upcoming,
    required this.completed,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _StatPill(
              label: 'In progress',
              value: current.toString(),
              color: AppTheme.liveRed),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _StatPill(
              label: 'Upcoming',
              value: upcoming.toString(),
              color: AppTheme.upcomingBlue),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _StatPill(
              label: 'Completed',
              value: completed.toString(),
              color: AppTheme.primaryGreen),
        ),
      ],
    );
  }
}

class _StatPill extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _StatPill({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Column(
        children: [
          Text(value,
              style: GoogleFonts.poppins(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: color)),
          const SizedBox(height: 2),
          Text(label,
              style: GoogleFonts.poppins(
                  fontSize: 10,
                  color: AppTheme.ts(context),
                  letterSpacing: 0.4)),
        ],
      ),
    );
  }
}

class _TournamentTile extends StatelessWidget {
  final Tournament tournament;
  final String status;
  final Color color;
  final VoidCallback onTap;
  const _TournamentTile({
    required this.tournament,
    required this.status,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('dd MMM yyyy');
    final dateRange = tournament.startDate != null && tournament.endDate != null
        ? '${DateFormat('dd MMM').format(tournament.startDate!)} – ${fmt.format(tournament.endDate!)}'
        : tournament.startDate != null
            ? 'From ${fmt.format(tournament.startDate!)}'
            : tournament.endDate != null
                ? 'Until ${fmt.format(tournament.endDate!)}'
                : 'Dates TBD';

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
              border:
                  Border.all(color: color.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(Icons.emoji_events,
                      color: color, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(tournament.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.poppins(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.tp(context))),
                      const SizedBox(height: 2),
                      Text(dateRange,
                          style: GoogleFonts.poppins(
                              fontSize: 11,
                              color: AppTheme.ts(context))),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(status,
                      style: GoogleFonts.poppins(
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          letterSpacing: 0.6)),
                ),
              ],
            ),
          ),
        ),
      ).animate().fadeIn(duration: 300.ms),
    );
  }
}
