import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../models/tournament.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/theme_toggle.dart';
import 'tournament_fixtures_screen.dart';
import 'tournament_points_screen.dart';
import 'tournament_stats_screen.dart';

class TournamentDetailScreen extends StatefulWidget {
  final int tournamentId;

  const TournamentDetailScreen({super.key, required this.tournamentId});

  @override
  State<TournamentDetailScreen> createState() => _TournamentDetailScreenState();
}

class _TournamentDetailScreenState extends State<TournamentDetailScreen> {
  Tournament? _tournament;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadTournament();
  }

  Future<void> _loadTournament() async {
    setState(() => _loading = true);
    try {
      _tournament = await ApiService.getTournament(widget.tournamentId);
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        top: false,
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
            : _tournament == null
                ? const Center(child: Text('Tournament not found'))
                : SingleChildScrollView(
                    child: Column(
                      children: [
                        Stack(
                          children: [
                            const ProteaHeader(height: 160),
                            Positioned(
                              top: MediaQuery.of(context).padding.top + 8,
                              right: 8,
                              child: const ThemeToggleButton(),
                            ),
                          ],
                        ),

                        // ── Hero info card ───────────────────────────────────
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                          child: Card(
                            child: Padding(
                              padding: const EdgeInsets.all(20),
                              child: Column(
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: AppTheme.accentGold.withValues(alpha: 0.15),
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(Icons.emoji_events, size: 36, color: AppTheme.accentGold),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(_tournament!.name,
                                                style: GoogleFonts.poppins(
                                                    fontSize: 18, fontWeight: FontWeight.w700)),
                                            const SizedBox(height: 4),
                                            if (_tournament!.startDate != null || _tournament!.endDate != null)
                                              Text(
                                                [
                                                  if (_tournament!.startDate != null)
                                                    DateFormat('dd MMM yyyy').format(_tournament!.startDate!),
                                                  if (_tournament!.endDate != null)
                                                    DateFormat('dd MMM yyyy').format(_tournament!.endDate!),
                                                ].join(' – '),
                                                style: GoogleFonts.poppins(
                                                    fontSize: 12, color: AppTheme.ts(context)),
                                              ),
                                            if (_tournament!.venue != null && _tournament!.venue!.isNotEmpty) ...
                                              [
                                                const SizedBox(height: 2),
                                                Row(
                                                  children: [
                                                    Icon(Icons.location_on_outlined, size: 13, color: AppTheme.ts(context)),
                                                    const SizedBox(width: 2),
                                                    Flexible(
                                                      child: Text(_tournament!.venue!,
                                                          style: TextStyle(fontSize: 12, color: AppTheme.ts(context)),
                                                          overflow: TextOverflow.ellipsis),
                                                    ),
                                                  ],
                                                ),
                                              ],
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      _StatusBadge(status: _tournament!.status),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Align(
                                    alignment: Alignment.centerLeft,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        '${_tournament!.type} · ${_tournament!.overs} overs',
                                        style: GoogleFonts.poppins(
                                          fontSize: 12, fontWeight: FontWeight.w600,
                                          color: AppTheme.primaryGreen,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 16),

                        // ── Action tiles ─────────────────────────────────────
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Card(
                            child: Column(
                              children: [
                                _NavTile(
                                  icon: Icons.calendar_month,
                                  iconColor: AppTheme.upcomingBlue,
                                  label: 'Fixtures',
                                  subtitle: 'View all scheduled matches',
                                  onTap: () => Navigator.push(context, MaterialPageRoute(
                                    builder: (_) => TournamentFixturesScreen(
                                      tournamentId: widget.tournamentId,
                                      tournamentName: _tournament!.name,
                                      startDate: _tournament!.startDate,
                                      endDate: _tournament!.endDate,
                                    ),
                                  )),
                                ),
                                const Divider(height: 1, indent: 56),
                                _NavTile(
                                  icon: Icons.checklist_rtl,
                                  iconColor: AppTheme.completedGreen,
                                  label: 'Results',
                                  subtitle: 'Completed match results',
                                  onTap: () => Navigator.push(context, MaterialPageRoute(
                                    builder: (_) => TournamentFixturesScreen(
                                      tournamentId: widget.tournamentId,
                                      tournamentName: _tournament!.name,
                                      startDate: _tournament!.startDate,
                                      endDate: _tournament!.endDate,
                                      showResultsOnly: true,
                                    ),
                                  )),
                                ),
                                const Divider(height: 1, indent: 56),
                                _NavTile(
                                  icon: Icons.table_chart,
                                  iconColor: AppTheme.accentAmber,
                                  label: 'Points Table',
                                  subtitle: 'Team standings & NRR',
                                  onTap: () => Navigator.push(context, MaterialPageRoute(
                                    builder: (_) => TournamentPointsScreen(
                                      tournamentId: widget.tournamentId,
                                      tournamentName: _tournament!.name,
                                      startDate: _tournament!.startDate,
                                      endDate: _tournament!.endDate,
                                    ),
                                  )),
                                ),
                                const Divider(height: 1, indent: 56),
                                _NavTile(
                                  icon: Icons.bar_chart_rounded,
                                  iconColor: AppTheme.team2Color,
                                  label: 'Tournament Stats',
                                  subtitle: 'Top scorers, wickets & best figures',
                                  onTap: () => Navigator.push(context, MaterialPageRoute(
                                    builder: (_) => TournamentStatsScreen(
                                      tournamentId: widget.tournamentId,
                                      tournamentName: _tournament!.name,
                                    ),
                                  )),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color color;
    String label;
    switch (status) {
      case 'in_progress':
        color = AppTheme.inProgressOrange;
        label = 'In Progress';
        break;
      case 'completed':
        color = AppTheme.completedGreen;
        label = 'Completed';
        break;
      default:
        color = AppTheme.upcomingBlue;
        label = 'Upcoming';
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(label,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
    );
  }
}

class _NavTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label;
  final String subtitle;
  final VoidCallback onTap;

  const _NavTile({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: iconColor.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: iconColor, size: 22),
      ),
      title: Text(label,
          style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 15)),
      subtitle: Text(subtitle,
          style: TextStyle(fontSize: 12, color: AppTheme.ts(context))),
      trailing: const Icon(Icons.chevron_right),
    );
  }
}
