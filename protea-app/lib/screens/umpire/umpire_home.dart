// =============================================================================
// UMPIRE HOME — Field Official
// =============================================================================
// Per BRD §6.4 + role spec: "No active app interaction required — their
// involvement is a data field entered by the scorer." The Umpire is recorded
// against the official match record (Match.umpire / MatchOfficial table) on
// the Innings Setup screen by the scorer.
//
// This home is intentionally read-only and minimal: it lists matches where
// this user has been recorded as the umpire so they can verify their record.
// It is *not* a scoring or editing surface.
// =============================================================================

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/match.dart';
import '../../services/api_service.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import '../../shared/widgets/loading_state.dart';
import '../../shared/widgets/empty_state.dart';
import '../../widgets/notification_bell.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/theme_toggle.dart';
import '../auth/login_screen.dart';
import '../viewer/match_detail_screen.dart';
import '../profile/profile_screen.dart';

class UmpireHome extends StatefulWidget {
  const UmpireHome({super.key});

  @override
  State<UmpireHome> createState() => _UmpireHomeState();
}

class _UmpireHomeState extends State<UmpireHome> {
  List<CricketMatch> _allMatches = [];
  bool _loading = true;
  bool _mineOnly = false;  // Toggle: show only my assignments vs all matches.

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        ApiService.getMatches(status: 'upcoming'),
        ApiService.getMatches(status: 'live'),
        ApiService.getMatches(status: 'completed'),
      ]);
      _allMatches = [...results[0], ...results[1], ...results[2]];
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  /// Returns true if the umpire field on this match references the current
  /// user. The umpire field is a free-text record per BRD so we do a
  /// case-insensitive substring match against the user's name.
  bool _isAssignedToMe(CricketMatch m, String userName) {
    if (userName.isEmpty) return false;
    final needle = userName.toLowerCase();
    final u = (m.umpire ?? '').toLowerCase().trim();
    if (u.isEmpty) return false;
    return u == needle || u.contains(needle);
  }

  /// Match list shown in the body — either all matches, or only ones where
  /// this user is the recorded umpire.
  List<CricketMatch> _visibleMatches(String userName) {
    if (!_mineOnly) return _allMatches;
    return _allMatches.where((m) => _isAssignedToMe(m, userName)).toList();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final userName = auth.user?.name ?? '';
    final firstName = userName.split(' ').first;
    final visible = _visibleMatches(userName);

    final live = visible.where((m) => m.status == 'live').toList();
    final upcoming =
        visible.where((m) => m.status == 'upcoming').toList();
    final completed =
        visible.where((m) => m.status == 'completed').toList();
    // Count actual assignments regardless of toggle, for the summary chip.
    final assignedCount =
        _allMatches.where((m) => _isAssignedToMe(m, userName)).length;

    return Scaffold(
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            // ── Header ─────────────────────────────────────────────
            Stack(
              children: [
                const ProteaHeader(height: 150),
                Positioned(
                  top: MediaQuery.of(context).padding.top + 6,
                  left: 8,
                  child: GestureDetector(
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ProfileScreen()),
                    ),
                    child: Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border:
                            Border.all(color: AppTheme.accentGold, width: 2.5),
                      ),
                      child: CircleAvatar(
                        radius: 22,
                        backgroundColor: Colors.white,
                        backgroundImage: auth.user?.photoUrl != null &&
                                auth.user!.photoUrl!.isNotEmpty
                            ? NetworkImage(
                                ApiService.getPhotoUrl(auth.user!.photoUrl!))
                            : null,
                        child: auth.user?.photoUrl == null ||
                                auth.user!.photoUrl!.isEmpty
                            ? Text(
                                firstName.isNotEmpty
                                    ? firstName[0].toUpperCase()
                                    : 'U',
                                style: GoogleFonts.poppins(
                                  color: AppTheme.primaryGreen,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              )
                            : null,
                      ),
                    ),
                  ),
                ),
                Positioned(
                  top: MediaQuery.of(context).padding.top + 6,
                  right: 4,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const NotificationBell(iconSize: 22),
                      const ThemeToggleButton(),
                      IconButton(
                        icon: const Icon(Icons.logout,
                            color: Colors.white, size: 22),
                        onPressed: () => _confirmLogout(context),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            // ── Greeting + role pill ────────────────────────────────
            Padding(
              padding: const EdgeInsets.only(top: 4, bottom: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Hi $firstName',
                      style: GoogleFonts.poppins(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.tp(context))),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 2),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF6A1B9A), Color(0xFF4A148C)],
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text('UMPIRE',
                        style: GoogleFonts.poppins(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                            letterSpacing: 0.5)),
                  ),
                ],
              ),
            ),

            // ── Read-only notice (per BRD) ──────────────────────────
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: AppTheme.upcomingBlue.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                    color: AppTheme.upcomingBlue.withValues(alpha: 0.25)),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline,
                      size: 16, color: AppTheme.upcomingBlue),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      assignedCount == 0
                          ? 'No matches have you recorded as the umpire yet — browse all fixtures below. Scorers add umpire names during innings setup.'
                          : 'Field Official — $assignedCount match${assignedCount == 1 ? '' : 'es'} recorded with you as umpire. This view is read-only.',
                      style: GoogleFonts.poppins(
                          fontSize: 11,
                          color: AppTheme.tp(context),
                          height: 1.3),
                    ),
                  ),
                ],
              ),
            ),

            // ── My assignments / All matches toggle ────────────────
            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                children: [
                  Expanded(
                    child: _SegmentButton(
                      label: 'All matches',
                      count: _allMatches.length,
                      selected: !_mineOnly,
                      onTap: () => setState(() => _mineOnly = false),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _SegmentButton(
                      label: 'My assignments',
                      count: assignedCount,
                      selected: _mineOnly,
                      onTap: () => setState(() => _mineOnly = true),
                    ),
                  ),
                ],
              ),
            ),

            // ── Body ────────────────────────────────────────────────
            Expanded(
              child: _loading
                  ? const LoadingState(label: 'Loading your assignments…')
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                        children: [
                          _SummaryRow(
                            upcoming: upcoming.length,
                            live: live.length,
                            completed: completed.length,
                          ),
                          const SizedBox(height: 18),

                          if (live.isNotEmpty) ...[
                            _SectionTitle('On the field now'),
                            const SizedBox(height: 6),
                            ...live.map((m) => _AssignmentCard(
                                  match: m,
                                  badge: 'LIVE',
                                  assignedToMe:
                                      _isAssignedToMe(m, userName),
                                )),
                            const SizedBox(height: 18),
                          ],

                          _SectionTitle(_mineOnly ? 'My upcoming' : 'Upcoming'),
                          const SizedBox(height: 6),
                          if (upcoming.isEmpty)
                            EmptyState(
                              message: _mineOnly
                                  ? 'No upcoming assignments for you'
                                  : 'No upcoming matches',
                              subtitle: _mineOnly
                                  ? 'Matches will appear here once a scorer enters your name during innings setup.'
                                  : 'New fixtures will appear here once they are scheduled.',
                            )
                          else
                            ...upcoming.map((m) => _AssignmentCard(
                                  match: m,
                                  badge: 'UPCOMING',
                                  assignedToMe:
                                      _isAssignedToMe(m, userName),
                                )),
                          const SizedBox(height: 18),

                          _SectionTitle(_mineOnly ? 'My completed' : 'Completed'),
                          const SizedBox(height: 6),
                          if (completed.isEmpty)
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 6),
                              child: Text('No past matches yet.',
                                  style: GoogleFonts.poppins(
                                      fontSize: 12,
                                      color: AppTheme.ts(context))),
                            )
                          else
                            ...completed.map((m) => _AssignmentCard(
                                  match: m,
                                  badge: 'RESULT',
                                  assignedToMe:
                                      _isAssignedToMe(m, userName),
                                )),
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final navigator = Navigator.of(context);
              navigator.pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
              await context.read<AuthProvider>().logout();
            },
            child: const Text('Logout',
                style: TextStyle(color: AppTheme.wicketRed)),
          ),
        ],
      ),
    );
  }
}

