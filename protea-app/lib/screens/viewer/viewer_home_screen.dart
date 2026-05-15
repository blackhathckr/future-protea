import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
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
import 'match_detail_screen.dart';
import 'upcoming_match_detail_screen.dart';
import '../players/players_home_screen.dart';
import '../teams/teams_home_screen.dart';
import '../tournaments/tournament_home_screen.dart';
import '../profile/profile_screen.dart';

class ViewerHomeScreen extends StatefulWidget {
  const ViewerHomeScreen({super.key});

  @override
  State<ViewerHomeScreen> createState() => _ViewerHomeScreenState();
}

class _ViewerHomeScreenState extends State<ViewerHomeScreen> {
  List<CricketMatch> _liveMatches = [];
  List<CricketMatch> _upcomingMatches = [];
  List<CricketMatch> _completedMatches = [];
  bool _loading = true;
  int _navIndex = 0;

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
      _liveMatches = results[0];
      _upcomingMatches = results[1].take(5).toList();
      _completedMatches = results[2];
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final userName = auth.user?.name.split(' ').first ?? 'User';
    final isDark = AppTheme.isDark(context);

    return Scaffold(
      bottomNavigationBar: NavigationBar(
        selectedIndex: _navIndex,
        onDestinationSelected: (i) => setState(() => _navIndex = i),
        backgroundColor: isDark ? AppTheme.darkCardBg : Colors.white,
        indicatorColor: AppTheme.primaryGreen.withValues(alpha: 0.15),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.live_tv_outlined),
            selectedIcon:
                Icon(Icons.live_tv, color: AppTheme.primaryGreen),
            label: 'Matches',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon:
                Icon(Icons.people, color: AppTheme.primaryGreen),
            label: 'Players',
          ),
          NavigationDestination(
            icon: Icon(Icons.shield_outlined),
            selectedIcon:
                Icon(Icons.shield, color: AppTheme.primaryGreen),
            label: 'Teams',
          ),
          NavigationDestination(
            icon: Icon(Icons.emoji_events_outlined),
            selectedIcon:
                Icon(Icons.emoji_events, color: AppTheme.primaryGreen),
            label: 'Tournaments',
          ),
        ],
      ),
      body: SafeArea(
        top: false,
        child: IndexedStack(
          index: _navIndex,
          children: [
            // ── Tab 0: Matches ───────────────────────────────────────
            DefaultTabController(
              length: 3,
              child: Column(
                children: [
            // ── Compact Header ──────────────────────────────────────
            Stack(
              children: [
                const ProteaHeader(height: 140),
                Positioned(
                  top: MediaQuery.of(context).padding.top + 6,
                  left: 8,
                  child: GestureDetector(
                    onTap: () => Navigator.push(context,
                        MaterialPageRoute(builder: (_) => const ProfileScreen())),
                    child: Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: AppTheme.accentGold, width: 2.5),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.accentGold.withValues(alpha: 0.3),
                            blurRadius: 10,
                            spreadRadius: 1,
                          ),
                        ],
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
                            ? Text(userName[0].toUpperCase(),
                                style: GoogleFonts.poppins(
                                    color: AppTheme.primaryGreen,
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold))
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
                        icon: const Icon(Icons.logout, color: Colors.white, size: 22),
                        onPressed: () => _confirmLogout(context),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            // ── Greeting ────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.only(top: 2, bottom: 6),
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
                          colors: [Color(0xFFFFA000), Color(0xFFFFD600)]),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text('VIEWER',
                        style: GoogleFonts.poppins(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                            letterSpacing: 0.5)),
                  ),
                ],
              ),
            ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.1),

            // ── Live banner ─────────────────────────────────────────
            if (_liveMatches.isNotEmpty)
              Container(
                margin: const EdgeInsets.fromLTRB(20, 0, 20, 8),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [
                    AppTheme.liveRed.withValues(alpha: 0.15),
                    AppTheme.liveRed.withValues(alpha: 0.05),
                  ]),
                  borderRadius: BorderRadius.circular(24),
                  border:
                      Border.all(color: AppTheme.liveRed.withValues(alpha: 0.3)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const _PulsingDot(size: 9),
                    const SizedBox(width: 8),
                    Text(
                      '${_liveMatches.length} LIVE ${_liveMatches.length == 1 ? "MATCH" : "MATCHES"}',
                      style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                          color: AppTheme.liveRed,
                          letterSpacing: 0.5),
                    ),
                  ],
                ),
              ).animate().fadeIn(duration: 500.ms).shimmer(
                  duration: 2500.ms,
                  color: AppTheme.liveRed.withValues(alpha: 0.06)),

            // ── Tabs ────────────────────────────────────────────────
            Container(
              height: 44,
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: isDark
                    ? Colors.white.withValues(alpha: 0.06)
                    : Colors.grey.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: TabBar(
                indicator: BoxDecoration(
                  gradient: const LinearGradient(
                      colors: [Color(0xFF1B5E20), Color(0xFF2E7D32)]),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.primaryGreen.withValues(alpha: 0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                dividerHeight: 0,
                indicatorSize: TabBarIndicatorSize.tab,
                labelColor: Colors.white,
                unselectedLabelColor: AppTheme.ts(context),
                labelStyle: GoogleFonts.poppins(
                    fontWeight: FontWeight.w600, fontSize: 12),
                unselectedLabelStyle: GoogleFonts.poppins(
                    fontWeight: FontWeight.w500, fontSize: 12),
                tabs: [
                  _buildTab('Live', _liveMatches.length, Colors.white24, Colors.white),
                  _buildTab('Upcoming', _upcomingMatches.length,
                      AppTheme.upcomingBlue.withValues(alpha: 0.25), AppTheme.upcomingBlue),
                  _buildTab('Results', _completedMatches.length,
                      Colors.white.withValues(alpha: 0.15), Colors.white70),
                ],
              ),
            ),
            const SizedBox(height: 8),

            // ── Content ─────────────────────────────────────────────
                Expanded(
                child: _loading
                    ? const LoadingState(label: 'Loading matches...')
                    : TabBarView(
                        children: [
                          // Live
                          _liveMatches.isEmpty
                              ? EmptyState(
                                  message: 'No live matches right now',
                                  subtitle: 'Pull down to refresh or check upcoming matches',
                                  onRefresh: _loadMatches,
                                )
                              : RefreshIndicator(
                                  onRefresh: _loadMatches,
                                  child: ListView.builder(
                                    padding: const EdgeInsets.fromLTRB(
                                        16, 4, 16, 16),
                                    itemCount: _liveMatches.length,
                                    itemBuilder: (_, i) => _LiveMatchCard(
                                      match: _liveMatches[i],
                                      onTap: () => Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                              builder: (_) =>
                                                  MatchDetailScreen(
                                                      matchId:
                                                          _liveMatches[i]
                                                              .id))),
                                    )
                                        .animate()
                                        .fadeIn(
                                            duration: 500.ms,
                                            delay: (i * 120).ms)
                                        .slideY(
                                            begin: 0.12,
                                            duration: 500.ms,
                                            delay: (i * 120).ms,
                                            curve: Curves.easeOutCubic),
                                  ),
                                ),
                          // Upcoming
                          _upcomingMatches.isEmpty
                              ? EmptyState(
                                  message: 'No upcoming matches',
                                  subtitle: 'New matches will appear here',
                                  onRefresh: _loadMatches,
                                )
                              : RefreshIndicator(
                                  onRefresh: _loadMatches,
                                  child: ListView.builder(
                                    padding: const EdgeInsets.fromLTRB(
                                        16, 4, 16, 16),
                                    itemCount: _upcomingMatches.length,
                                    itemBuilder: (_, i) => _UpcomingMatchCard(
                                      match: _upcomingMatches[i],
                                      onTap: () => Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                              builder: (_) =>
                                                  UpcomingMatchDetailScreen(
                                                      matchId:
                                                          _upcomingMatches[i]
                                                              .id))),
                                    )
                                        .animate()
                                        .fadeIn(
                                            duration: 500.ms,
                                            delay: (i * 120).ms)
                                        .slideY(
                                            begin: 0.12,
                                            duration: 500.ms,
                                            delay: (i * 120).ms,
                                            curve: Curves.easeOutCubic),
                                  ),
                                ),
                          // Results
                          _completedMatches.isEmpty
                              ? EmptyState(
                                  message: 'No results yet',
                                  subtitle: 'Completed matches will appear here',
                                  onRefresh: _loadMatches,
                                )
                              : RefreshIndicator(
                                  onRefresh: _loadMatches,
                                  child: ListView.builder(
                                    padding: const EdgeInsets.fromLTRB(
                                        16, 4, 16, 16),
                                    itemCount: _completedMatches.length,
                                    itemBuilder: (_, i) =>
                                        _CompletedMatchCard(
                                      match: _completedMatches[i],
                                      onTap: () => Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                              builder: (_) =>
                                                  MatchDetailScreen(
                                                      matchId:
                                                          _completedMatches[i]
                                                              .id))),
                                    )
                                        .animate()
                                        .fadeIn(
                                            duration: 500.ms,
                                            delay: (i * 120).ms)
                                        .slideY(
                                            begin: 0.12,
                                            duration: 500.ms,
                                            delay: (i * 120).ms,
                                            curve: Curves.easeOutCubic),
                                  ),
                                ),
                        ],
                      ),
                ),
              ]),
            ),
            // ── Tab 1: Players ───────────────────────────────────────
            const PlayersHomeScreen(),
            // ── Tab 2: Teams ─────────────────────────────────────────
            const TeamsHomeScreen(),
            // ── Tab 3: Tournaments ───────────────────────────────────
            const TournamentHomeScreen(),
          ],
        ),
      ),
    );
  }

  Tab _buildTab(String label, int count, Color badgeColor, Color textColor) {
    return Tab(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label),
          if (count > 0) ...[
            const SizedBox(width: 4),
            Container(
              width: 18,
              height: 18,
              decoration: BoxDecoration(
                color: badgeColor,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  '$count',
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                  ),
                ),
              ),
            ),
          ],
        ],
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
              navigator.popUntil((route) => route.isFirst);
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
// LIVE MATCH CARD
// =============================================================================

