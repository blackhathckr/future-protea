import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lottie/lottie.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../models/match.dart';
import '../../models/ball.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/theme_toggle.dart';

class MatchDetailScreen extends StatefulWidget {
  final String matchId;
  final bool isGuest;
  const MatchDetailScreen({super.key, required this.matchId, this.isGuest = false});

  @override
  State<MatchDetailScreen> createState() => _MatchDetailScreenState();
}

class _MatchDetailScreenState extends State<MatchDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  CricketMatch? _match;
  List<PlayerScore> _batting = [];
  List<PlayerScore> _bowling = [];
  List<Ball> _balls = [];
  List<MatchPlayer> _players = [];
  bool _loading = true;
  int _selectedTeam = 1;
  int _statsFilter = 0; // 0 = overall, 1 = team1, 2 = team2
  Timer? _refreshTimer;
  Offset _fabOffset = const Offset(16, 80);

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 5, vsync: this);
    _loadData();
    _refreshTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted && _match?.status == 'live') _loadData();
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _tabCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      CricketMatch match;
      if (widget.isGuest) {
        final raw = await ApiService.getPublicMatch(widget.matchId);
        match = CricketMatch.fromJson(raw);
      } else {
        match = await ApiService.getMatch(widget.matchId);
      }
      final battingFirstTeam = _getBattingFirstTeam(match);
      setState(() {
        _match = match;
        if (_selectedTeam == 0) _selectedTeam = battingFirstTeam;
      });
      try {
        final sc = widget.isGuest
            ? await ApiService.getPublicScorecard(widget.matchId)
            : await ApiService.getScorecard(widget.matchId);
        if (mounted) {
          setState(() {
            _batting = (sc['batting'] as List).map((b) => PlayerScore.fromJson(b)).toList();
            _bowling = (sc['bowling'] as List).map((b) => PlayerScore.fromJson(b)).toList();
          });
        }
      } catch (_) {}
      try {
        final balls = widget.isGuest
            ? await ApiService.getPublicBalls(widget.matchId)
            : await ApiService.getBalls(widget.matchId);
        if (mounted) setState(() => _balls = balls);
      } catch (_) {}
      try {
        if (!widget.isGuest) {
          final players = await ApiService.getMatchPlayers(widget.matchId);
          if (mounted) setState(() => _players = players);
        }
      } catch (_) {}
    } catch (_) {}
    finally { if (mounted) setState(() => _loading = false); }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BUILD
  // ═══════════════════════════════════════════════════════════════════════════

  @override
  Widget build(BuildContext context) {
    final isDark = AppTheme.isDark(context);
    return Scaffold(
      body: SafeArea(
        top: false,
        child: _loading
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Lottie.asset('assets/images/lottie/Bat ball.json', width: 120, height: 120, repeat: true),
                    const SizedBox(height: 12),
                    Text('Loading match...', style: GoogleFonts.poppins(fontSize: 13, color: AppTheme.ts(context))),
                  ],
                ),
              )
            : _match == null
                ? const Center(child: Text('Match not found'))
                : Stack(
                    children: [
                      Column(
                        children: [
                      Stack(
                        children: [
                          const ProteaHeader(height: 90),
                          Positioned(
                            top: MediaQuery.of(context).padding.top + 6,
                            left: 4,
                            child: IconButton(icon: const Icon(Icons.arrow_back, color: Colors.white), onPressed: () => Navigator.pop(context)),
                          ),
                          Positioned(
                            top: MediaQuery.of(context).padding.top + 2,
                            right: 6,
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                _headerIconBtn(
                                  icon: Icons.picture_as_pdf_rounded,
                                  tooltip: 'Export PDF',
                                  onTap: _match != null ? () => _exportPdf(context) : null,
                                ),
                                Container(
                                  width: 1,
                                  height: 22,
                                  color: Colors.white.withValues(alpha: 0.35),
                                  margin: const EdgeInsets.symmetric(horizontal: 6),
                                ),
                                const ThemeToggleButton(),
                              ],
                            ),
                          ),
                        ],
                      ),
                      _buildScoreHeader(),
                      // ── Premium Tab Bar ────────────────────
                      Container(
                        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        height: 38,
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(19),
                        ),
                        child: TabBar(
                          controller: _tabCtrl,
                          indicator: BoxDecoration(
                            gradient: const LinearGradient(colors: [Color(0xFF1B5E20), Color(0xFF2E7D32)]),
                            borderRadius: BorderRadius.circular(19),
                            boxShadow: [BoxShadow(color: AppTheme.primaryGreen.withValues(alpha: 0.3), blurRadius: 6, offset: const Offset(0, 2))],
                          ),
                          dividerHeight: 0,
                          indicatorSize: TabBarIndicatorSize.tab,
                          labelColor: Colors.white,
                          unselectedLabelColor: AppTheme.ts(context),
                          labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 11),
                          unselectedLabelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w500, fontSize: 11),
                          labelPadding: EdgeInsets.zero,
                          tabs: const [
                            Tab(text: 'Scoring'),
                            Tab(text: 'Score Card'),
                            Tab(text: 'Stats'),
                            Tab(text: 'Stars'),
                            Tab(text: 'Balls'),
                          ],
                        ),
                      ),
                      Expanded(
                        child: TabBarView(
                          controller: _tabCtrl,
                          children: [_buildScoringTab(), _buildScorecardTab(), _buildStatsTab(), _buildSuperStarsTab(), _buildBallsTab()],
                        ),
                      ),
                    ],
                  ),
                  _buildDraggableFab(context),
                ],
              ),
      ),
    );
  }

  Widget _buildDraggableFab(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Positioned(
      right: _fabOffset.dx,
      bottom: _fabOffset.dy,
      child: GestureDetector(
        onPanUpdate: (details) {
          setState(() {
            final newRight = (_fabOffset.dx - details.delta.dx).clamp(8.0, size.width - 64.0);
            final newBottom = (_fabOffset.dy - details.delta.dy).clamp(8.0, size.height - 120.0);
            _fabOffset = Offset(newRight, newBottom);
          });
        },
        child: FloatingActionButton(
          heroTag: 'match_detail_share',
          onPressed: () {
            final link = '${ApiService.baseUrl.replaceAll('/api', '')}/public/matches/${widget.matchId}';
            Clipboard.setData(ClipboardData(text: link));
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Match link copied!'), backgroundColor: AppTheme.primaryGreen),
            );
          },
          backgroundColor: AppTheme.primaryGreen,
          foregroundColor: Colors.white,
          elevation: 4,
          child: const Icon(Icons.share_rounded, size: 22),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER ICON BUTTON HELPER
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _headerIconBtn({required IconData icon, required String tooltip, VoidCallback? onTap}) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          width: 36,
          height: 36,
          alignment: Alignment.center,
          child: Icon(icon, color: Colors.white, size: 21),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCORE HEADER
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildScoreHeader() {
    final m = _match!;
    final battingFirst = _getBattingFirstTeam(m);
    final isSecondInnings = m.currentInnings == 2;
    final currentBatTeam = isSecondInnings ? (battingFirst == 1 ? 2 : 1) : battingFirst;
    final currentBowlTeam = currentBatTeam == 1 ? 2 : 1;
    final batName = currentBatTeam == 1 ? m.team1Name : m.team2Name;
    final batLogo = currentBatTeam == 1 ? m.team1LogoUrl : m.team2LogoUrl;
    final bowlName = currentBowlTeam == 1 ? m.team1Name : m.team2Name;
    final bowlLogo = currentBowlTeam == 1 ? m.team1LogoUrl : m.team2LogoUrl;
    final t1Inns = battingFirst == 1 ? 1 : 2;
    final t2Inns = battingFirst == 2 ? 1 : 2;
    final batScore = currentBatTeam == 1 ? (t1Inns == 1 ? m.team1Score : m.team2Score) : (t2Inns == 1 ? m.team1Score : m.team2Score);
    final batWickets = currentBatTeam == 1 ? (t1Inns == 1 ? m.team1Wickets : m.team2Wickets) : (t2Inns == 1 ? m.team1Wickets : m.team2Wickets);
    final batOvers = currentBatTeam == 1 ? (t1Inns == 1 ? m.team1Overs : m.team2Overs) : (t2Inns == 1 ? m.team1Overs : m.team2Overs);
    final firstBatScore = battingFirst == 1 ? (t1Inns == 1 ? m.team1Score : m.team2Score) : (t2Inns == 1 ? m.team1Score : m.team2Score);
    final chasingCount = currentBatTeam == 1 ? m.team1PlayerCount : m.team2PlayerCount;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(14, 10, 14, 12),
      decoration: const BoxDecoration(gradient: LinearGradient(colors: [AppTheme.darkGreen, AppTheme.primaryGreen])),
      child: Column(
        children: [
          Row(
            children: [
              _headerAvatar(batLogo, batName),
              const SizedBox(width: 10),
              Expanded(
                child: Column(children: [
                  Text('$batName vs $bowlName', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13), textAlign: TextAlign.center),
                  Text('$batScore-$batWickets', style: GoogleFonts.poppins(color: AppTheme.accentGold, fontWeight: FontWeight.w700, fontSize: 30))
                      .animate(onPlay: (c) => m.status == 'live' ? c.repeat() : null)
                      .shimmer(duration: 2500.ms, color: m.status == 'live' ? AppTheme.accentGold.withValues(alpha: 0.3) : Colors.transparent),
                ]),
              ),
              const SizedBox(width: 10),
              _headerAvatar(bowlLogo, bowlName),
            ],
          ),
          const SizedBox(height: 4),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('${m.currentInnings == 1 ? "1st" : "2nd"} Inn', style: const TextStyle(color: Colors.white70, fontSize: 11)),
            Text('${batOvers.toStringAsFixed(1)} ov', style: const TextStyle(color: Colors.white70, fontSize: 11)),
            Row(children: List.generate(chasingCount > 0 ? chasingCount - 1 : 10, (i) => Container(width: 7, height: 7, margin: const EdgeInsets.only(left: 2), decoration: BoxDecoration(shape: BoxShape.circle, color: i < batWickets ? AppTheme.wicketRed : AppTheme.lightGreen)))),
          ]),
          if (isSecondInnings) _buildTargetInfo(firstBatScore, batScore, batOvers, m.totalOvers, chasingCount, batWickets),
          if (m.tossWinner != null && m.tossDecision != null)
            Padding(padding: const EdgeInsets.only(top: 4), child: Text('${m.tossWinner} won toss, chose to ${m.tossDecision}', style: const TextStyle(color: Colors.white54, fontSize: 10, fontStyle: FontStyle.italic))),
          if (m.winner != null && m.status == 'completed')
            Padding(padding: const EdgeInsets.only(top: 4), child: Text(_getVictoryMessage(m), style: const TextStyle(color: AppTheme.accentGold, fontWeight: FontWeight.bold, fontSize: 13))),
          // CRR / RRR
          if (m.status == 'live' || m.status == 'completed') ...[
            const SizedBox(height: 6),
            _buildLiveInfoBar(m, batOvers, batScore, firstBatScore, isSecondInnings),
          ],
        ],
      ),
    );
  }

  Widget _headerAvatar(String? logo, String name) {
    return Container(
      decoration: BoxDecoration(shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 8)]),
      child: CircleAvatar(
        radius: 28,
        backgroundColor: Colors.white24,
        backgroundImage: logo != null && logo.isNotEmpty ? NetworkImage(ApiService.getPhotoUrl(logo)) : null,
        child: logo == null || logo.isEmpty ? Text(name[0], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)) : null,
      ),
    );
  }

  Widget _buildTargetInfo(int firstBatScore, int batScore, double batOvers, int totalOvers, int chasingCount, int batWickets) {
    final target = firstBatScore + 1;
    final runsNeeded = target - batScore;
    final ballsRemaining = ((totalOvers - batOvers) * 6).toInt();
    final maxW = chasingCount > 0 ? chasingCount - 1 : 10;
    final wicketsRemaining = maxW - batWickets;
    if (batScore <= 0) return const SizedBox.shrink();
    if (runsNeeded <= 0) {
      return Padding(padding: const EdgeInsets.only(top: 4), child: Text('Won by $wicketsRemaining wickets (${batOvers.toStringAsFixed(1)} ov)', style: const TextStyle(color: AppTheme.lightGreen, fontSize: 12, fontWeight: FontWeight.bold)));
    }
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(color: AppTheme.accentGold.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12)),
        child: Text('TARGET $target  •  Need $runsNeeded in $ballsRemaining balls', style: GoogleFonts.poppins(color: AppTheme.accentGold, fontWeight: FontWeight.w600, fontSize: 11)),
      ),
    );
  }

  Widget _buildLiveInfoBar(CricketMatch m, double batOvers, int batScore, int firstBatScore, bool isSecondInnings) {
    final crr = batOvers > 0 ? (batScore / batOvers) : 0.0;
    final rrr = isSecondInnings && batOvers < m.totalOvers
        ? ((firstBatScore + 1 - batScore) / (m.totalOvers - batOvers))
        : 0.0;

    // Current partnership from ball data
    final currentInnings = m.currentInnings;
    final inningsBalls = _balls.where((b) => b.innings == currentInnings).toList();
    int partnershipRuns = 0, partnershipBalls = 0;
    int lastWicketIdx = -1;
    for (int i = inningsBalls.length - 1; i >= 0; i--) {
      if (inningsBalls[i].isWicket) { lastWicketIdx = i; break; }
    }
    for (int i = lastWicketIdx + 1; i < inningsBalls.length; i++) {
      partnershipRuns += inningsBalls[i].runs + inningsBalls[i].extras;
      if (!inningsBalls[i].isWide && !inningsBalls[i].isNoball) partnershipBalls++;
    }

    // Active batsmen
    final teamBattingInnings = _getTeamInnings(isSecondInnings ? (_getBattingFirstTeam(m) == 1 ? 2 : 1) : _getBattingFirstTeam(m));
    final batters = _batting.where((b) => b.team == teamBattingInnings).toList();
    final activeIds = <String>{};
    final ibBalls = _balls.where((b) => b.innings == teamBattingInnings).toList();
    for (final b in ibBalls.reversed) {
      if (b.batsmanId != null) {
        final bs = batters.where((x) => x.playerId == b.batsmanId).firstOrNull;
        // A player is active if they're not out (isOut=false), even if they have outType='retired hurt' but returned
        if (bs != null && !bs.isOut) {
          activeIds.add(b.batsmanId!);
          if (activeIds.length == 2) break;
        }
      }
    }
    final activeBatsmen = batters.where((b) => activeIds.contains(b.playerId)).toList();

    // Current bowler (last ball's bowler)
    final bowlerTeamInnings = teamBattingInnings == 1 ? 2 : 1;
    String? currentBowlerName;
    if (ibBalls.isNotEmpty) {
      final lastBowlerId = ibBalls.last.bowlerId;
      if (lastBowlerId != null) {
        final bowler = _bowling.where((b) => b.playerId == lastBowlerId && b.team == bowlerTeamInnings).firstOrNull;
        currentBowlerName = bowler?.name ?? ibBalls.last.bowlerName;
      }
    }

    // Extras
    int wides = 0, noBalls = 0;
    for (final b in inningsBalls) {
      if (b.isWide) wides += b.extras;
      if (b.isNoball) noBalls += b.extras;
    }

    return Container(
      margin: const EdgeInsets.only(top: 6),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        children: [
          // CRR / RRR / Extras row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _infoChip('CRR', crr.toStringAsFixed(2), AppTheme.accentGold),
              if (isSecondInnings && rrr > 0) _infoChip('RRR', rrr.toStringAsFixed(2), AppTheme.lightGreen),
              if (wides > 0 || noBalls > 0)
                _infoChip('Extras', '${wides}wd ${noBalls}nb', Colors.white70),
            ],
          ),
          const SizedBox(height: 6),
          // Partnership + active batsmen
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.handshake_outlined, size: 12, color: Colors.white.withValues(alpha: 0.6)),
              const SizedBox(width: 4),
              Text('P\'ship: ', style: TextStyle(fontSize: 10, color: Colors.white.withValues(alpha: 0.6))),
              Text('$partnershipRuns', style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 11, color: AppTheme.accentGold)),
              Text('($partnershipBalls)', style: TextStyle(fontSize: 10, color: Colors.white.withValues(alpha: 0.5))),
              if (activeBatsmen.isNotEmpty) ...[
                const SizedBox(width: 10),
                Text('|', style: TextStyle(color: Colors.white.withValues(alpha: 0.3))),
                const SizedBox(width: 10),
                Icon(Icons.sports_cricket, size: 11, color: Colors.white.withValues(alpha: 0.6)),
                const SizedBox(width: 3),
                Flexible(
                  child: Text(
                    activeBatsmen.map((b) => '${b.name.split(' ').first} ${b.runsScored}*').join(' & '),
                    style: TextStyle(fontSize: 10, color: Colors.white.withValues(alpha: 0.7)),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ],
          ),
          // Current bowler
          if (currentBowlerName != null) ...[
            const SizedBox(height: 3),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.sports_baseball, size: 11, color: Colors.white.withValues(alpha: 0.5)),
                const SizedBox(width: 4),
                Text('Bowling: $currentBowlerName', style: TextStyle(fontSize: 10, color: Colors.white.withValues(alpha: 0.6))),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _infoChip(String label, String value, Color valueColor) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('$label ', style: TextStyle(fontSize: 10, color: Colors.white.withValues(alpha: 0.5))),
        Text(value, style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 11, color: valueColor)),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCORING TAB — Enhanced
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildScoringTab() {
    if (_balls.isEmpty) {
      return _emptyTab(_match?.status == 'upcoming' ? 'Match has not started yet' : 'Ball-by-ball data not available');
    }
    final currentInnings = _match?.currentInnings ?? 1;
    final inningsBalls = _balls.where((b) => b.innings == currentInnings).toList();
    if (inningsBalls.isEmpty) return _emptyTab('Current innings has not started yet');

    final Map<int, List<Ball>> overs = {};
    for (final b in inningsBalls) {
      overs.putIfAbsent(b.overNumber, () => []).add(b);
    }
    final isDark = AppTheme.isDark(context);
    final overList = overs.entries.toList();

    // Summary stats for current innings
    final totalRuns = inningsBalls.fold<int>(0, (s, b) => s + b.runs + b.extras);
    final totalWickets = inningsBalls.where((b) => b.isWicket).length;
    final totalFours = inningsBalls.where((b) => b.runs == 4 && !b.isBye && !b.isLegbye).length;
    final totalSixes = inningsBalls.where((b) => b.runs == 6 && !b.isBye && !b.isLegbye).length;

    return ListView(
      padding: const EdgeInsets.fromLTRB(14, 8, 14, 16),
      children: [
        // Quick stats bar
        Container(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: isDark ? [const Color(0xFF1A2A1A), const Color(0xFF0D3B12)] : [const Color(0xFF0D3B12), const Color(0xFF1B5E20)]),
            borderRadius: BorderRadius.circular(14),
            boxShadow: [BoxShadow(color: AppTheme.primaryGreen.withValues(alpha: 0.2), blurRadius: 8, offset: const Offset(0, 2))],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _quickStat('Runs', '$totalRuns', AppTheme.accentGold),
              _dividerDot(),
              _quickStat('Wickets', '$totalWickets', AppTheme.wicketRed),
              _dividerDot(),
              _quickStat('4s', '$totalFours', AppTheme.fourColor),
              _dividerDot(),
              _quickStat('6s', '$totalSixes', AppTheme.sixColor),
            ],
          ),
        ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.05),
        const SizedBox(height: 12),

        // Over-by-over cards
        ...overList.asMap().entries.map((entry) {
          final idx = entry.key;
          final over = entry.value;
          final overRuns = over.value.fold<int>(0, (s, b) => s + b.runs + b.extras);
          final hasWicket = over.value.any((b) => b.isWicket);
          final hasSix = over.value.any((b) => b.runs == 6 && !b.isBye && !b.isLegbye);
          final hasFour = over.value.any((b) => b.runs == 4 && !b.isBye && !b.isLegbye);

          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              color: AppTheme.surface(context),
              border: hasWicket
                  ? Border.all(color: AppTheme.wicketRed.withValues(alpha: 0.3), width: 1.5)
                  : hasSix
                      ? Border.all(color: AppTheme.sixColor.withValues(alpha: 0.3), width: 1)
                      : null,
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.06), blurRadius: 6, offset: const Offset(0, 2))],
            ),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Over header
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(colors: [Color(0xFF1B5E20), Color(0xFF2E7D32)]),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text('Over ${over.key}', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 11)),
                      ),
                      const Spacer(),
                      // Over highlights
                      if (hasWicket) _overHighlight('W', AppTheme.wicketRed),
                      if (hasSix) _overHighlight('6', AppTheme.sixColor),
                      if (hasFour) _overHighlight('4', AppTheme.fourColor),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                        decoration: BoxDecoration(color: AppTheme.accentGold.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(10)),
                        child: Text('$overRuns runs', style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.accentAmber)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  // Ball badges
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: over.value.asMap().entries.map((bEntry) {
                      final ball = bEntry.value;
                      final bi = bEntry.key;
                      Color bg; Color fg = Colors.white;
                      List<BoxShadow>? shadow;
                      if (ball.isWicket) { bg = AppTheme.wicketRed; shadow = [BoxShadow(color: AppTheme.wicketRed.withValues(alpha: 0.4), blurRadius: 6)]; }
                      else if (ball.runs == 4 && !ball.isBye && !ball.isLegbye) { bg = AppTheme.fourColor; fg = Colors.black; shadow = [BoxShadow(color: AppTheme.fourColor.withValues(alpha: 0.3), blurRadius: 4)]; }
                      else if (ball.runs == 6 && !ball.isBye && !ball.isLegbye) { bg = AppTheme.sixColor; fg = Colors.black; shadow = [BoxShadow(color: AppTheme.sixColor.withValues(alpha: 0.4), blurRadius: 6)]; }
                      else if (ball.runs == 0 && !ball.isWide && !ball.isNoball) { bg = isDark ? const Color(0xFF424242) : AppTheme.dotBallColor; }
                      else { bg = isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE0E0E0); fg = AppTheme.tp(context); }
                      return Container(
                        width: 40, height: 40,
                        decoration: BoxDecoration(shape: BoxShape.circle, color: bg, boxShadow: shadow),
                        alignment: Alignment.center,
                        child: Text(ball.displayText, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: fg)),
                      ).animate().fadeIn(duration: 250.ms, delay: (bi * 40).ms).scale(begin: const Offset(0.7, 0.7), duration: 250.ms, delay: (bi * 40).ms, curve: Curves.easeOutBack);
                    }).toList(),
                  ),
                ],
              ),
            ),
          ).animate().fadeIn(duration: 400.ms, delay: (idx * 70).ms).slideX(begin: 0.04);
        }),
      ],
    );
  }

  Widget _quickStat(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w800, color: color)),
        Text(label, style: TextStyle(fontSize: 10, color: Colors.white.withValues(alpha: 0.6))),
      ],
    );
  }

  Widget _dividerDot() => Container(width: 3, height: 3, decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withValues(alpha: 0.2)));

  Widget _overHighlight(String text, Color color) {
    return Container(
      margin: const EdgeInsets.only(right: 4),
      width: 22, height: 22,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color.withValues(alpha: 0.15), border: Border.all(color: color.withValues(alpha: 0.5), width: 1)),
      child: Center(child: Text(text, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: color))),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCORECARD TAB
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildScorecardTab() {
    final m = _match!;
    final battingFirst = _getBattingFirstTeam(m);
    final isSecondInnings = m.currentInnings == 2;
    final currentBattingTeam = isSecondInnings ? (battingFirst == 1 ? 2 : 1) : battingFirst;
    final team1Innings = _getTeamInnings(1); final team2Innings = _getTeamInnings(2);
    final team1HasBatted = _batting.any((b) => b.team == team1Innings);
    final team2HasBatted = _batting.any((b) => b.team == team2Innings);
    final leftTeam = currentBattingTeam; final rightTeam = currentBattingTeam == 1 ? 2 : 1;
    final leftName = leftTeam == 1 ? m.team1Name : m.team2Name;
    final rightName = rightTeam == 1 ? m.team1Name : m.team2Name;
    final leftHasBatted = leftTeam == 1 ? team1HasBatted : team2HasBatted;
    final rightHasBatted = rightTeam == 1 ? team1HasBatted : team2HasBatted;
    final leftIsBatting = leftTeam == currentBattingTeam;
    final rightIsBatting = rightTeam == currentBattingTeam;

    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
        child: Row(children: [
          Expanded(child: _TeamTab(label: leftName, subtitle: !leftHasBatted ? 'Yet to bat' : (leftIsBatting && m.status == 'live' ? 'BATTING' : null), selected: _selectedTeam == leftTeam, onTap: () => setState(() => _selectedTeam = leftTeam), isBatting: leftIsBatting && m.status == 'live')),
          const SizedBox(width: 8),
          Expanded(child: _TeamTab(label: rightName, subtitle: !rightHasBatted ? 'Yet to bat' : (rightIsBatting && m.status == 'live' ? 'BATTING' : null), selected: _selectedTeam == rightTeam, onTap: () => setState(() => _selectedTeam = rightTeam), isBatting: rightIsBatting && m.status == 'live')),
        ]),
      ),
      const SizedBox(height: 6),
      Expanded(child: _buildTeamScorecard(_selectedTeam)),
    ]);
  }

  Widget _buildTeamScorecard(int team) {
    final m = _match!;
    final teamName = team == 1 ? m.team1Name : m.team2Name;
    final teamBattingInnings = _getTeamInnings(team);
    final teamScore = teamBattingInnings == 1 ? m.team1Score : m.team2Score;
    final teamWickets = teamBattingInnings == 1 ? m.team1Wickets : m.team2Wickets;
    final teamOvers = teamBattingInnings == 1 ? m.team1Overs : m.team2Overs;
    final batters = _batting.where((b) => b.team == teamBattingInnings).toList()..sort((a, b) => a.id.compareTo(b.id));
    final bowlerTeamValue = teamBattingInnings == 1 ? 2 : 1;
    final bowlers = _bowling.where((b) => b.team == bowlerTeamValue).toList();
    final teamPlayers = _players.where((p) => p.team == team).toList();
    final battedIds = batters.map((b) => b.playerId).toSet();
    final battedNames = batters.map((b) => b.name.toLowerCase().trim()).toSet();
    // Dedupe by name (case-insensitive) and exclude players who have batted.
    // Duplicates can occur when the same player name has been registered multiple
    // times in the system, each creating a separate User → MatchPlayer record.
    final seenNames = <String>{};
    final yetToBat = teamPlayers.where((p) {
      final nameLower = p.name.toLowerCase().trim();
      if (battedIds.contains(p.playerId)) return false;
      if (battedNames.contains(nameLower)) return false;
      if (seenNames.contains(nameLower)) return false;
      seenNames.add(nameLower);
      return true;
    }).toList();
    final activeBatsmenIds = <String>{};
    for (final b in _balls.where((b) => b.innings == teamBattingInnings).toList().reversed) {
      if (b.batsmanId != null) {
        final bs = batters.where((x) => x.playerId == b.batsmanId).firstOrNull;
        if (bs != null && !bs.isOut && bs.outType != 'retired hurt') { activeBatsmenIds.add(b.batsmanId!); if (activeBatsmenIds.length == 2) break; }
      }
    }
    final inningsBalls = _balls.where((b) => b.innings == teamBattingInnings).toList();
    int wides = 0, noBalls = 0, byes = 0, legByes = 0;
    for (final b in inningsBalls) { if (b.isWide) wides += b.extras; if (b.isNoball) noBalls += b.extras; if (b.isBye) byes += b.runs; if (b.isLegbye) legByes += b.runs; }
    final totalExtras = wides + noBalls + byes + legByes;
    final fallOfWickets = <_FallOfWicket>[]; int runningScore = 0; int wicketCount = 0;
    for (final b in _balls.where((b) => b.innings == _getTeamInnings(team))) { runningScore += b.runs + b.extras; if (b.isWicket) { wicketCount++; fallOfWickets.add(_FallOfWicket(batsmanName: b.batsmanName ?? 'Unknown', score: '$wicketCount-$runningScore', over: '${b.overNumber}.${b.ballNumber}')); } }
    final hasBattingData = batters.isNotEmpty;

    return ListView(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6), children: [
      if (!hasBattingData)
        Center(child: Padding(padding: const EdgeInsets.all(40), child: Column(children: [
          Lottie.asset('assets/images/lottie/Bat ball.json', width: 100, height: 100, repeat: true),
          const SizedBox(height: 12),
          Text('$teamName has not batted yet', style: GoogleFonts.poppins(color: AppTheme.ts(context), fontSize: 14)),
        ]))),
      if (hasBattingData) ...[
        _sectionHeader('BATTING', trailing: '$teamScore-$teamWickets (${teamOvers.toStringAsFixed(1)})'),
        _battingTable(batters, activeBatsmenIds),
        Padding(padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6), child: Row(children: [
          Text('Extras:', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13)),
          const Spacer(),
          Text('$totalExtras', style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 14)),
          const SizedBox(width: 8),
          Text('${legByes > 0 ? '${legByes}lb' : ''}${byes > 0 ? ', ${byes}b' : ''}${wides > 0 ? ', ${wides}w' : ''}${noBalls > 0 ? ', ${noBalls}nb' : ''}'.replaceFirst(RegExp(r'^, '), ''), style: TextStyle(fontSize: 12, color: AppTheme.ts(context))),
        ])),
        const Divider(),
      ],
      if (yetToBat.isNotEmpty) ...[
        const SizedBox(height: 6),
        Text(m.status == 'completed' ? 'DID NOT BAT' : 'YET TO BAT', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 12, color: AppTheme.ts(context))),
        const SizedBox(height: 8),
        Wrap(spacing: 14, runSpacing: 10, children: yetToBat.map((p) => SizedBox(width: (MediaQuery.of(context).size.width - 56) / 2, child: Row(children: [
          CircleAvatar(radius: 18, backgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.15), child: Text(p.name.isNotEmpty ? p.name[0].toUpperCase() : '?', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.primaryGreen))),
          const SizedBox(width: 6),
          Expanded(child: Row(children: [
            Flexible(child: Text(p.name, style: GoogleFonts.poppins(fontWeight: FontWeight.w500, fontSize: 12), overflow: TextOverflow.ellipsis)),
            if (p.isCaptain) ...[const SizedBox(width: 3), _roleBadge('C', AppTheme.primaryGreen)],
            if (p.isWicketKeeper) ...[const SizedBox(width: 3), _roleBadge('WK', Colors.orange)],
          ])),
        ]))).toList()),
        const SizedBox(height: 12), const Divider(),
      ],
      if (bowlers.isNotEmpty) ...[const SizedBox(height: 6), _sectionHeader('BOWLING'), _bowlingTable(bowlers), const SizedBox(height: 6), const Divider()],
      if (fallOfWickets.isNotEmpty) ...[
        const SizedBox(height: 6),
        Text('FALL OF WICKETS', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 12, color: AppTheme.ts(context))),
        const SizedBox(height: 6),
        Card(child: Padding(padding: const EdgeInsets.all(10), child: Column(children: [
          Row(children: [Expanded(flex: 3, child: Text('Batter', style: _colHeaderStyle)), Expanded(flex: 2, child: Text('Score', textAlign: TextAlign.center, style: _colHeaderStyle)), Expanded(child: Text('Over', textAlign: TextAlign.center, style: _colHeaderStyle))]),
          const Divider(),
          ...fallOfWickets.map((f) => Padding(padding: const EdgeInsets.symmetric(vertical: 3), child: Row(children: [Expanded(flex: 3, child: Text(f.batsmanName, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13))), Expanded(flex: 2, child: Text(f.score, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13))), Expanded(child: Text(f.over, textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: AppTheme.ts(context))))]))),
        ]))),
      ],
      const SizedBox(height: 16),
    ]);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATS TAB — Enhanced
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildStatsTab() {
    final m = _match!;
    final isDark = AppTheme.isDark(context);
    // team1Score/team2Score are stored by innings (1st/2nd), not team identity.
    // Remap so the team1Name card always shows team 1's actual score.
    final team1Innings = _getTeamInnings(1);
    final team1Score = team1Innings == 1 ? m.team1Score : m.team2Score;
    final team1Wickets = team1Innings == 1 ? m.team1Wickets : m.team2Wickets;
    final team1Overs = team1Innings == 1 ? m.team1Overs : m.team2Overs;
    final team2Score = team1Innings == 1 ? m.team2Score : m.team1Score;
    final team2Wickets = team1Innings == 1 ? m.team2Wickets : m.team1Wickets;
    final team2Overs = team1Innings == 1 ? m.team2Overs : m.team1Overs;
    final crr1 = team1Overs > 0 ? team1Score / team1Overs : 0.0;
    final crr2 = team2Overs > 0 ? team2Score / team2Overs : 0.0;

    // ── Filter data based on _statsFilter ──────────────────────────────
    // 0 = overall (both innings), 1 = team1 batting innings, 2 = team2 batting innings
    final hasSecondInnings = _balls.any((b) => b.innings == 2) || m.currentInnings == 2 || m.status == 'completed';
    final filterInnings = _statsFilter == 0 ? null : _getTeamInnings(_statsFilter);
    final filterTeamName = _statsFilter == 1 ? m.team1Name : (_statsFilter == 2 ? m.team2Name : 'Overall');

    final filteredBalls = filterInnings == null
        ? _balls
        : _balls.where((b) => b.innings == filterInnings).toList();
    // Batting: players who batted in the filter innings
    final filteredBatting = filterInnings == null
        ? _batting
        : _batting.where((b) => b.team == filterInnings).toList();
    // Bowling: bowlers from opposing team in that innings
    final filteredBowling = filterInnings == null
        ? _bowling
        : _bowling.where((b) => b.team == (filterInnings == 1 ? 2 : 1)).toList();

    final sortedBat = List<PlayerScore>.from(filteredBatting)..sort((a, b) => b.runsScored.compareTo(a.runsScored));
    final sortedBowl = List<PlayerScore>.from(filteredBowling)..sort((a, b) => b.wicketsTaken.compareTo(a.wicketsTaken));
    final topScorers = sortedBat.take(3).toList();
    final topBowlers = sortedBowl.take(3).toList();

    int totalFours = 0, totalSixes = 0, wides = 0, noBalls = 0, byes = 0, legByes = 0;
    for (final b in filteredBalls) {
      if (b.runs == 4 && !b.isBye && !b.isLegbye) totalFours++;
      if (b.runs == 6 && !b.isBye && !b.isLegbye) totalSixes++;
      if (b.isWide) wides++; if (b.isNoball) noBalls++; if (b.isBye) byes++; if (b.isLegbye) legByes++;
    }

    return ListView(padding: const EdgeInsets.fromLTRB(14, 10, 14, 16), children: [
      // ── Filter toggle (shown once 2nd innings has data) ──────────────
      if (hasSecondInnings) ...[
        _buildStatsFilterToggle(m, isDark),
        const SizedBox(height: 12),
      ],

      // Run rate cards
      Row(children: [
        Expanded(child: _statCard(m.team1Name, '$team1Score/$team1Wickets', 'CRR ${crr1.toStringAsFixed(2)}', AppTheme.primaryGreen, isDark, 0)),
        const SizedBox(width: 10),
        Expanded(child: _statCard(m.team2Name, '$team2Score/$team2Wickets', 'CRR ${crr2.toStringAsFixed(2)}', AppTheme.upcomingBlue, isDark, 1)),
      ]),
      const SizedBox(height: 14),

      // Filter context label (only when filtered)
      if (_statsFilter != 0) ...[
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: AppTheme.accentGold.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.4)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.filter_alt_rounded, size: 14, color: AppTheme.accentAmber),
              const SizedBox(width: 4),
              Text('Showing: $filterTeamName batting',
                  style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.accentAmber)),
            ],
          ),
        ),
        const SizedBox(height: 10),
      ],

      // Run rate chart
      if (_balls.isNotEmpty) ...[
        Text('RUN RATE PROGRESSION', style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 14)),
        const SizedBox(height: 8),
        Container(
          height: 180,
          padding: const EdgeInsets.fromLTRB(8, 16, 16, 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            color: AppTheme.surface(context),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.05), blurRadius: 6)],
          ),
          child: _buildRunRateChart(),
        ).animate().fadeIn(duration: 500.ms, delay: 100.ms),
        const SizedBox(height: 14),
      ],

      // Match highlights
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          gradient: LinearGradient(colors: isDark ? [const Color(0xFF1A2A1A), const Color(0xFF0D3B12)] : [const Color(0xFF0D3B12), const Color(0xFF1B5E20)]),
          boxShadow: [BoxShadow(color: AppTheme.primaryGreen.withValues(alpha: 0.15), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('MATCH HIGHLIGHTS', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13, letterSpacing: 0.5)),
            const SizedBox(height: 10),
            Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
              _highlightItem(Icons.looks_4_rounded, '$totalFours', 'Fours', AppTheme.fourColor),
              _highlightItem(Icons.looks_6_rounded, '$totalSixes', 'Sixes', AppTheme.sixColor),
              _highlightItem(Icons.sports_cricket_rounded, '${wides + noBalls + byes + legByes}', 'Extras', Colors.white70),
              _highlightItem(Icons.gps_fixed_rounded, '${filteredBalls.where((b) => b.runs == 0 && !b.isWide && !b.isNoball && !b.isWicket).length}', 'Dots', Colors.white54),
            ]),
          ],
        ),
      ).animate().fadeIn(duration: 500.ms, delay: 200.ms).slideY(begin: 0.05),
      const SizedBox(height: 14),

      // Wagon wheel — directional shot map when shot data exists
      if (filteredBalls.any((b) => b.shotDirection != null)) ...[
        Text('WAGON WHEEL', style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 14)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            color: AppTheme.surface(context),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.05), blurRadius: 6)],
          ),
          child: _buildWagonWheel(filteredBalls),
        ).animate().fadeIn(duration: 500.ms, delay: 250.ms),
        const SizedBox(height: 14),
      ],

      // Scoring zones (boundaries vs running breakdown)
      if (filteredBalls.isNotEmpty) ...[
        Text('SCORING BREAKDOWN', style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 14)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            color: AppTheme.surface(context),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.05), blurRadius: 6)],
          ),
          child: _buildScoringZones(filteredBalls),
        ).animate().fadeIn(duration: 500.ms, delay: 300.ms),
        const SizedBox(height: 14),
      ],

      // Top performers
      Text('TOP SCORERS', style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 14)),
      const SizedBox(height: 6),
      ...topScorers.asMap().entries.map((e) => _performerCard(e.value.name, '${e.value.runsScored}', '${e.value.ballsFaced}b  •  SR ${e.value.strikeRate.toStringAsFixed(1)}', AppTheme.primaryGreen, e.key, false)),
      const SizedBox(height: 14),
      Text('TOP BOWLERS', style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 14)),
      const SizedBox(height: 6),
      ...topBowlers.asMap().entries.map((e) => _performerCard(e.value.name, '${e.value.wicketsTaken}-${e.value.runsConceded}', '${e.value.oversBowled.toStringAsFixed(1)} ov  •  Eco ${e.value.economyRate.toStringAsFixed(2)}', AppTheme.team2Color, e.key, true)),
      const SizedBox(height: 14),

      // Extras breakdown
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(borderRadius: BorderRadius.circular(14), color: AppTheme.surface(context), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.05), blurRadius: 6)]),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('EXTRAS BREAKDOWN', style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 13)),
          const SizedBox(height: 8),
          Row(children: [
            _extrasPill('Wides', wides, AppTheme.inProgressOrange),
            _extrasPill('No Balls', noBalls, AppTheme.wicketRed),
            _extrasPill('Byes', byes, AppTheme.upcomingBlue),
            _extrasPill('Leg Byes', legByes, AppTheme.completedGreen),
          ]),
        ]),
      ).animate().fadeIn(duration: 400.ms, delay: 400.ms),

      // Post-match summary
      if (m.status == 'completed') ...[
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            gradient: LinearGradient(colors: [AppTheme.accentGold.withValues(alpha: 0.12), AppTheme.accentAmber.withValues(alpha: 0.06)]),
            border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.3)),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Icon(Icons.emoji_events_rounded, size: 20, color: AppTheme.accentAmber),
              const SizedBox(width: 8),
              Text('POST-MATCH SUMMARY', style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 13)),
            ]),
            const SizedBox(height: 10),
            if (m.winner != null)
              _summaryRow('Result', _getVictoryMessage(m)),
            if (m.playerOfMatch != null)
              _summaryRow('Player of the Match', m.playerOfMatch!),
            if (m.umpire != null)
              _summaryRow('Umpire', m.umpire!),
            _summaryRow('Match Type', m.matchType ?? 'T20'),
            if (m.venue != null)
              _summaryRow('Venue', m.venue!),
            // Auto highlights
            if (sortedBat.isNotEmpty)
              _summaryRow('Highest Score', '${sortedBat.first.name} — ${sortedBat.first.runsScored}(${sortedBat.first.ballsFaced})'),
            if (sortedBowl.isNotEmpty && sortedBowl.first.wicketsTaken > 0)
              _summaryRow('Best Bowling', '${sortedBowl.first.name} — ${sortedBowl.first.wicketsTaken}/${sortedBowl.first.runsConceded}'),
          ]),
        ).animate().fadeIn(duration: 400.ms, delay: 500.ms),
      ],
    ]);
  }

  Widget _summaryRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(children: [
        SizedBox(width: 130, child: Text(label, style: GoogleFonts.poppins(fontSize: 12, color: AppTheme.ts(context)))),
        Expanded(child: Text(value, style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600))),
      ]),
    );
  }

  Widget _buildStatsFilterToggle(CricketMatch m, bool isDark) {
    final options = [
      {'value': 0, 'label': 'Overall', 'icon': Icons.public_rounded, 'color': AppTheme.accentAmber},
      {'value': 1, 'label': m.team1Name, 'icon': Icons.shield_rounded, 'color': AppTheme.primaryGreen},
      {'value': 2, 'label': m.team2Name, 'icon': Icons.shield_rounded, 'color': AppTheme.upcomingBlue},
    ];
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        children: options.map((opt) {
          final value = opt['value'] as int;
          final label = opt['label'] as String;
          final icon = opt['icon'] as IconData;
          final color = opt['color'] as Color;
          final isSelected = _statsFilter == value;
          return Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _statsFilter = value),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
                decoration: BoxDecoration(
                  gradient: isSelected
                      ? LinearGradient(colors: [color, color.withValues(alpha: 0.7)])
                      : null,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: isSelected
                      ? [BoxShadow(color: color.withValues(alpha: 0.3), blurRadius: 6, offset: const Offset(0, 2))]
                      : null,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(icon, size: 14, color: isSelected ? Colors.white : AppTheme.ts(context)),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        label,
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                          color: isSelected ? Colors.white : AppTheme.tp(context),
                        ),
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _statCard(String team, String score, String crr, Color color, bool isDark, int idx) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        color: AppTheme.surface(context),
        border: Border.all(color: AppTheme.divider(context).withValues(alpha: 0.7), width: 0.8),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.06), blurRadius: 6)],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(team, style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 12, color: AppTheme.ts(context)), maxLines: 1, overflow: TextOverflow.ellipsis),
        Text(score, style: GoogleFonts.poppins(fontSize: 24, fontWeight: FontWeight.w800, color: color)),
        Text(crr, style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.ts(context))),
      ]),
    ).animate().fadeIn(duration: 400.ms, delay: (idx * 100).ms).slideY(begin: 0.08);
  }

  Widget _highlightItem(IconData icon, String value, String label, Color color) {
    return Column(children: [
      Icon(icon, color: color, size: 22),
      const SizedBox(height: 4),
      Text(value, style: GoogleFonts.poppins(color: color, fontWeight: FontWeight.w800, fontSize: 18)),
      Text(label, style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 10)),
    ]);
  }

  Widget _performerCard(String name, String stat, String sub, Color color, int idx, bool isBowler) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: AppTheme.surface(context),
        border: Border.all(color: AppTheme.divider(context).withValues(alpha: 0.7), width: 0.8),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: AppTheme.isDark(context) ? 0.15 : 0.04), blurRadius: 4)],
      ),
      child: Row(children: [
        CircleAvatar(radius: 18, backgroundColor: color.withValues(alpha: 0.15), child: Text(name.isNotEmpty ? name[0] : '?', style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 14))),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(name, style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13), overflow: TextOverflow.ellipsis),
          Text(sub, style: TextStyle(fontSize: 11, color: AppTheme.ts(context))),
        ])),
        Text(stat, style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w800, color: color)),
      ]),
    ).animate().fadeIn(duration: 400.ms, delay: (idx * 80).ms).slideX(begin: 0.04);
  }

  Widget _extrasPill(String label, int count, Color color) {
    return Expanded(child: Padding(padding: const EdgeInsets.symmetric(horizontal: 3), child: Column(children: [
      Container(
        width: 38, height: 38,
        decoration: BoxDecoration(shape: BoxShape.circle, color: color.withValues(alpha: 0.12)),
        child: Center(child: Text('$count', style: GoogleFonts.poppins(fontWeight: FontWeight.w800, fontSize: 14, color: color))),
      ),
      const SizedBox(height: 4),
      Text(label, style: TextStyle(fontSize: 9, color: AppTheme.ts(context)), textAlign: TextAlign.center),
    ])));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUPER STARS TAB — Enhanced
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildSuperStarsTab() {
    final sortedBat = List<PlayerScore>.from(_batting)..sort((a, b) => b.runsScored.compareTo(a.runsScored));
    final sortedBowl = List<PlayerScore>.from(_bowling)..sort((a, b) => b.wicketsTaken.compareTo(a.wicketsTaken));

    if (_batting.isEmpty && _bowling.isEmpty) return _emptyTab('No data yet');

    return ListView(padding: const EdgeInsets.fromLTRB(14, 10, 14, 16), children: [
      _starSectionHeader('Best Batsmen', Icons.sports_cricket_rounded, AppTheme.primaryGreen),
      const SizedBox(height: 8),
      ...sortedBat.take(5).toList().asMap().entries.map((e) => _starCard(e.key, e.value.name, '${e.value.runsScored}', '${e.value.ballsFaced}b  •  ${e.value.fours}x4  •  ${e.value.sixes}x6  •  SR ${e.value.strikeRate.toStringAsFixed(1)}', AppTheme.primaryGreen, false)),
      const SizedBox(height: 18),
      _starSectionHeader('Best Bowlers', Icons.sports_baseball_rounded, AppTheme.team2Color),
      const SizedBox(height: 8),
      ...sortedBowl.take(5).toList().asMap().entries.map((e) => _starCard(e.key, e.value.name, '${e.value.wicketsTaken}-${e.value.runsConceded}', '${e.value.oversBowled.toStringAsFixed(1)} ov  •  Eco ${e.value.economyRate.toStringAsFixed(2)}', AppTheme.team2Color, true)),
    ]);
  }

  Widget _starSectionHeader(String title, IconData icon, Color color) {
    return Row(children: [
      Container(padding: const EdgeInsets.all(6), decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)), child: Icon(icon, size: 18, color: color)),
      const SizedBox(width: 8),
      Text(title, style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 16)),
    ]);
  }

  static const _rankColors = [Color(0xFFFFD700), Color(0xFFC0C0C0), Color(0xFFCD7F32)];
  static const _rankIcons = [Icons.emoji_events, Icons.workspace_premium, Icons.military_tech];

  Widget _starCard(int rank, String name, String stat, String sub, Color color, bool isBowler) {
    final isTop3 = rank < 3;
    final delay = ((isBowler ? 5 : 0) + rank) * 80;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: AppTheme.surface(context),
        border: Border.all(color: AppTheme.divider(context).withValues(alpha: 0.7), width: 0.8),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: AppTheme.isDark(context) ? 0.2 : 0.04), blurRadius: 6)],
      ),
      child: Row(children: [
        // Rank badge
        if (isTop3)
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _rankColors[rank].withValues(alpha: 0.15),
            ),
            child: Center(child: Icon(_rankIcons[rank], size: 16, color: _rankColors[rank])),
          )
        else
          SizedBox(width: 32, child: Center(child: Text('#${rank + 1}', style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 14, color: AppTheme.ts(context))))),
        const SizedBox(width: 12),
        // Avatar
        CircleAvatar(radius: 22, backgroundColor: color.withValues(alpha: 0.8), child: Text(name.isNotEmpty ? name[0] : '?', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16))),
        const SizedBox(width: 12),
        // Info
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(name, style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14)),
          Text(sub, style: TextStyle(fontSize: 11, color: AppTheme.ts(context))),
        ])),
        // Stat
        Text(stat, style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.w800, color: color)),
      ]),
    ).animate().fadeIn(duration: 400.ms, delay: delay.ms).slideX(begin: 0.06);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RUN RATE CHART
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildRunRateChart() {
    // Map team → innings where they batted
    final m = _match!;
    final team1Innings = _getTeamInnings(1);
    final team2Innings = _getTeamInnings(2);

    // Decide which lines to show based on filter
    final showTeam1 = _statsFilter == 0 || _statsFilter == 1;
    final showTeam2 = _statsFilter == 0 || _statsFilter == 2;

    final inn1Balls = _balls.where((b) => b.innings == team1Innings).toList();
    final inn2Balls = _balls.where((b) => b.innings == team2Innings).toList();

    List<FlSpot> buildSpots(List<Ball> balls) {
      if (balls.isEmpty) return [];
      final Map<int, int> overRuns = {};
      for (final b in balls) {
        overRuns[b.overNumber] = (overRuns[b.overNumber] ?? 0) + b.runs + b.extras;
      }
      int cumulative = 0;
      final spots = <FlSpot>[const FlSpot(0, 0)];
      for (final over in overRuns.keys.toList()..sort()) {
        cumulative += overRuns[over]!;
        spots.add(FlSpot((over + 1).toDouble(), cumulative.toDouble()));
      }
      return spots;
    }

    final spots1 = showTeam1 ? buildSpots(inn1Balls) : <FlSpot>[];
    final spots2 = showTeam2 ? buildSpots(inn2Balls) : <FlSpot>[];

    final allYs = [
      ...spots1.map((s) => s.y),
      ...spots2.map((s) => s.y),
      10.0,
    ];
    final maxY = allYs.reduce((a, b) => a > b ? a : b);

    return Column(
      children: [
        // Legend
        Padding(
          padding: const EdgeInsets.only(left: 8, right: 8, bottom: 6),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              if (showTeam1) ...[
                Container(width: 12, height: 3, color: AppTheme.primaryGreen),
                const SizedBox(width: 4),
                Text(m.team1Name, style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.primaryGreen)),
              ],
              if (showTeam1 && showTeam2) const SizedBox(width: 10),
              if (showTeam2) ...[
                Container(width: 12, height: 3, color: AppTheme.upcomingBlue),
                const SizedBox(width: 4),
                Text(m.team2Name, style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.upcomingBlue)),
              ],
            ],
          ),
        ),
        Expanded(
          child: LineChart(
            LineChartData(
              minY: 0,
              maxY: maxY + 10,
              gridData: FlGridData(
                show: true,
                drawVerticalLine: false,
                horizontalInterval: (maxY / 4).clamp(10, 100),
                getDrawingHorizontalLine: (v) => FlLine(color: AppTheme.divider(context), strokeWidth: 0.5),
              ),
              titlesData: FlTitlesData(
                topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    interval: 2,
                    getTitlesWidget: (v, _) => v % 2 == 0
                        ? Text('${v.toInt()}', style: TextStyle(fontSize: 9, color: AppTheme.ts(context)))
                        : const SizedBox.shrink(),
                  ),
                ),
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 32,
                    getTitlesWidget: (v, _) => Text('${v.toInt()}', style: TextStyle(fontSize: 9, color: AppTheme.ts(context))),
                  ),
                ),
              ),
              borderData: FlBorderData(show: false),
              lineBarsData: [
                if (spots1.length > 1)
                  LineChartBarData(
                    spots: spots1,
                    isCurved: true,
                    color: AppTheme.primaryGreen,
                    barWidth: 2.5,
                    dotData: FlDotData(show: spots1.length < 15),
                    belowBarData: BarAreaData(show: true, color: AppTheme.primaryGreen.withValues(alpha: 0.08)),
                  ),
                if (spots2.length > 1)
                  LineChartBarData(
                    spots: spots2,
                    isCurved: true,
                    color: AppTheme.upcomingBlue,
                    barWidth: 2.5,
                    dotData: FlDotData(show: spots2.length < 15),
                    belowBarData: BarAreaData(show: true, color: AppTheme.upcomingBlue.withValues(alpha: 0.08)),
                    dashArray: [5, 3],
                  ),
              ],
              lineTouchData: LineTouchData(
                touchTooltipData: LineTouchTooltipData(
                  getTooltipItems: (spots) => spots.map((s) => LineTooltipItem(
                    'Over ${s.x.toInt()}: ${s.y.toInt()} runs',
                    TextStyle(fontSize: 11, color: s.bar.color, fontWeight: FontWeight.w600),
                  )).toList(),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WAGON WHEEL — actual shot direction visualization
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildWagonWheel([List<Ball>? sourceBalls]) {
    final balls = sourceBalls ?? _balls;
    // Aggregate runs per zone
    final Map<String, int> zoneRuns = {};
    final Map<String, int> zoneCount = {};
    int totalShots = 0;
    for (final b in balls) {
      if (b.shotDirection == null || b.isWide || b.isNoball || b.isWicket) continue;
      final zone = b.shotDirection!;
      zoneRuns[zone] = (zoneRuns[zone] ?? 0) + b.runs + b.overthrows;
      zoneCount[zone] = (zoneCount[zone] ?? 0) + 1;
      totalShots++;
    }

    if (totalShots == 0) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Center(child: Text('No shot direction data yet',
            style: GoogleFonts.poppins(color: AppTheme.ts(context), fontSize: 13))),
      );
    }

    return Column(
      children: [
        SizedBox(
          height: 280,
          child: CustomPaint(
            size: const Size(double.infinity, 280),
            painter: _WagonWheelPainter(zoneRuns: zoneRuns, isDark: AppTheme.isDark(context)),
          ),
        ),
        const SizedBox(height: 8),
        // Zone summary chips
        Wrap(
          spacing: 6,
          runSpacing: 6,
          alignment: WrapAlignment.center,
          children: zoneRuns.entries.map((e) {
            final label = _zoneLabel(e.key);
            final color = _WagonWheelPainter.zoneColors[e.key] ?? AppTheme.primaryGreen;
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: color.withValues(alpha: 0.5)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 8, height: 8,
                    decoration: BoxDecoration(shape: BoxShape.circle, color: color),
                  ),
                  const SizedBox(width: 5),
                  Text('$label: ${e.value}r (${zoneCount[e.key]})',
                      style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.w600, color: color)),
                ],
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  String _zoneLabel(String key) {
    switch (key) {
      case 'fine_leg': return 'Fine Leg';
      case 'square_leg': return 'Square Leg';
      case 'midwicket': return 'Mid-wicket';
      case 'mid_on': return 'Mid On';
      case 'long_on': return 'Long On';
      case 'long_off': return 'Long Off';
      case 'cover': return 'Cover';
      case 'point': return 'Point';
      case 'third_man': return 'Third Man';
      default: return key;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCORING ZONES (Wagon Wheel-style breakdown)
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildScoringZones([List<Ball>? sourceBalls]) {
    final balls = sourceBalls ?? _balls;
    int sixesRuns = 0, foursRuns = 0, runningRuns = 0, dotBalls = 0, extrasRuns = 0;
    for (final b in balls) {
      if (b.isWide || b.isNoball) {
        extrasRuns += b.extras;
      } else if (b.runs == 6 && !b.isBye && !b.isLegbye) {
        sixesRuns += 6;
      } else if (b.runs == 4 && !b.isBye && !b.isLegbye) {
        foursRuns += 4;
      } else if (b.runs == 0) {
        dotBalls++;
      } else {
        runningRuns += b.runs + b.extras;
      }
    }

    final totalRuns = sixesRuns + foursRuns + runningRuns + extrasRuns;
    if (totalRuns == 0) {
      return Padding(
        padding: const EdgeInsets.all(20),
        child: Center(
          child: Text('No scoring data yet',
              style: GoogleFonts.poppins(color: AppTheme.ts(context), fontSize: 13)),
        ),
      );
    }

    final sections = <PieChartSectionData>[];
    void addSection(int value, Color color, String label, IconData icon) {
      if (value == 0) return;
      sections.add(PieChartSectionData(
        value: value.toDouble(),
        color: color,
        title: '$value',
        radius: 55,
        titleStyle: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
      ));
    }

    addSection(sixesRuns, AppTheme.sixColor, 'Sixes', Icons.looks_6);
    addSection(foursRuns, AppTheme.fourColor, 'Fours', Icons.looks_4);
    addSection(runningRuns, AppTheme.primaryGreen, 'Running', Icons.directions_run);
    addSection(extrasRuns, AppTheme.upcomingBlue, 'Extras', Icons.add_circle_outline);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 16),
          child: SizedBox(
          height: 160,
          child: Row(
            children: [
              // Pie chart
              Expanded(
                flex: 2,
                child: PieChart(
                  PieChartData(
                    sections: sections,
                    sectionsSpace: 2,
                    centerSpaceRadius: 28,
                    centerSpaceColor: AppTheme.surface(context),
                  ),
                ),
              ),
              // Legend
              Expanded(
                flex: 3,
                child: Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _legendRow(AppTheme.sixColor, 'Sixes', '$sixesRuns runs', totalRuns),
                      _legendRow(AppTheme.fourColor, 'Fours', '$foursRuns runs', totalRuns),
                      _legendRow(AppTheme.primaryGreen, 'Running', '$runningRuns runs', totalRuns),
                      _legendRow(AppTheme.upcomingBlue, 'Extras', '$extrasRuns runs', totalRuns),
                    ],
                  ),
                ),
              ),
            ],
          ),
          ),
        ),
        const SizedBox(height: 8),
        // Dot ball summary
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: AppTheme.dotBallColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.gps_fixed, size: 13, color: AppTheme.dotBallColor),
              const SizedBox(width: 6),
              Text('$dotBalls dot balls',
                  style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.dotBallColor)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _legendRow(Color color, String label, String value, int total) {
    final pct = total > 0 ? ((int.tryParse(value.split(' ')[0]) ?? 0) * 100 / total).toStringAsFixed(0) : '0';
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Container(width: 12, height: 12, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600)),
                Text('$value  •  $pct%', style: TextStyle(fontSize: 10, color: AppTheme.ts(context))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BALLS TAB — Delivery log with cumulative score
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildBallsTab() {
    if (_balls.isEmpty) return _emptyTab('No ball data available');

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(14, 8, 14, 16),
      itemCount: _balls.length,
      itemBuilder: (context, index) {
        final b = _balls[index];
        // Calculate cumulative score up to this ball for this innings
        int cumScore = 0;
        for (int i = 0; i <= index; i++) {
          if (_balls[i].innings == b.innings) {
            cumScore += _balls[i].runs + _balls[i].extras;
          }
        }

        Color dotColor;
        if (b.isWicket) {
          dotColor = AppTheme.wicketRed;
        } else if (b.runs == 4 && !b.isBye && !b.isLegbye) {
          dotColor = AppTheme.fourColor;
        } else if (b.runs == 6 && !b.isBye && !b.isLegbye) {
          dotColor = AppTheme.sixColor;
        } else if (b.runs == 0 && !b.isWide && !b.isNoball) {
          dotColor = AppTheme.dotBallColor;
        } else {
          dotColor = AppTheme.upcomingBlue;
        }

        final isNewInnings = index == 0 || _balls[index - 1].innings != b.innings;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (isNewInnings)
              Padding(
                padding: const EdgeInsets.only(top: 8, bottom: 6),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFF1B5E20), Color(0xFF2E7D32)]),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text('Innings ${b.innings}', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 12)),
                ),
              ),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Row(
                children: [
                  // Over.Ball
                  SizedBox(
                    width: 40,
                    child: Text('${b.overNumber}.${b.ballNumber}', style: TextStyle(fontSize: 11, color: AppTheme.ts(context), fontWeight: FontWeight.w500)),
                  ),
                  // Outcome dot
                  Container(
                    width: 30, height: 30,
                    decoration: BoxDecoration(shape: BoxShape.circle, color: dotColor),
                    child: Center(child: Text(b.displayText, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700))),
                  ),
                  const SizedBox(width: 10),
                  // Batsman & Bowler
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(b.batsmanName ?? '', style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600)),
                        Text('b ${b.bowlerName ?? ''}', style: TextStyle(fontSize: 10, color: AppTheme.ts(context))),
                      ],
                    ),
                  ),
                  // Cumulative score
                  Text('$cumScore', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.primaryGreen)),
                ],
              ),
            ),
            if (index < _balls.length - 1 && _balls[index + 1].innings == b.innings)
              Divider(height: 1, color: AppTheme.divider(context).withValues(alpha: 0.3)),
          ],
        );
      },
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PDF EXPORT
  // ═══════════════════════════════════════════════════════════════════════════

  Future<void> _exportPdf(BuildContext context) async {
    final m = _match!;
    final doc = pw.Document();

    // ── PRE-COMPUTE: aggregate match data for all sections ─────────────
    final battingFirst = _getBattingFirstTeam(m);

    // Per-innings batting/bowling
    List<PlayerScore> battingFor(int teamNumber) {
      final inn = _getTeamInnings(teamNumber);
      return _batting.where((b) => b.team == inn).toList()..sort((a, b) => a.id.compareTo(b.id));
    }
    List<PlayerScore> bowlingFor(int teamNumber) {
      final inn = _getTeamInnings(teamNumber);
      final bowlerInn = inn == 1 ? 2 : 1;
      return _bowling.where((b) => b.team == bowlerInn).toList();
    }

    // Helper: build a batting block for a team
    List<pw.Widget> battingBlock(int teamNumber) {
      final teamName = teamNumber == 1 ? m.team1Name : m.team2Name;
      final teamScore = teamNumber == 1 ? m.team1Score : m.team2Score;
      final teamWickets = teamNumber == 1 ? m.team1Wickets : m.team2Wickets;
      final teamOvers = teamNumber == 1 ? m.team1Overs : m.team2Overs;
      final batters = battingFor(teamNumber);
      final bowlers = bowlingFor(teamNumber);
      final inn = _getTeamInnings(teamNumber);

      // Innings extras
      int wides = 0, noBalls = 0, byes = 0, legByes = 0;
      for (final b in _balls.where((b) => b.innings == inn)) {
        if (b.isWide) wides += b.extras;
        if (b.isNoball) noBalls += b.extras;
        if (b.isBye) byes += b.runs;
        if (b.isLegbye) legByes += b.runs;
      }

      // Fall of wickets
      final fallOfWickets = <_FallOfWicket>[];
      int runningScore = 0; int wicketCount = 0;
      for (final b in _balls.where((b) => b.innings == inn)) {
        runningScore += b.runs + b.extras;
        if (b.isWicket) {
          wicketCount++;
          fallOfWickets.add(_FallOfWicket(
            batsmanName: b.batsmanName ?? 'Unknown',
            score: '$wicketCount-$runningScore',
            over: '${b.overNumber}.${b.ballNumber}',
          ));
        }
      }

      return [
        pw.SizedBox(height: 10),
        pw.Container(
          padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          color: PdfColor.fromInt(0xFF1B5E20),
          child: pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Text(teamName, style: pw.TextStyle(color: PdfColors.white, fontSize: 12, fontWeight: pw.FontWeight.bold)),
              pw.Text('$teamScore/$teamWickets (${teamOvers.toStringAsFixed(1)} ov)',
                  style: pw.TextStyle(color: PdfColor.fromInt(0xFFFFD600), fontSize: 12, fontWeight: pw.FontWeight.bold)),
            ],
          ),
        ),
        pw.SizedBox(height: 6),
        // Batting table
        if (batters.isEmpty)
          pw.Padding(
            padding: const pw.EdgeInsets.all(8),
            child: pw.Text('$teamName has not batted yet', style: const pw.TextStyle(color: PdfColors.grey700)),
          )
        else
          pw.Table(
            border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.5),
            columnWidths: {
              0: const pw.FlexColumnWidth(3),
              1: const pw.FlexColumnWidth(1),
              2: const pw.FlexColumnWidth(1),
              3: const pw.FlexColumnWidth(1),
              4: const pw.FlexColumnWidth(1),
              5: const pw.FlexColumnWidth(1.2),
            },
            children: [
              pw.TableRow(
                decoration: const pw.BoxDecoration(color: PdfColors.grey200),
                children: [
                  _pdfCell('Batter', bold: true),
                  _pdfCell('R', bold: true, center: true),
                  _pdfCell('B', bold: true, center: true),
                  _pdfCell('4s', bold: true, center: true),
                  _pdfCell('6s', bold: true, center: true),
                  _pdfCell('SR', bold: true, center: true),
                ],
              ),
              ...batters.map((p) {
                String status;
                if (p.isOut && p.outType != null) {
                  status = p.outType!;
                } else if (p.outType == 'retired hurt') {
                  status = 'retired hurt';
                } else {
                  status = 'not out';
                }
                final nameWithStatus = '${p.name}${p.isCaptain ? ' (c)' : ''}${p.isWicketKeeper ? ' (wk)' : ''}\n$status';
                return pw.TableRow(children: [
                  _pdfCell(nameWithStatus),
                  _pdfCell('${p.runsScored}', center: true, bold: true),
                  _pdfCell('${p.ballsFaced}', center: true),
                  _pdfCell('${p.fours}', center: true),
                  _pdfCell('${p.sixes}', center: true),
                  _pdfCell(p.strikeRate.toStringAsFixed(1), center: true),
                ]);
              }),
            ],
          ),
        // Extras line
        pw.SizedBox(height: 4),
        pw.Padding(
          padding: const pw.EdgeInsets.symmetric(horizontal: 4),
          child: pw.Text(
            'Extras: ${wides + noBalls + byes + legByes}'
            '${legByes > 0 ? ' (${legByes}lb' : ' ('}'
            '${byes > 0 ? '${legByes > 0 ? ", " : ""}${byes}b' : ''}'
            '${wides > 0 ? '${(legByes > 0 || byes > 0) ? ", " : ""}${wides}w' : ''}'
            '${noBalls > 0 ? '${(legByes > 0 || byes > 0 || wides > 0) ? ", " : ""}${noBalls}nb' : ''}'
            '${(legByes + byes + wides + noBalls) > 0 ? ")" : ""}',
            style: const pw.TextStyle(fontSize: 9),
          ),
        ),
        // Bowling table
        if (bowlers.isNotEmpty) ...[
          pw.SizedBox(height: 8),
          pw.Text('Bowling', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 11)),
          pw.SizedBox(height: 4),
          pw.Table(
            border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.5),
            columnWidths: {
              0: const pw.FlexColumnWidth(3),
              1: const pw.FlexColumnWidth(1),
              2: const pw.FlexColumnWidth(1),
              3: const pw.FlexColumnWidth(1),
              4: const pw.FlexColumnWidth(1),
              5: const pw.FlexColumnWidth(1.2),
            },
            children: [
              pw.TableRow(
                decoration: const pw.BoxDecoration(color: PdfColors.grey200),
                children: [
                  _pdfCell('Bowler', bold: true),
                  _pdfCell('O', bold: true, center: true),
                  _pdfCell('M', bold: true, center: true),
                  _pdfCell('R', bold: true, center: true),
                  _pdfCell('W', bold: true, center: true),
                  _pdfCell('Eco', bold: true, center: true),
                ],
              ),
              ...bowlers.map((b) => pw.TableRow(children: [
                _pdfCell('${b.name}${b.isCaptain ? ' (c)' : ''}${b.isWicketKeeper ? ' (wk)' : ''}'),
                _pdfCell(b.oversBowled.toStringAsFixed(1), center: true),
                _pdfCell('${b.maidens}', center: true),
                _pdfCell('${b.runsConceded}', center: true),
                _pdfCell('${b.wicketsTaken}', center: true, bold: true),
                _pdfCell(b.economyRate.toStringAsFixed(2), center: true),
              ])),
            ],
          ),
        ],
        // Fall of wickets
        if (fallOfWickets.isNotEmpty) ...[
          pw.SizedBox(height: 8),
          pw.Text('Fall of Wickets', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 11)),
          pw.SizedBox(height: 4),
          pw.Wrap(
            spacing: 8, runSpacing: 4,
            children: fallOfWickets.map((f) => pw.Container(
              padding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: pw.BoxDecoration(
                color: PdfColors.grey100,
                borderRadius: pw.BorderRadius.circular(3),
              ),
              child: pw.Text('${f.score} (${f.batsmanName}, ${f.over})',
                  style: const pw.TextStyle(fontSize: 9)),
            )).toList(),
          ),
        ],
      ];
    }

    // Stats — top performers across both innings
    final sortedBat = List<PlayerScore>.from(_batting)..sort((a, b) => b.runsScored.compareTo(a.runsScored));
    final sortedBowl = List<PlayerScore>.from(_bowling)..sort((a, b) => b.wicketsTaken.compareTo(a.wicketsTaken));

    int totalFours = 0, totalSixes = 0, totalDots = 0, totalWides = 0, totalNoBalls = 0;
    for (final b in _balls) {
      if (b.runs == 4 && !b.isBye && !b.isLegbye) totalFours++;
      if (b.runs == 6 && !b.isBye && !b.isLegbye) totalSixes++;
      if (b.runs == 0 && !b.isWide && !b.isNoball && !b.isWicket) totalDots++;
      if (b.isWide) totalWides++;
      if (b.isNoball) totalNoBalls++;
    }

    // Scoring tab — over-by-over balls grouped
    Map<String, List<Ball>> ballsByOver(int innings) {
      final map = <String, List<Ball>>{};
      for (final b in _balls.where((b) => b.innings == innings)) {
        final key = 'Over ${b.overNumber}';
        map.putIfAbsent(key, () => []).add(b);
      }
      return map;
    }

    // Helper for scoring section
    List<pw.Widget> scoringBlock(int innings) {
      final overs = ballsByOver(innings);
      if (overs.isEmpty) return [];
      return [
        pw.SizedBox(height: 8),
        pw.Text('Innings $innings', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 11)),
        pw.SizedBox(height: 4),
        ...overs.entries.map((e) {
          final overRuns = e.value.fold<int>(0, (s, b) => s + b.runs + b.extras);
          return pw.Container(
            margin: const pw.EdgeInsets.only(bottom: 4),
            padding: const pw.EdgeInsets.all(4),
            decoration: pw.BoxDecoration(
              color: PdfColors.grey100,
              borderRadius: pw.BorderRadius.circular(3),
            ),
            child: pw.Row(
              children: [
                pw.SizedBox(
                  width: 50,
                  child: pw.Text(e.key, style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold)),
                ),
                pw.Expanded(
                  child: pw.Wrap(
                    spacing: 3,
                    children: e.value.map((b) => pw.Container(
                      padding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                      decoration: pw.BoxDecoration(
                        color: b.isWicket
                            ? PdfColor.fromInt(0xFFFF1744)
                            : (b.runs == 6 && !b.isBye && !b.isLegbye)
                                ? PdfColor.fromInt(0xFFFFD600)
                                : (b.runs == 4 && !b.isBye && !b.isLegbye)
                                    ? PdfColor.fromInt(0xFF00E676)
                                    : PdfColors.grey200,
                        borderRadius: pw.BorderRadius.circular(2),
                      ),
                      child: pw.Text(b.displayText,
                          style: pw.TextStyle(
                              fontSize: 8,
                              fontWeight: pw.FontWeight.bold,
                              color: b.isWicket ? PdfColors.white : PdfColors.black)),
                    )).toList(),
                  ),
                ),
                pw.Container(
                  padding: const pw.EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                  decoration: pw.BoxDecoration(
                    color: PdfColor.fromInt(0xFFFFD600),
                    borderRadius: pw.BorderRadius.circular(2),
                  ),
                  child: pw.Text('$overRuns r',
                      style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold)),
                ),
              ],
            ),
          );
        }),
      ];
    }

    // ── BUILD PDF DOCUMENT ─────────────────────────────────────────────
    doc.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(28),
        header: (ctx) => pw.Container(
          alignment: pw.Alignment.centerRight,
          margin: const pw.EdgeInsets.only(bottom: 8),
          child: pw.Text('Future Protea — Match Report',
              style: pw.TextStyle(fontSize: 9, color: PdfColors.grey600, fontStyle: pw.FontStyle.italic)),
        ),
        footer: (ctx) => pw.Container(
          alignment: pw.Alignment.centerRight,
          child: pw.Text('Page ${ctx.pageNumber} of ${ctx.pagesCount}',
              style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey600)),
        ),
        build: (ctx) {
          return [
            // ── HEADER ────────────────────────────────────────────────
            pw.Container(
              padding: const pw.EdgeInsets.all(12),
              decoration: pw.BoxDecoration(
                gradient: const pw.LinearGradient(
                  colors: [PdfColor.fromInt(0xFF0D3B12), PdfColor.fromInt(0xFF1B5E20)],
                ),
                borderRadius: pw.BorderRadius.circular(6),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text('${m.team1Name} vs ${m.team2Name}',
                      style: pw.TextStyle(
                          color: PdfColors.white, fontSize: 18, fontWeight: pw.FontWeight.bold)),
                  pw.SizedBox(height: 4),
                  pw.Row(
                    children: [
                      pw.Text(
                        '${m.team1Name}: ${m.team1Score}/${m.team1Wickets} (${m.team1Overs.toStringAsFixed(1)})',
                        style: const pw.TextStyle(color: PdfColors.white, fontSize: 11),
                      ),
                      pw.SizedBox(width: 16),
                      pw.Text(
                        '${m.team2Name}: ${m.team2Score}/${m.team2Wickets} (${m.team2Overs.toStringAsFixed(1)})',
                        style: const pw.TextStyle(color: PdfColors.white, fontSize: 11),
                      ),
                    ],
                  ),
                  if (m.winner != null) ...[
                    pw.SizedBox(height: 6),
                    pw.Container(
                      padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: pw.BoxDecoration(
                        color: PdfColor.fromInt(0xFFFFD600),
                        borderRadius: pw.BorderRadius.circular(3),
                      ),
                      child: pw.Text(
                        _getVictoryMessage(m),
                        style: pw.TextStyle(
                            fontSize: 11, fontWeight: pw.FontWeight.bold, color: PdfColors.black),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            pw.SizedBox(height: 10),

            // ── MATCH INFO ────────────────────────────────────────────
            pw.Wrap(
              spacing: 10, runSpacing: 4,
              children: [
                _pdfInfoRow('Date', m.matchDate.toLocal().toString().split(' ')[0]),
                if (m.venue != null) _pdfInfoRow('Venue', m.venue!),
                if (m.umpire != null) _pdfInfoRow('Umpire', m.umpire!),
                _pdfInfoRow('Type', '${m.matchType ?? "T20"} (${m.totalOvers} overs)'),
                if (m.tossWinner != null) _pdfInfoRow('Toss', '${m.tossWinner} (${m.tossDecision})'),
                if (m.playerOfMatch != null) _pdfInfoRow('Player of Match', m.playerOfMatch!),
              ],
            ),
            pw.SizedBox(height: 12),

            // ── 1. SCORECARD ──────────────────────────────────────────
            pw.Container(
              padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              color: PdfColor.fromInt(0xFF2E7D32),
              child: pw.Text('1. SCORECARD',
                  style: pw.TextStyle(
                      color: PdfColors.white, fontSize: 13, fontWeight: pw.FontWeight.bold)),
            ),
            ...battingBlock(battingFirst),
            ...battingBlock(battingFirst == 1 ? 2 : 1),

            // ── 2. SCORING (Over-by-Over) ─────────────────────────────
            pw.SizedBox(height: 14),
            pw.Container(
              padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              color: PdfColor.fromInt(0xFF2E7D32),
              child: pw.Text('2. SCORING — OVER BY OVER',
                  style: pw.TextStyle(
                      color: PdfColors.white, fontSize: 13, fontWeight: pw.FontWeight.bold)),
            ),
            ...scoringBlock(1),
            ...scoringBlock(2),

            // ── 3. STATS ──────────────────────────────────────────────
            pw.SizedBox(height: 14),
            pw.Container(
              padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              color: PdfColor.fromInt(0xFF2E7D32),
              child: pw.Text('3. MATCH STATS',
                  style: pw.TextStyle(
                      color: PdfColors.white, fontSize: 13, fontWeight: pw.FontWeight.bold)),
            ),
            pw.SizedBox(height: 8),
            pw.Table(
              border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.5),
              children: [
                pw.TableRow(
                  decoration: const pw.BoxDecoration(color: PdfColors.grey200),
                  children: [
                    _pdfCell('Metric', bold: true),
                    _pdfCell(m.team1Name, bold: true, center: true),
                    _pdfCell(m.team2Name, bold: true, center: true),
                    _pdfCell('Total', bold: true, center: true),
                  ],
                ),
                pw.TableRow(children: [
                  _pdfCell('Runs'),
                  _pdfCell('${m.team1Score}', center: true),
                  _pdfCell('${m.team2Score}', center: true),
                  _pdfCell('${m.team1Score + m.team2Score}', center: true, bold: true),
                ]),
                pw.TableRow(children: [
                  _pdfCell('CRR'),
                  _pdfCell(m.team1Overs > 0 ? (m.team1Score / m.team1Overs).toStringAsFixed(2) : '0', center: true),
                  _pdfCell(m.team2Overs > 0 ? (m.team2Score / m.team2Overs).toStringAsFixed(2) : '0', center: true),
                  _pdfCell('—', center: true),
                ]),
              ],
            ),
            pw.SizedBox(height: 10),
            pw.Text('Match Highlights', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 11)),
            pw.SizedBox(height: 4),
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceAround,
              children: [
                _pdfHighlight('Fours', '$totalFours'),
                _pdfHighlight('Sixes', '$totalSixes'),
                _pdfHighlight('Wides', '$totalWides'),
                _pdfHighlight('No Balls', '$totalNoBalls'),
                _pdfHighlight('Dots', '$totalDots'),
              ],
            ),

            // ── 4. SUPER STARS ────────────────────────────────────────
            pw.SizedBox(height: 14),
            pw.Container(
              padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              color: PdfColor.fromInt(0xFF2E7D32),
              child: pw.Text('4. SUPER STARS',
                  style: pw.TextStyle(
                      color: PdfColors.white, fontSize: 13, fontWeight: pw.FontWeight.bold)),
            ),
            pw.SizedBox(height: 8),
            pw.Text('Best Batsmen', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 11)),
            pw.SizedBox(height: 4),
            if (sortedBat.where((p) => p.runsScored > 0).isEmpty)
              pw.Text('No batting data', style: const pw.TextStyle(color: PdfColors.grey700, fontSize: 9))
            else
              pw.Table(
                border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.5),
                columnWidths: {
                  0: const pw.FlexColumnWidth(0.5),
                  1: const pw.FlexColumnWidth(3),
                  2: const pw.FlexColumnWidth(1),
                  3: const pw.FlexColumnWidth(1),
                  4: const pw.FlexColumnWidth(1),
                  5: const pw.FlexColumnWidth(1),
                  6: const pw.FlexColumnWidth(1),
                },
                children: [
                  pw.TableRow(
                    decoration: const pw.BoxDecoration(color: PdfColors.grey200),
                    children: [
                      _pdfCell('#', bold: true, center: true),
                      _pdfCell('Batter', bold: true),
                      _pdfCell('R', bold: true, center: true),
                      _pdfCell('B', bold: true, center: true),
                      _pdfCell('4s', bold: true, center: true),
                      _pdfCell('6s', bold: true, center: true),
                      _pdfCell('SR', bold: true, center: true),
                    ],
                  ),
                  ...sortedBat.where((p) => p.runsScored > 0).take(5).toList().asMap().entries.map((e) {
                    final p = e.value;
                    return pw.TableRow(
                      decoration: e.key == 0
                          ? const pw.BoxDecoration(color: PdfColor.fromInt(0xFFFFF8E1))
                          : null,
                      children: [
                        _pdfCell('${e.key + 1}', center: true, bold: e.key < 3),
                        _pdfCell(p.name),
                        _pdfCell('${p.runsScored}', center: true, bold: true),
                        _pdfCell('${p.ballsFaced}', center: true),
                        _pdfCell('${p.fours}', center: true),
                        _pdfCell('${p.sixes}', center: true),
                        _pdfCell(p.strikeRate.toStringAsFixed(1), center: true),
                      ],
                    );
                  }),
                ],
              ),
            pw.SizedBox(height: 8),
            pw.Text('Best Bowlers', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 11)),
            pw.SizedBox(height: 4),
            if (sortedBowl.where((p) => p.wicketsTaken > 0).isEmpty)
              pw.Text('No bowling data', style: const pw.TextStyle(color: PdfColors.grey700, fontSize: 9))
            else
              pw.Table(
                border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.5),
                columnWidths: {
                  0: const pw.FlexColumnWidth(0.5),
                  1: const pw.FlexColumnWidth(3),
                  2: const pw.FlexColumnWidth(1),
                  3: const pw.FlexColumnWidth(1),
                  4: const pw.FlexColumnWidth(1),
                  5: const pw.FlexColumnWidth(1),
                  6: const pw.FlexColumnWidth(1),
                },
                children: [
                  pw.TableRow(
                    decoration: const pw.BoxDecoration(color: PdfColors.grey200),
                    children: [
                      _pdfCell('#', bold: true, center: true),
                      _pdfCell('Bowler', bold: true),
                      _pdfCell('O', bold: true, center: true),
                      _pdfCell('M', bold: true, center: true),
                      _pdfCell('R', bold: true, center: true),
                      _pdfCell('W', bold: true, center: true),
                      _pdfCell('Eco', bold: true, center: true),
                    ],
                  ),
                  ...sortedBowl.where((p) => p.wicketsTaken > 0).take(5).toList().asMap().entries.map((e) {
                    final p = e.value;
                    return pw.TableRow(
                      decoration: e.key == 0
                          ? const pw.BoxDecoration(color: PdfColor.fromInt(0xFFFFEBEE))
                          : null,
                      children: [
                        _pdfCell('${e.key + 1}', center: true, bold: e.key < 3),
                        _pdfCell(p.name),
                        _pdfCell(p.oversBowled.toStringAsFixed(1), center: true),
                        _pdfCell('${p.maidens}', center: true),
                        _pdfCell('${p.runsConceded}', center: true),
                        _pdfCell('${p.wicketsTaken}', center: true, bold: true),
                        _pdfCell(p.economyRate.toStringAsFixed(2), center: true),
                      ],
                    );
                  }),
                ],
              ),

            // ── 5. BALLS — Full delivery log ──────────────────────────
            pw.SizedBox(height: 14),
            pw.Container(
              padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              color: PdfColor.fromInt(0xFF2E7D32),
              child: pw.Text('5. BALL-BY-BALL LOG',
                  style: pw.TextStyle(
                      color: PdfColors.white, fontSize: 13, fontWeight: pw.FontWeight.bold)),
            ),
            pw.SizedBox(height: 6),
            if (_balls.isEmpty)
              pw.Text('No ball data', style: const pw.TextStyle(color: PdfColors.grey700, fontSize: 9))
            else
              () {
                // Build cumulative score per innings
                final rows = <pw.TableRow>[
                  pw.TableRow(
                    decoration: const pw.BoxDecoration(color: PdfColors.grey200),
                    children: [
                      _pdfCell('Inn', bold: true, center: true),
                      _pdfCell('Over', bold: true, center: true),
                      _pdfCell('Outcome', bold: true, center: true),
                      _pdfCell('Batter', bold: true),
                      _pdfCell('Bowler', bold: true),
                      _pdfCell('Score', bold: true, center: true),
                    ],
                  ),
                ];
                final cumByInnings = <int, int>{};
                for (final b in _balls) {
                  cumByInnings[b.innings] = (cumByInnings[b.innings] ?? 0) + b.runs + b.extras;
                  rows.add(pw.TableRow(children: [
                    _pdfCell('${b.innings}', center: true),
                    _pdfCell('${b.overNumber}.${b.ballNumber}', center: true),
                    _pdfCell(b.displayText, center: true, bold: true),
                    _pdfCell(b.batsmanName ?? ''),
                    _pdfCell(b.bowlerName ?? ''),
                    _pdfCell('${cumByInnings[b.innings]}', center: true),
                  ]));
                }
                return pw.Table(
                  border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.5),
                  columnWidths: {
                    0: const pw.FlexColumnWidth(0.6),
                    1: const pw.FlexColumnWidth(0.8),
                    2: const pw.FlexColumnWidth(1.0),
                    3: const pw.FlexColumnWidth(2.5),
                    4: const pw.FlexColumnWidth(2.5),
                    5: const pw.FlexColumnWidth(1.0),
                  },
                  children: rows,
                );
              }(),
          ];
        },
      ),
    );

    await Printing.layoutPdf(onLayout: (format) => doc.save());
  }

  pw.Widget _pdfCell(String text, {bool bold = false, bool center = false}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.all(4),
      child: pw.Text(text,
          textAlign: center ? pw.TextAlign.center : pw.TextAlign.left,
          style: pw.TextStyle(
              fontSize: 9, fontWeight: bold ? pw.FontWeight.bold : pw.FontWeight.normal)),
    );
  }

  pw.Widget _pdfInfoRow(String label, String value) {
    return pw.Container(
      padding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: pw.BoxDecoration(
        color: PdfColors.grey100,
        borderRadius: pw.BorderRadius.circular(3),
      ),
      child: pw.RichText(
        text: pw.TextSpan(
          children: [
            pw.TextSpan(
              text: '$label: ',
              style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey700),
            ),
            pw.TextSpan(
              text: value,
              style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }

  pw.Widget _pdfHighlight(String label, String value) {
    return pw.Container(
      padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: pw.BoxDecoration(
        color: PdfColor.fromInt(0xFF1B5E20),
        borderRadius: pw.BorderRadius.circular(4),
      ),
      child: pw.Column(
        children: [
          pw.Text(value,
              style: pw.TextStyle(
                  fontSize: 14, fontWeight: pw.FontWeight.bold, color: PdfColor.fromInt(0xFFFFD600))),
          pw.Text(label,
              style: const pw.TextStyle(fontSize: 8, color: PdfColors.white)),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _emptyTab(String msg) => Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
    Lottie.asset('assets/images/lottie/Bat ball.json', width: 120, height: 120, repeat: true),
    const SizedBox(height: 16),
    Text(msg, style: GoogleFonts.poppins(color: AppTheme.ts(context), fontSize: 14)),
  ]));

  Widget _roleBadge(String text, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
    decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(3)),
    child: Text(text, style: GoogleFonts.poppins(fontSize: 8, fontWeight: FontWeight.w700, color: Colors.white)),
  );

  TextStyle get _colHeaderStyle => TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: AppTheme.ts(context));

  Widget _sectionHeader(String title, {String? trailing}) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    decoration: BoxDecoration(
      gradient: const LinearGradient(colors: [Color(0xFF1B5E20), Color(0xFF2E7D32)]),
      borderRadius: BorderRadius.circular(8),
      boxShadow: [BoxShadow(color: AppTheme.primaryGreen.withValues(alpha: 0.2), blurRadius: 4, offset: const Offset(0, 1))],
    ),
    child: Row(children: [
      Expanded(child: Text(title, style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13))),
      if (trailing != null) Text(trailing, style: GoogleFonts.poppins(color: AppTheme.accentGold, fontSize: 12, fontWeight: FontWeight.w600)),
    ]),
  );

  Widget _battingTable(List<PlayerScore> players, Set<String> activeIds) => Card(
    child: Padding(padding: const EdgeInsets.all(10), child: Column(children: [
      Row(children: [Expanded(flex: 3, child: Text('Batter', style: _colHeaderStyle)), Expanded(child: Text('R', textAlign: TextAlign.center, style: _colHeaderStyle)), Expanded(child: Text('B', textAlign: TextAlign.center, style: _colHeaderStyle)), Expanded(child: Text('4s', textAlign: TextAlign.center, style: _colHeaderStyle)), Expanded(child: Text('6s', textAlign: TextAlign.center, style: _colHeaderStyle)), Expanded(child: Text('SR', textAlign: TextAlign.center, style: _colHeaderStyle))]),
      const Divider(),
      ...players.asMap().entries.map((e) {
        final i = e.key; final p = e.value; final notOut = !p.isOut; final active = activeIds.contains(p.playerId);
        return Padding(padding: const EdgeInsets.symmetric(vertical: 3), child: Row(children: [
          Expanded(flex: 3, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              if (active) Container(width: 7, height: 7, margin: const EdgeInsets.only(right: 4), decoration: const BoxDecoration(shape: BoxShape.circle, color: AppTheme.lightGreen)),
              Flexible(child: Text(p.name, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: notOut ? AppTheme.primaryGreen : null))),
              if (p.isCaptain) ...[const SizedBox(width: 3), _roleBadge('C', AppTheme.primaryGreen)],
              if (p.isWicketKeeper) ...[const SizedBox(width: 3), _roleBadge('WK', Colors.orange)],
            ]),
            if (p.isOut && p.outType != null) Text(p.outType!, style: TextStyle(fontSize: 10, color: AppTheme.ts(context))),
            if (active) Text('Batting', style: TextStyle(fontSize: 10, color: AppTheme.ts(context))),
            if (notOut && !active && p.outType == 'retired hurt') const Text('retired hurt', style: TextStyle(fontSize: 10, color: Colors.orange)),
            if (notOut && !active && p.outType != 'retired hurt' && p.outType != null) const Text('not out', style: TextStyle(fontSize: 10, color: AppTheme.completedGreen)),
            if (notOut && !active && p.outType == null) const Text('not out', style: TextStyle(fontSize: 10, color: AppTheme.completedGreen)),
          ])),
          Expanded(child: Text('${p.runsScored}', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: p.runsScored >= 50 ? AppTheme.accentAmber : null))),
          Expanded(child: Text('${p.ballsFaced}', textAlign: TextAlign.center, style: const TextStyle(fontSize: 13))),
          Expanded(child: Text('${p.fours}', textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: p.fours > 0 ? AppTheme.fourColor : null))),
          Expanded(child: Text('${p.sixes}', textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: p.sixes > 0 ? AppTheme.sixColor : null))),
          Expanded(child: Text(p.strikeRate.toStringAsFixed(1), textAlign: TextAlign.center, style: const TextStyle(fontSize: 11))),
        ])).animate().fadeIn(duration: 300.ms, delay: (i * 50).ms);
      }),
    ])),
  );

  Widget _bowlingTable(List<PlayerScore> bowlers) => Card(
    child: Padding(padding: const EdgeInsets.all(10), child: Column(children: [
      Row(children: [Expanded(flex: 3, child: Text('Bowler', style: _colHeaderStyle)), Expanded(child: Text('O', textAlign: TextAlign.center, style: _colHeaderStyle)), Expanded(child: Text('M', textAlign: TextAlign.center, style: _colHeaderStyle)), Expanded(child: Text('R', textAlign: TextAlign.center, style: _colHeaderStyle)), Expanded(child: Text('W', textAlign: TextAlign.center, style: _colHeaderStyle)), Expanded(child: Text('Eco', textAlign: TextAlign.center, style: _colHeaderStyle))]),
      const Divider(),
      ...bowlers.asMap().entries.map((e) {
        final i = e.key; final b = e.value;
        return Padding(padding: const EdgeInsets.symmetric(vertical: 3), child: Row(children: [
          Expanded(flex: 3, child: Row(children: [
            Flexible(child: Text(b.name, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13))),
            if (b.isCaptain) ...[const SizedBox(width: 3), _roleBadge('C', AppTheme.primaryGreen)],
            if (b.isWicketKeeper) ...[const SizedBox(width: 3), _roleBadge('WK', Colors.orange)],
          ])),
          Expanded(child: Text(b.oversBowled.toStringAsFixed(1), textAlign: TextAlign.center, style: const TextStyle(fontSize: 13))),
          Expanded(child: Text('${b.maidens}', textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: b.maidens > 0 ? AppTheme.primaryGreen : null))),
          Expanded(child: Text('${b.runsConceded}', textAlign: TextAlign.center, style: const TextStyle(fontSize: 13))),
          Expanded(child: Text('${b.wicketsTaken}', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: b.wicketsTaken > 0 ? AppTheme.wicketRed : null))),
          Expanded(child: Text(b.economyRate.toStringAsFixed(1), textAlign: TextAlign.center, style: const TextStyle(fontSize: 11))),
        ])).animate().fadeIn(duration: 300.ms, delay: (i * 50).ms);
      }),
    ])),
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGIC HELPERS (unchanged)
  // ═══════════════════════════════════════════════════════════════════════════

  String _getVictoryMessage(CricketMatch m) {
    if (m.winner == null) return '';
    final bf = _getBattingFirstTeam(m); final t1First = bf == 1;
    final w1 = m.winner == m.team1Name;
    final wBatFirst = (w1 && t1First) || (!w1 && !t1First);
    if (wBatFirst) { return '${m.winner} won by ${(m.team1Score - m.team2Score).abs()} runs'; }
    else { final wW = w1 ? m.team1Wickets : m.team2Wickets; final wP = _players.where((p) => (w1 && p.team == 1) || (!w1 && p.team == 2)).length; return '${m.winner} won by ${(wP - 1) - wW} wickets'; }
  }

  int _getBattingFirstTeam(CricketMatch match) {
    if (match.tossWinner != null && match.tossDecision != null) {
      final t1 = match.tossWinner == match.team1Name; final bats = match.tossDecision == 'bat';
      return (t1 == bats) ? 1 : 2;
    }
    return 1;
  }

  int _getTeamInnings(int team) {
    final m = _match!;
    if (m.tossWinner != null && m.tossDecision != null) {
      final t1 = m.tossWinner == m.team1Name; final bats = m.tossDecision == 'bat';
      final t1First = t1 == bats;
      return team == 1 ? (t1First ? 1 : 2) : (t1First ? 2 : 1);
    }
    return team;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PRIVATE WIDGETS
// ═══════════════════════════════════════════════════════════════════════════

class _FallOfWicket {
  final String batsmanName, score, over;
  const _FallOfWicket({required this.batsmanName, required this.score, required this.over});
}

class _TeamTab extends StatelessWidget {
  final String label; final String? subtitle; final bool selected; final VoidCallback onTap; final bool isBatting;
  const _TeamTab({required this.label, this.subtitle, required this.selected, required this.onTap, this.isBatting = false});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
        decoration: BoxDecoration(
          gradient: selected ? const LinearGradient(colors: [Color(0xFF1B5E20), Color(0xFF2E7D32)]) : null,
          color: selected ? null : AppTheme.surface(context),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: selected ? AppTheme.primaryGreen : AppTheme.divider(context), width: selected ? 0 : 1),
          boxShadow: selected ? [BoxShadow(color: AppTheme.primaryGreen.withValues(alpha: 0.25), blurRadius: 6, offset: const Offset(0, 2))] : null,
        ),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Text(label, style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 13, color: selected ? Colors.white : AppTheme.tp(context)), overflow: TextOverflow.ellipsis),
          if (subtitle != null) Text(subtitle!, style: GoogleFonts.poppins(fontSize: 10, fontWeight: isBatting ? FontWeight.w600 : FontWeight.w400, color: isBatting ? (selected ? Colors.white : AppTheme.primaryGreen) : (selected ? Colors.white70 : AppTheme.ts(context)))),
        ]),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// WAGON WHEEL PAINTER — draws cricket field with shot direction lines
