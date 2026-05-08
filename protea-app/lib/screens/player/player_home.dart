import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/match.dart';
import '../../models/tournament.dart';
import '../../services/api_service.dart';
import '../../services/auth_provider.dart';
import '../../services/theme_provider.dart';
import '../../theme/app_theme.dart';
import '../viewer/match_detail_screen.dart';
import '../tournaments/tournament_detail_screen.dart';
import '../profile/profile_screen.dart';
import 'my_journey_screen.dart';
import 'player_dashboard_screen.dart';
import 'player_search_screen.dart';

class PlayerHome extends StatefulWidget {
  const PlayerHome({super.key});

  @override
  State<PlayerHome> createState() => _PlayerHomeState();
}

class _PlayerHomeState extends State<PlayerHome> {
  int _currentIndex = 0;

  // Matches tab state
  List<CricketMatch> _matches = [];
  bool _matchesLoading = true;

  // Tournaments tab state
  List<Tournament> _tournaments = [];
  bool _tournamentsLoading = true;

  @override
  void initState() {
    super.initState();
    _loadMatches();
    _loadTournaments();
  }

  Future<void> _loadMatches() async {
    setState(() => _matchesLoading = true);
    try {
      final results = await Future.wait([
        ApiService.getMatches(status: 'live'),
        ApiService.getMatches(status: 'upcoming'),
        ApiService.getMatches(status: 'completed'),
      ]);
      _matches = [...results[0], ...results[1], ...results[2]];
    } catch (_) {}
    if (mounted) setState(() => _matchesLoading = false);
  }

