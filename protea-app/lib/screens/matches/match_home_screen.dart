import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/match.dart';
import '../../services/api_service.dart';
import '../../services/auth_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/theme_toggle.dart';
import '../../widgets/protea_buttons.dart';
import 'create_match_screen.dart';
import 'toss_screen.dart';
import '../viewer/match_detail_screen.dart';
import '../feeder/live_scoring_screen.dart';

class MatchHomeScreen extends StatefulWidget {
  const MatchHomeScreen({super.key});

  @override
  State<MatchHomeScreen> createState() => _MatchHomeScreenState();
}

class _MatchHomeScreenState extends State<MatchHomeScreen> {
  List<CricketMatch> _matches = [];
  bool _loading = true;

  bool get _canManage {
    final role = context.read<AuthProvider>().role;
    return role == 'feeder';
  }

  @override
  void initState() {
    super.initState();
    _loadMatches();
  }

  Future<void> _loadMatches() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        ApiService.getMatches(status: 'live'),
        ApiService.getMatches(status: 'upcoming'),
        ApiService.getMatches(status: 'completed'),
      ]);
      _matches = [...results[0], ...results[1], ...results[2]];
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final canManage = _canManage;

    return Scaffold(
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            Stack(
              children: [
                const ProteaHeader(height: 175),
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
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Text('Matches',
                  style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w700)),
            ),
            if (canManage)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: YellowButton(
                  label: 'CREATE MATCH',
                  onPressed: () async {
                    final result = await Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const CreateMatchScreen()),
                    );
                    if (result == true) _loadMatches();
                  },
                ),
              ),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
                  : _matches.isEmpty
                      ? Center(
                          child: Text('No matches yet',
                              style: GoogleFonts.poppins(color: AppTheme.ts(context))),
                        )
                      : RefreshIndicator(
                          onRefresh: _loadMatches,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _matches.length,
                            itemBuilder: (context, index) =>
                                _MatchCard(match: _matches[index], onRefresh: _loadMatches, canManage: canManage),
                          ),
                        ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: GreenButton(
                label: 'MAIN MENU',
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MatchCard extends StatelessWidget {
  final CricketMatch match;
  final VoidCallback onRefresh;
  final bool canManage;

  const _MatchCard({required this.match, required this.onRefresh, required this.canManage});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => MatchDetailScreen(matchId: match.id)),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      '${match.team1Name} vs ${match.team2Name}',
                      style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 15),
                    ),
                  ),
                  _StatusBadge(status: match.status),
                ],
              ),
              if (match.status != 'upcoming') ...[
                const SizedBox(height: 6),
                Text('${match.team1Name}: ${match.team1Display}',
                    style: TextStyle(fontSize: 13, color: AppTheme.ts(context))),
                Text('${match.team2Name}: ${match.team2Display}',
                    style: TextStyle(fontSize: 13, color: AppTheme.ts(context))),
              ],
              if (match.tossWinner != null && match.tossDecision != null) ...[
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.swap_vert_circle_outlined, size: 14, color: AppTheme.ts(context)),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        '${match.tossWinner} won toss, chose to ${match.tossDecision}',
                        style: TextStyle(fontSize: 12, color: AppTheme.ts(context), fontStyle: FontStyle.italic),
                      ),
                    ),
                  ],
                ),
              ],
              if (match.winner != null) ...[
                const SizedBox(height: 4),
                Text('${match.winner} won!',
                    style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w600, color: AppTheme.primaryGreen, fontSize: 13)),
              ],
              const SizedBox(height: 8),
              Row(
                children: [
                  if (match.venue != null) ...[
                    Icon(Icons.location_on, size: 14, color: AppTheme.ts(context)),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(match.venue!,
                          style: TextStyle(fontSize: 12, color: AppTheme.ts(context))),
                    ),
                  ],
                  Text(
                    DateFormat('dd MMM yyyy').format(match.matchDate),
                    style: TextStyle(fontSize: 12, color: AppTheme.ts(context)),
                  ),
                ],
              ),
              // Only show action buttons for feeders
              if (canManage) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    if (match.status == 'upcoming')
                      _ActionChip(
                        label: 'Start',
                        color: AppTheme.primaryGreen,
                        onTap: () async {
                          final result = await Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => TossScreen(matchId: match.id, match: match),
                            ),
                          );
                          if (result == true) onRefresh();
                        },
                      ),
                    if (match.status == 'live') ...[
                      if (match.tossWinner == null)
                        _ActionChip(
                          label: 'Toss',
                          color: AppTheme.upcomingBlue,
                          onTap: () async {
                            final result = await _showManualTossDialog(context, match);
                            if (result == true) onRefresh();
                          },
                        ),
                      if (match.tossWinner == null) const SizedBox(width: 8),
                      _ActionChip(
                        label: 'Score',
                        color: AppTheme.accentAmber,
                        onTap: () {
                          Navigator.push(context,
                              MaterialPageRoute(builder: (_) => LiveScoringScreen(matchId: match.id)));
                        },
                      ),
                      const SizedBox(width: 8),
                      _ActionChip(
                        label: 'End',
                        color: AppTheme.wicketRed,
                        onTap: () async {
                          final winner = await showDialog<String>(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: const Text('End Match'),
                              content: const Text('Select the winner:'),
                              actions: [
                                TextButton(
                                    onPressed: () => Navigator.pop(ctx, match.team1Name),
                                    child: Text(match.team1Name)),
                                TextButton(
                                    onPressed: () => Navigator.pop(ctx, match.team2Name),
                                    child: Text(match.team2Name)),
                                TextButton(
                                    onPressed: () => Navigator.pop(ctx, 'Draw'),
                                    child: const Text('Draw')),
                              ],
                            ),
                          );
                          if (winner != null) {
                            try {
                              await ApiService.updateMatch(
                                  match.id, {'status': 'completed', 'winner': winner});
                              onRefresh();
                            } catch (_) {}
                          }
                        },
                      ),
                    ],
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