// ═══════════════════════════════════════════════════════════════════════════

class _WagonWheelPainter extends CustomPainter {
  final Map<String, int> zoneRuns;
  final bool isDark;

  _WagonWheelPainter({required this.zoneRuns, required this.isDark});

  // Angles in degrees (0 = up = straight bowler-end, going clockwise)
  // Standard wagon wheel layout for a right-handed batsman batting from the bottom
  static const Map<String, double> _zoneAngles = {
    'long_on': 350,
    'mid_on': 320,
    'midwicket': 290,
    'square_leg': 260,
    'fine_leg': 220,
    'third_man': 140,
    'point': 100,
    'cover': 70,
    'long_off': 10,
  };

  // Distinct, vivid color per zone — easily distinguishable across the wheel
  static const Map<String, Color> zoneColors = {
    'long_on':    Color(0xFF4FC3F7), // sky blue
    'mid_on':     Color(0xFF26C6DA), // cyan
    'midwicket':  Color(0xFF66BB6A), // green
    'square_leg': Color(0xFFAED581), // lime
    'fine_leg':   Color(0xFFFFCA28), // amber
    'third_man':  Color(0xFFFF7043), // deep orange
    'point':      Color(0xFFEF5350), // red
    'cover':      Color(0xFFEC407A), // pink
    'long_off':   Color(0xFFAB47BC), // purple
  };

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = math.min(size.width, size.height) / 2 - 18;