// =============================================================================
// SUPPORTING WIDGETS
// =============================================================================

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(text,
        style: GoogleFonts.poppins(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: AppTheme.tp(context)));
  }
}

class _SummaryRow extends StatelessWidget {
  final int upcoming;
  final int live;
  final int completed;
  const _SummaryRow({
    required this.upcoming,
    required this.live,
    required this.completed,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _StatPill(
            label: 'Upcoming',
            value: upcoming.toString(),
            color: AppTheme.upcomingBlue,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _StatPill(
            label: 'Live',
            value: live.toString(),
            color: AppTheme.liveRed,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _StatPill(
            label: 'Completed',
            value: completed.toString(),
            color: AppTheme.primaryGreen,
          ),
        ),
      ],
    );
  }
}

class _StatPill extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _StatPill({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Column(
        children: [
          Text(value,
              style: GoogleFonts.poppins(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: color)),
          const SizedBox(height: 2),
          Text(label,
              style: GoogleFonts.poppins(
                  fontSize: 10,
                  color: AppTheme.ts(context),
                  letterSpacing: 0.4)),
        ],
      ),
    );
  }
}

/// Pill toggle between "All matches" and "My assignments".
class _SegmentButton extends StatelessWidget {
  final String label;
  final int count;
  final bool selected;
  final VoidCallback onTap;

