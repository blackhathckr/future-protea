import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../models/match.dart';
import '../../models/user.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import 'player_journey_screen.dart';

class PlayerApprovalScreen extends StatefulWidget {
  final int? matchId;
  const PlayerApprovalScreen({super.key, this.matchId});

  @override
  State<PlayerApprovalScreen> createState() => _PlayerApprovalScreenState();
}

class _PlayerApprovalScreenState extends State<PlayerApprovalScreen> {
  List<User> _allPlayers = [];
  List<MatchPlayer> _matchPlayers = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      if (widget.matchId != null) {
        _matchPlayers = await ApiService.getMatchPlayers(widget.matchId!);
      } else {
        _allPlayers = await ApiService.getPlayers();
      }
      setState(() => _loading = false);
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isMatchView = widget.matchId != null;
    return isMatchView
        ? Scaffold(
            appBar: AppBar(title: const Text('Match Players')),
            body: _buildBody(),
          )
        : _buildBody();
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.accentGold));
    }

    if (widget.matchId != null) {
      return _buildMatchPlayers();
    }
    return _buildAllPlayers();
  }

  Widget _buildAllPlayers() {
    if (_allPlayers.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.people_outline, size: 64, color: AppTheme.ts(context)),
            SizedBox(height: 16),
            Text('No players registered yet', style: TextStyle(color: AppTheme.ts(context))),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _allPlayers.length,
        itemBuilder: (context, i) {
          final player = _allPlayers[i];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              contentPadding: const EdgeInsets.all(12),
              leading: CircleAvatar(
                backgroundColor: player.approved ? AppTheme.lightGreen : AppTheme.textSecondary,
                child: Text(player.name[0].toUpperCase(),
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
              title: Text(player.name, style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(player.email, style: TextStyle(fontSize: 12, color: AppTheme.ts(context))),
                  if (player.battingStyle != null)
                    Text(player.battingStyle!, style: TextStyle(fontSize: 12, color: AppTheme.ts(context))),
                ],
              ),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (!player.approved)
                    IconButton(
                      icon: const Icon(Icons.check_circle_outline, color: AppTheme.lightGreen),
                      onPressed: () async {
                        await ApiService.approveUser(player.id);
                        _load();
                      },
                    ),
                  IconButton(
                    icon: const Icon(Icons.timeline, color: AppTheme.accentGold),
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => PlayerJourneyScreen(playerId: player.id)),
                    ),
                  ),
                ],
              ),
            ),
          ).animate().slideX(begin: 0.05, delay: (i * 60).ms).fadeIn();
        },
      ),
    );
  }

  Widget _buildMatchPlayers() {
    final pending = _matchPlayers.where((p) => p.status == 'pending').toList();
    final approved = _matchPlayers.where((p) => p.status == 'approved').toList();

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (pending.isNotEmpty) ...[
            _sectionHeader('Pending Approval', AppTheme.accentAmber, pending.length),
            ...pending.map((p) => _matchPlayerCard(p)),
          ],
          if (approved.isNotEmpty) ...[
            _sectionHeader('Approved', AppTheme.lightGreen, approved.length),
            ...approved.map((p) => _matchPlayerCard(p)),
          ],
          if (_matchPlayers.isEmpty)
            Center(
              child: Padding(
                padding: EdgeInsets.all(40),
                child: Text('No players have joined yet', style: TextStyle(color: AppTheme.ts(context))),
              ),
            ),
        ],
      ),
    );
  }

  Widget _sectionHeader(String title, Color color, int count) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, top: 8),
      child: Row(
        children: [
          Container(width: 4, height: 20,
              decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
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

  Widget _matchPlayerCard(MatchPlayer player) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: player.team == 1 ? AppTheme.team1Color : (player.team == 2 ? AppTheme.team2Color : AppTheme.textSecondary),
              child: Text(player.name[0].toUpperCase(),
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(player.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                  Text(
                    '${player.battingStyle ?? "N/A"} | Team ${player.team ?? "Unassigned"}',
                    style: TextStyle(fontSize: 12, color: AppTheme.ts(context)),
                  ),
                ],
              ),
            ),
            if (player.status == 'pending') ...[
              // Team assignment + approve
              PopupMenuButton<int>(
                icon: const Icon(Icons.group_add, color: AppTheme.accentGold),
                itemBuilder: (ctx) => [
                  const PopupMenuItem(value: 1, child: Text('Approve → Team 1')),
                  const PopupMenuItem(value: 2, child: Text('Approve → Team 2')),
                ],
                onSelected: (team) async {
                  await ApiService.approvePlayer(player.id, team: team);
                  _load();
                },
              ),
              IconButton(
                icon: const Icon(Icons.close, color: AppTheme.wicketRed),
                onPressed: () async {
                  await ApiService.approvePlayer(player.id, status: 'rejected');
                  _load();
                },
              ),
            ],
            if (player.status == 'approved')
              const Icon(Icons.check_circle, color: AppTheme.lightGreen),
          ],
        ),
      ),
    );
  }
}
