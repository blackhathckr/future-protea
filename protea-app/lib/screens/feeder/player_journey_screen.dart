import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../models/match.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../player/my_journey_screen.dart';

class PlayerJourneyScreen extends StatefulWidget {
  final int? playerId;
  final int? matchId;
  const PlayerJourneyScreen({super.key, this.playerId, this.matchId});

  @override
  State<PlayerJourneyScreen> createState() => _PlayerJourneyScreenState();
}

class _PlayerJourneyScreenState extends State<PlayerJourneyScreen> {
  List<PlayerScore> _matchScores = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      if (widget.matchId != null) {
        final match = await ApiService.getMatch(widget.matchId!);
        setState(() {
          _matchScores = match.scores ?? [];
          _loading = false;
        });
      }
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // If a specific player, use the full analytics journey screen
    if (widget.playerId != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Player Journey')),
        body: MyJourneyScreen(playerId: widget.playerId!),
      );
    }

    // Otherwise show match player list
    return Scaffold(
      appBar: AppBar(title: const Text('Player Journeys')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
          : _buildMatchScores(),
    );
  }

  Widget _buildMatchScores() {
    if (_matchScores.isEmpty) {
      return Center(child: Text('No player scores for this match', style: TextStyle(color: AppTheme.ts(context))));
    }

    final team1 = _matchScores.where((s) => s.team == 1).toList();
    final team2 = _matchScores.where((s) => s.team == 2).toList();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (team1.isNotEmpty) ...[
          _teamHeader('Team 1', AppTheme.team1Color, team1.length),
          ...team1.asMap().entries.map((e) => _playerScoreCard(e.value, e.key)),
        ],
        if (team2.isNotEmpty) ...[
          const SizedBox(height: 12),
          _teamHeader('Team 2', AppTheme.team2Color, team2.length),
          ...team2.asMap().entries.map((e) => _playerScoreCard(e.value, e.key)),
        ],
      ],
    );
  }

  Widget _teamHeader(String title, Color color, int count) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Container(width: 4, height: 20, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
          const SizedBox(width: 8),
          Text(title, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color)),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(color: color.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(10)),
            child: Text('$count', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color)),
          ),
        ],
      ),
    );
  }

  Widget _playerScoreCard(PlayerScore s, int index) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => PlayerJourneyScreen(playerId: s.playerId)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: s.runsScored >= 50 ? AppTheme.primaryGreen : (s.team == 1 ? AppTheme.team1Color : AppTheme.team2Color),
                child: Text(s.name[0], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(s.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                    Row(
                      children: [
                        Text('${s.runsScored}(${s.ballsFaced})', style: const TextStyle(fontSize: 13, color: AppTheme.primaryGreen, fontWeight: FontWeight.bold)),
                        const SizedBox(width: 8),
                        if (s.fours > 0) Text('${s.fours}x4 ', style: const TextStyle(fontSize: 11, color: AppTheme.fourColor)),
                        if (s.sixes > 0) Text('${s.sixes}x6 ', style: const TextStyle(fontSize: 11, color: AppTheme.sixColor)),
                        if (s.wicketsTaken > 0) Text('${s.wicketsTaken}wkt ', style: const TextStyle(fontSize: 11, color: AppTheme.wicketRed)),
                      ],
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('SR ${s.strikeRate.toStringAsFixed(0)}', style: TextStyle(fontSize: 12, color: AppTheme.ts(context))),
                  const SizedBox(height: 2),
                  const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('Journey', style: TextStyle(fontSize: 11, color: AppTheme.primaryGreen, fontWeight: FontWeight.w600)),
                      SizedBox(width: 2),
                      Icon(Icons.arrow_forward_ios, size: 10, color: AppTheme.primaryGreen),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    ).animate().slideX(begin: 0.05, delay: (index * 60).ms).fadeIn();
  }
}
