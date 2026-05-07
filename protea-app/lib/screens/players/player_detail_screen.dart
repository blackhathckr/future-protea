import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../models/player.dart';
import 'dart:ui' as ui;
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/theme_toggle.dart';

class PlayerDetailScreen extends StatefulWidget {
  final Player player;
  const PlayerDetailScreen({super.key, required this.player});

  @override
  State<PlayerDetailScreen> createState() => _PlayerDetailScreenState();
}

class _PlayerDetailScreenState extends State<PlayerDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  Map<String, dynamic>? _careerStats;
  List<dynamic> _matches = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
    _loadJourney();
  }

  Future<void> _loadJourney() async {
    try {
      final data = await ApiService.getPlayerJourneyByName(widget.player.name);
      setState(() {
        _careerStats = data['career_stats'];
        _matches = data['matches'] ?? [];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.player;

    return Scaffold(
      body: NestedScrollView(
        headerSliverBuilder: (context, _) => [
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: AppTheme.darkGreen,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
            actions: const [ThemeToggleButton()],
            flexibleSpace: FlexibleSpaceBar(
              collapseMode: CollapseMode.pin,
              background: Container(
                decoration: const BoxDecoration(
                  gradient: AppTheme.headerGradient,
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 48),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Avatar
                        Container(
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: AppTheme.accentGold, width: 3),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.25),
                                blurRadius: 10,
                              ),
                            ],
                          ),
                          child: _buildAvatar(p, 40),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          p.name,
                          style: GoogleFonts.poppins(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        if (p.playerId != null)
                          Container(
                            margin: const EdgeInsets.only(top: 4),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppTheme.accentGold.withValues(alpha: 0.25),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                  color: AppTheme.accentGold.withValues(alpha: 0.6)),
                            ),
                            child: Text(
                              p.playerId!,
                              style: GoogleFonts.poppins(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            bottom: TabBar(
              controller: _tabCtrl,
              indicatorColor: AppTheme.accentGold,
              indicatorWeight: 3,
              labelColor: AppTheme.accentGold,
              unselectedLabelColor: Colors.white70,
              labelStyle: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600, fontSize: 13),
              tabs: const [
                Tab(text: 'Career Stats'),
                Tab(text: 'Matches'),
                Tab(text: 'Bio'),
              ],
            ),
          ),
        ],
        body: _loading
            ? const Center(
                child: CircularProgressIndicator(color: AppTheme.primaryGreen))
            : TabBarView(
                controller: _tabCtrl,
                children: [
                  _buildStatsTab(),
                  _buildMatchesTab(),
                  _buildBioTab(),
                ],
              ),
      ),
    );
  }

  Widget _buildStatsTab() {
    if (_careerStats == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.sports_cricket, size: 64, color: AppTheme.primaryGreen.withValues(alpha: 0.3)),
              const SizedBox(height: 16),
              Text('Newly Added!',
                  style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600, color: AppTheme.primaryGreen)),
              const SizedBox(height: 8),
              Text('Yet to begin the journey',
                  style: GoogleFonts.poppins(fontSize: 14, color: AppTheme.ts(context)),
                  textAlign: TextAlign.center),
              const SizedBox(height: 4),
              Text('Stats will appear after playing matches',
                  style: GoogleFonts.poppins(fontSize: 12, color: AppTheme.ts(context)),
                  textAlign: TextAlign.center),
            ],
          ),
        ),
      );
    }
    final s = _careerStats!;
    final totalMatches = int.tryParse(s['total_matches'].toString()) ?? 0;
    final totalRuns = int.tryParse(s['total_runs'].toString()) ?? 0;
    final highestScore = int.tryParse(s['highest_score'].toString()) ?? 0;
    final totalFours = int.tryParse(s['total_fours'].toString()) ?? 0;
    final totalSixes = int.tryParse(s['total_sixes'].toString()) ?? 0;
    final fifties = int.tryParse(s['fifties']?.toString() ?? '0') ?? 0;
    final hundreds = int.tryParse(s['hundreds']?.toString() ?? '0') ?? 0;
    final totalWickets = int.tryParse(s['total_wickets'].toString()) ?? 0;
    final strikeRate = double.tryParse(s['strike_rate'].toString()) ?? 0;
    final battingAvg = double.tryParse(s['batting_average'].toString()) ?? 0;
    final totalOvers = double.tryParse(s['total_overs_bowled']?.toString() ?? '0') ?? 0;
    final totalRunsConceded = int.tryParse(s['total_runs_conceded']?.toString() ?? '0') ?? 0;
    final bowlingEcon = double.tryParse(s['bowling_economy']?.toString() ?? '0') ?? 0;
    final bowlingAvg = double.tryParse(s['bowling_average']?.toString() ?? '0') ?? 0;
    final bestBowling = s['best_bowling']?.toString() ?? '-';

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Hero stats
        Row(
          children: [
            _heroStat('Matches', '$totalMatches', AppTheme.primaryGreen),
            _heroStat('Runs', '$totalRuns', AppTheme.accentAmber),
            _heroStat('Highest', '$highestScore', AppTheme.upcomingBlue),
            _heroStat('Wickets', '$totalWickets', AppTheme.wicketRed),
          ],
        ),
        const SizedBox(height: 16),
        // Batting stats
        _sectionTitle('Batting'),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              children: [
                _statRow('Average', battingAvg.toStringAsFixed(1)),
                _statRow('Strike Rate', strikeRate.toStringAsFixed(1)),
                _statRow('Highest Score', '$highestScore'),
                _statRow('Fours', '$totalFours'),
                _statRow('Sixes', '$totalSixes'),
                _statRow('50s', '$fifties'),
                _statRow('100s', '$hundreds'),
              ],
            ),
          ),
        ),
        // Bowling stats
        if (totalOvers > 0 || totalWickets > 0) ...[
          const SizedBox(height: 12),
          _sectionTitle('Bowling'),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                children: [
                  _statRow('Wickets', '$totalWickets'),
                  _statRow('Best Figures', bestBowling),
                  _statRow('Average', bowlingAvg.toStringAsFixed(1)),
                  _statRow('Economy', bowlingEcon.toStringAsFixed(2)),
                  _statRow('Overs Bowled', totalOvers.toStringAsFixed(1)),
                  _statRow('Runs Conceded', '$totalRunsConceded'),
                ],
              ),
            ),
          ),
        ],
        // Performance graph placeholder
        const SizedBox(height: 12),
        _sectionTitle('Run Progression'),
        Card(
          child: SizedBox(
            height: 120,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: _matches.isEmpty
                  ? Center(child: Text('No match data', style: GoogleFonts.poppins(color: AppTheme.ts(context), fontSize: 12)))
                  : CustomPaint(
                      painter: _RunGraphPainter(_matches.reversed.map((m) => (m['runs_scored'] as int?) ?? 0).toList()),
                      size: Size.infinite,
                    ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMatchesTab() {
    if (_matches.isEmpty) {
      return Center(child: Text('No matches played yet',
          style: GoogleFonts.poppins(color: AppTheme.ts(context))));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _matches.length,
      itemBuilder: (context, index) {
        final m = _matches[index];
        final runs = m['runs_scored'] ?? 0;
        final balls = m['balls_faced'] ?? 0;
        final fours = m['fours'] ?? 0;
        final sixes = m['sixes'] ?? 0;
        final wickets = m['wickets_taken'] ?? 0;
        final team1 = m['team1_name'] ?? '';
        final team2 = m['team2_name'] ?? '';
        final winner = m['winner'];
        final venue = m['venue'];
        final date = m['match_date'] != null ? DateTime.tryParse(m['match_date']) : null;
        final isOut = m['is_out'] ?? false;
        final outType = m['out_type'];

        // Did this player's team win?
        final playerTeam = m['team'] == 1 ? team1 : team2;
        final didWin = winner == playerTeam;

        return Card(
          margin: const EdgeInsets.only(bottom: 10),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
            side: BorderSide(
              color: didWin ? AppTheme.completedGreen.withValues(alpha: 0.3) : AppTheme.wicketRed.withValues(alpha: 0.2),
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text('$team1 vs $team2',
                          style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13)),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: didWin ? AppTheme.completedGreen : AppTheme.wicketRed,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(didWin ? 'WON' : 'LOST',
                          style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                // Batting performance
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Text('$runs', style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w700, color: AppTheme.primaryGreen)),
                          Text(' ($balls)', style: GoogleFonts.poppins(fontSize: 13, color: AppTheme.ts(context))),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    _miniStat('4s', '$fours', AppTheme.fourColor),
                    const SizedBox(width: 8),
                    _miniStat('6s', '$sixes', AppTheme.sixColor),
                    if (wickets > 0) ...[
                      const SizedBox(width: 8),
                      _miniStat('W', '$wickets', AppTheme.wicketRed),
                    ],
                    const Spacer(),
                    Text(
                      balls > 0 ? 'SR ${(runs * 100 / balls).toStringAsFixed(1)}' : '',
                      style: GoogleFonts.poppins(fontSize: 11, color: AppTheme.ts(context)),
                    ),
                  ],
                ),
                if (isOut && outType != null) ...[
                  const SizedBox(height: 4),
                  Text(outType, style: TextStyle(fontSize: 11, color: AppTheme.ts(context), fontStyle: FontStyle.italic)),
                ],
                if (!isOut)
                  const Padding(
                    padding: EdgeInsets.only(top: 4),
                    child: Text('not out', style: TextStyle(fontSize: 11, color: AppTheme.completedGreen, fontStyle: FontStyle.italic)),
                  ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    if (venue != null) ...[
                      Icon(Icons.location_on, size: 12, color: AppTheme.ts(context)),
                      const SizedBox(width: 2),
                      Text(venue, style: TextStyle(fontSize: 11, color: AppTheme.ts(context))),
                      const Spacer(),
                    ],
                    if (date != null)
                      Text(DateFormat('dd MMM yyyy').format(date),
                          style: TextStyle(fontSize: 11, color: AppTheme.ts(context))),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildBioTab() {
    final p = widget.player;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _sectionTitle('Personal Information'),
                const SizedBox(height: 8),
                _bioRow('Full Name', p.name),
                if (p.playerId != null) _bioRow('Player ID', p.playerId!),
                if (p.dateOfBirth != null) _bioRow('Date of Birth', _formatDate(p.dateOfBirth!)),
                if (p.dateOfBirth != null) _bioRow('Age', _calculateAge(p.dateOfBirth!)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 10),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _sectionTitle('Cricket Profile'),
                const SizedBox(height: 8),
                if (p.battingStyle != null) _bioRow('Batting Style', p.battingStyle!),
                if (p.bowlingStyle != null) _bioRow('Bowling Style', p.bowlingStyle!),
                if (p.schoolName != null) _bioRow('School', p.schoolName!),
                if (p.clubName != null) _bioRow('Club', p.clubName!),
                if (p.teamsPlayed != null && p.teamsPlayed!.isNotEmpty)
                  _bioRow('Teams Played', p.teamsPlayed!.join(', ')),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // Helper widgets
  Widget _buildAvatar(Player p, double radius) {
    if (p.photoUrl != null && p.photoUrl!.isNotEmpty) {
      return CircleAvatar(radius: radius, backgroundImage: NetworkImage(ApiService.getPhotoUrl(p.photoUrl!)), backgroundColor: AppTheme.primaryGreen);
    }
    return CircleAvatar(
      radius: radius,
      backgroundColor: AppTheme.primaryGreen,
      child: Text(p.name.isNotEmpty ? p.name[0].toUpperCase() : '?',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: radius * 0.7)),
    );
  }

  Widget _heroStat(String label, String value, Color color) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 3),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          children: [
            Text(value, style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w700, color: color)),
            Text(label, style: GoogleFonts.poppins(fontSize: 10, color: AppTheme.ts(context))),
          ],
        ),
      ),
    );
  }

  Widget _sectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Container(width: 4, height: 16, decoration: BoxDecoration(color: AppTheme.primaryGreen, borderRadius: BorderRadius.circular(2))),
          const SizedBox(width: 8),
          Text(title, style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 14)),
        ],
      ),
    );
  }

  Widget _statRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: AppTheme.ts(context), fontSize: 13)),
          Text(value, style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14)),
        ],
      ),
    );
  }

  Widget _bioRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 120, child: Text(label, style: GoogleFonts.poppins(fontWeight: FontWeight.w500, color: AppTheme.ts(context), fontSize: 13))),
          Expanded(child: Text(value, style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13))),
        ],
      ),
    );
  }

  Widget _miniStat(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(4)),
      child: Text('$label: $value', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: color)),
    );
  }

  String _formatDate(String date) {
    try { return DateFormat('dd MMM yyyy').format(DateTime.parse(date)); } catch (_) { return date; }
  }

  String _calculateAge(String dob) {
    try {
      final birthDate = DateTime.parse(dob);
      final now = DateTime.now();
      int age = now.year - birthDate.year;
      if (now.month < birthDate.month || (now.month == birthDate.month && now.day < birthDate.day)) age--;
      return '$age years';
    } catch (_) { return ''; }
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }
}