class _LiveMatchCard extends StatelessWidget {
  final CricketMatch match;
  final VoidCallback onTap;
  const _LiveMatchCard({required this.match, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Material(
        borderRadius: BorderRadius.circular(20),
        elevation: 6,
        shadowColor: Colors.black38,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: onTap,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              // Deep dark-green charcoal — same family as the app header
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF0A1F0A), // near-black green
                  Color(0xFF0D2E10), // very dark forest
                  Color(0xFF0F3812), // dark green
                ],
              ),
              border: Border.all(
                color: Color(0xFF1B5E20),
                width: 1,
              ),
            ),
            child: Stack(
              children: [
                // Gold accent stripe along top edge
                Positioned(
                  top: 0, left: 0, right: 0,
                  child: Container(
                    height: 3,
                    decoration: const BoxDecoration(
                      borderRadius: BorderRadius.vertical(
                          top: Radius.circular(20)),
                      gradient: LinearGradient(colors: [
                        Color(0xFFFFD600),
                        Color(0xFFFFA000),
                        Color(0xFFFFD600),
                      ]),
                    ),
                  ),
                ),
                // Faint watermark
                Positioned(
                  right: -16, bottom: -16,
                  child: Icon(Icons.sports_cricket,
                      size: 110,
                      color: Colors.white.withValues(alpha: 0.03)),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 18, 16, 14),
                  child: Column(
                    children: [
                      // ── Top row ──────────────────────────────
                      Row(
                        children: [
                          // LIVE badge
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.liveRed,
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [
                                BoxShadow(
                                  color: AppTheme.liveRed.withValues(alpha: 0.5),
                                  blurRadius: 10,
                                  spreadRadius: 1,
                                ),
                              ],
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                _PulsingDot(size: 7, color: Colors.white),
                                SizedBox(width: 5),
                                Text('LIVE',
                                    style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: 1.2)),
                              ],
                            ),
                          ),
                          const Spacer(),
                          // Match type pill
                          if (match.matchType != null)
                            Container(
                              margin: const EdgeInsets.only(right: 8),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 7, vertical: 3),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryGreen.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                    color: AppTheme.primaryGreen.withValues(alpha: 0.4)),
                              ),
                              child: Text(match.matchType!,
                                  style: TextStyle(
                                      color: Colors.white.withValues(alpha: 0.85),
                                      fontSize: 9,
                                      fontWeight: FontWeight.w600)),
                            ),
                          // Innings pill
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.12)),
                            ),
                            child: Text(
                              match.currentInnings == 1
                                  ? '1st Inn'
                                  : '2nd Inn',
                              style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.75),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),

                      // ── Teams + scores ────────────────────────
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          // Team 1
                          Expanded(
                            child: _LiveTeamColumn(
                              name: match.team1Name,
                              logoUrl: match.team1LogoUrl,
                              score: match.team1Score,
                              wickets: match.team1Wickets,
                              overs: match.team1Overs,
                              totalOvers: match.totalOvers,
                            ),
                          ),
                          // VS divider
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            child: Column(
                              children: [
                                Container(
                                  width: 34,
                                  height: 34,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: Colors.white.withValues(alpha: 0.06),
                                    border: Border.all(
                                        color: AppTheme.accentGold.withValues(alpha: 0.5),
                                        width: 1.5),
                                  ),
                                  child: Center(
                                    child: Text('VS',
                                        style: GoogleFonts.poppins(
                                            fontWeight: FontWeight.w800,
                                            fontSize: 9,
                                            color: AppTheme.accentGold)),
                                  ),
                                ),
                                const SizedBox(height: 5),
                                Text('${match.totalOvers} ov',
                                    style: TextStyle(
                                        color: Colors.white.withValues(alpha: 0.35),
                                        fontSize: 9)),
                              ],
                            ),
                          ),
                          // Team 2
                          Expanded(
                            child: _LiveTeamColumn(
                              name: match.team2Name,
                              logoUrl: match.team2LogoUrl,
                              score: match.team2Score,
                              wickets: match.team2Wickets,
                              overs: match.team2Overs,
                              totalOvers: match.totalOvers,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      // ── Overs progress bar ────────────────────
                      _OversProgressBar(
                        overs: match.currentInnings == 1
                            ? match.team1Overs
                            : match.team2Overs,
                        totalOvers: match.totalOvers,
                      ),
                      const SizedBox(height: 10),

                      // ── Bottom info ───────────────────────────
                      Row(
                        children: [
                          if (match.venue != null) ...[
                            Icon(Icons.location_on_rounded,
                                size: 12,
                                color: Colors.white.withValues(alpha: 0.35)),
                            const SizedBox(width: 3),
                            Expanded(
                              child: Text(match.venue!,
                                  style: TextStyle(
                                      fontSize: 11,
                                      color: Colors.white.withValues(alpha: 0.35)),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis),
                            ),
                          ],
                          if (match.tossWinner != null) ...[
                            const SizedBox(width: 8),
                            Icon(Icons.swap_horiz_rounded,
                                size: 12,
                                color: Colors.white.withValues(alpha: 0.3)),
                            const SizedBox(width: 3),
                            Flexible(
                              child: Text(
                                'Toss: ${match.tossWinner}',
                                style: TextStyle(
                                    fontSize: 10,
                                    color: Colors.white.withValues(alpha: 0.3)),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// =============================================================================
// LIVE TEAM COLUMN
// =============================================================================

class _LiveTeamColumn extends StatelessWidget {
  final String name;
  final String? logoUrl;
  final int score;
  final int wickets;
  final double overs;
  final int totalOvers;

  const _LiveTeamColumn({
    required this.name,
    this.logoUrl,
    required this.score,
    required this.wickets,
    required this.overs,
    required this.totalOvers,
  });

  @override
  Widget build(BuildContext context) {
    final progress = totalOvers > 0 ? (overs / totalOvers).clamp(0.0, 1.0) : 0.0;

    return Column(
      children: [
        // Avatar with progress ring
        SizedBox(
          width: 60,
          height: 60,
          child: CustomPaint(
            painter: _OversProgressPainter(
              progress: progress,
              color: AppTheme.accentGold,
              backgroundColor: Colors.white.withValues(alpha: 0.12),
              strokeWidth: 3,
            ),
            child: Center(
              child: Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: logoUrl != null && logoUrl!.isNotEmpty
                      ? Colors.white
                      : null,
                  gradient: logoUrl == null || logoUrl!.isEmpty
                      ? LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            AppTheme.primaryGreen.withValues(alpha: 0.6),
                            AppTheme.primaryGreen.withValues(alpha: 0.3),
                          ],
                        )
                      : null,
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.2),
                    width: 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.35),
                      blurRadius: 8,
                    ),
                  ],
                  image: logoUrl != null && logoUrl!.isNotEmpty
                      ? DecorationImage(
                          image: NetworkImage(ApiService.getPhotoUrl(logoUrl!)),
                          fit: BoxFit.cover,
                        )
                      : null,
                ),
                child: logoUrl == null || logoUrl!.isEmpty
                    ? Center(
                        child: Text(
                          name.isNotEmpty ? name[0].toUpperCase() : '?',
                          style: GoogleFonts.poppins(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              fontSize: 20),
                        ),
                      )
                    : null,
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        // Frosted glass score panel
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.07),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.10),
            ),
          ),
          child: Column(
            children: [
              Text(name,
                  style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w600,
                      fontSize: 11,
                      color: Colors.white.withValues(alpha: 0.85)),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis),
              const SizedBox(height: 2),
              Text('$score/$wickets',
                  style: GoogleFonts.poppins(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.accentGold,
                      height: 1.1)),
              Text('(${overs.toStringAsFixed(1)} ov)',
                  style: TextStyle(
                      fontSize: 10,
                      color: Colors.white.withValues(alpha: 0.45))),
            ],
          ),
        ),
      ],
    );
  }
}

