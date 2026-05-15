import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../models/tournament.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/theme_toggle.dart';
import '../viewer/match_detail_screen.dart';

class TournamentFixturesScreen extends StatefulWidget {
  final String tournamentId;
  final String tournamentName;
  final DateTime? startDate;
  final DateTime? endDate;
  final bool showResultsOnly;

  const TournamentFixturesScreen({
    super.key,
    required this.tournamentId,
    required this.tournamentName,
    this.startDate,
    this.endDate,
    this.showResultsOnly = false,
  });

  @override
  State<TournamentFixturesScreen> createState() => _TournamentFixturesScreenState();
}

class _TournamentFixturesScreenState extends State<TournamentFixturesScreen>
    with SingleTickerProviderStateMixin {
  List<TournamentFixture> _fixtures = [];
  bool _loading = true;
  TabController? _tabCtrl;
  List<String> _tabs = ['All'];
  int _selectedTab = 0;

  @override
  void initState() {
    super.initState();
    _loadFixtures();
  }

  Future<void> _loadFixtures() async {
    setState(() => _loading = true);
    try {
      _fixtures = await ApiService.getTournamentFixtures(widget.tournamentId);

      // Build dynamic tabs from the actual group names in fixtures
      final groupNames = <String>{};
      for (final f in _fixtures) {
        if (f.group != null && f.group!.isNotEmpty) {
          groupNames.add(f.group!);
        }
      }

      // Sort groups: Group A, Group B first, then League, Semi Final, Final
      final sortedGroups = groupNames.toList()..sort((a, b) {
        const order = ['Group A', 'Group B', 'Group C', 'Group D', 'League', 'Semi Final', 'Final'];
        final ai = order.indexOf(a);
        final bi = order.indexOf(b);
        if (ai >= 0 && bi >= 0) return ai.compareTo(bi);
        if (ai >= 0) return -1;
        if (bi >= 0) return 1;
        return a.compareTo(b);
      });

      setState(() {
        _tabs = ['All', ...sortedGroups];
        _tabCtrl?.dispose();
        _tabCtrl = TabController(length: _tabs.length, vsync: this);
        _tabCtrl!.addListener(() {
          if (!_tabCtrl!.indexIsChanging) {
            setState(() => _selectedTab = _tabCtrl!.index);
          }
        });
      });
    } catch (_) {}
    setState(() => _loading = false);
  }

  List<TournamentFixture> get _filtered {
    var list = _fixtures;
    if (widget.showResultsOnly) {
      list = list.where((f) => f.status == 'completed').toList();
    } else {
      list = list.where((f) => f.status != 'completed').toList();
    }
    // Tab filtering
    if (_selectedTab > 0 && _selectedTab < _tabs.length) {
      final selectedGroup = _tabs[_selectedTab];
      list = list.where((f) => f.group == selectedGroup).toList();
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final dateStr = [
      if (widget.startDate != null) DateFormat('dd MMM yyyy').format(widget.startDate!),
      if (widget.endDate != null) DateFormat('dd MMM yyyy').format(widget.endDate!),
    ].join(' \u2013 ');

    return Scaffold(
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            Stack(
              children: [
                const ProteaHeader(height: 120),
                Positioned(
                  top: MediaQuery.of(context).padding.top + 8,
                  left: 8,
                  child: IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
                Positioned(
                  top: MediaQuery.of(context).padding.top + 8,
                  right: 8,
                  child: const ThemeToggleButton(),
                ),
              ],
            ),
            Text(widget.tournamentName,
                style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.w700),
                textAlign: TextAlign.center),
            if (dateStr.isNotEmpty)
              Text(dateStr,
                  style: GoogleFonts.poppins(fontSize: 13, color: AppTheme.ts(context))),
            const SizedBox(height: 8),
            // Dynamic tabs built from fixture group names
            if (_tabCtrl != null)
              TabBar(
                controller: _tabCtrl,
                isScrollable: _tabs.length > 4,
                labelColor: AppTheme.primaryGreen,
                unselectedLabelColor: AppTheme.textSecondary,
                indicatorColor: AppTheme.primaryGreen,
                labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 12),
                tabs: _tabs.map((t) => Tab(text: t)).toList(),
              ),
            // Fixtures list
            Expanded(
              child: _loading
                  ? Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
                  : _filtered.isEmpty
                      ? Center(child: Text(
                          widget.showResultsOnly ? 'No results yet' : 'No upcoming fixtures',
                          style: GoogleFonts.poppins(color: AppTheme.ts(context))))
                      : RefreshIndicator(
                          onRefresh: _loadFixtures,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            itemCount: _filtered.length,
                            itemBuilder: (context, index) =>
                                _FixtureCard(fixture: _filtered[index], isResult: widget.showResultsOnly),
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _tabCtrl?.dispose();
    super.dispose();
  }
}

class _FixtureCard extends StatelessWidget {
  final TournamentFixture fixture;
  final bool isResult;
  const _FixtureCard({required this.fixture, this.isResult = false});

  @override
  Widget build(BuildContext context) {
    Color statusColor;
    String statusLabel;
    switch (fixture.status) {
      case 'live':
        statusColor = AppTheme.liveRed;
        statusLabel = 'Live';
        break;
      case 'completed':
        statusColor = AppTheme.completedGreen;
        statusLabel = 'Completed';
        break;
      default:
        statusColor = AppTheme.upcomingBlue;
        statusLabel = 'Upcoming';
    }

    final canTap = isResult && fixture.matchId != null;

    return GestureDetector(
      onTap: canTap
          ? () => Navigator.push(context, MaterialPageRoute(
              builder: (_) => MatchDetailScreen(matchId: fixture.matchId!)))
          : null,
      child: Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Date, group badge, and status
            Row(
              children: [
                Expanded(
                  child: Text(
                    DateFormat('EEEE, dd MMM yyyy, hh:mm a').format(fixture.matchDate),
                    style: TextStyle(fontSize: 11, color: AppTheme.ts(context)),
                  ),
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: statusColor,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(statusLabel,
                          style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                    if (canTap) ...[
                      const SizedBox(width: 4),
                      Icon(Icons.chevron_right, size: 18, color: AppTheme.primaryGreen),
                    ],
                  ],
                ),
              ],
            ),
            if (fixture.group != null && fixture.group!.isNotEmpty) ...[
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: _groupColor(fixture.group!).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: _groupColor(fixture.group!).withValues(alpha: 0.3)),
                ),
                child: Text(fixture.group!,
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _groupColor(fixture.group!))),
              ),
            ],
            const SizedBox(height: 10),
            // Teams + scores
            _buildTeamsRow(context),
            if (fixture.venue != null) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  Icon(Icons.location_on, size: 13, color: AppTheme.ts(context)),
                  const SizedBox(width: 3),
                  Expanded(
                    child: Text(fixture.venue!,
                        style: TextStyle(fontSize: 11, color: AppTheme.ts(context)),
                        overflow: TextOverflow.ellipsis),
                  ),
                ],
              ),
            ],
            if (fixture.winner != null) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  Icon(Icons.emoji_events, size: 14, color: AppTheme.accentAmber),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text('${fixture.winner} won',
                        style: GoogleFonts.poppins(
                            fontWeight: FontWeight.w600, color: AppTheme.primaryGreen, fontSize: 12)),
                  ),
                ],
              ),
            ],
            if (fixture.playerOfMatch != null) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(Icons.star, size: 13, color: AppTheme.accentGold),
                  const SizedBox(width: 4),
                  Text('MoM: ${fixture.playerOfMatch}',
                      style: GoogleFonts.poppins(fontSize: 11, color: AppTheme.ts(context))),
                ],
              ),
            ],
          ],
        ),
      ),
    ));
  }

  Widget _buildTeamsRow(BuildContext context) {
    final hasScores = fixture.team1Score != null && fixture.team2Score != null;

    if (hasScores) {
      String _overs(double? o) => o != null ? o.toStringAsFixed(1) : '';

      return Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Team 1
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(fixture.team1Name,
                    style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13),
                    overflow: TextOverflow.ellipsis),
                Text(
                  '${fixture.team1Score}/${fixture.team1Wickets ?? 10}'
                  '${fixture.team1Overs != null ? ' (${_overs(fixture.team1Overs)})' : ''}',
                  style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: fixture.winner == fixture.team1Name
                          ? AppTheme.primaryGreen
                          : AppTheme.tp(context)),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Text('vs', style: TextStyle(color: AppTheme.ts(context), fontSize: 11)),
          ),
          // Team 2
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(fixture.team2Name,
                    style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13),
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.right),
                Text(
                  '${fixture.team2Score}/${fixture.team2Wickets ?? 10}'
                  '${fixture.team2Overs != null ? ' (${_overs(fixture.team2Overs)})' : ''}',
                  style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: fixture.winner == fixture.team2Name
                          ? AppTheme.primaryGreen
                          : AppTheme.tp(context)),
                  textAlign: TextAlign.right,
                ),
              ],
            ),
          ),
        ],
      );
    }

    // Upcoming / no score yet — plain team row
    return Row(
      children: [
        Expanded(
          child: Text(fixture.team1Name,
              style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14)),
        ),
        Row(
          children: [
            CircleAvatar(
              radius: 14,
              backgroundColor: AppTheme.primaryGreen,
              child: Text(fixture.team1Name.isNotEmpty ? fixture.team1Name[0] : '?',
                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: Text('vs', style: TextStyle(color: AppTheme.ts(context), fontSize: 11)),
            ),
            CircleAvatar(
              radius: 14,
              backgroundColor: AppTheme.team2Color,
              child: Text(fixture.team2Name.isNotEmpty ? fixture.team2Name[0] : '?',
                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(fixture.team2Name,
              style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14),
              textAlign: TextAlign.right),
        ),
      ],
    );
  }

  Color _groupColor(String group) {
    if (group.contains('A')) return AppTheme.primaryGreen;
    if (group.contains('B')) return AppTheme.upcomingBlue;
    if (group.contains('Semi')) return AppTheme.accentAmber;
    if (group.contains('Final')) return AppTheme.wicketRed;
    return AppTheme.textSecondary;
  }
}
