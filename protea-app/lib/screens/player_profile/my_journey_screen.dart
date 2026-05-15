import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../../models/match.dart';
import '../../models/user.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class MyJourneyScreen extends StatefulWidget {
  final String playerId;
  const MyJourneyScreen({super.key, required this.playerId});

  @override
  State<MyJourneyScreen> createState() => _MyJourneyScreenState();
}

class _MyJourneyScreenState extends State<MyJourneyScreen> with SingleTickerProviderStateMixin {
  User? _player;
  CareerStats? _stats;
  List<PlayerScore> _matches = [];
  bool _loading = true;
  String? _error;
  late TabController _tabCtrl;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
    _load();
  }

  Future<void> _load() async {
    if (widget.playerId.isEmpty) {
      setState(() { _loading = false; _error = 'Invalid player'; });
      return;
    }
    try {
      final data = await ApiService.getPlayerJourney(widget.playerId);
      setState(() {
        _player = User.fromJson(data['player']);
        _stats = data['career_stats'] != null
            ? CareerStats.fromJson(data['career_stats'])
            : null;
        _matches = (data['matches'] as List? ?? const [])
            .map((m) => PlayerScore.fromJson(m))
            .toList();
        _loading = false;
      });
    } catch (e) {
      setState(() { _loading = false; _error = e.toString(); });
    }
  }

  // Computed analytics
  int get _fifties => _matches.where((m) => m.runsScored >= 50 && m.runsScored < 100).length;
  int get _centuries => _matches.where((m) => m.runsScored >= 100).length;
  int get _ducks => _matches.where((m) => m.runsScored == 0 && m.isOut).length;
  int get _notOuts => _matches.where((m) => !m.isOut && m.ballsFaced > 0).length;
  int get _totalWins => _matches.where((m) {
    if (m.matchWinner == null) return false;
    // Check if player's team won
    if (m.team == 1) return m.matchWinner == m.team1Name;
    return m.matchWinner == m.team2Name;
  }).length;

  Map<String, int> get _dismissalMap {
    final map = <String, int>{};
    for (final m in _matches) {
      if (m.isOut && m.outType != null) {
        map[m.outType!] = (map[m.outType!] ?? 0) + 1;
      }
    }
    return map;
  }

  // Run distribution: dots, 1s, 2s, 3s, 4s, 6s (approximate from totals)
  double get _boundaryPercentage {
    final totalRuns = _stats?.totalRuns ?? 0;
    if (totalRuns == 0) return 0;
    final boundaryRuns = (_stats!.totalFours * 4) + (_stats!.totalSixes * 6);
    return boundaryRuns / totalRuns * 100;
  }

  // Last 3 match form
  String get _recentForm {
    final recent = _matches.take(3).toList();
    if (recent.isEmpty) return '-';
    final avg = recent.map((m) => m.runsScored).reduce((a, b) => a + b) / recent.length;
    if (avg >= 50) return 'Excellent';
    if (avg >= 30) return 'Good';
    if (avg >= 15) return 'Average';
    return 'Poor';
  }

  Color get _formColor {
    switch (_recentForm) {
      case 'Excellent': return AppTheme.accentGold;
      case 'Good': return AppTheme.lightGreen;
      case 'Average': return AppTheme.accentAmber;
      default: return AppTheme.wicketRed;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen));
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: AppTheme.wicketRed),
              const SizedBox(height: 16),
              Text('Failed to load journey', style: TextStyle(color: AppTheme.ts(context), fontSize: 16)),
              const SizedBox(height: 8),
              Text('Player ID: ${widget.playerId}', style: TextStyle(color: AppTheme.ts(context), fontSize: 12)),
              const SizedBox(height: 4),
              Text(_error!, style: TextStyle(color: AppTheme.ts(context), fontSize: 11), textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: () { setState(() { _loading = true; _error = null; }); _load(); }, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }

    if (_stats == null || _matches.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.sports_cricket, size: 64, color: AppTheme.ts(context).withValues(alpha: 0.3)),
            const SizedBox(height: 16),
            Text('Your cricket journey starts here!',
                style: TextStyle(color: AppTheme.ts(context), fontSize: 16)),
            const SizedBox(height: 8),
            Text('Join matches to build your stats',
                style: TextStyle(color: AppTheme.ts(context), fontSize: 13)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: NestedScrollView(
        headerSliverBuilder: (context, _) => [
          SliverToBoxAdapter(child: _buildProfileCard()),
        ],
        body: Column(
          children: [
            TabBar(
              controller: _tabCtrl,
              indicatorColor: AppTheme.primaryGreen,
              labelColor: AppTheme.primaryGreen,
              unselectedLabelColor: AppTheme.textSecondary,
              tabs: const [
                Tab(text: 'Overview'),
                Tab(text: 'Analytics'),
                Tab(text: 'Matches'),
              ],
            ),
            Expanded(
              child: TabBarView(
                controller: _tabCtrl,
                children: [
                  _buildOverviewTab(),
                  _buildAnalyticsTab(),
                  _buildMatchesTab(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ==================== PROFILE CARD ====================
  Widget _buildProfileCard() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.darkGreen, AppTheme.primaryGreen],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: AppTheme.primaryGreen.withValues(alpha: 0.3), blurRadius: 16, offset: const Offset(0, 8)),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 36,
                backgroundColor: Colors.white.withValues(alpha: 0.2),
                child: Text(_player!.name[0].toUpperCase(),
                    style: const TextStyle(fontSize: 30, fontWeight: FontWeight.bold, color: Colors.white)),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(_player!.name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
                    if (_player!.battingStyle != null)
                      Text(_player!.battingStyle!, style: const TextStyle(color: Colors.white70, fontSize: 13)),
                    if (_player!.bowlingStyle != null && _player!.bowlingStyle != 'None')
                      Text(_player!.bowlingStyle!, style: const TextStyle(color: Colors.white70, fontSize: 13)),
                  ],
                ),
              ),
              // Form badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: _formColor.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: _formColor.withValues(alpha: 0.5)),
                ),
                child: Column(
                  children: [
                    Text(_recentForm, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: _formColor)),
                    Text('Form', style: TextStyle(fontSize: 9, color: _formColor.withValues(alpha: 0.7))),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _heroStat('Matches', '${_stats!.totalMatches}'),
              Container(width: 1, height: 40, color: Colors.white24),
              _heroStat('Runs', '${_stats!.totalRuns}'),
              Container(width: 1, height: 40, color: Colors.white24),
              _heroStat('Highest', '${_stats!.highestScore}'),
              Container(width: 1, height: 40, color: Colors.white24),
              _heroStat('Wickets', '${_stats!.totalWickets}'),
            ],
          ),
        ],
      ),
    ).animate().fadeIn().scale(begin: const Offset(0.95, 0.95));
  }

  // ==================== OVERVIEW TAB ====================
  Widget _buildOverviewTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Key stats grid
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 4,
          childAspectRatio: 0.9,
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
          children: [
            _miniStatCard('Average', _stats!.battingAverage.toStringAsFixed(1), AppTheme.lightGreen),
            _miniStatCard('SR', _stats!.strikeRate.toStringAsFixed(1), AppTheme.accentAmber),
            _miniStatCard('50s', '$_fifties', AppTheme.primaryGreen),
            _miniStatCard('100s', '$_centuries', const Color(0xFFE040FB)),
            _miniStatCard('4s', '${_stats!.totalFours}', AppTheme.fourColor),
            _miniStatCard('6s', '${_stats!.totalSixes}', AppTheme.sixColor),
            _miniStatCard('Not Out', '$_notOuts', AppTheme.team1Color),
            _miniStatCard('Ducks', '$_ducks', AppTheme.wicketRed),
          ],
        ).animate().fadeIn(delay: 100.ms),
        const SizedBox(height: 20),

        // Win/Loss bar
        _sectionTitle('Win Contribution'),
        const SizedBox(height: 8),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('$_totalWins Wins', style: TextStyle(color: AppTheme.lightGreen, fontWeight: FontWeight.bold)),
                    Text('${_matches.length - _totalWins} Losses', style: const TextStyle(color: AppTheme.wicketRed, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: LinearProgressIndicator(
                    value: _matches.isNotEmpty ? _totalWins / _matches.length : 0,
                    backgroundColor: AppTheme.wicketRed.withValues(alpha: 0.3),
                    valueColor: AlwaysStoppedAnimation(AppTheme.lightGreen),
                    minHeight: 12,
                  ),
                ),
                const SizedBox(height: 4),
                Text('Win Rate: ${_matches.isNotEmpty ? (_totalWins / _matches.length * 100).toStringAsFixed(0) : 0}%',
                    style: TextStyle(fontSize: 12, color: AppTheme.ts(context))),
              ],
            ),
          ),
        ).animate().fadeIn(delay: 200.ms),
        const SizedBox(height: 20),

        // Bowling stats (if applicable)
        if (_stats!.totalWickets > 0) ...[
          _sectionTitle('Bowling Stats'),
          const SizedBox(height: 8),
          Row(
            children: [
              _detailStatCard('Wickets', '${_stats!.totalWickets}', AppTheme.wicketRed),
              const SizedBox(width: 10),
              _detailStatCard('Best', _bestBowling, AppTheme.primaryGreen),
              const SizedBox(width: 10),
              _detailStatCard('Avg Econ', _avgEconomy, AppTheme.accentAmber),
            ],
          ).animate().fadeIn(delay: 300.ms),
          const SizedBox(height: 20),
        ],

        // Boundary % card
        _sectionTitle('Run Scoring'),
        const SizedBox(height: 8),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${_boundaryPercentage.toStringAsFixed(0)}%',
                          style: TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: AppTheme.primaryGreen)),
                      Text('Runs from Boundaries',
                          style: TextStyle(fontSize: 12, color: AppTheme.ts(context))),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          _boundaryChip('4s', '${_stats!.totalFours * 4}', AppTheme.fourColor),
                          const SizedBox(width: 8),
                          _boundaryChip('6s', '${_stats!.totalSixes * 6}', AppTheme.sixColor),
                          const SizedBox(width: 8),
                          _boundaryChip('Others', '${_stats!.totalRuns - (_stats!.totalFours * 4 + _stats!.totalSixes * 6)}', AppTheme.textSecondary),
                        ],
                      ),
                    ],
                  ),
                ),
                SizedBox(
                  width: 90,
                  height: 90,
                  child: PieChart(
                    PieChartData(
                      sectionsSpace: 2,
                      centerSpaceRadius: 20,
                      sections: [
                        PieChartSectionData(
                          value: (_stats!.totalFours * 4).toDouble(),
                          color: AppTheme.fourColor,
                          radius: 22,
                          showTitle: false,
                        ),
                        PieChartSectionData(
                          value: (_stats!.totalSixes * 6).toDouble(),
                          color: AppTheme.sixColor,
                          radius: 22,
                          showTitle: false,
                        ),
                        PieChartSectionData(
                          value: max(0, _stats!.totalRuns - (_stats!.totalFours * 4 + _stats!.totalSixes * 6)).toDouble(),
                          color: AppTheme.surfaceCardLight,
                          radius: 22,
                          showTitle: false,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ).animate().fadeIn(delay: 400.ms),
      ],
    );
  }

  // ==================== ANALYTICS TAB ====================
  Widget _buildAnalyticsTab() {
    final reversed = _matches.reversed.toList();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Run progression line chart
        _sectionTitle('Run Progression'),
        const SizedBox(height: 8),
        SizedBox(
          height: 220,
          child: Card(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 24, 16, 12),
              child: LineChart(
                LineChartData(
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    getDrawingHorizontalLine: (value) =>
                        FlLine(color: AppTheme.ts(context).withValues(alpha: 0.1), strokeWidth: 1),
                  ),
                  titlesData: FlTitlesData(
                    leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 36)),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, _) {
                          final idx = value.toInt();
                          if (idx >= 0 && idx < reversed.length) {
                            return Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text('M${idx + 1}', style: TextStyle(fontSize: 9, color: AppTheme.ts(context))),
                            );
                          }
                          return const SizedBox();
                        },
                      ),
                    ),
                    topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  ),
                  borderData: FlBorderData(show: false),
                  lineBarsData: [
                    LineChartBarData(
                      spots: reversed.asMap().entries.map((e) =>
                          FlSpot(e.key.toDouble(), e.value.runsScored.toDouble())).toList(),
                      isCurved: true,
                      color: AppTheme.primaryGreen,
                      barWidth: 3,
                      dotData: FlDotData(
                        show: true,
                        getDotPainter: (spot, percent, bar, index) {
                          Color dotColor;
                          if (spot.y >= 50) {
                            dotColor = AppTheme.primaryGreen;
                          } else if (spot.y >= 30) {
                            dotColor = AppTheme.lightGreen;
                          } else {
                            dotColor = AppTheme.team1Color;
                          }
                          return FlDotCirclePainter(radius: 5, color: dotColor, strokeWidth: 2, strokeColor: Colors.white);
                        },
                      ),
                      belowBarData: BarAreaData(
                        show: true,
                        gradient: LinearGradient(
                          colors: [AppTheme.primaryGreen.withValues(alpha: 0.3), AppTheme.primaryGreen.withValues(alpha: 0.0)],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                      ),
                    ),
                  ],
                  lineTouchData: LineTouchData(
                    touchTooltipData: LineTouchTooltipData(
                      getTooltipItems: (spots) => spots.map((s) {
                        final m = reversed[s.spotIndex];
                        final vs = m.team == 1 ? (m.team2Name ?? '') : (m.team1Name ?? '');
                        return LineTooltipItem(
                          '${s.y.toInt()} runs\nvs $vs',
                          const TextStyle(fontSize: 11, color: Colors.white),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ).animate().fadeIn(delay: 100.ms),
        const SizedBox(height: 24),

        // Strike Rate trend
        _sectionTitle('Strike Rate Trend'),
        const SizedBox(height: 8),
        SizedBox(
          height: 200,
          child: Card(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 24, 16, 12),
              child: BarChart(
                BarChartData(
                  alignment: BarChartAlignment.spaceAround,
                  maxY: reversed.map((m) => m.strikeRate).reduce(max) + 20,
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    getDrawingHorizontalLine: (value) =>
                        FlLine(color: AppTheme.ts(context).withValues(alpha: 0.1), strokeWidth: 1),
                  ),
                  titlesData: FlTitlesData(
                    leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 36)),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, _) {
                          final idx = value.toInt();
                          if (idx >= 0 && idx < reversed.length) {
                            return Text('M${idx + 1}', style: TextStyle(fontSize: 9, color: AppTheme.ts(context)));
                          }
                          return const SizedBox();
                        },
                      ),
                    ),
                    topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  ),
                  borderData: FlBorderData(show: false),
                  barGroups: reversed.asMap().entries.map((e) {
                    final sr = e.value.strikeRate;
                    Color color;
                    if (sr >= 150) {
                      color = AppTheme.sixColor;
                    } else if (sr >= 120) {
                      color = AppTheme.lightGreen;
                    } else {
                      color = AppTheme.team1Color;
                    }
                    return BarChartGroupData(
                      x: e.key,
                      barRods: [BarChartRodData(toY: sr, color: color, width: 16, borderRadius: BorderRadius.circular(4))],
                    );
                  }).toList(),
                ),
              ),
            ),
          ),
        ).animate().fadeIn(delay: 200.ms),
        const SizedBox(height: 24),

        // Dismissal breakdown
        if (_dismissalMap.isNotEmpty) ...[
          _sectionTitle('How You Got Out'),
          const SizedBox(height: 8),
          SizedBox(
            height: 200,
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: PieChart(
                        PieChartData(
                          sectionsSpace: 3,
                          centerSpaceRadius: 30,
                          sections: _dismissalMap.entries.toList().asMap().entries.map((e) {
                            final colors = [AppTheme.wicketRed, AppTheme.team1Color, AppTheme.accentAmber, AppTheme.accentGold, const Color(0xFFE040FB), AppTheme.lightGreen];
                            return PieChartSectionData(
                              value: e.value.value.toDouble(),
                              color: colors[e.key % colors.length],
                              radius: 35,
                              title: '${e.value.value}',
                              titleStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                            );
                          }).toList(),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: _dismissalMap.entries.toList().asMap().entries.map((e) {
                        final colors = [AppTheme.wicketRed, AppTheme.team1Color, AppTheme.accentAmber, AppTheme.accentGold, const Color(0xFFE040FB), AppTheme.lightGreen];
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 3),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(width: 10, height: 10, decoration: BoxDecoration(
                                color: colors[e.key % colors.length], shape: BoxShape.circle)),
                              const SizedBox(width: 6),
                              Text('${e.value.key} (${e.value.value})',
                                  style: TextStyle(fontSize: 12, color: AppTheme.ts(context))),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
            ),
          ).animate().fadeIn(delay: 300.ms),
          const SizedBox(height: 24),
        ],

        // Bowling wickets per match (if bowler)
        if (_stats!.totalWickets > 0) ...[
          _sectionTitle('Wickets per Match'),
          const SizedBox(height: 8),
          SizedBox(
            height: 180,
            child: Card(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 24, 16, 12),
                child: BarChart(
                  BarChartData(
                    alignment: BarChartAlignment.spaceAround,
                    maxY: reversed.map((m) => m.wicketsTaken.toDouble()).reduce(max) + 1,
                    gridData: FlGridData(show: true, drawVerticalLine: false,
                      getDrawingHorizontalLine: (v) => FlLine(color: AppTheme.ts(context).withValues(alpha: 0.1), strokeWidth: 1)),
                    titlesData: FlTitlesData(
                      leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 24)),
                      bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true,
                        getTitlesWidget: (v, _) {
                          final idx = v.toInt();
                          if (idx >= 0 && idx < reversed.length) return Text('M${idx + 1}', style: TextStyle(fontSize: 9, color: AppTheme.ts(context)));
                          return const SizedBox();
                        })),
                      topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    ),
                    borderData: FlBorderData(show: false),
                    barGroups: reversed.asMap().entries.map((e) {
                      final wkt = e.value.wicketsTaken.toDouble();
                      return BarChartGroupData(
                        x: e.key,
                        barRods: [BarChartRodData(toY: wkt, color: wkt >= 3 ? AppTheme.wicketRed : AppTheme.accentAmber, width: 16, borderRadius: BorderRadius.circular(4))],
                      );
                    }).toList(),
                  ),
                ),
              ),
            ),
          ).animate().fadeIn(delay: 400.ms),
        ],
      ],
    );
  }

  // ==================== MATCHES TAB ====================
  Widget _buildMatchesTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _matches.length,
      itemBuilder: (ctx, i) {
        final m = _matches[i];
        final vs = m.team == 1 ? (m.team2Name ?? '') : (m.team1Name ?? '');
        return Card(
          margin: const EdgeInsets.only(bottom: 10),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  children: [
                    Container(
                      width: 40, height: 40,
                      decoration: BoxDecoration(
                        color: m.runsScored >= 50 ? AppTheme.primaryGreen.withValues(alpha: 0.2) : AppTheme.surfaceCardLight,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      alignment: Alignment.center,
                      child: Text('${m.runsScored}',
                          style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold,
                            color: m.runsScored >= 50 ? AppTheme.primaryGreen : Colors.white)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('vs $vs', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                          Row(
                            children: [
                              if (m.venue != null) ...[
                                Icon(Icons.location_on, size: 11, color: AppTheme.ts(context)),
                                const SizedBox(width: 2),
                                Flexible(child: Text(m.venue!, style: TextStyle(fontSize: 11, color: AppTheme.ts(context)), overflow: TextOverflow.ellipsis)),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        if (m.matchDate != null)
                          Text(DateFormat('dd MMM').format(m.matchDate!),
                              style: TextStyle(fontSize: 11, color: AppTheme.ts(context))),
                        if (m.matchWinner != null)
                          Container(
                            margin: const EdgeInsets.only(top: 2),
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: _didWin(m) ? AppTheme.lightGreen.withValues(alpha: 0.2) : AppTheme.wicketRed.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(_didWin(m) ? 'WON' : 'LOST',
                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold,
                                    color: _didWin(m) ? AppTheme.lightGreen : AppTheme.wicketRed)),
                          ),
                      ],
                    ),
                  ],
                ),
                const Divider(height: 16),
                // Stats row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _matchStat('Runs', '${m.runsScored}(${m.ballsFaced})', m.runsScored >= 50 ? AppTheme.primaryGreen : null),
                    _matchStat('4s', '${m.fours}', m.fours > 0 ? AppTheme.fourColor : null),
                    _matchStat('6s', '${m.sixes}', m.sixes > 0 ? AppTheme.sixColor : null),
                    _matchStat('SR', m.strikeRate.toStringAsFixed(0)),
                    if (m.wicketsTaken > 0)
                      _matchStat('Wkt', '${m.wicketsTaken}', AppTheme.wicketRed),
                    if (m.isOut && m.outType != null)
                      _matchStat('Out', m.outType!, AppTheme.wicketRed),
                  ],
                ),
                // Match score
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    '${m.team1Name}: ${m.team1Score}/${m.team1Wickets}  |  ${m.team2Name}: ${m.team2Score}/${m.team2Wickets}',
                    style: TextStyle(fontSize: 11, color: AppTheme.ts(context)),
                  ),
                ),
              ],
            ),
          ),
        ).animate().slideX(begin: 0.05, delay: (i * 60).ms).fadeIn();
      },
    );
  }

  bool _didWin(PlayerScore m) {
    if (m.matchWinner == null) return false;
    if (m.team == 1) return m.matchWinner == m.team1Name;
    return m.matchWinner == m.team2Name;
  }

  String get _bestBowling {
    if (_matches.isEmpty) return '-';
    final best = _matches.where((m) => m.wicketsTaken > 0).toList();
    if (best.isEmpty) return '-';
    best.sort((a, b) => b.wicketsTaken.compareTo(a.wicketsTaken));
    return '${best.first.wicketsTaken}/${best.first.runsConceded}';
  }

  String get _avgEconomy {
    final bowled = _matches.where((m) => m.oversBowled > 0).toList();
    if (bowled.isEmpty) return '-';
    final totalConc = bowled.map((m) => m.runsConceded).reduce((a, b) => a + b);
    final totalOvers = bowled.map((m) => m.oversBowled).reduce((a, b) => a + b);
    return (totalConc / totalOvers).toStringAsFixed(1);
  }

  // ==================== WIDGETS ====================
  Widget _sectionTitle(String title) {
    return Row(
      children: [
        Container(width: 4, height: 20,
            decoration: BoxDecoration(color: AppTheme.primaryGreen, borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 8),
        Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _heroStat(String label, String value) {
    return Column(
      children: [
        Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
        Text(label, style: TextStyle(fontSize: 11, color: AppTheme.ts(context))),
      ],
    );
  }

  Widget _miniStatCard(String label, String value, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 2),
            Text(label, style: TextStyle(fontSize: 10, color: AppTheme.ts(context))),
          ],
        ),
      ),
    );
  }

  Widget _detailStatCard(String label, String value, Color color) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            children: [
              Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
              const SizedBox(height: 4),
              Text(label, style: TextStyle(fontSize: 11, color: AppTheme.ts(context))),
            ],
          ),
        ),
      ),
    );
  }

  Widget _matchStat(String label, String value, [Color? color]) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: color)),
        Text(label, style: TextStyle(fontSize: 10, color: AppTheme.ts(context))),
      ],
    );
  }

  Widget _boundaryChip(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text('$label: $value', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
    );
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }
}
