import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../models/match.dart';
import '../../services/api_service.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../theme/app_theme.dart';
import '../../shared/utils/snackbar_utils.dart';
import '../../widgets/protea_header.dart';
import '../viewer/match_detail_screen.dart';
import '../viewer/upcoming_match_detail_screen.dart';
import '../players/players_home_screen.dart';
import '../teams/teams_home_screen.dart';
import '../tournaments/tournament_home_screen.dart';
import '../profile/profile_screen.dart';
import 'feeder_create_match_screen.dart';
import 'live_scoring_screen.dart';
import '../matches/toss_screen.dart';
import 'player_journey_screen.dart';

class FeederHome extends StatefulWidget {
  const FeederHome({super.key});

  @override
  State<FeederHome> createState() => _FeederHomeState();
}

class _FeederHomeState extends State<FeederHome> {
  int _selectedIndex = 0;
  List<CricketMatch> _matches = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadMatches();
  }

  Future<void> _loadMatches() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        ApiService.getMatches(status: 'live'),
        ApiService.getMatches(status: 'upcoming'),
        ApiService.getMatches(status: 'completed'),
      ]);
      _matches = [...results[0], ...results[1], ...results[2]];
      setState(() => _loading = false);
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: [
          _MatchesHomeTab(
            matches: _matches,
            loading: _loading,
            onRefresh: _loadMatches,
            onNewMatch: () async {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const FeederCreateMatchScreen()),
              );
              if (result == true) _loadMatches();
            },
            onStartMatch: _startMatch,
            onEndMatch: _endMatch,
          ),
          const PlayersHomeScreen(),
          const TeamsHomeScreen(),
          const TournamentHomeScreen(),
          const ProfileScreen(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) => setState(() => _selectedIndex = index),
        backgroundColor: Theme.of(context).brightness == Brightness.dark
            ? AppTheme.darkCardBg
            : Colors.white,
        indicatorColor: AppTheme.primaryGreen.withValues(alpha: 0.15),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.sports_cricket_outlined),
            selectedIcon: Icon(Icons.sports_cricket, color: AppTheme.primaryGreen),
            label: 'Matches',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people, color: AppTheme.primaryGreen),
            label: 'Players',
          ),
          NavigationDestination(
            icon: Icon(Icons.shield_outlined),
            selectedIcon: Icon(Icons.shield, color: AppTheme.primaryGreen),
            label: 'Teams',
          ),
          NavigationDestination(
            icon: Icon(Icons.emoji_events_outlined),
            selectedIcon: Icon(Icons.emoji_events, color: AppTheme.primaryGreen),
            label: 'Tournament',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person, color: AppTheme.primaryGreen),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  Future<void> _startMatch(CricketMatch match) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => TossScreen(matchId: match.id, match: match)),
    );
    if (result == true) _loadMatches();
  }

  Future<void> _endMatch(CricketMatch match) async {
    final winner = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('End Match'),
        content: const Text('Select the winner:'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, match.team1Name), child: Text(match.team1Name)),
          TextButton(onPressed: () => Navigator.pop(ctx, match.team2Name), child: Text(match.team2Name)),
          TextButton(onPressed: () => Navigator.pop(ctx, 'Draw'), child: const Text('Draw')),
        ],
      ),
    );
    if (winner != null) {
      try {
        await ApiService.updateMatch(match.id, {'status': 'completed', 'winner': winner});
        _loadMatches();
      } catch (e) {
        if (mounted) {
          SnackbarUtils.showError(context, e);
        }
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME TAB — matches dashboard with Protea header
// ─────────────────────────────────────────────────────────────────────────────

class _MatchesHomeTab extends StatelessWidget {
  final List<CricketMatch> matches;
  final bool loading;
  final Future<void> Function() onRefresh;
  final VoidCallback onNewMatch;
  final Future<void> Function(CricketMatch) onStartMatch;
  final Future<void> Function(CricketMatch) onEndMatch;

  const _MatchesHomeTab({
    required this.matches,
    required this.loading,
    required this.onRefresh,
    required this.onNewMatch,
    required this.onStartMatch,
    required this.onEndMatch,
  });

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final userName = auth.user?.name.split(' ').first ?? 'User';

    return Scaffold(
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            // ── Header with logo + controls ──────────────────────────────
            Stack(
              children: [
                const ProteaHeader(height: 180),
                // Profile avatar top-left
                Positioned(
                  top: MediaQuery.of(context).padding.top + 8,
                  left: 12,
                  child: GestureDetector(
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ProfileScreen()),
                    ),
                    child: Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: AppTheme.accentGold, width: 2.5),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.2),
                            blurRadius: 6,
                          ),
                        ],
                      ),
                      child: CircleAvatar(
                        radius: 22,
                        backgroundColor: Colors.white,
                        backgroundImage: auth.user?.photoUrl != null && auth.user!.photoUrl!.isNotEmpty
                            ? NetworkImage(ApiService.getPhotoUrl(auth.user!.photoUrl!))
                            : null,
                        child: auth.user?.photoUrl == null || auth.user!.photoUrl!.isEmpty
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
                // Theme toggle + logout top-right
                Positioned(
                  top: MediaQuery.of(context).padding.top + 4,
                  right: 4,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Consumer<ThemeProvider>(
                        builder: (context, theme, _) => IconButton(
                          icon: Icon(
                            theme.isDark ? Icons.light_mode : Icons.dark_mode,
                            color: Colors.white,
                          ),
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

            // ── Greeting + role badge ────────────────────────────────────
            Padding(
              padding: const EdgeInsets.only(top: 10, bottom: 2),
              child: Text(
                'Hi $userName,',
                style: GoogleFonts.poppins(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: Theme.of(context).textTheme.bodyLarge?.color,
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 3),
              decoration: BoxDecoration(
                color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                'Score Feeder',
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.primaryGreen,
                ),
              ),
            ),
            const SizedBox(height: 12),

            // ── Matches list ─────────────────────────────────────────────
            Expanded(
              child: _buildMatchesList(context),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'feeder_home_new_match',
        onPressed: onNewMatch,
        backgroundColor: AppTheme.accentGold,
        foregroundColor: AppTheme.textPrimary,
        icon: const Icon(Icons.add),
        label: Text('New Match', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
      ),
    );
  }

  Widget _buildMatchesList(BuildContext context) {
    if (loading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.accentGold));
    }

    final live = matches.where((m) => m.status == 'live').toList();
    final upcoming = matches.where((m) => m.status == 'upcoming').toList();
    final completed = matches.where((m) => m.status == 'completed').toList();

    return RefreshIndicator(
      color: AppTheme.accentGold,
      onRefresh: onRefresh,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
        children: [
          // ── Stats row ────────────────────────────────────────────────
          Row(
            children: [
              _statCard(context, 'Live', live.length.toString(), AppTheme.wicketRed, Icons.live_tv),
              const SizedBox(width: 10),
              _statCard(context, 'Upcoming', upcoming.length.toString(), AppTheme.team1Color, Icons.calendar_today),
              const SizedBox(width: 10),
              _statCard(context, 'Done', completed.length.toString(), AppTheme.lightGreen, Icons.check_circle),
            ],
          ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1),
          const SizedBox(height: 20),

          if (matches.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.only(top: 40),
                child: Column(
                  children: [
                    Icon(Icons.sports_cricket, size: 64, color: AppTheme.ts(context)),
                    const SizedBox(height: 12),
                    Text('No matches yet', style: TextStyle(color: AppTheme.ts(context), fontSize: 16)),
                    const SizedBox(height: 8),
                    Text('Tap + New Match to get started', style: TextStyle(color: AppTheme.ts(context), fontSize: 13)),
                  ],
                ),
              ),
            ),

          if (live.isNotEmpty) ...[
            _sectionHeader(context, 'Live Matches', AppTheme.wicketRed),
            ...live.map((m) => _buildMatchCard(context, m)),
          ],
          if (upcoming.isNotEmpty) ...[
            _sectionHeader(context, 'Upcoming Matches', AppTheme.team1Color),
            ...upcoming.map((m) => _buildMatchCard(context, m)),
          ],
          if (completed.isNotEmpty) ...[
            _sectionHeader(context, 'Completed Matches', AppTheme.lightGreen),
            ...completed.map((m) => _buildMatchCard(context, m)),
          ],
        ],
      ),
    );
  }

  Widget _statCard(BuildContext context, String label, String count, Color color, IconData icon) {
    return Expanded(
      child: Card(
        elevation: 2,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
          child: Column(
            children: [
              Icon(icon, color: color, size: 24),
              const SizedBox(height: 6),
              Text(count, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color)),
              Text(label, style: TextStyle(fontSize: 11, color: AppTheme.ts(context))),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sectionHeader(BuildContext context, String title, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, top: 4),
      child: Row(
        children: [
          Container(width: 4, height: 20, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
          const SizedBox(width: 8),
          Text(title, style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }

  Widget _buildMatchCard(BuildContext context, CricketMatch match) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => match.status == 'upcoming'
                ? UpcomingMatchDetailScreen(matchId: match.id)
                : MatchDetailScreen(matchId: match.id),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Teams row
              Row(
                children: [
                  Expanded(
                    child: Text(
                      '${match.team1Name} vs ${match.team2Name}',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                  ),
                  _statusChip(match.status),
                ],
              ),
              // Score
              if (match.status != 'upcoming') ...[
                const SizedBox(height: 8),
                _scoreRow(context, match.team1Name, match.team1Display),
                const SizedBox(height: 2),
                _scoreRow(context, match.team2Name, match.team2Display),
              ],
              // Venue / date
              if (match.venue != null || true) ...[
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(Icons.location_on_outlined, size: 13, color: AppTheme.ts(context)),
                    const SizedBox(width: 3),
                    Text(
                      match.venue ?? 'TBD',
                      style: TextStyle(fontSize: 12, color: AppTheme.ts(context)),
                    ),
                    const Spacer(),
                    Icon(Icons.calendar_today_outlined, size: 13, color: AppTheme.ts(context)),
                    const SizedBox(width: 3),
                    Text(
                      _formatDate(match.matchDate),
                      style: TextStyle(fontSize: 12, color: AppTheme.ts(context)),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 12),
              // Action buttons
              Row(
                children: [
                  if (match.status == 'upcoming')
                    _actionButton('Start', Icons.play_arrow, AppTheme.lightGreen, () => onStartMatch(match)),
                  if (match.status == 'live') ...[
                    _actionButton('Score', Icons.sports_cricket, AppTheme.accentGold, () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => LiveScoringScreen(matchId: match.id)));
                    }),
                    const SizedBox(width: 8),
                    _actionButton('End', Icons.stop_circle, AppTheme.wicketRed, () => onEndMatch(match)),
                  ],
                  if (match.status == 'completed')
                    _actionButton('Journey', Icons.timeline, AppTheme.primaryGreen, () {
                      Navigator.push(context, MaterialPageRoute(
                          builder: (_) => PlayerJourneyScreen(matchId: match.id)));
                    }),
                  const Spacer(),
                  // Match type badge
                  if (match.matchType != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        match.matchType!.toUpperCase(),
                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.primaryGreen),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.05);
  }

  Widget _scoreRow(BuildContext context, String team, String score) {
    return Row(
      children: [
        Expanded(
          child: Text(team, style: TextStyle(fontSize: 13, color: AppTheme.ts(context))),
        ),
        Text(score, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _actionButton(String label, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 15, color: color),
            const SizedBox(width: 4),
            Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
          ],
        ),
      ),
    );
  }

  Widget _statusChip(String status) {
    Color color;
    switch (status) {
      case 'live':
        color = AppTheme.wicketRed;
        break;
      case 'completed':
        color = AppTheme.lightGreen;
        break;
      default:
        color = AppTheme.team1Color;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(12)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (status == 'live') ...[
            Container(
              width: 7,
              height: 7,
              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
            ),
            const SizedBox(width: 4),
          ],
          Text(status.toUpperCase(), style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${date.day} ${months[date.month - 1]}';
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
