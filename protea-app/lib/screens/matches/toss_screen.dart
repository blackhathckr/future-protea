import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/match.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/theme_toggle.dart';
import '../../widgets/protea_buttons.dart';
import 'start_match_screen.dart';

class TossScreen extends StatefulWidget {
  final int matchId;
  final CricketMatch match;

  const TossScreen({super.key, required this.matchId, required this.match});

  @override
  State<TossScreen> createState() => _TossScreenState();
}

class _TossScreenState extends State<TossScreen> {
  String? _tossWinner;
  String? _tossDecision;
  final _umpireCtrl = TextEditingController();
  bool _loading = false;

  Future<void> _startMatch() async {
    if (_tossWinner == null || _tossDecision == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Select toss winner and decision'),
          backgroundColor: AppTheme.wicketRed,
        ),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      await ApiService.updateMatch(widget.matchId, {
        'toss_winner': _tossWinner,
        'toss_decision': _tossDecision,
        'status': 'live',
        if (_umpireCtrl.text.trim().isNotEmpty) 'umpire': _umpireCtrl.text.trim(),
      });
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => StartMatchScreen(
              matchId: widget.matchId,
              match: widget.match,
              tossWinner: _tossWinner!,
              tossDecision: _tossDecision!,
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.wicketRed),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final m = widget.match;

    return Scaffold(
      body: SafeArea(
        top: false,
        child: SingleChildScrollView(
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
                      onPressed: () => Navigator.pop(context, true),
                    ),
                  ),
                Positioned(
                  top: MediaQuery.of(context).padding.top + 8,
                  right: 8,
                  child: const ThemeToggleButton(),
                ),
                ],
              ),
              const SizedBox(height: 16),
              Text('Who won the toss?',
                  style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w700)),
              const SizedBox(height: 24),

              // Team selection
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Row(
                  children: [
                    Expanded(
                      child: _TeamTossCard(
                        teamName: m.team1Name,
                        selected: _tossWinner == m.team1Name,
                        onTap: () => setState(() => _tossWinner = m.team1Name),
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: _TeamTossCard(
                        teamName: m.team2Name,
                        selected: _tossWinner == m.team2Name,
                        onTap: () => setState(() => _tossWinner = m.team2Name),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Decision
              Text('Decided to?',
                  style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.w700)),
              const SizedBox(height: 20),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Row(
                  children: [
                    Expanded(
                      child: _DecisionCard(
                        label: 'Bat',
                        icon: Icons.sports_cricket,
                        selected: _tossDecision == 'bat',
                        onTap: () => setState(() => _tossDecision = 'bat'),
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: _DecisionCard(
                        label: 'Bowl',
                        icon: Icons.sports_baseball,
                        selected: _tossDecision == 'bowl',
                        onTap: () => setState(() => _tossDecision = 'bowl'),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Umpire
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Umpire (optional)',
                        style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14)),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _umpireCtrl,
                      decoration: InputDecoration(
                        hintText: 'Enter umpire name',
                        prefixIcon: const Icon(Icons.person_outline),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  children: [
                    GreenButton(
                      label: 'START MATCH',
                      onPressed: _startMatch,
                      loading: _loading,
                    ),
                    const SizedBox(height: 12),
                    YellowButton(
                      label: 'SAVE MATCH',
                      onPressed: () async {
                        if (_tossWinner != null && _tossDecision != null) {
                          await ApiService.updateMatch(widget.matchId, {
                            'toss_winner': _tossWinner,
                            'toss_decision': _tossDecision,
                            if (_umpireCtrl.text.trim().isNotEmpty) 'umpire': _umpireCtrl.text.trim(),
                          });
                        }
                        if (mounted) Navigator.pop(context, true);
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _umpireCtrl.dispose();
    super.dispose();
  }
}

class _TeamTossCard extends StatelessWidget {
  final String teamName;
  final bool selected;
  final VoidCallback onTap;

  const _TeamTossCard({
    required this.teamName,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primaryGreen.withValues(alpha: 0.1) : AppTheme.surface(context),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? AppTheme.primaryGreen : AppTheme.divider(context),
            width: selected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            if (selected)
              const Align(
                alignment: Alignment.topLeft,
                child: Icon(Icons.check_circle, color: AppTheme.primaryGreen, size: 20),
              ),
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  teamName.isNotEmpty ? teamName[0].toUpperCase() : '?',
                  style: GoogleFonts.poppins(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryGreen,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              teamName,
              style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

class _DecisionCard extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _DecisionCard({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primaryGreen.withValues(alpha: 0.1) : AppTheme.surface(context),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? AppTheme.primaryGreen : AppTheme.divider(context),
            width: selected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            if (selected)
              const Icon(Icons.check_circle, color: AppTheme.primaryGreen, size: 20),
            Icon(icon, size: 48, color: selected ? AppTheme.primaryGreen : AppTheme.textSecondary),
            const SizedBox(height: 8),
            Text(label,
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                  color: selected ? AppTheme.primaryGreen : AppTheme.tp(context),
                )),
          ],
        ),
      ),
    );
  }
}
