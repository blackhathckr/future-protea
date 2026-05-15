import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/tournament.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/protea_header.dart';

/// Simple knockout bracket view: semi-finals on top, final at the bottom.
/// Identifies knockout fixtures by `groupName` containing 'semi' or 'final'
/// (case-insensitive).
class TournamentBracketScreen extends StatefulWidget {
  final String tournamentId;
  final String tournamentName;

  const TournamentBracketScreen({
    super.key,
    required this.tournamentId,
    required this.tournamentName,
  });

  @override
  State<TournamentBracketScreen> createState() => _TournamentBracketScreenState();
}

class _TournamentBracketScreenState extends State<TournamentBracketScreen> {
  List<TournamentFixture> _fixtures = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _fixtures = await ApiService.getTournamentFixtures(widget.tournamentId);
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  bool _isSemi(TournamentFixture f) {
    final g = (f.group ?? '').toLowerCase();
    return g.contains('semi');
  }

  bool _isFinal(TournamentFixture f) {
    final g = (f.group ?? '').toLowerCase();
    return g.contains('final') && !g.contains('semi');
  }

  @override
  Widget build(BuildContext context) {
    final semis = _fixtures.where(_isSemi).toList();
    final finals = _fixtures.where(_isFinal).toList();

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
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Knockout Bracket',
                      style: GoogleFonts.poppins(
                          fontSize: 20, fontWeight: FontWeight.w700)),
                  Text(widget.tournamentName,
                      style: GoogleFonts.poppins(
                          fontSize: 13, color: AppTheme.ts(context))),
                ],
              ),
            ),
            Expanded(
              child: _loading
                  ? Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
                  : (semis.isEmpty && finals.isEmpty)
                      ? _emptyState()
                      : RefreshIndicator(
                          color: AppTheme.primaryGreen,
                          onRefresh: _load,
                          child: ListView(
                            padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                            children: [
                              if (semis.isNotEmpty) ...[
                                _stageHeader('Semi-Finals', AppTheme.upcomingBlue),
                                const SizedBox(height: 8),
                                ...semis.map(_bracketCard),
                                const SizedBox(height: 24),
                                Center(
                                  child: Icon(
                                    Icons.arrow_downward,
                                    color: AppTheme.accentGold,
                                    size: 28,
                                  ),
                                ),
                                const SizedBox(height: 16),
                              ],
                              if (finals.isNotEmpty) ...[
                                _stageHeader('Final', AppTheme.accentGold),
                                const SizedBox(height: 8),
                                ...finals.map(_bracketCard),
                              ],
                            ],
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _emptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.account_tree_outlined, size: 56, color: AppTheme.ts(context)),
            const SizedBox(height: 12),
            Text(
              'No knockout fixtures yet',
              style: GoogleFonts.poppins(
                  fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.tp(context)),
            ),
            const SizedBox(height: 4),
            Text(
              'Add fixtures with group "Semi-Final" or "Final"\nto see them here.',
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(fontSize: 12, color: AppTheme.ts(context)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _stageHeader(String label, Color color) {
    return Row(
      children: [
        Container(width: 4, height: 22, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 10),
        Text(label,
            style: GoogleFonts.poppins(
                fontSize: 16, fontWeight: FontWeight.w700, color: color)),
      ],
    );
  }

  Widget _bracketCard(TournamentFixture f) {
    final t1Wins = f.winner != null && f.winner == f.team1Name;
    final t2Wins = f.winner != null && f.winner == f.team2Name;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            children: [
              _teamRow(
                name: f.team1Name,
                score: f.team1Score != null
                    ? '${f.team1Score}/${f.team1Wickets ?? 0}'
                    : null,
                overs: f.team1Overs,
                isWinner: t1Wins,
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 6),
                child: Divider(height: 1),
              ),
              _teamRow(
                name: f.team2Name,
                score: f.team2Score != null
                    ? '${f.team2Score}/${f.team2Wickets ?? 0}'
                    : null,
                overs: f.team2Overs,
                isWinner: t2Wins,
              ),
              if (f.winner != null) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.accentGold.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.emoji_events,
                          size: 14, color: AppTheme.accentAmber),
                      const SizedBox(width: 4),
                      Text('${f.winner} won',
                          style: GoogleFonts.poppins(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.accentAmber)),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _teamRow({
    required String name,
    required String? score,
    required double? overs,
    required bool isWinner,
  }) {
    return Row(
      children: [
        CircleAvatar(
          radius: 12,
          backgroundColor: isWinner
              ? AppTheme.completedGreen
              : AppTheme.primaryGreen.withValues(alpha: 0.5),
          child: Text(
            name.isNotEmpty ? name[0].toUpperCase() : '?',
            style: GoogleFonts.poppins(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            name,
            style: GoogleFonts.poppins(
              fontSize: 14,
              fontWeight: isWinner ? FontWeight.w700 : FontWeight.w500,
              color: AppTheme.tp(context),
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
        if (score != null)
          Text(
            overs != null
                ? '$score (${overs.toStringAsFixed(1)})'
                : score,
            style: GoogleFonts.poppins(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: isWinner ? AppTheme.completedGreen : AppTheme.tp(context),
            ),
          ),
      ],
    );
  }
}