// =============================================================================
// OVERS PROGRESS BAR
// =============================================================================

class _OversProgressBar extends StatelessWidget {
  final double overs;
  final int totalOvers;
  const _OversProgressBar({required this.overs, required this.totalOvers});

  @override
  Widget build(BuildContext context) {
    final progress = totalOvers > 0 ? (overs / totalOvers).clamp(0.0, 1.0) : 0.0;
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Overs',
                style: TextStyle(
                    fontSize: 10,
                    color: Colors.white.withValues(alpha: 0.5))),
            Text('${overs.toStringAsFixed(1)} / $totalOvers',
                style: GoogleFonts.poppins(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.accentGold)),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: Stack(
            children: [
              Container(
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              FractionallySizedBox(
                widthFactor: progress,
                child: Container(
                  height: 4,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                        colors: [Color(0xFFFFD600), Color(0xFFFFA000)]),
                    borderRadius: BorderRadius.circular(4),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.accentGold.withValues(alpha: 0.4),
                        blurRadius: 6,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// =============================================================================
// UPCOMING MATCH CARD
// =============================================================================

class _UpcomingMatchCard extends StatelessWidget {
  final CricketMatch match;
  final VoidCallback onTap;
  const _UpcomingMatchCard({required this.match, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final formattedDate = DateFormat('dd MMM, hh:mm a').format(match.matchDate);
    final hoursUntil = match.matchDate.difference(DateTime.now()).inHours;
    final isStartingSoon = hoursUntil >= 0 && hoursUntil <= 24;
    final isDark = AppTheme.isDark(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        borderRadius: BorderRadius.circular(16),
        elevation: 3,
        shadowColor: isDark ? Colors.black26 : Colors.black12,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              color: AppTheme.surface(context),
              border: isStartingSoon
                  ? Border.all(
                      color: AppTheme.accentGold.withValues(alpha: 0.4),
                      width: 1.5)
                  : null,
            ),
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Top row
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppTheme.upcomingBlue.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.schedule_rounded,
                              size: 11, color: AppTheme.upcomingBlue),
                          const SizedBox(width: 4),
                          Text('UPCOMING',
                              style: TextStyle(
                                  color: AppTheme.upcomingBlue,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 0.5)),
                        ],
                      ),
                    ),
                    const Spacer(),
                    Text(formattedDate,
                        style: GoogleFonts.poppins(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.upcomingBlue)),
                  ],
                ),
                const SizedBox(height: 14),

                // Teams
                Row(
                  children: [
                    Expanded(
                      child: _UpcomingTeamColumn(
                          name: match.team1Name,
                          logoUrl: match.team1LogoUrl),
                    ),
                    Text('VS',
                        style: GoogleFonts.poppins(
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                            color: AppTheme.ts(context))),
                    Expanded(
                      child: _UpcomingTeamColumn(
                          name: match.team2Name,
                          logoUrl: match.team2LogoUrl),
                    ),
                  ],
                ),

                // Starting soon
                if (isStartingSoon) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 5),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: [
                        AppTheme.accentGold.withValues(alpha: 0.12),
                        AppTheme.accentAmber.withValues(alpha: 0.08),
                      ]),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.bolt_rounded,
                            size: 14, color: AppTheme.accentAmber),
                        const SizedBox(width: 4),
                        Text(
                          hoursUntil <= 0
                              ? 'Starting soon!'
                              : hoursUntil == 1
                                  ? 'Starting in 1 hour'
                                  : 'Starting in $hoursUntil hours',
                          style: GoogleFonts.poppins(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.accentAmber),
                        ),
                      ],
                    ),
                  ),
                ],

                // Venue
                if (match.venue != null) ...[
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.location_on_rounded,
                          size: 13, color: AppTheme.ts(context)),
                      const SizedBox(width: 3),
                      Flexible(
                        child: Text(match.venue!,
                            style: GoogleFonts.poppins(
                                fontSize: 11,
                                color: AppTheme.ts(context)),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis),
                      ),
                      Text('  •  ${match.totalOvers} overs',
                          style: GoogleFonts.poppins(
                              fontSize: 11,
                              color: AppTheme.ts(context))),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _UpcomingTeamColumn extends StatelessWidget {
  final String name;
  final String? logoUrl;
  const _UpcomingTeamColumn({required this.name, this.logoUrl});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        CircleAvatar(
          radius: 24,
          backgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.1),
          backgroundImage: logoUrl != null && logoUrl!.isNotEmpty
              ? NetworkImage(ApiService.getPhotoUrl(logoUrl!))
              : null,
          child: logoUrl == null || logoUrl!.isEmpty
              ? Text(name.isNotEmpty ? name[0] : '?',
                  style: TextStyle(
                      color: AppTheme.primaryGreen,
                      fontWeight: FontWeight.bold,
                      fontSize: 16))
              : null,
        ),
        const SizedBox(height: 6),
        Text(name,
            style: GoogleFonts.poppins(
                fontWeight: FontWeight.w600,
                fontSize: 12,
                color: AppTheme.tp(context)),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis),
      ],
    );
  }
}

