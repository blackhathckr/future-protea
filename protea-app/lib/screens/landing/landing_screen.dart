import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../models/match.dart';
import '../../providers/theme_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/protea_header.dart';
import '../auth/login_screen.dart';
import '../guest/guest_match_detail_screen.dart';
import 'news_detail_screen.dart';

class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> {
  bool _loading = true;
  List<CricketMatch> _liveMatches = [];
  List<CricketMatch> _upcomingMatches = [];
  List<CricketMatch> _recentMatches = [];
  List<dynamic> _topRunScorers = [];
  List<dynamic> _topWicketTakers = [];
  List<dynamic> _newsArticles = [];

  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;
  List<dynamic> _searchMatchResults = [];
  List<dynamic> _searchPlayerResults = [];

  @override
  void initState() {
    super.initState();
    _loadAllData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadAllData() async {
    setState(() => _loading = true);
    try {
      final futures = await Future.wait([
        ApiService.getPublicMatches(status: 'live'),
        ApiService.getPublicMatches(status: 'upcoming', limit: 5),
        ApiService.getPublicMatches(status: 'completed', limit: 5),
        ApiService.getPublicTopPlayers(),
        ApiService.getPublicNews(),
      ]);

      _liveMatches = futures[0] as List<CricketMatch>;
      _upcomingMatches = futures[1] as List<CricketMatch>;
      _recentMatches = futures[2] as List<CricketMatch>;

      final topPlayers = futures[3] as Map<String, dynamic>;
      _topRunScorers = topPlayers['top_run_scorers'] ?? [];
      _topWicketTakers = topPlayers['top_wicket_takers'] ?? [];

      final news = futures[4] as Map<String, dynamic>;
      _newsArticles = news['articles'] ?? [];
    } catch (e) {
      debugPrint('Error loading landing data: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _performSearch(String query) async {
    if (query.isEmpty) {
      setState(() {
        _isSearching = false;
        _searchMatchResults = [];
        _searchPlayerResults = [];
      });
      return;
    }

    setState(() => _isSearching = true);
    try {
      final results = await ApiService.publicSearch(query);
      if (mounted) {
        setState(() {
          _searchMatchResults = results['matches'] ?? [];
          _searchPlayerResults = results['players'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Error searching: $e');
    }
  }

  void _openNews(Map<String, dynamic> article) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => NewsDetailScreen(article: article)),
    );
  }

  void _navigateToLogin() {
    Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  void _openMatch(String id) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => GuestMatchDetailScreen(matchId: id)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        top: false,
        child: RefreshIndicator(
          color: AppTheme.primaryGreen,
          onRefresh: _loadAllData,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: Column(
              children: [
                _buildHeader(),
                _buildSearchBar(),
                if (_loading)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 80),
                    child: CircularProgressIndicator(color: AppTheme.primaryGreen),
                  )
                else if (_isSearching && _searchController.text.isNotEmpty)
                  _buildSearchResults()
                else ...[
                  if (_liveMatches.isNotEmpty) _buildLiveMatches(),
                  _buildQuickStats(),
                  if (_upcomingMatches.isNotEmpty) _buildUpcomingMatches(),
                  if (_recentMatches.isNotEmpty) _buildRecentMatches(),
                  if (_topRunScorers.isNotEmpty || _topWicketTakers.isNotEmpty)
                    _buildTopPlayers(),
                  if (_newsArticles.isNotEmpty) _buildNews(),
                  _buildBottomCTA(),
                  const SizedBox(height: 32),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ---------- HEADER (matches login/register style) ----------
  Widget _buildHeader() {
    return Stack(
      children: [
        const ProteaHeader(height: 200),
        Positioned(
          top: MediaQuery.of(context).padding.top + 8,
          right: 8,
          child: Row(
            children: [
              Consumer<ThemeProvider>(
                builder: (context, theme, _) => IconButton(
                  icon: Icon(
                    theme.isDark ? Icons.light_mode : Icons.dark_mode,
                    color: Colors.white,
                  ),
                  onPressed: theme.toggle,
                ),
              ),
              TextButton.icon(
                onPressed: _navigateToLogin,
                icon: const Icon(Icons.login, color: Colors.white, size: 18),
                label: Text(
                  'Sign In',
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ---------- SEARCH ----------
  Widget _buildSearchBar() {
    return Transform.translate(
      offset: const Offset(0, -24),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Card(
          elevation: 6,
          shadowColor: Colors.black26,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: TextField(
              controller: _searchController,
              onChanged: _performSearch,
              style: GoogleFonts.poppins(fontSize: 14, color: AppTheme.tp(context)),
              decoration: InputDecoration(
                hintText: 'Search matches, players, venues…',
                hintStyle: TextStyle(color: AppTheme.ts(context), fontSize: 14),
                prefixIcon: const Icon(Icons.search, color: AppTheme.primaryGreen),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          _performSearch('');
                        },
                      )
                    : null,
                filled: false,
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSearchResults() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_searchMatchResults.isNotEmpty) ...[
            Text(
              'Matches',
              style: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.tp(context),
              ),
            ),
            const SizedBox(height: 8),
            ..._searchMatchResults.map((m) {
              final match = CricketMatch.fromJson(m);
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: AppTheme.primaryGreen,
                    child: Icon(Icons.sports_cricket, color: Colors.white, size: 16),
                  ),
                  title: Text(
                    '${match.team1Name} vs ${match.team2Name}',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w600,
                      color: AppTheme.tp(context),
                    ),
                  ),
                  subtitle: Text(
                    '${match.venue ?? 'Unknown venue'} • ${match.status}',
                    style: TextStyle(color: AppTheme.ts(context)),
                  ),
                  onTap: () => _openMatch(match.id),
                ),
              );
            }),
            const SizedBox(height: 16),
          ],
          if (_searchPlayerResults.isNotEmpty) ...[
            Text(
              'Players',
              style: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.tp(context),
              ),
            ),
            const SizedBox(height: 8),
            ..._searchPlayerResults.map((p) {
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: AppTheme.primaryGreen.withOpacity(0.15),
                    backgroundImage: p['photo_url'] != null
                        ? NetworkImage(ApiService.getPhotoUrl(p['photo_url']))
                        : null,
                    child: p['photo_url'] == null
                        ? const Icon(Icons.person, color: AppTheme.primaryGreen)
                        : null,
                  ),
                  title: Text(
                    p['name'] ?? 'Unknown',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w600,
                      color: AppTheme.tp(context),
                    ),
                  ),
                  subtitle: Text(
                    '${p['batting_style'] ?? ''} ${p['bowling_style'] ?? ''}',
                    style: TextStyle(color: AppTheme.ts(context)),
                  ),
                ),
              );
            }),
          ],
          if (_searchMatchResults.isEmpty && _searchPlayerResults.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  children: [
                    Icon(Icons.search_off, size: 48, color: AppTheme.ts(context)),
                    const SizedBox(height: 12),
                    Text(
                      'No results found for "${_searchController.text}"',
                      style: TextStyle(color: AppTheme.ts(context)),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  // ---------- QUICK STATS ----------
  Widget _buildQuickStats() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
      child: Row(
        children: [
          _statTile(Icons.sensors, AppTheme.liveRed, _liveMatches.length.toString(), 'Live'),
          const SizedBox(width: 10),
          _statTile(Icons.event, AppTheme.upcomingBlue, _upcomingMatches.length.toString(), 'Upcoming'),
          const SizedBox(width: 10),
          _statTile(Icons.history, AppTheme.completedGreen, _recentMatches.length.toString(), 'Recent'),
        ],
      ),
    );
  }

  Widget _statTile(IconData icon, Color color, String value, String label) {
    return Expanded(
      child: Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 18),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      value,
                      style: GoogleFonts.poppins(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.tp(context),
                        height: 1,
                      ),
                    ),
                    Text(
                      label,
                      style: TextStyle(fontSize: 11, color: AppTheme.ts(context)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ---------- SECTION HEADER ----------
  Widget _buildSectionTitle(String title, {IconData? icon, Color? iconColor}) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
      child: Row(
        children: [
          if (icon != null) ...[
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: (iconColor ?? AppTheme.primaryGreen).withOpacity(0.13),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: iconColor ?? AppTheme.primaryGreen, size: 18),
            ),
            const SizedBox(width: 10),
          ],
          Text(
            title,
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppTheme.tp(context),
            ),
          ),
        ],
      ),
    );
  }

  // ---------- LIVE MATCHES ----------
  Widget _buildLiveMatches() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Live Now', icon: Icons.sensors, iconColor: AppTheme.liveRed),
        SizedBox(
          height: 260,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: _liveMatches.length,
            itemBuilder: (context, index) {
              final match = _liveMatches[index];
              final battingTeam = match.battingTeam;
              return Container(
                width: 300,
                margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                child: Card(
                  margin: EdgeInsets.zero,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(12),
                    onTap: () => _openMatch(match.id),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: AppTheme.liveRed,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      width: 6,
                                      height: 6,
                                      decoration: const BoxDecoration(
                                        color: Colors.white,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      'LIVE',
                                      style: GoogleFonts.poppins(
                                        color: Colors.white,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryGreen.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  match.isSecondInnings ? '2nd Inn' : '1st Inn',
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
                                  match.venue ?? '',
                                  textAlign: TextAlign.right,
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: AppTheme.ts(context),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          _liveTeamRow(
                            match.team1Name,
                            '${match.team1Score}/${match.team1Wickets}',
                            match.team1Overs,
                            isBatting: battingTeam == 1,
                          ),
                          const SizedBox(height: 8),
                          _liveTeamRow(
                            match.team2Name,
                            '${match.team2Score}/${match.team2Wickets}',
                            match.team2Overs,
                            isBatting: battingTeam == 2,
                          ),
                          const SizedBox(height: 10),
                          Divider(height: 1, color: AppTheme.divider(context)),
                          const SizedBox(height: 8),
                          _liveStatsRow(match),
                          if (match.tossSummary != null) ...[
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Icon(Icons.casino_outlined, size: 12, color: AppTheme.ts(context)),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    match.tossSummary!,
                                    style: GoogleFonts.poppins(
                                      fontSize: 11,
                                      color: AppTheme.ts(context),
                                      fontStyle: FontStyle.italic,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
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
            },
          ),
        ),
      ],
    );
  }

  Widget _liveTeamRow(String name, String score, double overs, {required bool isBatting}) {
    return Row(
      children: [
        CircleAvatar(
          radius: 13,
          backgroundColor: (isBatting ? AppTheme.liveRed : AppTheme.primaryGreen).withOpacity(0.15),
          child: Text(
            name.isNotEmpty ? name[0].toUpperCase() : '?',
            style: GoogleFonts.poppins(
              color: isBatting ? AppTheme.liveRed : AppTheme.primaryGreen,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Row(
            children: [
              Flexible(
                child: Text(
                  name,
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: AppTheme.tp(context),
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (isBatting) ...[
                const SizedBox(width: 6),
                const Icon(Icons.sports_cricket, size: 12, color: AppTheme.liveRed),
              ],
            ],
          ),
        ),
        Text(
          score,
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.bold,
            fontSize: 15,
            color: AppTheme.tp(context),
          ),
        ),
        const SizedBox(width: 4),
        Text(
          '(${overs.toStringAsFixed(1)})',
          style: GoogleFonts.poppins(
            fontSize: 11,
            color: AppTheme.ts(context),
          ),
        ),
      ],
    );
  }

  Widget _liveStatsRow(CricketMatch match) {
    final crr = match.currentRunRate;
    final crrText = crr > 0 ? crr.toStringAsFixed(2) : '–';

    if (match.isSecondInnings && match.battingTeam != null) {
      final rrr = match.requiredRunRate;
      final rrrText = match.runsNeeded > 0 && match.ballsRemaining > 0
          ? rrr.toStringAsFixed(2)
          : '–';
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: _statPill('CRR', crrText, AppTheme.primaryGreen)),
              const SizedBox(width: 6),
              Expanded(child: _statPill('RRR', rrrText, AppTheme.liveRed)),
            ],
          ),
          const SizedBox(height: 6),
          if (match.runsNeeded > 0)
            Text(
              'Need ${match.runsNeeded} from ${match.ballsRemaining} balls',
              style: GoogleFonts.poppins(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppTheme.tp(context),
              ),
            )
          else
            Text(
              'Target achieved',
              style: GoogleFonts.poppins(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppTheme.completedGreen,
              ),
            ),
        ],
      );
    }

    return Row(
      children: [
        Expanded(child: _statPill('CRR', crrText, AppTheme.primaryGreen)),
        const SizedBox(width: 6),
        Expanded(
          child: _statPill(
            'OVERS',
            '${match.battingOvers.toStringAsFixed(1)}/${match.totalOvers}',
            AppTheme.upcomingBlue,
          ),
        ),
      ],
    );
  }

  Widget _statPill(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.10),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: GoogleFonts.poppins(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: color,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: AppTheme.tp(context),
            ),
          ),
        ],
      ),
    );
  }