Future<bool?> _showManualTossDialog(BuildContext context, CricketMatch match) {
  String? selectedWinner;
  String? selectedDecision;

  return showDialog<bool>(
    context: context,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setDialogState) => AlertDialog(
        title: Text('Record Toss', style: GoogleFonts.poppins(fontWeight: FontWeight.w700)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Who won the toss?', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14)),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _TossOptionChip(
                    label: match.team1Name,
                    selected: selectedWinner == match.team1Name,
                    onTap: () => setDialogState(() => selectedWinner = match.team1Name),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _TossOptionChip(
                    label: match.team2Name,
                    selected: selectedWinner == match.team2Name,
                    onTap: () => setDialogState(() => selectedWinner = match.team2Name),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text('Chose to?', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14)),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _TossOptionChip(
                    label: 'Bat',
                    selected: selectedDecision == 'bat',
                    onTap: () => setDialogState(() => selectedDecision = 'bat'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _TossOptionChip(
                    label: 'Bowl',
                    selected: selectedDecision == 'bowl',
                    onTap: () => setDialogState(() => selectedDecision = 'bowl'),
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen),
            onPressed: (selectedWinner != null && selectedDecision != null)
                ? () async {
                    final nav = Navigator.of(ctx);
                    final messenger = ScaffoldMessenger.of(ctx);
                    try {
                      await ApiService.updateMatch(match.id, {
                        'toss_winner': selectedWinner,
                        'toss_decision': selectedDecision,
                      });
                      nav.pop(true);
                    } catch (e) {
                      messenger.showSnackBar(
                        SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.wicketRed),
                      );
                    }
                  }
                : null,
            child: const Text('Save', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    ),
  );
}

class _TossOptionChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _TossOptionChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primaryGreen.withValues(alpha: 0.15) : AppTheme.surface(context),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: selected ? AppTheme.primaryGreen : AppTheme.divider(context),
            width: selected ? 2 : 1,
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w600,
              fontSize: 13,
              color: selected ? AppTheme.primaryGreen : AppTheme.tp(context),
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
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
      case 'live':
        color = AppTheme.liveRed;
        label = 'LIVE';
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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(label,
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color)),
    );
  }
}

class _ActionChip extends StatelessWidget {
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionChip({required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(label,
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
      ),
    );
  }
}
