import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../models/match.dart';
import '../../models/team.dart';
import '../../models/tournament.dart';
import '../../providers/auth_provider.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/notification_bell.dart';
import '../../widgets/protea_header.dart';
import '../players/register_player_screen.dart';
import '../profile/profile_screen.dart';
import '../teams/register_team_screen.dart';
import '../tournaments/create_tournament_screen.dart';
import '../viewer/match_detail_screen.dart';
import '../viewer/upcoming_match_detail_screen.dart';
import 'manage_teams_screen.dart';

class AdminDashboard extends StatefulWidget {
  const AdminDashboard({super.key});

  @override
  State<AdminDashboard> createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> with TickerProviderStateMixin {
  bool _loading = true;
  bool _showGreeting = true;
  late AnimationController _greetingController;
  late Animation<double> _greetingAnimation;

  List<CricketMatch> _live = [];
  List<CricketMatch> _upcoming = [];
  List<CricketMatch> _completed = [];
  List<Team> _teams = [];
  List<Tournament> _tournaments = [];
  int _playerCount = 0;
  List<dynamic> _topRunScorers = [];
  List<dynamic> _topWicketTakers = [];

  @override
  void initState() {
    super.initState();
    _initializeAnimation();
    _loadAll();
  }

  void _initializeAnimation() {
    _greetingController = AnimationController(
      duration: const Duration(milliseconds: 300),
      reverseDuration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _greetingAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _greetingController, curve: Curves.easeInOut),
    );
    _greetingController.forward();
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        _greetingController.reverse().then((_) {
          if (mounted) setState(() => _showGreeting = false);
        });
      }
    });
  }

  @override
  void dispose() {
    _greetingController.dispose();
    super.dispose();
  }

  Future<void> _loadAll() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        ApiService.getMatches(status: 'live'),
        ApiService.getMatches(status: 'upcoming'),
        ApiService.getMatches(status: 'completed'),
        ApiService.getTeams(),
        ApiService.getTournaments(),
        ApiService.getRegisteredPlayers(),
        ApiService.getPublicTopPlayers(),
      ]);
      _live = results[0] as List<CricketMatch>;
      _upcoming = results[1] as List<CricketMatch>;
      _completed = results[2] as List<CricketMatch>;
      _teams = results[3] as List<Team>;
      _tournaments = results[4] as List<Tournament>;
      _playerCount = (results[5] as List).length;
      final top = results[6] as Map<String, dynamic>;
      _topRunScorers = top['top_run_scorers'] ?? [];
      _topWicketTakers = top['top_wicket_takers'] ?? [];
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  int get _liveTournaments => _tournaments.where((t) => t.status == 'in_progress').length;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final userName = auth.user?.name.split(' ').first ?? 'Admin';

    return Scaffold(
      body: SafeArea(
        top: false,
        child: RefreshIndicator(
          color: AppTheme.primaryGreen,
          onRefresh: _loadAll,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: EdgeInsets.zero,
            children: [
              _buildHeader(context, auth, userName),
              if (_loading) ...[
                const SizedBox(height: 80),
                const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen)),
              ] else ...[
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  child: Text(
                    'Overview',
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.tp(context),
                    ),
                  ),
                ),
                _buildStatsGrid(),
                _buildQuickActions(),
                if (_live.isNotEmpty) _buildSection(
                  title: 'Live Now',
                  icon: Icons.sensors,
                  iconColor: AppTheme.liveRed,
                  child: _liveMatchesStrip(),
                ),
                if (_upcoming.isNotEmpty) _buildSection(
                  title: 'Upcoming Matches',
                  icon: Icons.calendar_today,
                  iconColor: AppTheme.upcomingBlue,
                  child: _upcomingList(),
                ),
                if (_completed.isNotEmpty) _buildSection(
                  title: 'Recent Results',
                  icon: Icons.history,
                  iconColor: AppTheme.completedGreen,
                  child: _recentList(),
                ),
                if (_topRunScorers.isNotEmpty || _topWicketTakers.isNotEmpty)
                  _buildSection(
                    title: 'Top Performers',
                    icon: Icons.star,
                    iconColor: AppTheme.accentAmber,
                    child: _topPerformers(),
                  ),
                if (_live.isEmpty && _upcoming.isEmpty && _completed.isEmpty)
                  _emptyState(),
                const SizedBox(height: 28),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // ---------- HEADER ----------
  Widget _buildHeader(BuildContext context, AuthProvider auth, String userName) {
    return Stack(
      children: [
        const ProteaHeader(height: 220),
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
        Positioned(
          top: MediaQuery.of(context).padding.top + 4,
          right: 4,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const NotificationBell(),
              Consumer<ThemeProvider>(
                builder: (context, theme, _) => IconButton(
                  icon: Icon(
                    theme.isDark ? Icons.light_mode : Icons.dark_mode,
                    color: Colors.white,
                  ),
                  onPressed: theme.toggle,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.logout, color: Colors.white),
                onPressed: () => _confirmLogout(context),
              ),
            ],
          ),
        ),
        Positioned(
          left: 0,
          right: 0,
          bottom: 8,
          child: Column(
            children: [
              if (_showGreeting)
                FadeTransition(
                  opacity: _greetingAnimation,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.95),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.2),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.notifications_active, size: 16, color: AppTheme.liveRed),
                        const SizedBox(width: 6),
                        Text(
                          'Hii $userName!',
                          style: GoogleFonts.poppins(
                            color: AppTheme.textPrimary,
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              if (_showGreeting) const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.accentGold,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.admin_panel_settings,
                        size: 14, color: AppTheme.textPrimary),
                    const SizedBox(width: 4),
                    Text(
                      'ADMIN',
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textPrimary,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ---------- STATS GRID ----------
  Widget _buildStatsGrid() {
    final tiles = [
      _StatTileData('Live', _live.length, AppTheme.liveRed, Icons.sensors),
      _StatTileData('Upcoming', _upcoming.length, AppTheme.upcomingBlue, Icons.event),
      _StatTileData('Completed', _completed.length, AppTheme.completedGreen, Icons.history),
      _StatTileData('Teams', _teams.length, AppTheme.primaryGreen, Icons.shield),
      _StatTileData('Tournaments', _tournaments.length, AppTheme.accentAmber, Icons.emoji_events,
          badge: _liveTournaments > 0 ? '$_liveTournaments live' : null),
      _StatTileData('Players', _playerCount, AppTheme.team2Color, Icons.people),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          mainAxisExtent: 120,
        ),
        itemCount: tiles.length,
        itemBuilder: (_, i) => _statTile(tiles[i]),
      ),
    );
  }

  Widget _statTile(_StatTileData t) {
    return Card(
      margin: EdgeInsets.zero,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: t.label == 'Teams' 
            ? () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const ManageTeamsScreen()),
                )
            : null,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: t.color.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(t.icon, color: t.color, size: 20),
              ),
              const SizedBox(height: 8),
              Text(
                t.value.toString(),
                style: GoogleFonts.poppins(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.tp(context),
                  height: 1,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                t.label,
                style: GoogleFonts.poppins(fontSize: 11, color: AppTheme.ts(context)),
              ),
              if (t.badge != null) ...[
                const SizedBox(height: 2),
                Text(
                  t.badge!,
                  style: GoogleFonts.poppins(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: t.color,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // ---------- QUICK ACTIONS ----------
  Widget _buildQuickActions() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Row(
        children: [
          Expanded(
            child: _actionButton(
              label: 'New Tournament',
              icon: Icons.emoji_events,
              color: AppTheme.accentAmber,
              onTap: () async {
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const CreateTournamentScreen()),
                );
                if (result == true) _loadAll();
              },
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _actionButton(
              label: 'New Team',
              icon: Icons.shield,
              color: AppTheme.primaryGreen,
              onTap: () async {
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const RegisterTeamScreen()),
                );
                if (result == true) _loadAll();
              },
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _actionButton(
              label: 'New Player',
              icon: Icons.person_add_alt_1,
              color: AppTheme.upcomingBlue,
              onTap: () async {
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const RegisterPlayerScreen()),
                );
                if (result == true) _loadAll();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _actionButton({
    required String label,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Ink(
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.10),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: color.withValues(alpha: 0.35), width: 0.8),
          ),
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: color, size: 22),
              const SizedBox(height: 6),
              Text(
                label,
                textAlign: TextAlign.center,
                style: GoogleFonts.poppins(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ---------- SECTIONS ----------
  Widget _buildSection({
    required String title,
    required IconData icon,
    required Color iconColor,
    required Widget child,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 22, 16, 10),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.13),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: iconColor, size: 18),
              ),
              const SizedBox(width: 10),
              Text(
                title,
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.tp(context),
                ),
              ),
            ],
          ),
        ),
        child,
      ],
    );
  }

  // ---------- LIVE MATCHES STRIP ----------
  Widget _liveMatchesStrip() {
    return SizedBox(
      height: 170,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: _live.length,
        itemBuilder: (_, i) {
          final m = _live[i];
          return Container(
            width: 270,
            margin: const EdgeInsets.symmetric(horizontal: 4),
            child: Card(
              margin: EdgeInsets.zero,
              child: InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => MatchDetailScreen(matchId: m.id)),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          _liveBadge(),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              m.isSecondInnings ? '2nd Inn' : '1st Inn',
                              style: GoogleFonts.poppins(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.primaryGreen,
                              ),
                            ),
                          ),
                          const Spacer(),
                          Flexible(
                            child: Text(
                              m.venue ?? '',
                              textAlign: TextAlign.right,
                              style: TextStyle(fontSize: 11, color: AppTheme.ts(context)),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      _teamScoreRow(m.team1Name, '${m.team1Score}/${m.team1Wickets}',
                          m.team1Overs, isBatting: m.battingTeam == 1),
                      const SizedBox(height: 6),
                      _teamScoreRow(m.team2Name, '${m.team2Score}/${m.team2Wickets}',
                          m.team2Overs, isBatting: m.battingTeam == 2),
                      const Spacer(),
                      Row(
                        children: [
                          Icon(Icons.speed, size: 12, color: AppTheme.ts(context)),
                          const SizedBox(width: 3),
                          Text(
                            'CRR ${m.currentRunRate.toStringAsFixed(2)}',
                            style: GoogleFonts.poppins(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.ts(context),
                            ),
                          ),
                          if (m.isSecondInnings && m.runsNeeded > 0) ...[
                            const SizedBox(width: 10),
                            Icon(Icons.flag_outlined, size: 12, color: AppTheme.liveRed),
                            const SizedBox(width: 3),
                            Flexible(
                              child: Text(
                                'Need ${m.runsNeeded} (${m.ballsRemaining}b)',
                                style: GoogleFonts.poppins(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.liveRed,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _liveBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: AppTheme.liveRed,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 5,
            height: 5,
            decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
          ),
          const SizedBox(width: 4),
          Text(
            'LIVE',
            style: GoogleFonts.poppins(
              color: Colors.white,
              fontSize: 9,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _teamScoreRow(String name, String score, double overs, {required bool isBatting}) {
    return Row(
      children: [
        CircleAvatar(
          radius: 11,
          backgroundColor: (isBatting ? AppTheme.liveRed : AppTheme.primaryGreen)
              .withValues(alpha: 0.15),
          child: Text(
            name.isNotEmpty ? name[0].toUpperCase() : '?',
            style: GoogleFonts.poppins(
              color: isBatting ? AppTheme.liveRed : AppTheme.primaryGreen,
              fontWeight: FontWeight.bold,
              fontSize: 10,
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            name,
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w600,
              fontSize: 13,
              color: AppTheme.tp(context),
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
        Text(
          score,
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.bold,
            fontSize: 13,
            color: AppTheme.tp(context),
          ),
        ),
        const SizedBox(width: 3),
        Text(
          '(${overs.toStringAsFixed(1)})',
          style: GoogleFonts.poppins(fontSize: 10.5, color: AppTheme.ts(context)),
        ),
      ],
    );
  }

  // ---------- UPCOMING ----------
  Widget _upcomingList() {
    final items = _upcoming.take(5).toList();
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: items.map((m) {
          final date = m.matchDate.toLocal();
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Card(
              margin: EdgeInsets.zero,
              child: InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => UpcomingMatchDetailScreen(matchId: m.id)),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Container(
                        width: 48,
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        decoration: BoxDecoration(
                          color: AppTheme.upcomingBlue.withValues(alpha: 0.10),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Column(
                          children: [
                            Text(
                              DateFormat('MMM').format(date).toUpperCase(),
                              style: GoogleFonts.poppins(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.upcomingBlue,
                              ),
                            ),
                            Text(
                              date.day.toString(),
                              style: GoogleFonts.poppins(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.upcomingBlue,
                                height: 1,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${m.team1Name} vs ${m.team2Name}',
                              style: GoogleFonts.poppins(
                                fontWeight: FontWeight.w600,
                                fontSize: 13.5,
                                color: AppTheme.tp(context),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                Icon(Icons.place,
                                    size: 11, color: AppTheme.ts(context)),
                                const SizedBox(width: 3),
                                Expanded(
                                  child: Text(
                                    m.venue ?? 'TBD',
                                    style: TextStyle(
                                        fontSize: 11.5, color: AppTheme.ts(context)),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      Icon(Icons.chevron_right, color: AppTheme.ts(context)),
                    ],
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  // ---------- RECENT ----------
  Widget _recentList() {
    final items = _completed.take(5).toList();
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: items.map((m) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Card(
              margin: EdgeInsets.zero,
              child: InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => MatchDetailScreen(matchId: m.id)),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.completedGreen.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              'COMPLETED',
                              style: GoogleFonts.poppins(
                                fontSize: 9,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.completedGreen,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                          const Spacer(),
                          if (m.winner != null)
                            Row(
                              children: [
                                const Icon(Icons.emoji_events,
                                    size: 13, color: AppTheme.accentAmber),
                                const SizedBox(width: 3),
                                Text(
                                  '${m.winner} won',
                                  style: GoogleFonts.poppins(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.primaryGreen,
                                  ),
                                ),
                              ],
                            ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${m.team1Name} vs ${m.team2Name}',
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w700,
                          fontSize: 13.5,
                          color: AppTheme.tp(context),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${m.team1Score}/${m.team1Wickets}  •  ${m.team2Score}/${m.team2Wickets}',
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w500,
                          fontSize: 12,
                          color: AppTheme.ts(context),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  // ---------- TOP PERFORMERS ----------
  Widget _topPerformers() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: _leaderCard(
              title: 'Most Runs',
              icon: Icons.sports_cricket,
              color: AppTheme.team1Color,
              players: _topRunScorers,
              statKey: 'runs',
              statLabel: 'runs',
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _leaderCard(
              title: 'Most Wickets',
              icon: Icons.flash_on,
              color: AppTheme.team2Color,
              players: _topWicketTakers,
              statKey: 'wickets',
              statLabel: 'wkts',
            ),
          ),
        ],
      ),
    );
  }

  Widget _leaderCard({
    required String title,
    required IconData icon,
    required Color color,
    required List<dynamic> players,
    required String statKey,
    required String statLabel,
  }) {
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(5),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.13),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Icon(icon, color: color, size: 14),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    title,
                    style: GoogleFonts.poppins(
                      fontSize: 12.5,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.tp(context),
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            if (players.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  'No data yet',
                  style: TextStyle(color: AppTheme.ts(context), fontSize: 11.5),
                ),
              )
            else
              ...players.take(3).toList().asMap().entries.map((entry) {
                final i = entry.key;
                final p = entry.value;
                final rankColors = [
                  AppTheme.accentGold,
                  const Color(0xFFC0C0C0),
                  const Color(0xFFCD7F32),
                ];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    children: [
                      Container(
                        width: 16,
                        height: 16,
                        decoration: BoxDecoration(
                          color: rankColors[i],
                          shape: BoxShape.circle,
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          '${i + 1}',
                          style: GoogleFonts.poppins(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: 7),
                      Expanded(
                        child: Text(
                          p['name'] ?? '',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.poppins(
                            color: AppTheme.tp(context),
                            fontSize: 11.5,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      Text(
                        '${p[statKey] ?? 0} $statLabel',
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.bold,
                          fontSize: 11.5,
                          color: color,
                        ),
                      ),
                    ],
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }

  // ---------- EMPTY / LOGOUT ----------
  Widget _emptyState() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 24),
      child: Column(
        children: [
          Icon(Icons.dashboard_outlined, size: 56, color: AppTheme.ts(context)),
          const SizedBox(height: 12),
          Text(
            'Nothing to show yet',
            style: GoogleFonts.poppins(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: AppTheme.tp(context),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Create a tournament or team to get started.',
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(fontSize: 12, color: AppTheme.ts(context)),
          ),
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

class _StatTileData {
  final String label;
  final int value;
  final Color color;
  final IconData icon;
  final String? badge;
  const _StatTileData(this.label, this.value, this.color, this.icon, {this.badge});
}
