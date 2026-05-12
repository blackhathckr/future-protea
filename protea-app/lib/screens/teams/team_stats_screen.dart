import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/protea_header.dart';

class TeamStatsScreen extends StatefulWidget {
  final String teamId;
  final String teamName;

  const TeamStatsScreen({super.key, required this.teamId, required this.teamName});

  @override
  State<TeamStatsScreen> createState() => _TeamStatsScreenState();
}

class _TeamStatsScreenState extends State<TeamStatsScreen> {
  Map<String, dynamic>? _stats;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      _stats = await ApiService.getTeamStats(widget.teamId);
    } catch (e) {
      _error = e.toString();
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            Stack(
              children: [
                const ProteaHeader(height: 160),
                Positioned(
                  top: MediaQuery.of(context).padding.top + 8,
                  left: 8,
                  child: IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.accentAmber.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.bar_chart_rounded,
                        color: AppTheme.accentAmber, size: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(widget.teamName,
                            style: GoogleFonts.poppins(
                                fontSize: 18, fontWeight: FontWeight.w700)),
                        Text('Team statistics',
                            style: GoogleFonts.poppins(
                                fontSize: 12, color: AppTheme.ts(context))),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Expanded(child: _buildBody()),
          ],
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen));
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(_error!, style: TextStyle(color: AppTheme.ts(context))),
        ),
      );
    }
    final s = _stats ?? {};
    final total = s['total_matches'] ?? 0;
    final wins = s['wins'] ?? 0;
    final losses = s['losses'] ?? 0;
    final noResults = s['no_results'] ?? 0;
    final highest = s['highest_total'] ?? 0;
    final scorer = s['leading_scorer'] as Map<String, dynamic>?;
    final taker = s['leading_wicket_taker'] as Map<String, dynamic>?;

    return RefreshIndicator(
      color: AppTheme.primaryGreen,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          Row(
            children: [
              _statBox('Matches', total.toString(), AppTheme.upcomingBlue, Icons.sports_cricket),
              const SizedBox(width: 8),
              _statBox('Won', wins.toString(), AppTheme.completedGreen, Icons.emoji_events),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _statBox('Lost', losses.toString(), AppTheme.wicketRed, Icons.close),
              const SizedBox(width: 8),
              _statBox('No Result', noResults.toString(), AppTheme.textSecondary, Icons.remove),
            ],
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.accentGold.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.show_chart, color: AppTheme.accentAmber, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Highest Team Total',
                            style: GoogleFonts.poppins(
                                fontSize: 13, color: AppTheme.ts(context))),
                        Text('$highest',
                            style: GoogleFonts.poppins(
                                fontSize: 22, fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          _leaderCard(
            label: 'Leading Run-Scorer',
            icon: Icons.sports_cricket,
            color: AppTheme.team1Color,
            name: scorer?['name'] as String?,
            value: scorer != null ? '${scorer['runs']} runs' : null,
          ),
          const SizedBox(height: 12),
          _leaderCard(
            label: 'Leading Wicket-Taker',
            icon: Icons.flash_on,
            color: AppTheme.team2Color,
            name: taker?['name'] as String?,
            value: taker != null ? '${taker['wickets']} wkts' : null,
          ),
        ],
      ),
    );
  }

  Widget _statBox(String label, String value, Color color, IconData icon) {
    return Expanded(
      child: Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
          child: Column(
            children: [
              Icon(icon, color: color, size: 22),
              const SizedBox(height: 6),
              Text(value,
                  style: GoogleFonts.poppins(
                      fontSize: 22, fontWeight: FontWeight.bold, color: color)),
              Text(label,
                  style: GoogleFonts.poppins(
                      fontSize: 12, color: AppTheme.ts(context))),
            ],
          ),
        ),
      ),
    );
  }

  Widget _leaderCard({
    required String label,
    required IconData icon,
    required Color color,
    required String? name,
    required String? value,
  }) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.13),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: GoogleFonts.poppins(
                          fontSize: 12, color: AppTheme.ts(context))),
                  const SizedBox(height: 2),
                  Text(name ?? 'No data yet',
                      style: GoogleFonts.poppins(
                          fontSize: 16, fontWeight: FontWeight.w700)),
                ],
              ),
            ),
            if (value != null)
              Text(value,
                  style: GoogleFonts.poppins(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: color)),
          ],
        ),
      ),
    );
  }
}