  Future<void> _loadTournaments() async {
    setState(() => _tournamentsLoading = true);
    try {
      _tournaments = await ApiService.getTournaments();
    } catch (_) {}
    if (mounted) setState(() => _tournamentsLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    final tabs = [
      const PlayerDashboardScreen(),
      MyJourneyScreen(playerId: user?.id ?? ''),
      const PlayerSearchScreen(),
      _buildMatchesAndTournamentsTab(),
      const ProfileScreen(),
    ];

    final tabLabels = ['Dashboard', 'My Journey', 'Players', 'Matches', 'Profile'];
    final tabIcons = [
      Icons.dashboard,
      Icons.timeline,
      Icons.people,
      Icons.sports_cricket,
      Icons.person,
    ];

    final isProfileTab = _currentIndex == 4;

    return Scaffold(
      appBar: isProfileTab
          ? null
          : AppBar(
              leading: IconButton(
                icon: const Icon(Icons.sports_cricket, color: AppTheme.accentGold),
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileScreen())).then((_) => setState(() {})),
              ),
              title: Text(
                tabLabels[_currentIndex],
                style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 18),
                overflow: TextOverflow.ellipsis,
              ),
              actions: [
                Consumer<ThemeProvider>(
                  builder: (_, theme, __) => IconButton(
                    icon: Icon(theme.isDark ? Icons.light_mode : Icons.dark_mode),
                    tooltip: theme.isDark ? 'Light mode' : 'Dark mode',
                    onPressed: theme.toggle,
                  ),
                ),
                if (_currentIndex == 0 || _currentIndex == 3)
                  IconButton(
                    icon: const Icon(Icons.refresh),
                    onPressed: () {
                      if (_currentIndex == 3) {
                        _loadMatches();
                        _loadTournaments();
                      }
                    },
                  ),
              ],
            ),
      body: IndexedStack(
        index: _currentIndex,
        children: tabs,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        destinations: List.generate(5, (i) => NavigationDestination(
          icon: Icon(tabIcons[i]),
          label: tabLabels[i],
        )),
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        indicatorColor: AppTheme.primaryGreen.withValues(alpha: 0.15),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
      ),
    );
  }

  // ==================== MATCHES + TOURNAMENTS TAB ====================
  Widget _buildMatchesAndTournamentsTab() {
    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          Container(
            color: Theme.of(context).scaffoldBackgroundColor,
            child: const TabBar(
              indicatorColor: AppTheme.accentGold,
              labelColor: AppTheme.accentGold,
              unselectedLabelColor: AppTheme.textSecondary,
              tabs: [
                Tab(icon: Icon(Icons.sports_cricket, size: 18), text: 'Matches'),
                Tab(icon: Icon(Icons.emoji_events, size: 18), text: 'Tournaments'),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              children: [
                _buildMatchesTab(),
                _buildTournamentsTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMatchesTab() {
    if (_matchesLoading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.accentGold));
    }

    final live = _matches.where((m) => m.status == 'live').toList();
    final upcoming = _matches.where((m) => m.status == 'upcoming').toList();
    final completed = _matches.where((m) => m.status == 'completed').toList();

    return RefreshIndicator(
      onRefresh: _loadMatches,
      color: AppTheme.accentGold,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (live.isNotEmpty) ...[
            _sectionHeader('🔴 Live Now', AppTheme.wicketRed),
            ...live.asMap().entries.map((e) => _buildMatchCard(e.value, e.key)),
          ],
          if (upcoming.isNotEmpty) ...[
            _sectionHeader('Upcoming — Join Now!', AppTheme.upcomingBlue),
            ...upcoming.asMap().entries.map((e) => _buildMatchCard(e.value, e.key)),
          ],
          if (completed.isNotEmpty) ...[
            _sectionHeader('Recent Results', AppTheme.lightGreen),
            ...completed.take(15).toList().asMap().entries.map((e) => _buildMatchCard(e.value, e.key)),
          ],
          if (_matches.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 64),
                child: Column(
                  children: [
                    Icon(Icons.sports_cricket, size: 64, color: AppTheme.ts(context).withValues(alpha: 0.3)),
                    const SizedBox(height: 16),
                    Text('No matches yet', style: TextStyle(color: AppTheme.ts(context), fontSize: 16)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildMatchCard(CricketMatch match, int index) {
    final isLive = match.status == 'live';
    final isCompleted = match.status == 'completed';
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => MatchDetailScreen(matchId: match.id))),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text('${match.team1Name} vs ${match.team2Name}',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15), maxLines: 1, overflow: TextOverflow.ellipsis),
                  ),
                  _statusChip(match.status),
                ],
              ),
              const SizedBox(height: 6),
              if (match.venue != null)
                Row(children: [
                  Icon(Icons.location_on, size: 12, color: AppTheme.ts(context)),
                  const SizedBox(width: 3),
                  Text(match.venue!, style: TextStyle(fontSize: 11, color: AppTheme.ts(context))),
                ]),
              Row(children: [
                Icon(Icons.calendar_today, size: 12, color: AppTheme.ts(context)),
                const SizedBox(width: 3),
                Text(DateFormat('dd MMM yyyy, hh:mm a').format(match.matchDate),
                    style: TextStyle(fontSize: 11, color: AppTheme.ts(context))),
              ]),
              if (!isLive && !isCompleted && !context.read<AuthProvider>().user!.approved)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: AppTheme.accentAmber.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                    child: const Text('Account pending approval to join', style: TextStyle(fontSize: 11, color: AppTheme.accentAmber)),
                  ),
                ),
              if (isLive || isCompleted) ...[
                const SizedBox(height: 8),
                Row(children: [
                  Expanded(child: _scoreChip(match.team1Name, match.team1Score, match.team1Wickets, match.team1Overs, isWinner: match.winner == match.team1Name)),
                  const SizedBox(width: 8),
                  Expanded(child: _scoreChip(match.team2Name, match.team2Score, match.team2Wickets, match.team2Overs, isWinner: match.winner == match.team2Name)),
                ]),
              ],
              if (match.winner != null) ...[
                const SizedBox(height: 6),
                Row(children: [
                  const Icon(Icons.emoji_events, size: 14, color: AppTheme.accentGold),
                  const SizedBox(width: 4),
                  Text('${match.winner} wins', style: const TextStyle(color: AppTheme.accentGold, fontWeight: FontWeight.w600, fontSize: 12)),
                ]),
              ],
              if (match.status == 'upcoming') ...[
                const SizedBox(height: 10),
                Row(children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _joinMatch(match, 1),
                      icon: const Icon(Icons.group_add, size: 16),
                      label: Text('Join ${match.team1Name}', overflow: TextOverflow.ellipsis),
                      style: ElevatedButton.styleFrom(backgroundColor: AppTheme.team1Color, padding: const EdgeInsets.symmetric(vertical: 8)),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _joinMatch(match, 2),
                      icon: const Icon(Icons.group_add, size: 16),
                      label: Text('Join ${match.team2Name}', overflow: TextOverflow.ellipsis),
                      style: ElevatedButton.styleFrom(backgroundColor: AppTheme.team2Color, padding: const EdgeInsets.symmetric(vertical: 8)),
                    ),
                  ),
                ]),
              ],
            ],
          ),
        ),
      ),
    ).animate().slideY(begin: 0.05, delay: (index * 60).ms).fadeIn();
  }

  Widget _scoreChip(String team, int runs, int wickets, double overs, {bool isWinner = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: isWinner ? AppTheme.accentGold.withValues(alpha: 0.1) : Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: isWinner ? AppTheme.accentGold.withValues(alpha: 0.4) : Theme.of(context).dividerColor.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(team, style: TextStyle(fontSize: 10, color: AppTheme.ts(context)), overflow: TextOverflow.ellipsis),
          Text('$runs/$wickets (${overs.toStringAsFixed(1)})', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: isWinner ? AppTheme.accentGold : AppTheme.tp(context))),
        ],
      ),
    );
  }

  Widget _buildTournamentsTab() {
    if (_tournamentsLoading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.accentGold));
    }

    final active = _tournaments.where((t) => t.status == 'active' || t.status == 'in_progress').toList();
    final upcoming = _tournaments.where((t) => t.status == 'upcoming').toList();
    final completed = _tournaments.where((t) => t.status == 'completed').toList();

    return RefreshIndicator(
      onRefresh: _loadTournaments,
      color: AppTheme.accentGold,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (active.isNotEmpty) ...[
            _sectionHeader('Active Tournaments', AppTheme.accentGold),
            ...active.asMap().entries.map((e) => _buildTournamentCard(e.value, e.key)),
          ],
          if (upcoming.isNotEmpty) ...[
            _sectionHeader('Upcoming Tournaments', AppTheme.upcomingBlue),
            ...upcoming.asMap().entries.map((e) => _buildTournamentCard(e.value, e.key)),
          ],
          if (completed.isNotEmpty) ...[
            _sectionHeader('Past Tournaments', AppTheme.textSecondary),
            ...completed.take(10).toList().asMap().entries.map((e) => _buildTournamentCard(e.value, e.key)),
          ],
          if (_tournaments.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 64),
                child: Column(
                  children: [
                    Icon(Icons.emoji_events, size: 64, color: AppTheme.ts(context).withValues(alpha: 0.3)),
                    const SizedBox(height: 16),
                    Text('No tournaments yet', style: TextStyle(color: AppTheme.ts(context), fontSize: 16)),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTournamentCard(Tournament t, int index) {
    final isActive = t.status == 'active' || t.status == 'in_progress';
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => TournamentDetailScreen(tournamentId: t.id))),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 46, height: 46,
                decoration: BoxDecoration(
                  color: (isActive ? AppTheme.accentGold : AppTheme.upcomingBlue).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(Icons.emoji_events, color: isActive ? AppTheme.accentGold : AppTheme.upcomingBlue, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(t.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 3),
                    Row(children: [
                      _pill(t.type, AppTheme.primaryGreen),
                      const SizedBox(width: 6),
                      _pill('${t.overs} Overs', AppTheme.accentAmber),
                    ]),
                    if (t.startDate != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 3),
                        child: Text(DateFormat('dd MMM yyyy').format(t.startDate!), style: TextStyle(fontSize: 10, color: AppTheme.ts(context))),
                      ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppTheme.textSecondary),
            ],
          ),
        ),
      ),
    ).animate().slideX(begin: 0.05, delay: (index * 60).ms).fadeIn();
  }

  Widget _sectionHeader(String title, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, top: 4),
      child: Row(children: [
        Container(width: 4, height: 18, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 8),
        Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: color)),
      ]),
    );
  }

  Widget _statusChip(String status) {
    Color color;
    switch (status) {
      case 'live': color = AppTheme.wicketRed; break;
      case 'completed': color = AppTheme.lightGreen; break;
      default: color = AppTheme.upcomingBlue;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(10)),
      child: Text(status.toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: color)),
    );
  }

  Widget _pill(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(5)),
      child: Text(label, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: color)),
    );
  }

  Future<void> _joinMatch(CricketMatch match, int team) async {
    try {
      await ApiService.joinMatch(match.id, team: team);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Join request sent for ${team == 1 ? match.team1Name : match.team2Name}!'),
          backgroundColor: AppTheme.lightGreen,
        ));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: AppTheme.wicketRed,
        ));
      }
    }
  }
}