// Simple run progression line graph
class _RunGraphPainter extends CustomPainter {
  final List<int> runs;
  _RunGraphPainter(this.runs);

  @override
  void paint(Canvas canvas, Size size) {
    if (runs.isEmpty) return;
    final maxRun = runs.reduce((a, b) => a > b ? a : b).toDouble();
    if (maxRun == 0) return;

    final paint = Paint()
      ..color = AppTheme.primaryGreen
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    final dotPaint = Paint()..color = AppTheme.primaryGreen;
    final fillPaint = Paint()
      ..color = AppTheme.primaryGreen.withValues(alpha: 0.1)
      ..style = PaintingStyle.fill;

    final path = Path();
    final fillPath = Path();
    final stepX = runs.length > 1 ? size.width / (runs.length - 1) : size.width / 2;

    for (int i = 0; i < runs.length; i++) {
      final x = i * stepX;
      final y = size.height - (runs[i] / maxRun * (size.height - 10)) - 5;
      if (i == 0) {
        path.moveTo(x, y);
        fillPath.moveTo(x, size.height);
        fillPath.lineTo(x, y);
      } else {
        path.lineTo(x, y);
        fillPath.lineTo(x, y);
      }
      canvas.drawCircle(Offset(x, y), 3, dotPaint);

      // Draw run label
      final tp = TextPainter(
        text: TextSpan(text: '${runs[i]}', style: const TextStyle(fontSize: 9, color: AppTheme.primaryGreen, fontWeight: FontWeight.bold)),
        textDirection: ui.TextDirection.ltr,
      )..layout();
      tp.paint(canvas, Offset(x - tp.width / 2, y - 14));
    }

    fillPath.lineTo((runs.length - 1) * stepX, size.height);
    fillPath.close();
    canvas.drawPath(fillPath, fillPaint);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