// =============================================================================
// COMPLETED MATCH CARD
// =============================================================================

class _CompletedMatchCard extends StatelessWidget {
  final CricketMatch match;
  final VoidCallback onTap;
  const _CompletedMatchCard({required this.match, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isDark = AppTheme.isDark(context);
    final formattedDate =
        DateFormat('dd MMM yyyy').format(match.matchDate);

    final result = match.winner != null ? '${match.winner} won' : '';

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        borderRadius: BorderRadius.circular(16),
        elevation: 3,
        shadowColor: isDark ? Colors.black26 : Colors.black12,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              color: AppTheme.surface(context),
              border: Border.all(
                color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.black.withValues(alpha: 0.06),
              ),
            ),
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Top row — RESULT badge + date
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.grey.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.check_circle_outline,
                              size: 11, color: AppTheme.ts(context)),
                          const SizedBox(width: 4),
                          Text('RESULT',
                              style: TextStyle(
                                  color: AppTheme.ts(context),
                                  fontSize: 9,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 0.5)),
                        ],
                      ),
                    ),
                    const Spacer(),
                    Text(formattedDate,
                        style: GoogleFonts.poppins(
                            fontSize: 11,
                            color: AppTheme.ts(context))),
                  ],
                ),
                const SizedBox(height: 14),

                // Teams
                Row(
                  children: [
                    Expanded(
                      child: _UpcomingTeamColumn(
                          name: match.team1Name,
                          logoUrl: match.team1LogoUrl),
                    ),
                    Column(
                      children: [
                        Text('VS',
                            style: GoogleFonts.poppins(
                                fontWeight: FontWeight.w700,
                                fontSize: 11,
                                color: AppTheme.ts(context))),
                        const SizedBox(height: 2),
                        Text(
                          '${match.team1Score}/${match.team1Wickets}',
                          style: GoogleFonts.poppins(
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                              color: AppTheme.accentGold),
                        ),
                        Text(
                          'vs',
                          style: GoogleFonts.poppins(
                              fontSize: 10, color: AppTheme.ts(context)),
                        ),
                        Text(
                          '${match.team2Score}/${match.team2Wickets}',
                          style: GoogleFonts.poppins(
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                              color: AppTheme.accentGold),
                        ),
                      ],
                    ),
                    Expanded(
                      child: _UpcomingTeamColumn(
                          name: match.team2Name,
                          logoUrl: match.team2LogoUrl),
                    ),
                  ],
                ),

                if (result.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryGreen.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      result,
                      style: GoogleFonts.poppins(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primaryGreen),
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],

                if (match.venue != null) ...[
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.location_on_rounded,
                          size: 12, color: AppTheme.ts(context)),
                      const SizedBox(width: 3),
                      Flexible(
                        child: Text(match.venue!,
                            style: GoogleFonts.poppins(
                                fontSize: 11,
                                color: AppTheme.ts(context)),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// =============================================================================
// PULSING DOT
// =============================================================================

class _PulsingDot extends StatefulWidget {
  final double size;
  final Color color;
  const _PulsingDot({this.size = 10, this.color = AppTheme.liveRed});

  @override
  State<_PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<_PulsingDot>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
        duration: const Duration(milliseconds: 1200), vsync: this)
      ..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final pulse =
            (math.sin(_controller.value * 2 * math.pi) + 1) / 2;
        return Container(
          width: widget.size,
          height: widget.size,
          decoration: BoxDecoration(
            color: widget.color,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: widget.color.withValues(alpha: 0.3 + pulse * 0.5),
                blurRadius: 4 + pulse * 6,
                spreadRadius: pulse * 3,
              ),
            ],
          ),
        );
      },
    );
  }
}

// =============================================================================
// OVERS PROGRESS PAINTER (ring)
// =============================================================================

class _OversProgressPainter extends CustomPainter {
  final double progress;
  final Color color;
  final Color backgroundColor;
  final double strokeWidth;

  _OversProgressPainter({
    required this.progress,
    required this.color,
    required this.backgroundColor,
    this.strokeWidth = 3,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (math.min(size.width, size.height) / 2) - strokeWidth;

    final bgPaint = Paint()
      ..color = backgroundColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;
    canvas.drawCircle(center, radius, bgPaint);

    if (progress > 0) {
      final progressPaint = Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        -math.pi / 2,
        progress * 2 * math.pi,
        false,
        progressPaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _OversProgressPainter oldDelegate) =>
      oldDelegate.progress != progress ||
      oldDelegate.color != color ||
      oldDelegate.backgroundColor != backgroundColor;
}
