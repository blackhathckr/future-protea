import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../models/match.dart';
import '../../models/team.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/theme_toggle.dart';
import 'match_detail_screen.dart';

class UpcomingMatchDetailScreen extends StatefulWidget {
  final int matchId;
  const UpcomingMatchDetailScreen({super.key, required this.matchId});

  @override
  State<UpcomingMatchDetailScreen> createState() => _UpcomingMatchDetailScreenState();
}

class _UpcomingMatchDetailScreenState extends State<UpcomingMatchDetailScreen>
    with SingleTickerProviderStateMixin {
  CricketMatch? _match;
  List<TeamPlayer> _team1Players = [];
  List<TeamPlayer> _team2Players = [];
  bool _loading = true;
  Timer? _pollTimer;
  late TabController _tabCtrl;
  int _selectedTeam = 1;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
    _loadData();
    // Poll every 15 s — if match goes live, auto-navigate
    _pollTimer = Timer.periodic(const Duration(seconds: 15), (_) => _pollStatus());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _tabCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      final match = await ApiService.getMatch(widget.matchId);
      if (!mounted) return;
      if (match.status != 'upcoming') {
        _navigateToMatchDetail();
        return;
      }
      List<TeamPlayer> t1 = [];
      List<TeamPlayer> t2 = [];
      try {
        // Find teams by name then load their full rosters
        final allTeams = await ApiService.getTeams();
        final team1 = allTeams.firstWhere(
          (t) => t.teamName.toLowerCase().trim() == match.team1Name.toLowerCase().trim(),
          orElse: () => allTeams.firstWhere(
            (t) => match.team1Name.toLowerCase().contains(t.teamName.toLowerCase()),
            orElse: () => allTeams.first,
          ),
        );
        final team2 = allTeams.firstWhere(
          (t) => t.teamName.toLowerCase().trim() == match.team2Name.toLowerCase().trim(),
          orElse: () => allTeams.firstWhere(
            (t) => match.team2Name.toLowerCase().contains(t.teamName.toLowerCase()),
            orElse: () => allTeams.last,
          ),
        );
        final fullTeam1 = await ApiService.getTeam(team1.id);
        final fullTeam2 = await ApiService.getTeam(team2.id);
        t1 = fullTeam1.players ?? [];
        t2 = fullTeam2.players ?? [];
      } catch (_) {}
      if (!mounted) return;
      setState(() {
        _match = match;
        _team1Players = t1;
        _team2Players = t2;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pollStatus() async {
    try {
      final match = await ApiService.getMatch(widget.matchId);
      if (!mounted) return;
      if (match.status != 'upcoming') {
        _navigateToMatchDetail();
      }
    } catch (_) {}
  }

  void _navigateToMatchDetail() {
    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => MatchDetailScreen(matchId: widget.matchId)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppTheme.isDark(context);
    return Scaffold(
      body: SafeArea(
        top: false,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _match == null
                ? const Center(child: Text('Match not found'))
                : Column(
                    children: [
                      // ── Header ──────────────────────────────
                      Stack(
                        children: [
                          const ProteaHeader(height: 90),
                          Positioned(
                            top: MediaQuery.of(context).padding.top + 6,
                            left: 4,
                            child: IconButton(
                              icon: const Icon(Icons.arrow_back, color: Colors.white),
                              onPressed: () => Navigator.pop(context),
                            ),
                          ),
                          Positioned(
                            top: MediaQuery.of(context).padding.top + 2,
                            right: 6,
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Container(
                                  width: 1,
                                  height: 22,
                                  color: Colors.white.withValues(alpha: 0.35),
                                  margin: const EdgeInsets.symmetric(horizontal: 6),
                                ),
                                const ThemeToggleButton(),
                              ],
                            ),
                          ),
                        ],
                      ),

                      // ── Match Hero Card ──────────────────────
                      _buildMatchHero(isDark),

                      // ── Tab Bar ──────────────────────────────
                      Container(
                        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        height: 38,
                        decoration: BoxDecoration(
                          color: isDark
                              ? Colors.white.withValues(alpha: 0.06)
                              : Colors.grey.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(19),
                        ),
                        child: TabBar(
                          controller: _tabCtrl,
                          indicator: BoxDecoration(
                            gradient: const LinearGradient(
                                colors: [Color(0xFF1B5E20), Color(0xFF2E7D32)]),
                            borderRadius: BorderRadius.circular(19),
                            boxShadow: [
                              BoxShadow(
                                  color: AppTheme.primaryGreen.withValues(alpha: 0.3),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2))
                            ],
                          ),
                          dividerHeight: 0,
                          indicatorSize: TabBarIndicatorSize.tab,
                          labelColor: Colors.white,
                          unselectedLabelColor: AppTheme.ts(context),
                          labelStyle: GoogleFonts.poppins(
                              fontWeight: FontWeight.w600, fontSize: 12),
                          unselectedLabelStyle: GoogleFonts.poppins(
                              fontWeight: FontWeight.w500, fontSize: 12),
                          labelPadding: EdgeInsets.zero,
                          tabs: const [
                            Tab(text: 'Match Info'),
                            Tab(text: 'Players'),
                          ],
                        ),
                      ),

                      Expanded(
                        child: TabBarView(
                          controller: _tabCtrl,
                          children: [
                            _buildInfoTab(isDark),
                            _buildPlayersTab(isDark),
                          ],
                        ),
                      ),
                    ],
                  ),
      ),
    );
  }

  // ── Match Hero ────────────────────────────────────────────────────────────

  Widget _buildMatchHero(bool isDark) {
    final m = _match!;
    final formattedDate = DateFormat('EEE, dd MMM yyyy • hh:mm a').format(m.matchDate);
    final hoursUntil = m.matchDate.difference(DateTime.now()).inHours;
    final minutesUntil = m.matchDate.difference(DateTime.now()).inMinutes;

    return Container(
      margin: const EdgeInsets.fromLTRB(12, 8, 12, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0A1F0A), Color(0xFF0D2E10), Color(0xFF0F3812)],
        ),
        border: Border.all(color: const Color(0xFF1B5E20), width: 1),
      ),
      child: Column(
        children: [
          // Teams row
          Row(
            children: [
              Expanded(child: _teamCol(m.team1Name, m.team1LogoUrl, align: CrossAxisAlignment.start)),
              Column(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.upcomingBlue.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text('VS',
                        style: GoogleFonts.poppins(
                            color: AppTheme.upcomingBlue,
                            fontWeight: FontWeight.w800,
                            fontSize: 14)),
                  ),
                  const SizedBox(height: 6),
                  // Countdown
                  if (minutesUntil > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        hoursUntil >= 24
                            ? '${(hoursUntil / 24).floor()}d ${hoursUntil % 24}h'
                            : hoursUntil > 0
                                ? '${hoursUntil}h ${minutesUntil % 60}m'
                                : '${minutesUntil}m',
                        style: GoogleFonts.poppins(
                            color: AppTheme.accentGold,
                            fontWeight: FontWeight.w700,
                            fontSize: 11),
                      ),
                    )
                  else
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppTheme.accentGold.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text('Starting soon!',
                          style: GoogleFonts.poppins(
                              color: AppTheme.accentGold,
                              fontWeight: FontWeight.w700,
                              fontSize: 10)),
                    ),
                ],
              ),
              Expanded(child: _teamCol(m.team2Name, m.team2LogoUrl, align: CrossAxisAlignment.end)),
            ],
          ),
          const SizedBox(height: 12),
          // Date row
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.calendar_today_rounded, size: 12, color: Colors.white54),
              const SizedBox(width: 5),
              Text(formattedDate,
                  style: GoogleFonts.poppins(
                      color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w500)),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.08);
  }

  Widget _teamCol(String name, String? logoUrl, {required CrossAxisAlignment align}) {
    return Column(
      crossAxisAlignment: align,
      children: [
        CircleAvatar(
          radius: 26,
          backgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.2),
          backgroundImage: logoUrl != null && logoUrl.isNotEmpty
              ? NetworkImage(ApiService.getPhotoUrl(logoUrl))
              : null,
          child: logoUrl == null || logoUrl.isEmpty
              ? Text(name.isNotEmpty ? name[0] : '?',
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18))
              : null,
        ),
        const SizedBox(height: 6),
        Text(name,
            style: GoogleFonts.poppins(
                color: Colors.white, fontWeight: FontWeight.w600, fontSize: 12),
            textAlign: align == CrossAxisAlignment.start ? TextAlign.left : TextAlign.right,
            maxLines: 2,
            overflow: TextOverflow.ellipsis),
      ],
    );
  }

  // ── Info Tab ──────────────────────────────────────────────────────────────

  Widget _buildInfoTab(bool isDark) {
    final m = _match!;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        _sectionTitle('Match Details', Icons.info_outline_rounded, isDark),
        const SizedBox(height: 10),
        _infoCard(isDark, [
          if (m.venue != null)
            _infoRow(Icons.location_on_rounded, 'Venue', m.venue!, AppTheme.upcomingBlue, isDark),
          _infoRow(Icons.sports_cricket_rounded, 'Format',
              '${m.totalOvers} Overs${m.matchType != null ? ' • ${m.matchType}' : ''}',
              AppTheme.primaryGreen, isDark),
          _infoRow(Icons.calendar_month_rounded, 'Date & Time',
              DateFormat('EEEE, dd MMMM yyyy').format(m.matchDate), AppTheme.accentGold, isDark),
          _infoRow(Icons.access_time_rounded, 'Time',
              DateFormat('hh:mm a').format(m.matchDate), AppTheme.accentAmber, isDark),
          if (m.umpire != null)
            _infoRow(Icons.person_pin_rounded, 'Umpire', m.umpire!, Colors.purple.shade300, isDark),
          if (m.createdByName != null)
            _infoRow(Icons.manage_accounts_rounded, 'Organised by', m.createdByName!,
                Colors.teal.shade300, isDark),
        ]),
        const SizedBox(height: 20),
        _sectionTitle('Teams', Icons.groups_rounded, isDark),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(child: _teamInfoCard(m.team1Name, m.team1LogoUrl, m.team1PlayerCount, 1, isDark)),
            const SizedBox(width: 10),
            Expanded(child: _teamInfoCard(m.team2Name, m.team2LogoUrl, m.team2PlayerCount, 2, isDark)),
          ],
        ),
        const SizedBox(height: 24),
        // Awaiting start banner
        Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            color: AppTheme.primaryGreen.withValues(alpha: isDark ? 0.12 : 0.08),
            border: Border.all(
                color: AppTheme.primaryGreen.withValues(alpha: 0.3), width: 1),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.pending_rounded, color: AppTheme.primaryGreen, size: 18),
              const SizedBox(width: 8),
              Flexible(
                child: Text('This screen will auto-update when the match starts',
                    style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: AppTheme.primaryGreen,
                        fontWeight: FontWeight.w500),
                    textAlign: TextAlign.center),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _infoCard(bool isDark, List<Widget> rows) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.withValues(alpha: 0.06),
        border: Border.all(
            color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.06)),
      ),
      child: Column(children: rows),
    );
  }

  Widget _infoRow(IconData icon, String label, String value, Color color, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      child: Row(
        children: [
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 16, color: color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: GoogleFonts.poppins(
                        fontSize: 10,
                        color: AppTheme.ts(context).withValues(alpha: 0.5),
                        fontWeight: FontWeight.w500)),
                Text(value,
                    style: GoogleFonts.poppins(
                        fontSize: 13,
                        color: AppTheme.tp(context),
                        fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _teamInfoCard(String name, String? logoUrl, int playerCount, int teamNum, bool isDark) {
    final color = teamNum == 1 ? AppTheme.team1Color : AppTheme.team2Color;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        color: color.withValues(alpha: isDark ? 0.08 : 0.05),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Column(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: color.withValues(alpha: 0.15),
            backgroundImage: logoUrl != null && logoUrl.isNotEmpty
                ? NetworkImage(ApiService.getPhotoUrl(logoUrl))
                : null,
            child: logoUrl == null || logoUrl.isEmpty
                ? Text(name.isNotEmpty ? name[0] : '?',
                    style: TextStyle(
                        color: color, fontWeight: FontWeight.bold, fontSize: 20))
                : null,
          ),
          const SizedBox(height: 8),
          Text(name,
              style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                  color: AppTheme.tp(context)),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.people_rounded, size: 13, color: color),
              const SizedBox(width: 4),
              Text('$playerCount players',
                  style: GoogleFonts.poppins(
                      fontSize: 11, color: color, fontWeight: FontWeight.w600)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(String title, IconData icon, bool isDark) {
    return Row(
      children: [
        Icon(icon, size: 17, color: AppTheme.primaryGreen),
        const SizedBox(width: 7),
        Text(title,
            style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppTheme.tp(context))),
      ],
    );
  }

  // ── Players Tab ───────────────────────────────────────────────────────────

  Widget _buildPlayersTab(bool isDark) {
    final m = _match!;
    final team1 = _team1Players;
    final team2 = _team2Players;
    final activePlayers = _selectedTeam == 1 ? team1 : team2;
    final activeColor = _selectedTeam == 1 ? AppTheme.team1Color : AppTheme.team2Color;

    return Column(
      children: [
        // ── Team Switcher ────────────────────────────────────
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              color: isDark
                  ? Colors.white.withValues(alpha: 0.06)
                  : Colors.grey.withValues(alpha: 0.1),
            ),
            child: Row(
              children: [
                _teamChip(
                  teamNum: 1,
                  name: m.team1Name,
                  logoUrl: m.team1LogoUrl,
                  count: team1.length,
                  color: AppTheme.team1Color,
                  isDark: isDark,
                ),
                _teamChip(
                  teamNum: 2,
                  name: m.team2Name,
                  logoUrl: m.team2LogoUrl,
                  count: team2.length,
                  color: AppTheme.team2Color,
                  isDark: isDark,
                ),
              ],
            ),
          ),
        ),

        // ── Player List ──────────────────────────────────────
        Expanded(
          child: activePlayers.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.people_outline_rounded,
                          size: 56,
                          color: AppTheme.ts(context).withValues(alpha: 0.25)),
                      const SizedBox(height: 10),
                      Text('Squad not announced yet',
                          style: GoogleFonts.poppins(
                              fontSize: 13, color: AppTheme.ts(context))),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                  itemCount: activePlayers.length,
                  itemBuilder: (_, i) => _playerTile(
                      activePlayers[i], i, activeColor, isDark),
                ),
        ),
      ],
    );
  }

  Widget _teamChip({
    required int teamNum,
    required String name,
    required String? logoUrl,
    required int count,
    required Color color,
    required bool isDark,
  }) {
    final isSelected = _selectedTeam == teamNum;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedTeam = teamNum),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeInOut,
          margin: const EdgeInsets.all(4),
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            color: isSelected ? color : Colors.transparent,
            boxShadow: isSelected
                ? [BoxShadow(color: color.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 3))]
                : [],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircleAvatar(
                radius: 13,
                backgroundColor: isSelected
                    ? Colors.white.withValues(alpha: 0.25)
                    : color.withValues(alpha: 0.15),
                backgroundImage: logoUrl != null && logoUrl.isNotEmpty
                    ? NetworkImage(ApiService.getPhotoUrl(logoUrl))
                    : null,
                child: logoUrl == null || logoUrl.isEmpty
                    ? Text(name.isNotEmpty ? name[0] : '?',
                        style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: isSelected ? Colors.white : color))
                    : null,
              ),
              const SizedBox(width: 7),
              Flexible(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name,
                        style: GoogleFonts.poppins(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: isSelected ? Colors.white : AppTheme.tp(context)),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                    Text('$count players',
                        style: GoogleFonts.poppins(
                            fontSize: 9,
                            color: isSelected
                                ? Colors.white.withValues(alpha: 0.75)
                                : AppTheme.ts(context))),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _playerTile(TeamPlayer p, int i, Color teamColor, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.grey.withValues(alpha: 0.05),
        border: Border.all(
            color: isDark
                ? Colors.white.withValues(alpha: 0.07)
                : Colors.black.withValues(alpha: 0.05)),
      ),
      child: Row(
        children: [
          // Number badge
          Container(
            width: 28, height: 28,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: teamColor.withValues(alpha: 0.12),
            ),
            alignment: Alignment.center,
            child: Text('${i + 1}',
                style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: teamColor)),
          ),
          const SizedBox(width: 12),
          // Photo
          if (p.photoUrl != null && p.photoUrl!.isNotEmpty) ...[
            CircleAvatar(
              radius: 16,
              backgroundImage: NetworkImage(ApiService.getPhotoUrl(p.photoUrl!)),
            ),
            const SizedBox(width: 10),
          ],
          // Name + badges
          Expanded(
            child: Row(
              children: [
                Flexible(
                  child: Text(p.playerName,
                      style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                          color: AppTheme.tp(context)),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis),
                ),
                if (p.isCaptain) ...[
                  const SizedBox(width: 5),
                  _badge('C', AppTheme.accentGold),
                ],
                if (p.isWicketKeeper) ...[
                  const SizedBox(width: 4),
                  _badge('WK', AppTheme.upcomingBlue),
                ],
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 300.ms, delay: (i * 40).ms).slideX(begin: 0.05);
  }

  Widget _badge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(text,
          style: TextStyle(
              fontSize: 9, fontWeight: FontWeight.w800, color: color)),
    );
  }
}
