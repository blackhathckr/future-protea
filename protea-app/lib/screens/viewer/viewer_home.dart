import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../models/match.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/match_card.dart';
import 'match_detail_screen.dart';
import 'upcoming_match_detail_screen.dart';
import '../profile/profile_screen.dart';

class ViewerHome extends StatefulWidget {
  const ViewerHome({super.key});

  @override
  State<ViewerHome> createState() => _ViewerHomeState();
}

class _ViewerHomeState extends State<ViewerHome> with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  List<CricketMatch> _live = [];
  List<CricketMatch> _upcoming = [];
  List<CricketMatch> _completed = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
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
      setState(() {
        _live = results[0];
        _upcoming = results[1];
        _completed = results[2];
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Icon(Icons.sports_cricket, color: AppTheme.accentGold, size: 28),
            const SizedBox(width: 8),
            const Text('Future Protea'),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadMatches),
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ProfileScreen()),
            ),
          ),
        ],
        bottom: TabBar(
          controller: _tabCtrl,
          indicatorColor: AppTheme.accentGold,
          labelColor: AppTheme.accentGold,
          unselectedLabelColor: AppTheme.textSecondary,
          tabs: [
            Tab(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_live.isNotEmpty)
                    Container(
                      width: 8,
                      height: 8,
                      margin: const EdgeInsets.only(right: 6),
                      decoration: const BoxDecoration(
                        color: AppTheme.wicketRed,
                        shape: BoxShape.circle,
                      ),
                    ),
                  const Text('Live'),
                ],
              ),
            ),
            const Tab(text: 'Upcoming'),
            const Tab(text: 'Results'),
          ],
        ),
      ),
      body: _loading
          ? Center(child: CircularProgressIndicator(color: AppTheme.accentGold))
          : RefreshIndicator(
              onRefresh: _loadMatches,
              child: TabBarView(
                controller: _tabCtrl,
                children: [
                  _buildMatchList(_live, 'No live matches', Icons.live_tv),
                  _buildMatchList(_upcoming, 'No upcoming matches', Icons.calendar_today),
                  _buildMatchList(_completed, 'No completed matches', Icons.emoji_events),
                ],
              ),
            ),
    );
  }

  Widget _buildMatchList(List<CricketMatch> matches, String emptyMsg, IconData emptyIcon) {
    if (matches.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(emptyIcon, size: 64, color: AppTheme.ts(context).withValues(alpha: 0.3)),
            const SizedBox(height: 16),
            Text(emptyMsg, style: TextStyle(color: AppTheme.ts(context))),
          ],
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: matches.length,
      itemBuilder: (context, i) {
        return MatchCard(
          match: matches[i],
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => matches[i].status == 'upcoming'
                  ? UpcomingMatchDetailScreen(matchId: matches[i].id)
                  : MatchDetailScreen(matchId: matches[i].id),
            ),
          ),
        ).animate().slideY(begin: 0.1, delay: (i * 80).ms).fadeIn();
      },
    );
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }
}
