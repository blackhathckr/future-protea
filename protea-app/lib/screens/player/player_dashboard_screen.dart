import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/match.dart';
import '../../models/player.dart';
import '../../models/tournament.dart';
import '../../models/user.dart';
import '../../services/api_service.dart';
import '../../services/auth_provider.dart';
import '../../theme/app_theme.dart';
import '../profile/profile_screen.dart';
import '../viewer/match_detail_screen.dart';
import '../tournaments/tournament_detail_screen.dart';

class PlayerDashboardScreen extends StatefulWidget {
  const PlayerDashboardScreen({super.key});

  @override
  State<PlayerDashboardScreen> createState() => _PlayerDashboardScreenState();
}

class _PlayerDashboardScreenState extends State<PlayerDashboardScreen> {
  Map<String, dynamic>? _profileData;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await ApiService.getMyProfile();
      setState(() { _profileData = data; _loading = false; });
    } catch (e) {
      setState(() { _loading = false; _error = e.toString(); });
    }
  }

  @override
  Widget build(BuildContext context) {
    final authUser = context.watch<AuthProvider>().user;

    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.accentGold));
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: AppTheme.wicketRed),
              const SizedBox(height: 16),
              Text('Failed to load profile', style: TextStyle(color: AppTheme.ts(context), fontSize: 16)),
              const SizedBox(height: 8),
              Text(_error!, style: TextStyle(color: AppTheme.ts(context), fontSize: 12), textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _load,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen, foregroundColor: Colors.white),
              ),
            ],
          ),
        ),
      );
    }

    final data = _profileData!;
    final user = authUser;
    final careerStats = data['career_stats'] != null ? CareerStats.fromJson(data['career_stats']) : null;
    final registeredPlayer = data['registered_player'] != null ? Player.fromJson(data['registered_player']) : null;
    final recentScores = (data['recent_scores'] as List? ?? []).map((s) => PlayerScore.fromJson(s)).toList();
    final upcomingMatches = (data['upcoming_matches'] as List? ?? []).map((m) => _UpcomingMatchItem.fromJson(m)).toList();
    final tournaments = (data['tournaments'] as List? ?? []).map((t) => Tournament.fromJson(t)).toList();

    return RefreshIndicator(
      onRefresh: _load,
      color: AppTheme.accentGold,
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          _buildHeroCard(context, user, careerStats, registeredPlayer),
          if (!_approved(data)) _buildApprovalBanner(),
          _buildStatGrid(careerStats),
          if (recentScores.isNotEmpty) _buildRecentForm(context, recentScores),
          if (registeredPlayer != null) _buildPlayerCard(context, registeredPlayer),
          if (upcomingMatches.isNotEmpty) _buildUpcomingMatches(context, upcomingMatches),
          if (tournaments.isNotEmpty) _buildTournaments(context, tournaments),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  bool _approved(Map<String, dynamic> data) {
    return data['user']?['approved'] == true;
  }

  // ==================== HERO CARD ====================
  Widget _buildHeroCard(BuildContext context, User? user, CareerStats? stats, Player? regPlayer) {
    final name = user?.name ?? 'Player';
    final photo = user?.photoUrl;
    final battingStyle = regPlayer?.battingStyle ?? user?.battingStyle;
    final bowlingStyle = regPlayer?.bowlingStyle ?? user?.bowlingStyle;
    final playingRole = regPlayer?.playingRole;
    final jersey = regPlayer?.jerseyNumber;
    final club = regPlayer?.clubName ?? regPlayer?.schoolName;

    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0D2B1A), AppTheme.primaryGreen],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: AppTheme.primaryGreen.withValues(alpha: 0.4), blurRadius: 20, offset: const Offset(0, 8))],
      ),
      child: Stack(
        children: [
          // Background cricket-bat watermark
          Positioned(
            right: -20, bottom: -20,
            child: Icon(Icons.sports_cricket, size: 160, color: Colors.white.withValues(alpha: 0.04)),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileScreen())).then((_) => _load()),
                      child: Stack(
                        children: [
                          Container(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: AppTheme.accentGold, width: 3),
                              boxShadow: [BoxShadow(color: AppTheme.accentGold.withValues(alpha: 0.3), blurRadius: 12)],
                            ),
                            child: CircleAvatar(
                              radius: 42,
                              backgroundColor: Colors.white.withValues(alpha: 0.2),
                              backgroundImage: photo != null && photo.isNotEmpty ? NetworkImage(ApiService.getPhotoUrl(photo)) : null,
                              child: photo == null || photo.isEmpty
                                  ? Text(name[0].toUpperCase(), style: GoogleFonts.poppins(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white))
                                  : null,
                            ),
                          ),
                          Positioned(
                            bottom: 2, right: 2,
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(color: AppTheme.accentGold, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 1.5)),
                              child: const Icon(Icons.edit, size: 12, color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (jersey != null)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(color: AppTheme.accentGold.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(6)),
                              child: Text('#$jersey', style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.accentGold)),
                            ),
                          const SizedBox(height: 4),
                          Text(name, style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white), maxLines: 1, overflow: TextOverflow.ellipsis),
                          if (playingRole != null)
                            Text(playingRole, style: GoogleFonts.poppins(fontSize: 12, color: AppTheme.accentGold, fontWeight: FontWeight.w600)),
                          if (club != null)
                            Row(children: [
                              const Icon(Icons.group, size: 12, color: Colors.white60),
                              const SizedBox(width: 4),
                              Flexible(child: Text(club, style: GoogleFonts.poppins(fontSize: 11, color: Colors.white70), overflow: TextOverflow.ellipsis)),
                            ]),
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 6,
                            children: [
                              if (battingStyle != null) _stylePill(battingStyle, Icons.sports_cricket),
                              if (bowlingStyle != null && bowlingStyle != 'None') _stylePill(bowlingStyle, Icons.sports_baseball),
                            ],
                          ),
                        ],
                      ),
                    ),
                    // Matches badge
                    Container(
                      width: 52, height: 52,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: AppTheme.accentGold, width: 2),
                        color: Colors.white.withValues(alpha: 0.1),
                      ),
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              stats != null ? '${stats.totalMatches}' : '0',
                              style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.accentGold),
                            ),
                            Text('M', style: GoogleFonts.poppins(fontSize: 9, color: Colors.white60)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                // Key stats row
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _heroStat('Runs', stats != null && stats.totalMatches > 0 ? '${stats.totalRuns}' : '-'),
                      _vDivider(),
                      _heroStat('HS', stats != null && stats.totalMatches > 0 ? '${stats.highestScore}' : '-'),
                      _vDivider(),
                      _heroStat('Avg', stats != null && stats.totalMatches > 0 ? stats.battingAverage.toStringAsFixed(1) : '-'),
                      _vDivider(),
                      _heroStat('SR', stats != null && stats.totalMatches > 0 ? stats.strikeRate.toStringAsFixed(0) : '-'),
                      _vDivider(),
                      _heroStat('Wkts', stats != null && stats.totalMatches > 0 ? '${stats.totalWickets}' : '-'),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn().scale(begin: const Offset(0.95, 0.95));
  }

  Widget _stylePill(String label, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: Colors.white70),
          const SizedBox(width: 4),
          Text(label, style: GoogleFonts.poppins(fontSize: 10, color: Colors.white70)),
        ],
      ),
    );
  }

  Widget _heroStat(String label, String value) {
    return Column(
      children: [
        Text(value, style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.accentGold)),
        Text(label, style: GoogleFonts.poppins(fontSize: 9, color: Colors.white60)),
      ],
    );
  }

  Widget _vDivider() => Container(width: 1, height: 30, color: Colors.white.withValues(alpha: 0.2));

  // ==================== APPROVAL BANNER ====================
  Widget _buildApprovalBanner() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.accentAmber.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.accentAmber.withValues(alpha: 0.4)),
      ),
      child: const Row(children: [
        Icon(Icons.hourglass_empty, color: AppTheme.accentAmber, size: 20),
        SizedBox(width: 10),
        Expanded(child: Text('Your account is pending approval. You can browse, but join requests need approval.',
            style: TextStyle(color: AppTheme.accentAmber, fontSize: 12))),
      ]),
    ).animate().fadeIn(delay: 200.ms);
  }

  // ==================== STAT GRID ====================
  Widget _buildStatGrid(CareerStats? stats) {
    final items = [
      _StatItem('50s', stats != null ? '${stats.fifties}' : '-', AppTheme.accentGold, Icons.star_half),
      _StatItem('100s', stats != null ? '${stats.hundreds}' : '-', const Color(0xFFE040FB), Icons.star),
      _StatItem('4s', stats != null ? '${stats.totalFours}' : '-', AppTheme.fourColor, Icons.looks_4),
      _StatItem('6s', stats != null ? '${stats.totalSixes}' : '-', AppTheme.sixColor, Icons.looks_6),
      _StatItem('Catches', stats != null ? '${stats.totalCatches}' : '-', AppTheme.lightGreen, Icons.catching_pokemon),
      _StatItem('Best', stats != null ? stats.bestBowling : '-', AppTheme.wicketRed, Icons.local_fire_department),
      _StatItem('Bowl Avg', stats != null && stats.totalWickets > 0 ? stats.bowlingAverage.toStringAsFixed(1) : '-', AppTheme.upcomingBlue, Icons.sports_baseball),
      _StatItem('Economy', stats != null && stats.totalWickets > 0 ? stats.bowlingEconomy.toStringAsFixed(1) : '-', AppTheme.accentAmber, Icons.trending_down),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: _sectionTitle('Career Highlights'),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: LayoutBuilder(
            builder: (ctx, constraints) {
              final tileWidth = (constraints.maxWidth - 30) / 4;
              return Wrap(
                spacing: 10,
                runSpacing: 10,
                children: items.map((item) => SizedBox(
                  width: tileWidth,
                  child: _buildStatTile(item),
                )).toList(),
              );
            },
          ),
        ),
      ],
    ).animate().fadeIn(delay: 150.ms);
  }

  Widget _buildStatTile(_StatItem item) {
    return Card(
      elevation: 2,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(item.icon, size: 16, color: item.color.withValues(alpha: 0.8)),
            const SizedBox(height: 4),
            Text(
              item.value,
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: item.color),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            Text(
              item.label,
              style: TextStyle(fontSize: 9, color: AppTheme.ts(context)),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  // ==================== RECENT FORM ====================
  Widget _buildRecentForm(BuildContext context, List<PlayerScore> scores) {
    final recent = scores.take(5).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              _sectionTitle('Recent Form'),
              const Spacer(),
              // Mini sparkline dots
              ...recent.map((s) {
                Color c;
                if (s.runsScored >= 50) {
                  c = AppTheme.accentGold;
                } else if (s.runsScored >= 30) {
                  c = AppTheme.lightGreen;
                } else if (s.runsScored == 0 && s.isOut) {
                  c = AppTheme.wicketRed;
                } else {
                  c = AppTheme.ts(context).withValues(alpha: 0.3);
                }
                return Container(
                  width: 10, height: 10,
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  decoration: BoxDecoration(color: c, shape: BoxShape.circle),
                );
              }),
            ],
          ),
        ),
        SizedBox(
          height: 110,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: recent.length,
            itemBuilder: (ctx, i) {
              final s = recent[i];
              final vs = s.team == 1 ? (s.team2Name ?? '') : (s.team1Name ?? '');
              final isGold = s.runsScored >= 50;
              final won = s.matchWinner != null && ((s.team == 1 && s.matchWinner == s.team1Name) || (s.team == 2 && s.matchWinner == s.team2Name));
              return Container(
                width: 88,
                margin: const EdgeInsets.symmetric(horizontal: 4),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(14),
                  gradient: LinearGradient(
                    colors: isGold
                        ? [AppTheme.accentGold.withValues(alpha: 0.15), AppTheme.accentGold.withValues(alpha: 0.05)]
                        : [Theme.of(context).cardColor, Theme.of(context).cardColor.withValues(alpha: 0.8)],
                    begin: Alignment.topLeft, end: Alignment.bottomRight,
                  ),
                  border: Border.all(color: isGold ? AppTheme.accentGold.withValues(alpha: 0.4) : Theme.of(context).dividerColor.withValues(alpha: 0.3)),
                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 6)],
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('${s.runsScored}', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: isGold ? AppTheme.accentGold : AppTheme.tp(context))),
                    Text('(${s.ballsFaced}b)', style: TextStyle(fontSize: 9, color: AppTheme.ts(context))),
                    const SizedBox(height: 3),
                    Text('vs $vs', style: TextStyle(fontSize: 9, color: AppTheme.ts(context)), maxLines: 1, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 3),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                      decoration: BoxDecoration(
                        color: (won ? AppTheme.lightGreen : (s.matchWinner != null ? AppTheme.wicketRed : Colors.grey)).withValues(alpha: 0.18),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        won ? 'W' : (s.matchWinner != null ? 'L' : '-'),
                        style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold,
                            color: won ? AppTheme.lightGreen : (s.matchWinner != null ? AppTheme.wicketRed : AppTheme.ts(context))),
                      ),
                    ),
                  ],
                ),
              ).animate().slideX(begin: 0.1, delay: (i * 60).ms).fadeIn();
            },
          ),
        ),
      ],
    );
  }

  // ==================== REGISTERED PLAYER CARD ====================
  Widget _buildPlayerCard(BuildContext context, Player p) {
    final infos = <_InfoItem>[
      if (p.playerId != null) _InfoItem(Icons.badge, 'Player ID', p.playerId!),
      if (p.dateOfBirth != null) _InfoItem(Icons.cake, 'DOB', _formatDob(p.dateOfBirth!)),
      if (p.city != null || p.state != null) _InfoItem(Icons.location_on, 'Location', [p.city, p.state].where((s) => s != null).join(', ')),
      if (p.height != null) _InfoItem(Icons.height, 'Height', '${p.height!.toStringAsFixed(0)} cm'),
      if (p.weight != null) _InfoItem(Icons.monitor_weight, 'Weight', '${p.weight!.toStringAsFixed(0)} kg'),
      if (p.bloodGroup != null) _InfoItem(Icons.water_drop, 'Blood', p.bloodGroup!),
      if (p.nationality != null) _InfoItem(Icons.flag, 'Nationality', p.nationality!),
    ];

    if (infos.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle('Player Details'),
          const SizedBox(height: 10),
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2, childAspectRatio: 3, crossAxisSpacing: 8, mainAxisSpacing: 8,
                    ),
                    itemCount: infos.length,
                    itemBuilder: (ctx, i) => Row(
                      children: [
                        Icon(infos[i].icon, size: 14, color: AppTheme.primaryGreen),
                        const SizedBox(width: 6),
                        Expanded(child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(infos[i].label, style: TextStyle(fontSize: 9, color: AppTheme.ts(context))),
                            Text(infos[i].value, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.tp(context)), overflow: TextOverflow.ellipsis),
                          ],
                        )),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 250.ms);
  }

  String _formatDob(String dob) {
    try {
      final dt = DateTime.parse(dob);
      return DateFormat('dd MMM yyyy').format(dt);
    } catch (_) {
      return dob;
    }
  }

  // ==================== UPCOMING MATCHES ====================
  Widget _buildUpcomingMatches(BuildContext context, List<_UpcomingMatchItem> matches) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _sectionTitle('Upcoming Matches'),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: AppTheme.upcomingBlue.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8)),
                child: Text('${matches.length}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.upcomingBlue)),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ...matches.asMap().entries.map((e) => _buildUpcomingMatchCard(context, e.value, e.key)),
        ],
      ),
    ).animate().fadeIn(delay: 300.ms);
  }

  Widget _buildUpcomingMatchCard(BuildContext context, _UpcomingMatchItem m, int index) {
    final daysUntil = m.matchDate.difference(DateTime.now()).inDays;
    return GestureDetector(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => MatchDetailScreen(matchId: m.id))),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          color: Theme.of(context).cardColor,
          border: Border.all(color: AppTheme.upcomingBlue.withValues(alpha: 0.25)),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8)],
        ),
        child: Row(
          children: [
            Container(
              width: 48, height: 48,
              decoration: BoxDecoration(
                color: AppTheme.upcomingBlue.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(DateFormat('dd').format(m.matchDate), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.upcomingBlue)),
                  Text(DateFormat('MMM').format(m.matchDate), style: const TextStyle(fontSize: 9, color: AppTheme.upcomingBlue)),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${m.team1Name} vs ${m.team2Name}', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 3),
                  if (m.venue != null)
                    Row(children: [
                      Icon(Icons.location_on, size: 11, color: AppTheme.ts(context)),
                      const SizedBox(width: 3),
                      Flexible(child: Text(m.venue!, style: TextStyle(fontSize: 11, color: AppTheme.ts(context)), overflow: TextOverflow.ellipsis)),
                    ]),
                  Row(children: [
                    Icon(Icons.access_time, size: 11, color: AppTheme.ts(context)),
                    const SizedBox(width: 3),
                    Text(DateFormat('hh:mm a').format(m.matchDate), style: TextStyle(fontSize: 11, color: AppTheme.ts(context))),
                    if (m.matchType != null) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                        decoration: BoxDecoration(color: AppTheme.primaryGreen.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(4)),
                        child: Text(m.matchType!, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: AppTheme.primaryGreen)),
                      ),
                    ],
                  ]),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: daysUntil == 0 ? AppTheme.wicketRed.withValues(alpha: 0.15) : AppTheme.upcomingBlue.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    daysUntil == 0 ? 'TODAY' : daysUntil == 1 ? '1 day' : '$daysUntil days',
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: daysUntil == 0 ? AppTheme.wicketRed : AppTheme.upcomingBlue),
                  ),
                ),
                const SizedBox(height: 4),
                const Icon(Icons.chevron_right, size: 18, color: AppTheme.textSecondary),
              ],
            ),
          ],
        ),
      ).animate().slideX(begin: 0.05, delay: (index * 70).ms).fadeIn(),
    );
  }

  // ==================== TOURNAMENTS ====================
  Widget _buildTournaments(BuildContext context, List<Tournament> tournaments) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle('Tournaments'),
          const SizedBox(height: 10),
          ...tournaments.asMap().entries.map((e) => _buildTournamentCard(context, e.value, e.key)),
        ],
      ),
    ).animate().fadeIn(delay: 400.ms);
  }

  Widget _buildTournamentCard(BuildContext context, Tournament t, int index) {
    final isActive = t.status == 'active';
    return GestureDetector(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => TournamentDetailScreen(tournamentId: t.id))),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          gradient: LinearGradient(
            colors: isActive
                ? [AppTheme.accentGold.withValues(alpha: 0.1), Theme.of(context).cardColor]
                : [Theme.of(context).cardColor, Theme.of(context).cardColor],
            begin: Alignment.topLeft, end: Alignment.bottomRight,
          ),
          border: Border.all(color: isActive ? AppTheme.accentGold.withValues(alpha: 0.4) : Theme.of(context).dividerColor.withValues(alpha: 0.3)),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8)],
        ),
        child: Row(
          children: [
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                color: (isActive ? AppTheme.accentGold : AppTheme.upcomingBlue).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(Icons.emoji_events, color: isActive ? AppTheme.accentGold : AppTheme.upcomingBlue, size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(t.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 3),
                  Row(children: [
                    _tournamentPill(t.type, AppTheme.primaryGreen),
                    const SizedBox(width: 6),
                    _tournamentPill('${t.overs} Overs', AppTheme.accentAmber),
                    if (t.venue != null) ...[
                      const SizedBox(width: 6),
                      Flexible(child: Text(t.venue!, style: TextStyle(fontSize: 10, color: AppTheme.ts(context)), overflow: TextOverflow.ellipsis)),
                    ],
                  ]),
                  if (t.startDate != null)
                    Text(DateFormat('dd MMM yyyy').format(t.startDate!), style: TextStyle(fontSize: 10, color: AppTheme.ts(context))),

                ],
              ),
            ),
            Column(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: (isActive ? AppTheme.accentGold : AppTheme.upcomingBlue).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(isActive ? 'LIVE' : 'UPCOMING',
                      style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: isActive ? AppTheme.accentGold : AppTheme.upcomingBlue)),
                ),
                const SizedBox(height: 4),
                const Icon(Icons.chevron_right, size: 18, color: AppTheme.textSecondary),
              ],
            ),
          ],
        ),
      ).animate().slideX(begin: 0.05, delay: (index * 60).ms).fadeIn(),
    );
  }

  Widget _tournamentPill(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(4)),
      child: Text(label, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: color)),
    );
  }

  Widget _sectionTitle(String title) {
    return Row(
      children: [
        Container(width: 4, height: 18, decoration: BoxDecoration(color: AppTheme.accentGold, borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 8),
        Text(title, style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.tp(context))),
      ],
    );
  }
}

// ==================== DATA CLASSES ====================
class _StatItem {
  final String label, value;
  final Color color;
  final IconData icon;
  _StatItem(this.label, this.value, this.color, this.icon);
}

class _InfoItem {
  final IconData icon;
  final String label, value;
  _InfoItem(this.icon, this.label, this.value);
}

class _UpcomingMatchItem {
  final String id;
  final String team1Name, team2Name;
  final DateTime matchDate;
  final String? venue, matchType;
  final String? tournamentId;
  final int? totalOvers;

  _UpcomingMatchItem({
    required this.id,
    required this.team1Name,
    required this.team2Name,
    required this.matchDate,
    this.venue,
    this.matchType,
    this.tournamentId,
    this.totalOvers,
  });

  factory _UpcomingMatchItem.fromJson(Map<String, dynamic> j) {
    return _UpcomingMatchItem(
      id: j['id'],
      team1Name: j['team1_name'] ?? '',
      team2Name: j['team2_name'] ?? '',
      matchDate: DateTime.parse(j['match_date']),
      venue: j['venue'],
      matchType: j['match_type'],
      tournamentId: j['tournament_id'],
      totalOvers: j['total_overs'],
    );
  }
}