  // ---------- UPCOMING ----------
  Widget _buildUpcomingMatches() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Upcoming Fixtures', icon: Icons.calendar_today, iconColor: AppTheme.upcomingBlue),
        ListView.builder(
          physics: const NeverScrollableScrollPhysics(),
          shrinkWrap: true,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: _upcomingMatches.length,
          itemBuilder: (context, index) {
            final match = _upcomingMatches[index];
            final date = match.matchDate.toLocal();
            return Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: InkWell(
                borderRadius: BorderRadius.circular(12),
                onTap: () => _openMatch(match.id),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Container(
                        width: 52,
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: AppTheme.upcomingBlue.withOpacity(0.10),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Column(
                          children: [
                            Text(
                              _monthShort(date.month),
                              style: GoogleFonts.poppins(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.upcomingBlue,
                              ),
                            ),
                            Text(
                              date.day.toString(),
                              style: GoogleFonts.poppins(
                                fontSize: 20,
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
                              '${match.team1Name} vs ${match.team2Name}',
                              style: GoogleFonts.poppins(
                                fontWeight: FontWeight.w600,
                                color: AppTheme.tp(context),
                                fontSize: 14,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 3),
                            Row(
                              children: [
                                Icon(Icons.place, size: 12, color: AppTheme.ts(context)),
                                const SizedBox(width: 3),
                                Expanded(
                                  child: Text(
                                    match.venue ?? 'TBD',
                                    style: TextStyle(fontSize: 12, color: AppTheme.ts(context)),
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
            );
          },
        ),
      ],
    );
  }

  String _monthShort(int m) {
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    return months[m - 1];
  }

  // ---------- RECENT ----------
  Widget _buildRecentMatches() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Recent Results', icon: Icons.history, iconColor: AppTheme.completedGreen),
        SizedBox(
          height: 150,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: _recentMatches.length,
            itemBuilder: (context, index) {
              final match = _recentMatches[index];
              return Container(
                width: 270,
                margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                child: Card(
                  margin: EdgeInsets.zero,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(12),
                    onTap: () => _openMatch(match.id),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppTheme.completedGreen.withOpacity(0.15),
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
                            ],
                          ),
                          const SizedBox(height: 10),
                          Text(
                            '${match.team1Name} vs ${match.team2Name}',
                            style: GoogleFonts.poppins(
                              fontWeight: FontWeight.bold,
                              color: AppTheme.tp(context),
                              fontSize: 14,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '${match.team1Score}/${match.team1Wickets}  •  ${match.team2Score}/${match.team2Wickets}',
                            style: GoogleFonts.poppins(
                              fontWeight: FontWeight.w600,
                              color: AppTheme.ts(context),
                              fontSize: 13,
                            ),
                          ),
                          const Spacer(),
                          Row(
                            children: [
                              const Icon(Icons.emoji_events,
                                  color: AppTheme.accentAmber, size: 14),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  match.winner != null
                                      ? '${match.winner} won'
                                      : 'Result pending',
                                  style: GoogleFonts.poppins(
                                    color: AppTheme.primaryGreen,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 12,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
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
        ),
      ],
    );
  }

  // ---------- TOP PLAYERS ----------
  Widget _buildTopPlayers() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Top Performers', icon: Icons.star, iconColor: AppTheme.accentAmber),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: _playerLeaderCard(
                  title: 'Most Runs',
                  icon: Icons.sports_cricket,
                  accent: AppTheme.team1Color,
                  players: _topRunScorers,
                  statKey: 'runs',
                  statLabel: 'runs',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _playerLeaderCard(
                  title: 'Most Wickets',
                  icon: Icons.flash_on,
                  accent: AppTheme.team2Color,
                  players: _topWicketTakers,
                  statKey: 'wickets',
                  statLabel: 'wkts',
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _playerLeaderCard({
    required String title,
    required IconData icon,
    required Color accent,
    required List<dynamic> players,
    required String statKey,
    required String statLabel,
  }) {
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(5),
                  decoration: BoxDecoration(
                    color: accent.withOpacity(0.13),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Icon(icon, color: accent, size: 14),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    title,
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.tp(context),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            ...players.take(3).toList().asMap().entries.map((entry) {
              final i = entry.key;
              final p = entry.value;
              final rankColors = [
                AppTheme.accentGold,
                const Color(0xFFC0C0C0),
                const Color(0xFFCD7F32),
              ];
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Container(
                      width: 18,
                      height: 18,
                      decoration: BoxDecoration(
                        color: rankColors[i],
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        '${i + 1}',
                        style: GoogleFonts.poppins(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        p['name'] ?? '',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.poppins(
                          color: AppTheme.tp(context),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    Text(
                      '${p[statKey] ?? 0}',
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: accent,
                      ),
                    ),
                  ],
                ),
              );
            }),
            if (players.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Text(
                  'No data yet',
                  style: TextStyle(color: AppTheme.ts(context), fontSize: 12),
                ),
              ),
          ],
        ),
      ),
    );
  }

  // ---------- NEWS ----------
  Widget _buildNews() {
    final featured = _newsArticles.first;
    final rest = _newsArticles.skip(1).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Cricket News', icon: Icons.article, iconColor: AppTheme.primaryGreen),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: _featuredNewsCard(featured),
        ),
        if (rest.isNotEmpty) ...[
          const SizedBox(height: 12),
          ListView.builder(
            physics: const NeverScrollableScrollPhysics(),
            shrinkWrap: true,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: rest.length,
            itemBuilder: (context, index) => _newsListTile(rest[index]),
          ),
        ],
      ],
    );
  }

  Widget _featuredNewsCard(Map<String, dynamic> article) {
    final image = article['url_to_image'] ?? article['urlToImage'];
    final source = (article['source'] ?? 'News') as String;
    return Card(
      margin: EdgeInsets.zero,
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => _openNews(article),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (image != null)
              Image.network(
                image,
                height: 190,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  height: 190,
                  color: AppTheme.surfaceLight(context),
                  child: const Icon(Icons.image_not_supported,
                      size: 48, color: AppTheme.textSecondary),
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    article['title'] ?? '',
                    style: GoogleFonts.poppins(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.tp(context),
                      height: 1.3,
                    ),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if ((article['description'] ?? '').toString().isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      article['description'],
                      style: TextStyle(
                        fontSize: 12,
                        color: AppTheme.ts(context),
                        height: 1.4,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.public, size: 12, color: AppTheme.primaryGreen),
                      const SizedBox(width: 4),
                      Text(
                        source,
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primaryGreen,
                        ),
                      ),
                      Text(
                        '  •  ${(article['published_at'] ?? '').toString().split('T').first}',
                        style: TextStyle(fontSize: 11, color: AppTheme.ts(context)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _newsListTile(Map<String, dynamic> article) {
    final image = article['url_to_image'] ?? article['urlToImage'];
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _openNews(article),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: image != null
                    ? Image.network(
                        image,
                        width: 92,
                        height: 88,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          width: 92,
                          height: 88,
                          color: AppTheme.surfaceLight(context),
                          child: const Icon(Icons.article, color: AppTheme.textSecondary),
                        ),
                      )
                    : Container(
                        width: 92,
                        height: 88,
                        color: AppTheme.surfaceLight(context),
                        child: const Icon(Icons.article, color: AppTheme.textSecondary),
                      ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      article['title'] ?? '',
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        color: AppTheme.tp(context),
                        height: 1.3,
                      ),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryGreen.withOpacity(0.10),
                            borderRadius: BorderRadius.circular(3),
                          ),
                          child: Text(
                            article['source'] ?? 'News',
                            style: GoogleFonts.poppins(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.primaryGreen,
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            (article['published_at'] ?? '').toString().split('T').first,
                            style: TextStyle(fontSize: 11, color: AppTheme.ts(context)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ---------- BOTTOM CTA (matches login screen button style) ----------
  Widget _buildBottomCTA() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
      child: Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              const Icon(Icons.sports_cricket, color: AppTheme.primaryGreen, size: 36),
              const SizedBox(height: 10),
              Text(
                'Ready to manage your team?',
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.tp(context),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 6),
              Text(
                'Score matches, manage rosters,\nand track detailed statistics.',
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  color: AppTheme.ts(context),
                  height: 1.4,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _navigateToLogin,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.accentGold,
                    foregroundColor: AppTheme.darkGreen,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: Text(
                    'SIGN IN',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                      letterSpacing: 1,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
