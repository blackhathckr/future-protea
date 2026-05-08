import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/match.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/theme_toggle.dart';
import '../../widgets/protea_buttons.dart';
import '../feeder/live_scoring_screen.dart';

class StartMatchScreen extends StatefulWidget {
  final String matchId;
  final CricketMatch match;
  final String tossWinner;
  final String tossDecision;

  const StartMatchScreen({
    super.key,
    required this.matchId,
    required this.match,
    required this.tossWinner,
    required this.tossDecision,
  });

  @override
  State<StartMatchScreen> createState() => _StartMatchScreenState();
}

class _StartMatchScreenState extends State<StartMatchScreen> {
  List<MatchPlayer> _team1Players = [];
  List<MatchPlayer> _team2Players = [];
  MatchPlayer? _striker;
  MatchPlayer? _nonStriker;
  MatchPlayer? _openingBowler;
  // ignore: unused_field
  String _umpire = '';
  bool _loading = true;

  String get _battingTeamName {
    if (widget.tossDecision == 'bat') return widget.tossWinner;
    return widget.tossWinner == widget.match.team1Name
        ? widget.match.team2Name
        : widget.match.team1Name;
  }

  String get _bowlingTeamName {
    if (widget.tossDecision == 'bowl') return widget.tossWinner;
    return widget.tossWinner == widget.match.team1Name
        ? widget.match.team2Name
        : widget.match.team1Name;
  }

  @override
  void initState() {
    super.initState();
    _loadPlayers();
  }

  Future<void> _loadPlayers() async {
    try {
      // Populate players from team rosters first
      try {
        await ApiService.populateMatchPlayers(widget.matchId);
      } catch (_) {
        // Players may already be populated, continue
      }
      
      final players = await ApiService.getMatchPlayers(widget.matchId);
      setState(() {
        _team1Players = players.where((p) => p.team == 1).toList();
        _team2Players = players.where((p) => p.team == 2).toList();
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  List<MatchPlayer> get _battingTeam {
    return _battingTeamName == widget.match.team1Name ? _team1Players : _team2Players;
  }

  List<MatchPlayer> get _bowlingTeam {
    return _bowlingTeamName == widget.match.team1Name ? _team1Players : _team2Players;
  }

  @override
  Widget build(BuildContext context) {
    final m = widget.match;

    return Scaffold(
      body: SafeArea(
        top: false,
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
            : SingleChildScrollView(
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
                Positioned(
                  top: MediaQuery.of(context).padding.top + 8,
                  right: 8,
                  child: const ThemeToggleButton(),
                ),
                      ],
                    ),
                    Text('Start Match',
                        style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 12),

                    // VS header
                    Container(
                      margin: const EdgeInsets.symmetric(horizontal: 24),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppTheme.accentGold, width: 2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              CircleAvatar(
                                backgroundColor: AppTheme.primaryGreen,
                                child: Text(m.team1Name[0],
                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                              ),
                              const SizedBox(width: 8),
                              Text(m.team1Name,
                                  style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 12),
                                child: Text('VS',
                                    style: GoogleFonts.poppins(
                                        fontWeight: FontWeight.w700,
                                        color: AppTheme.ts(context))),
                              ),
                              Text(m.team2Name,
                                  style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                              const SizedBox(width: 8),
                              CircleAvatar(
                                backgroundColor: AppTheme.team2Color,
                                child: Text(m.team2Name[0],
                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          // Batting 1st / Bowling labels
                          Row(
                            children: [
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 6),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primaryGreen,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  alignment: Alignment.center,
                                  child: const Text('Batting 1st',
                                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 6),
                                  decoration: BoxDecoration(
                                    color: AppTheme.ts(context).withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  alignment: Alignment.center,
                                  child: const Text('Bowling',
                                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Expanded(
                                child: Text(_battingTeamName,
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.poppins(fontSize: 13)),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(_bowlingTeamName,
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.poppins(fontSize: 13)),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Player selectors
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Decided to?',
                              style: GoogleFonts.poppins(
                                  fontSize: 18, fontWeight: FontWeight.w700)),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Expanded(
                                child: _PlayerSelector(
                                  label: 'Striker',
                                  selected: _striker,
                                  players: _battingTeam,
                                  onChanged: (v) => setState(() => _striker = v),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _PlayerSelector(
                                  label: 'Non-Striker',
                                  selected: _nonStriker,
                                  players: _battingTeam,
                                  onChanged: (v) => setState(() => _nonStriker = v),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Text('Opening Bowler',
                              style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                          const SizedBox(height: 8),
                          DropdownButtonFormField<MatchPlayer>(
                            value: _openingBowler,
                            decoration: const InputDecoration(hintText: 'Select bowler'),
                            items: _bowlingTeam
                                .map((p) => DropdownMenuItem(
                                    value: p, child: Text(p.name)))
                                .toList(),
                            onChanged: (v) => setState(() => _openingBowler = v),
                          ),
                          const SizedBox(height: 16),
                          Text('Umpire',
                              style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                          const SizedBox(height: 8),
                          TextFormField(
                            decoration: const InputDecoration(hintText: 'Umpire name'),
                            onChanged: (v) => _umpire = v,
                          ),
                          const SizedBox(height: 32),

                          YellowButton(
                            label: 'START INNINGS',
                            onPressed: () {
                              Navigator.pushReplacement(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => LiveScoringScreen(matchId: widget.matchId),
                                ),
                              );
                            },
                          ),
                          const SizedBox(height: 12),
                          GreenButton(
                            label: 'SAVE MATCH',
                            onPressed: () => Navigator.popUntil(context, (route) => route.isFirst),
                          ),
                          const SizedBox(height: 32),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}

class _PlayerSelector extends StatelessWidget {
  final String label;
  final MatchPlayer? selected;
  final List<MatchPlayer> players;
  final ValueChanged<MatchPlayer?> onChanged;

  const _PlayerSelector({
    required this.label,
    required this.selected,
    required this.players,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13)),
        const SizedBox(height: 6),
        DropdownButtonFormField<MatchPlayer>(
          value: selected,
          decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
          isExpanded: true,
          items: players
              .map((p) => DropdownMenuItem(
                  value: p,
                  child: Text(p.name, style: const TextStyle(fontSize: 13), overflow: TextOverflow.ellipsis)))
              .toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }
}
