import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/tournament.dart';
import '../../services/api_service.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import '../../shared/widgets/loading_state.dart';
import '../../shared/widgets/empty_state.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/theme_toggle.dart';
import 'create_tournament_screen.dart';
import 'tournament_detail_screen.dart';

class TournamentHomeScreen extends StatefulWidget {
  const TournamentHomeScreen({super.key});

  @override
  State<TournamentHomeScreen> createState() => _TournamentHomeScreenState();
}

class _TournamentHomeScreenState extends State<TournamentHomeScreen> {
  List<Tournament> _tournaments = [];
  bool _loading = true;

  bool get _canManage {
    final role = context.read<AuthProvider>().role;
    return role == 'admin' || role == 'tournament_organiser';
  }

  @override
  void initState() {
    super.initState();
    _loadTournaments();
  }

  Future<void> _loadTournaments() async {
    setState(() => _loading = true);
    try {
      _tournaments = await ApiService.getTournaments();
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final canManage = _canManage;
    final current = _tournaments.where((t) => t.status == 'in_progress').toList();
    final upcoming = _tournaments.where((t) => t.status == 'upcoming').toList();
    final completed = _tournaments.where((t) => t.status == 'completed').toList();

    return Scaffold(
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            // ── Header ──────────────────────────────────────────────────
            Stack(
              children: [
                const ProteaHeader(height: 120),
                Positioned(
                  top: MediaQuery.of(context).padding.top + 8,
                  right: 8,
                  child: const ThemeToggleButton(),
                ),
              ],
            ),

            // ── Title + count ────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
              child: Row(
                children: [
                  Text('Tournaments',
                      style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w700)),
                  const SizedBox(width: 10),
                  if (!_loading)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${_tournaments.length}',
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primaryGreen,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 8),

            // ── Tournament lists ──────────────────────────────────────────
            Expanded(
              child: _loading
                  ? LoadingState(label: 'Loading tournaments...')
                  : RefreshIndicator(
                      color: AppTheme.accentGold,
                      onRefresh: _loadTournaments,
                      child: ListView(
                        padding: const EdgeInsets.fromLTRB(16, 4, 16, 80),
                        children: [
                          if (current.isNotEmpty) ...[
                            Container(
                              decoration: BoxDecoration(
                                border: Border(left: BorderSide(color: AppTheme.primaryGreen, width: 4)),
                              ),
                              padding: const EdgeInsets.only(left: 8),
                              child: Text('Current Tournaments',
                                  style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700)),
                            ),
                            const SizedBox(height: 8),
                            ...current.toList().asMap().entries.map((e) {
                              final index = e.key;
                              final t = e.value;
                              return _TournamentListItem(
                                tournament: t,
                                index: index,
                                onTap: () => _openTournament(t),
                              );
                            }),
                            const SizedBox(height: 16),
                          ],
                          if (completed.isNotEmpty) ...[
                            _sectionHeader('Completed', AppTheme.completedGreen),
                            const SizedBox(height: 8),
                            ...completed.asMap().entries.map((e) => _TournamentListItem(
                              tournament: e.value,
                              index: e.key,
                              onTap: () => _openTournament(e.value),
                            )),
                            const SizedBox(height: 16),
                          ],
                          if (upcoming.isNotEmpty) ...[
                            Container(
                              decoration: BoxDecoration(
                                border: Border(left: BorderSide(color: AppTheme.primaryGreen, width: 4)),
                              ),
                              padding: const EdgeInsets.only(left: 8),
                              child: Text('Upcoming Tournaments',
                                  style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700)),
                            ),
                            const SizedBox(height: 8),
                            ...upcoming.toList().asMap().entries.map((e) {
                              final index = e.key;
                              final t = e.value;
                              return _TournamentListItem(
                                tournament: t,
                                index: index,
                                onTap: () => _openTournament(t),
                              );
                            }),
                          ],
                          if (_tournaments.isEmpty)
                            Padding(
                              padding: const EdgeInsets.all(40),
                              child: EmptyState(
                                message: 'No tournaments yet',
                                subtitle: 'Create a tournament to get started',
                                onRefresh: _loadTournaments,
                              ),
                            ),
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),
      floatingActionButton: canManage
          ? FloatingActionButton.extended(
              heroTag: 'tournaments_home_create',
              onPressed: () async {
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const CreateTournamentScreen()),
                );
                if (result == true) _loadTournaments();
              },
              backgroundColor: AppTheme.accentGold,
              foregroundColor: AppTheme.textPrimary,
              icon: const Icon(Icons.add),
              label: Text('New Tournament',
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
            )
          : null,
    );
  }

  Widget _sectionHeader(String title, Color color) {
    return Row(
      children: [
        Container(width: 4, height: 20, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 8),
        Text(title, style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: color)),
      ],
    );
  }

  void _openTournament(Tournament t) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => TournamentDetailScreen(tournamentId: t.id)),
    );
  }
}

class _TournamentListItem extends StatelessWidget {
  final Tournament tournament;
  final int index;
  final VoidCallback onTap;

  const _TournamentListItem({required this.tournament, required this.index, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final dateStr = [
      if (tournament.startDate != null) DateFormat('dd MMM yyyy').format(tournament.startDate!),
      if (tournament.endDate != null) DateFormat('dd MMM yyyy').format(tournament.endDate!),
    ].join(' - ');

    Color statusColor;
    switch (tournament.status) {
      case 'in_progress':
        statusColor = AppTheme.inProgressOrange;
        break;
      case 'completed':
        statusColor = AppTheme.completedGreen;
        break;
      default:
        statusColor = AppTheme.upcomingBlue;
    }

    final String typeLabel = 'T${tournament.overs}';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppTheme.isDark(context)
              ? AppTheme.accentGold.withValues(alpha: 0.1)
              : AppTheme.buttonYellow.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.5)),
        ),
        child: Row(
          children: [
            Icon(Icons.emoji_events, size: 28, color: statusColor),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(tournament.name,
                            style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 15)),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          typeLabel,
                          style: GoogleFonts.poppins(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.primaryGreen,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (dateStr.isNotEmpty)
                    Text(dateStr,
                        style: TextStyle(fontSize: 12, color: AppTheme.ts(context))),
                  if (tournament.venue != null && tournament.venue!.isNotEmpty)
                    Row(
                      children: [
                        Icon(Icons.location_on, size: 12, color: AppTheme.ts(context)),
                        const SizedBox(width: 2),
                        Expanded(
                          child: Text(
                            tournament.venue!,
                            style: TextStyle(fontSize: 11, color: AppTheme.ts(context)),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: statusColor,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(tournament.statusLabel,
                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 400.ms, delay: (index * 80).ms).slideY(begin: 0.08);
  }
}
