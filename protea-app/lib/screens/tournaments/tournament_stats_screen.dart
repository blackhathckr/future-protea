import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../shared/widgets/loading_state.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/theme_toggle.dart';

class TournamentStatsScreen extends StatefulWidget {
  final String tournamentId;
  final String tournamentName;
  const TournamentStatsScreen({
    super.key,
    required this.tournamentId,
    required this.tournamentName,
  });

  @override
  State<TournamentStatsScreen> createState() => _TournamentStatsScreenState();
}

class _TournamentStatsScreenState extends State<TournamentStatsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  Map<String, dynamic>? _stats;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 5, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final stats = await ApiService.getTournamentStats(widget.tournamentId);
      if (mounted) setState(() { _stats = stats; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppTheme.isDark(context);
    return Scaffold(
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            Stack(
              children: [
                const ProteaHeader(height: 130),
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
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
              child: Column(
                children: [
                  Text('Tournament Stats',
                      style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 2),
                  Text(widget.tournamentName,
                      style: GoogleFonts.poppins(fontSize: 12, color: AppTheme.ts(context)),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 12),
              height: 38,
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(19),
              ),
              child: TabBar(
                controller: _tabCtrl,
                isScrollable: true,
                tabAlignment: TabAlignment.center,
                indicator: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFF1B5E20), Color(0xFF2E7D32)]),
                  borderRadius: BorderRadius.circular(19),
                ),
                dividerHeight: 0,
                indicatorSize: TabBarIndicatorSize.tab,
                labelColor: Colors.white,
                unselectedLabelColor: AppTheme.ts(context),
                labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 11),
                unselectedLabelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w500, fontSize: 11),
                tabs: const [
                  Tab(text: 'Top Scorers'),
                  Tab(text: 'Top Wickets'),
                  Tab(text: 'Best Bowling'),
                  Tab(text: 'Most 4s'),
                  Tab(text: 'Most 6s'),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: _loading
                  ? const LoadingState(label: 'Loading stats...')
                  : _error != null
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.error_outline, size: 48, color: AppTheme.wicketRed),
                              const SizedBox(height: 12),
                              Text('Failed to load stats',
                                  style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: AppTheme.tp(context))),
                              const SizedBox(height: 8),
                              ElevatedButton.icon(
                                onPressed: _load,
                                icon: const Icon(Icons.refresh),
                                label: const Text('Retry'),
                              ),
                            ],
                          ),
                        )
                      : TabBarView(
                          controller: _tabCtrl,
                          children: [
                            _buildBatsmenList(_stats?['top_scorers'] as List? ?? [], 'runs'),
                            _buildBowlersList(_stats?['top_wicket_takers'] as List? ?? []),
                            _buildBestBowlingList(_stats?['best_bowling'] as List? ?? []),
                            _buildBatsmenList(_stats?['most_fours'] as List? ?? [], 'fours'),
                            _buildBatsmenList(_stats?['most_sixes'] as List? ?? [], 'sixes'),
                          ],
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBatsmenList(List items, String statKey) {
    if (items.isEmpty) {
      return Center(child: Text('No data yet', style: GoogleFonts.poppins(color: AppTheme.ts(context))));
    }
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(14, 8, 14, 16),
      itemCount: items.length,
      itemBuilder: (context, i) {
        final p = items[i] as Map<String, dynamic>;
        final isTop3 = i < 3;
        final value = p[statKey] ?? 0;
        return _statCard(
          rank: i + 1,
          isTop3: isTop3,
          name: p['name'] ?? '',
          subtitle: '${p['matches']} match${p['matches'] == 1 ? '' : 'es'}  •  ${p['runs']}r in ${p['balls']}b  •  SR ${p['strike_rate']}',
          mainStat: '$value',
          mainColor: AppTheme.primaryGreen,
          extras: '${p['fours']}x4  ${p['sixes']}x6',
          delay: i * 80,
        );
      },
    );
  }

  Widget _buildBowlersList(List items) {
    if (items.isEmpty) {
      return Center(child: Text('No data yet', style: GoogleFonts.poppins(color: AppTheme.ts(context))));
    }
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(14, 8, 14, 16),
      itemCount: items.length,
      itemBuilder: (context, i) {
        final p = items[i] as Map<String, dynamic>;
        return _statCard(
          rank: i + 1,
          isTop3: i < 3,
          name: p['name'] ?? '',
          subtitle: '${p['matches']} match${p['matches'] == 1 ? '' : 'es'}  •  ${p['overs_bowled']} ov  •  Eco ${p['economy']}  •  Avg ${p['average']}',
          mainStat: '${p['wickets']}',
          mainColor: AppTheme.wicketRed,
          extras: '${p['runs_conceded']} runs',
          delay: i * 80,
        );
      },
    );
  }

  Widget _buildBestBowlingList(List items) {
    if (items.isEmpty) {
      return Center(child: Text('No data yet', style: GoogleFonts.poppins(color: AppTheme.ts(context))));
    }
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(14, 8, 14, 16),
      itemCount: items.length,
      itemBuilder: (context, i) {
        final p = items[i] as Map<String, dynamic>;
        return _statCard(
          rank: i + 1,
          isTop3: i < 3,
          name: p['name'] ?? '',
          subtitle: 'Wickets: ${p['wickets']}  •  Runs conceded: ${p['runs_conceded']}',
          mainStat: '${p['figures']}',
          mainColor: AppTheme.team2Color,
          extras: 'Best in tournament',
          delay: i * 80,
        );
      },
    );
  }

  Widget _statCard({
    required int rank,
    required bool isTop3,
    required String name,
    required String subtitle,
    required String mainStat,
    required Color mainColor,
    required String extras,
    required int delay,
  }) {
    const rankColors = [Color(0xFFFFD700), Color(0xFFC0C0C0), Color(0xFFCD7F32)];
    const rankIcons = [Icons.emoji_events, Icons.workspace_premium, Icons.military_tech];

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      child: Material(
        borderRadius: BorderRadius.circular(14),
        elevation: 2,
        shadowColor: Colors.black12,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            color: AppTheme.surface(context),
          ),
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              if (isTop3)
                Container(
                  width: 30, height: 30,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(colors: [rankColors[rank - 1], rankColors[rank - 1].withValues(alpha: 0.7)]),
                    boxShadow: [BoxShadow(color: rankColors[rank - 1].withValues(alpha: 0.4), blurRadius: 6)],
                  ),
                  child: Center(child: Icon(rankIcons[rank - 1], size: 14, color: Colors.white)),
                )
              else
                SizedBox(width: 30, child: Center(child: Text('#$rank', style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 12, color: AppTheme.ts(context))))),
              const SizedBox(width: 10),
              CircleAvatar(
                radius: 18,
                backgroundColor: mainColor.withValues(alpha: 0.8),
                child: Text(name.isNotEmpty ? name[0] : '?', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13)),
                    Text(subtitle, style: TextStyle(fontSize: 10, color: AppTheme.ts(context))),
                    const SizedBox(height: 2),
                    Text(extras, style: TextStyle(fontSize: 10, color: AppTheme.ts(context), fontStyle: FontStyle.italic)),
                  ],
                ),
              ),
              Text(mainStat, style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w800, color: mainColor)),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(duration: 400.ms, delay: delay.ms).slideX(begin: 0.05);
  }
}