    // ── 1. Outfield with radial gradient (gives depth) ──────────────────
    final outfieldGradient = RadialGradient(
      colors: isDark
          ? [const Color(0xFF2E7D32), const Color(0xFF0D3B12)]
          : [const Color(0xFF66BB6A), const Color(0xFF1B5E20)],
    );
    final outfieldPaint = Paint()
      ..shader = outfieldGradient.createShader(
        Rect.fromCircle(center: center, radius: radius),
      );
    canvas.drawCircle(center, radius, outfieldPaint);

    // Subtle radial "mowed grass" texture: alternating shaded segments
    for (int i = 0; i < 16; i++) {
      final startAngle = i * (math.pi * 2 / 16);
      final sweepAngle = math.pi * 2 / 16;
      final stripePaint = Paint()
        ..color = Colors.white.withValues(alpha: i.isEven ? 0.04 : 0.0)
        ..style = PaintingStyle.fill;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle, sweepAngle, true, stripePaint,
      );
    }

    // ── 2. Zone sector tinting (subtle per-zone background slice) ───────
    // Each zone occupies a 40-deg slice centered on its angle
    for (final entry in _zoneAngles.entries) {
      final color = zoneColors[entry.key];
      if (color == null) continue;
      final centerAngleRad = (entry.value - 90) * math.pi / 180;
      const sliceWidth = math.pi / 9; // 20 degrees on each side
      final sectorPaint = Paint()
        ..color = color.withValues(alpha: 0.05)
        ..style = PaintingStyle.fill;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        centerAngleRad - sliceWidth,
        sliceWidth * 2,
        true,
        sectorPaint,
      );
    }

    // ── 3. 30-yard inner circle ─────────────────────────────────────────
    final innerPaint = Paint()
      ..color = (isDark ? Colors.white : Colors.white).withValues(alpha: 0.06)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, radius * 0.55, innerPaint);

    final innerBorderPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.35)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;
    // Dashed circle for 30-yard line
    _drawDashedCircle(canvas, center, radius * 0.55, innerBorderPaint, 4, 4);

    // ── 4. Pitch with creases & stumps ──────────────────────────────────
    final pitchRect = Rect.fromCenter(
      center: center,
      width: radius * 0.14,
      height: radius * 0.50,
    );
    final pitchGradient = LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: const [Color(0xFFEFE5C7), Color(0xFFD7CCC8), Color(0xFFEFE5C7)],
    );
    final pitchPaint = Paint()..shader = pitchGradient.createShader(pitchRect);
    canvas.drawRRect(
      RRect.fromRectAndRadius(pitchRect, const Radius.circular(3)),
      pitchPaint,
    );

    // Pitch border
    final pitchBorderPaint = Paint()
      ..color = Colors.brown.shade300.withValues(alpha: 0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.6;
    canvas.drawRRect(
      RRect.fromRectAndRadius(pitchRect, const Radius.circular(3)),
      pitchBorderPaint,
    );

    // Crease lines (top + bottom of pitch)
    final creasePaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.7)
      ..strokeWidth = 1;
    canvas.drawLine(
      Offset(pitchRect.left - 4, pitchRect.top + 8),
      Offset(pitchRect.right + 4, pitchRect.top + 8),
      creasePaint,
    );
    canvas.drawLine(
      Offset(pitchRect.left - 4, pitchRect.bottom - 8),
      Offset(pitchRect.right + 4, pitchRect.bottom - 8),
      creasePaint,
    );

    // Stumps (3 vertical lines) at each end of pitch
    final stumpPaint = Paint()
      ..color = const Color(0xFFFFEB3B)
      ..strokeWidth = 1.2
      ..strokeCap = StrokeCap.round;
    final stumpHeight = 6.0;
    for (int i = -1; i <= 1; i++) {
      final dx = pitchRect.center.dx + i * 3.0;
      // Top stumps
      canvas.drawLine(
        Offset(dx, pitchRect.top + 4),
        Offset(dx, pitchRect.top + 4 + stumpHeight),
        stumpPaint,
      );
      // Bottom stumps
      canvas.drawLine(
        Offset(dx, pitchRect.bottom - 4 - stumpHeight),
        Offset(dx, pitchRect.bottom - 4),
        stumpPaint,
      );
    }

    // ── 5. Boundary line (white solid) ──────────────────────────────────
    final boundaryLinePaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.55)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    canvas.drawCircle(center, radius, boundaryLinePaint);

    // ── 6. Shot direction lines with glow ───────────────────────────────
    final maxRuns = zoneRuns.values.isEmpty
        ? 1
        : zoneRuns.values.reduce((a, b) => a > b ? a : b);

    for (final entry in zoneRuns.entries) {
      final angleDeg = _zoneAngles[entry.key];
      final color = zoneColors[entry.key];
      if (angleDeg == null || color == null) continue;
      final runs = entry.value;
      if (runs == 0) continue;

      final angleRad = (angleDeg - 90) * math.pi / 180;
      final endPoint = Offset(
        center.dx + radius * math.cos(angleRad),
        center.dy + radius * math.sin(angleRad),
      );

      final lineWidth = 2.5 + (runs / maxRuns) * 4.5;

      // Glow underlay (wider, semi-transparent)
      final glowPaint = Paint()
        ..color = color.withValues(alpha: 0.4)
        ..strokeWidth = lineWidth + 4
        ..strokeCap = StrokeCap.round
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4);
      canvas.drawLine(center, endPoint, glowPaint);

      // Main line gradient (bright at end, fades toward center)
      final lineGradient = LinearGradient(
        colors: [color.withValues(alpha: 0.6), color],
      );
      final linePaint = Paint()
        ..shader = lineGradient.createShader(
          Rect.fromPoints(center, endPoint),
        )
        ..strokeWidth = lineWidth
        ..strokeCap = StrokeCap.round;
      canvas.drawLine(center, endPoint, linePaint);

      // End-of-line dot
      final endDotPaint = Paint()..color = color;
      canvas.drawCircle(endPoint, lineWidth + 1, endDotPaint);
      // Inner white highlight on dot
      final endDotInner = Paint()..color = Colors.white;
      canvas.drawCircle(endPoint, (lineWidth + 1) * 0.4, endDotInner);

      // Run count badge — mid-line so it doesn't clash with end dot
      final badgePos = Offset(
        center.dx + radius * 0.78 * math.cos(angleRad),
        center.dy + radius * 0.78 * math.sin(angleRad),
      );
      final badgePaint = Paint()..color = color;
      canvas.drawCircle(badgePos, 9, badgePaint);
      final badgeBorderPaint = Paint()
        ..color = Colors.white.withValues(alpha: 0.8)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5;
      canvas.drawCircle(badgePos, 9, badgeBorderPaint);

      final tp = TextPainter(
        text: TextSpan(
          text: '$runs',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 10,
            fontWeight: FontWeight.w800,
          ),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, Offset(badgePos.dx - tp.width / 2, badgePos.dy - tp.height / 2));
    }

    // ── 7. Batsman marker at center ─────────────────────────────────────
    // Outer glow
    final centerGlowPaint = Paint()
      ..color = AppTheme.accentGold.withValues(alpha: 0.6)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4);
    canvas.drawCircle(center, 7, centerGlowPaint);
    // Solid gold outer
    final centerOuter = Paint()..color = AppTheme.accentGold;
    canvas.drawCircle(center, 5, centerOuter);
    // White inner
    final centerInner = Paint()..color = Colors.white;
    canvas.drawCircle(center, 2.5, centerInner);
  }

  void _drawDashedCircle(
    Canvas canvas,
    Offset center,
    double r,
    Paint paint,
    double dashLen,
    double gapLen,
  ) {
    final circumference = 2 * math.pi * r;
    final dashCount = (circumference / (dashLen + gapLen)).floor();
    final dashAngle = (math.pi * 2) / dashCount;
    final gapAngle = dashAngle * (gapLen / (dashLen + gapLen));
    final drawAngle = dashAngle - gapAngle;
    for (int i = 0; i < dashCount; i++) {
      final start = i * dashAngle;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: r),
        start, drawAngle, false, paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _WagonWheelPainter oldDelegate) =>
      oldDelegate.zoneRuns.length != zoneRuns.length ||
      oldDelegate.isDark != isDark;
}
