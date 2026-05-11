import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../models/match.dart';
import '../../models/user.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class OtherPlayerProfileScreen extends StatefulWidget {
  final String playerId;
  final String playerName;

  const OtherPlayerProfileScreen({
    super.key,
    required this.playerId,
    required this.playerName,
  });

  @override
  State<OtherPlayerProfileScreen> createState() => _OtherPlayerProfileScreenState();
}

class _OtherPlayerProfileScreenState extends State<OtherPlayerProfileScreen>
    with SingleTickerProviderStateMixin {
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
    setState(() { _loading = true; _error = null; });
    try {
      final data = await ApiService.getPlayerJourney(widget.playerId);
      setState(() {
        _player = User.fromJson(data['player']);
        _stats = data['career_stats'] != null ? CareerStats.fromJson(data['career_stats']) : null;
        _matches = (data['matches'] as List).map((m) => PlayerScore.fromJson(m)).toList();
        _loading = false;
      });
    } catch (e) {
      setState(() { _loading = false; _error = e.toString(); });
    }
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  int get _fifties => _matches.where((m) => m.runsScored >= 50 && m.runsScored < 100).length;
  int get _hundreds => _matches.where((m) => m.runsScored >= 100).length;
  int get _ducks => _matches.where((m) => m.runsScored == 0 && m.isOut).length;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        top: false,
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.accentGold))
            : _error != null
                ? _buildError()
                : _buildContent(),
      ),
    );
  }

  Widget _buildError() {
    return Column(
      children: [
        _buildHeader(),
        Expanded(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 64, color: AppTheme.wicketRed),
                const SizedBox(height: 16),
                Text('Failed to load profile', style: TextStyle(color: AppTheme.ts(context))),
                const SizedBox(height: 8),
                ElevatedButton.icon(
                  onPressed: _load,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retry'),
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen, foregroundColor: Colors.white),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildContent() {
    if (_stats == null || _matches.isEmpty) {
      return Column(
        children: [
          _buildHeader(),
          _buildProfileBanner(),
          Expanded(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.sports_cricket, size: 64, color: AppTheme.ts(context).withValues(alpha: 0.3)),
                  const SizedBox(height: 16),
                  Text('No match data yet', style: TextStyle(color: AppTheme.ts(context), fontSize: 16)),
                  const SizedBox(height: 6),
                  Text('${widget.playerName} hasn\'t played any matches', style: TextStyle(color: AppTheme.ts(context), fontSize: 13)),
                ],
              ),
            ),
          ),
        ],
      );
    }

    return NestedScrollView(
      headerSliverBuilder: (context, _) => [
        SliverToBoxAdapter(
          child: Column(
            children: [
              _buildHeader(),
              _buildProfileBanner(),
            ],
          ),
        ),
      ],
      body: Column(
        children: [
          TabBar(
            controller: _tabCtrl,
            indicatorColor: AppTheme.accentGold,
            labelColor: AppTheme.accentGold,
            unselectedLabelColor: AppTheme.textSecondary,
            tabs: const [
              Tab(text: 'Overview'),
              Tab(text: 'Batting'),
              Tab(text: 'Matches'),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabCtrl,
              children: [
                _buildOverviewTab(),
                _buildBattingTab(),
                _buildMatchesTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF0D2B1A), AppTheme.primaryGreen],
          begin: Alignment.topLeft, end: Alignment.bottomRight,
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: () => Navigator.pop(context),
              ),
              Expanded(
                child: Text(
                  widget.playerName,
                  style: GoogleFonts.poppins(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700),
                  maxLines: 1, overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProfileBanner() {
    final name = _player?.name ?? widget.playerName;
    final photo = _player?.photoUrl;
    final batting = _player?.battingStyle;
    final bowling = _player?.bowlingStyle;

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF0D2B1A), AppTheme.primaryGreen],
          begin: Alignment.topLeft, end: Alignment.bottomRight,
        ),
      ),
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
      child: Column(
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 38,
                backgroundColor: AppTheme.accentGold,
                backgroundImage: photo != null && photo.isNotEmpty ? NetworkImage(ApiService.getPhotoUrl(photo)) : null,
                child: photo == null || photo.isEmpty
                    ? Text(name[0].toUpperCase(), style: GoogleFonts.poppins(fontSize: 28, fontWeight: FontWeight.bold, color: AppTheme.darkGreen))
                    : null,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white), maxLines: 1, overflow: TextOverflow.ellipsis),
                    if (batting != null)
                      Text(batting, style: GoogleFonts.poppins(fontSize: 12, color: AppTheme.accentGold)),
                    if (bowling != null && bowling != 'None')
                      Text(bowling, style: GoogleFonts.poppins(fontSize: 12, color: Colors.white70)),
                  ],
                ),
              ),
            ],
          ),
          if (_stats != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
              decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(12)),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _heroStat('Matches', '${_stats!.totalMatches}'),
                  _vDiv(),
                  _heroStat('Runs', '${_stats!.totalRuns}'),
                  _vDiv(),
                  _heroStat('HS', '${_stats!.highestScore}'),
                  _vDiv(),
                  _heroStat('Avg', _stats!.battingAverage.toStringAsFixed(1)),
                  _vDiv(),
                  _heroStat('Wkts', '${_stats!.totalWickets}'),
                ],
              ),
            ),
          ],
        ],
      ),
    ).animate().fadeIn();
  }

  Widget _heroStat(String label, String value) => Column(
    children: [
      Text(value, style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.accentGold)),
      Text(label, style: const TextStyle(fontSize: 9, color: Colors.white60)),
    ],
  );

  Widget _vDiv() => Container(width: 1, height: 28, color: Colors.white.withValues(alpha: 0.2));

  // ==================== OVERVIEW TAB ====================
  Widget _buildOverviewTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 4,
          childAspectRatio: 0.9,
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
          children: [
            _statCard('Avg', _stats!.battingAverage.toStringAsFixed(1), AppTheme.lightGreen),
            _statCard('SR', _stats!.strikeRate.toStringAsFixed(0), AppTheme.accentAmber),
            _statCard('50s', '$_fifties', AppTheme.accentGold),
            _statCard('100s', '$_hundreds', const Color(0xFFE040FB)),
            _statCard('4s', '${_stats!.totalFours}', AppTheme.fourColor),
            _statCard('6s', '${_stats!.totalSixes}', AppTheme.sixColor),
            _statCard('Catches', '${_stats!.totalCatches}', AppTheme.lightGreen),
            _statCard('Ducks', '$_ducks', AppTheme.wicketRed),
          ],
        ).animate().fadeIn(delay: 100.ms),
        if (_stats!.totalWickets > 0) ...[
          const SizedBox(height: 20),
          _sectionTitle('Bowling'),
          const SizedBox(height: 10),
          Row(
            children: [
              _detailCard('Wickets', '${_stats!.totalWickets}', AppTheme.wicketRed),
              const SizedBox(width: 10),
              _detailCard('Best', _stats!.bestBowling, AppTheme.accentGold),
              const SizedBox(width: 10),
              _detailCard('Economy', _stats!.bowlingEconomy.toStringAsFixed(1), AppTheme.accentAmber),
            ],
          ).animate().fadeIn(delay: 200.ms),
        ],
        const SizedBox(height: 20),
        _sectionTitle('Recent Form'),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          children: _matches.take(5).map((m) {
            final isGold = m.runsScored >= 50;
            return Container(
              width: 56, height: 60,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                color: isGold ? AppTheme.accentGold.withValues(alpha: 0.15) : Theme.of(context).cardColor,
                border: Border.all(color: isGold ? AppTheme.accentGold.withValues(alpha: 0.5) : Theme.of(context).dividerColor.withValues(alpha: 0.3)),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('${m.runsScored}', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: isGold ? AppTheme.accentGold : AppTheme.tp(context))),
                  Text('(${m.ballsFaced}b)', style: TextStyle(fontSize: 9, color: AppTheme.ts(context))),
                ],
              ),
            );
          }).toList(),
        ).animate().fadeIn(delay: 250.ms),
      ],
    );
  }

  // ==================== BATTING TAB ====================
  Widget _buildBattingTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _batRow('Innings', '${_stats!.totalMatches}'),
                _batRow('Total Runs', '${_stats!.totalRuns}'),
                _batRow('Highest Score', '${_stats!.highestScore}'),
                _batRow('Batting Avg', _stats!.battingAverage.toStringAsFixed(2)),
                _batRow('Strike Rate', _stats!.strikeRate.toStringAsFixed(2)),
                _batRow('Balls Faced', '${_stats!.totalBallsFaced}'),
                _batRow('50s', '$_fifties'),
                _batRow('100s', '$_hundreds'),
                _batRow('Fours', '${_stats!.totalFours}'),
                _batRow('Sixes', '${_stats!.totalSixes}'),
                _batRow('Ducks', '$_ducks'),
              ],
            ),
          ),
        ).animate().fadeIn(delay: 100.ms),
        if (_stats!.totalWickets > 0) ...[
          const SizedBox(height: 20),
          _sectionTitle('Bowling Stats'),
          const SizedBox(height: 10),
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _batRow('Wickets', '${_stats!.totalWickets}'),
                  _batRow('Overs Bowled', _stats!.totalOversBowled.toStringAsFixed(1)),
                  _batRow('Runs Conceded', '${_stats!.totalRunsConceded}'),
                  _batRow('Economy', _stats!.bowlingEconomy.toStringAsFixed(2)),
                  _batRow('Bowling Avg', _stats!.bowlingAverage.toStringAsFixed(2)),
                  _batRow('Best Figures', _stats!.bestBowling),
                ],
              ),
            ),
          ).animate().fadeIn(delay: 150.ms),
        ],
      ],
    );
  }

  Widget _batRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 13, color: AppTheme.ts(context))),
          Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
        ],
      ),
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
        final isGold = m.runsScored >= 50;
        final didWin = m.matchWinner != null &&
            ((m.team == 1 && m.matchWinner == m.team1Name) || (m.team == 2 && m.matchWinner == m.team2Name));
        return Card(
          margin: const EdgeInsets.only(bottom: 10),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 40, height: 40,
                      decoration: BoxDecoration(
                        color: isGold ? AppTheme.accentGold.withValues(alpha: 0.15) : Theme.of(context).cardColor,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: isGold ? AppTheme.accentGold : Theme.of(context).dividerColor.withValues(alpha: 0.3)),
                      ),
                      alignment: Alignment.center,
                      child: Text('${m.runsScored}', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: isGold ? AppTheme.accentGold : AppTheme.tp(context))),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('vs $vs', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                          if (m.matchDate != null)
                            Text(DateFormat('dd MMM yyyy').format(m.matchDate!), style: TextStyle(fontSize: 11, color: AppTheme.ts(context))),
                        ],
                      ),
                    ),
                    if (m.matchWinner != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: (didWin ? AppTheme.lightGreen : AppTheme.wicketRed).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(didWin ? 'WON' : 'LOST',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: didWin ? AppTheme.lightGreen : AppTheme.wicketRed)),
                      ),
                  ],
                ),
                const Divider(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _mStat('Runs', '${m.runsScored}(${m.ballsFaced})'),
                    _mStat('4s', '${m.fours}'),
                    _mStat('6s', '${m.sixes}'),
                    _mStat('SR', m.strikeRate.toStringAsFixed(0)),
                    if (m.wicketsTaken > 0) _mStat('Wkt', '${m.wicketsTaken}'),
                  ],
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    '${m.team1Name}: ${m.team1Score ?? 0}/${m.team1Wickets ?? 0}  |  ${m.team2Name}: ${m.team2Score ?? 0}/${m.team2Wickets ?? 0}',
                    style: TextStyle(fontSize: 11, color: AppTheme.ts(context)),
                  ),
                ),
              ],
            ),
          ),
        ).animate().slideX(begin: 0.05, delay: (i * 50).ms).fadeIn();
      },
    );
  }

  Widget _statCard(String label, String value, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
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

  Widget _detailCard(String label, String value, Color color) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            children: [
              Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
              const SizedBox(height: 4),
              Text(label, style: TextStyle(fontSize: 11, color: AppTheme.ts(context))),
            ],
          ),
        ),
      ),
    );
  }

  Widget _mStat(String label, String value) => Column(
    children: [
      Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
      Text(label, style: TextStyle(fontSize: 10, color: AppTheme.ts(context))),
    ],
  );

  Widget _sectionTitle(String title) {
    return Row(
      children: [
        Container(width: 4, height: 18, decoration: BoxDecoration(color: AppTheme.accentGold, borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 8),
        Text(title, style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.accentGold)),
      ],
    );
  }
}