  const _SegmentButton({
    required this.label,
    required this.count,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected
          ? AppTheme.primaryGreen
          : AppTheme.surface(context),
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onTap,
        child: Container(
          padding:
              const EdgeInsets.symmetric(vertical: 9, horizontal: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: selected
                  ? AppTheme.primaryGreen
                  : AppTheme.primaryGreen.withValues(alpha: 0.25),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(label,
                  style: GoogleFonts.poppins(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: selected
                          ? Colors.white
                          : AppTheme.tp(context))),
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 7, vertical: 1),
                decoration: BoxDecoration(
                  color: selected
                      ? Colors.white.withValues(alpha: 0.25)
                      : AppTheme.primaryGreen.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text('$count',
                    style: GoogleFonts.poppins(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: selected
                            ? Colors.white
                            : AppTheme.primaryGreen)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AssignmentCard extends StatelessWidget {
  final CricketMatch match;
  final String badge;
  final bool assignedToMe;
  const _AssignmentCard({
    required this.match,
    required this.badge,
    this.assignedToMe = false,
  });

  Color get _badgeColor {
    switch (badge) {
      case 'LIVE':
        return AppTheme.liveRed;
      case 'UPCOMING':
        return AppTheme.upcomingBlue;
      default:
        return AppTheme.primaryGreen;
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateStr =
        DateFormat('dd MMM yyyy · hh:mm a').format(match.matchDate);

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: AppTheme.surface(context),
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          // The scorecard is the read-only verification surface for the umpire.
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(
                builder: (_) => MatchDetailScreen(matchId: match.id)),
          ),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                  color: _badgeColor.withValues(alpha: 0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: _badgeColor,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        badge,
                        style: GoogleFonts.poppins(
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          letterSpacing: 0.8,
                        ),
                      ),
                    ),
                    if (assignedToMe) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppTheme.accentGold,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.verified,
                                size: 10, color: Colors.black87),
                            const SizedBox(width: 3),
                            Text(
                              'YOUR MATCH',
                              style: GoogleFonts.poppins(
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                color: Colors.black87,
                                letterSpacing: 0.6,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const Spacer(),
                    Icon(Icons.gavel,
                        size: 14, color: AppTheme.ts(context)),
                    const SizedBox(width: 4),
                    Text(
                      match.umpire?.isNotEmpty == true
                          ? match.umpire!
                          : 'Umpire TBD',
                      style: GoogleFonts.poppins(
                          fontSize: 10,
                          color: AppTheme.ts(context),
                          fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text('${match.team1Name} vs ${match.team2Name}',
                    style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.tp(context)),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.schedule,
                        size: 12, color: AppTheme.ts(context)),
                    const SizedBox(width: 4),
                    Text(dateStr,
                        style: GoogleFonts.poppins(
                            fontSize: 11, color: AppTheme.ts(context))),
                    if (match.venue != null) ...[
                      const SizedBox(width: 10),
                      Icon(Icons.location_on,
                          size: 12, color: AppTheme.ts(context)),
                      const SizedBox(width: 3),
                      Flexible(
                        child: Text(match.venue!,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.poppins(
                                fontSize: 11,
                                color: AppTheme.ts(context))),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
