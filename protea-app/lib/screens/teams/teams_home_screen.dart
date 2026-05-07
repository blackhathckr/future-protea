import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lottie/lottie.dart';
import 'package:provider/provider.dart';
import '../../models/team.dart';
import '../../services/api_service.dart';
import '../../services/auth_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/theme_toggle.dart';
import 'register_team_screen.dart';
import 'team_registered_screen.dart';

class TeamsHomeScreen extends StatefulWidget {
  const TeamsHomeScreen({super.key});

  @override
  State<TeamsHomeScreen> createState() => _TeamsHomeScreenState();
}

class _TeamsHomeScreenState extends State<TeamsHomeScreen> {
  List<Team> _teams = [];
  bool _loading = true;
  final _searchCtrl = TextEditingController();
  final _searchFocus = FocusNode();

  List<Team> get _filteredTeams {
    if (_searchCtrl.text.trim().isEmpty) return _teams;
    final q = _searchCtrl.text.trim().toLowerCase();
    return _teams.where((t) =>
      t.teamName.toLowerCase().contains(q) ||
      t.organizationName.toLowerCase().contains(q)
    ).toList();
  }

  bool get _canEdit {
    final role = context.read<AuthProvider>().role;
    return role == 'feeder' || role == 'player';
  }

  @override
  void initState() {
    super.initState();
    _searchFocus.addListener(() => setState(() {}));
    _loadTeams();
  }

  Future<void> _loadTeams() async {
    setState(() => _loading = true);
    try {
      _teams = await ApiService.getTeams();
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final canEdit = _canEdit;
    final filtered = _filteredTeams;

    return Scaffold(
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            // ── Header ──────────────────────────────────────────────────
            Stack(
              children: [
                const ProteaHeader(height: 160),
                Positioned(
                  top: MediaQuery.of(context).padding.top + 8,
                  right: 8,
                  child: const ThemeToggleButton(),
                ),
              ],
            ),

            // ── Title row ────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(
                children: [
                  Container(
                    width: 4, height: 22,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [AppTheme.accentGold, AppTheme.primaryGreen],
                      ),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text('Teams',
                      style: GoogleFonts.poppins(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.tp(context),
                        letterSpacing: -0.3,
                      )),
                  const SizedBox(width: 8),
                  if (!_loading) _CountBadge(count: _teams.length),
                ],
              ),
            ),

            // ── Search bar ───────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
              child: TextField(
                controller: _searchCtrl,
                focusNode: _searchFocus,
                style: GoogleFonts.poppins(fontSize: 13.5, color: AppTheme.tp(context)),
                decoration: InputDecoration(
                  hintText: 'Search by team or organisation…',
                  hintStyle: GoogleFonts.poppins(fontSize: 13, color: AppTheme.ts(context)),
                  prefixIcon: Icon(Icons.search,
                      size: 20,
                      color: _searchFocus.hasFocus
                          ? AppTheme.primaryGreen
                          : AppTheme.ts(context)),
                  suffixIcon: _searchCtrl.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.close, size: 18),
                          color: AppTheme.ts(context),
                          onPressed: () {
                            _searchCtrl.clear();
                            setState(() {});
                          },
                        )
                      : null,
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: AppTheme.divider(context), width: 0.5),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: AppTheme.primaryGreen, width: 1.5),
                  ),
                  filled: true,
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
                onChanged: (_) => setState(() {}),
              ),
            ),

            // ── List ─────────────────────────────────────────────────────
            Expanded(
              child: _loading
                  ? _LoadingState(label: 'Loading teams…')
                  : filtered.isEmpty
                      ? _EmptyState(
                          message: _searchCtrl.text.isNotEmpty
                              ? 'No teams match "${_searchCtrl.text}"'
                              : 'No teams registered yet',
                        )
                      : RefreshIndicator(
                          color: AppTheme.accentGold,
                          backgroundColor: AppTheme.surface(context),
                          onRefresh: _loadTeams,
                          child: ListView.builder(
                            padding: const EdgeInsets.fromLTRB(14, 6, 14, 100),
                            itemCount: filtered.length,
                            itemBuilder: (context, index) => _TeamCard(
                              team: filtered[index],
                            )
                                .animate()
                                .fadeIn(duration: 300.ms, delay: (index * 40).ms)
                                .slideY(begin: 0.06, curve: Curves.easeOutCubic),
                          ),
                        ),
            ),
          ],
        ),
      ),
      floatingActionButton: canEdit
          ? Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(28),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.accentGold.withValues(alpha: 0.45),
                    blurRadius: 14,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: FloatingActionButton.extended(
                onPressed: () async {
                  final result = await Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const RegisterTeamScreen()),
                  );
                  if (result == true) _loadTeams();
                },
                backgroundColor: AppTheme.accentGold,
                foregroundColor: AppTheme.textPrimary,
                elevation: 0,
                icon: const Icon(Icons.group_add, size: 20),
                label: Text('Register Team',
                    style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 13.5)),
              ),
            )
          : null,
    );
  }
}

class _TeamCard extends StatelessWidget {
  final Team team;
  const _TeamCard({required this.team});

  @override
  Widget build(BuildContext context) {
    final isSchool = team.teamType == 'school';
    final accent = isSchool ? AppTheme.primaryGreen : AppTheme.accentAmber;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => TeamRegisteredScreen(teamId: team.id),
              ),
            );
          },
          child: Ink(
            decoration: BoxDecoration(
              color: AppTheme.surface(context),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: AppTheme.divider(context).withValues(alpha: 0.7),
                width: 0.8,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(
                      alpha: AppTheme.isDark(context) ? 0.25 : 0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 14, 12, 14),
              child: Row(
                children: [
                  _TeamLogo(team: team, accent: accent),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          team.teamName,
                          style: GoogleFonts.poppins(
                            fontWeight: FontWeight.w700,
                            fontSize: 15.5,
                            color: AppTheme.tp(context),
                            letterSpacing: -0.2,
                          ),
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                        ),
                        const SizedBox(height: 3),
                        Row(
                          children: [
                            Icon(Icons.business_outlined,
                                size: 12, color: AppTheme.ts(context)),
                            const SizedBox(width: 4),
                            Flexible(
                              child: Text(
                                team.organizationName,
                                style: GoogleFonts.poppins(
                                  color: AppTheme.ts(context),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  _TypeBadge(isSchool: isSchool, accent: accent),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _TeamLogo extends StatelessWidget {
  final Team team;
  final Color accent;
  const _TeamLogo({required this.team, required this.accent});

  @override
  Widget build(BuildContext context) {
    final hasLogo = team.logoUrl != null && team.logoUrl!.isNotEmpty;
    return Container(
      padding: const EdgeInsets.all(2.2),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [accent, accent.withValues(alpha: 0.55)],
        ),
        boxShadow: [
          BoxShadow(
            color: accent.withValues(alpha: 0.30),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: CircleAvatar(
        radius: 27,
        backgroundColor: AppTheme.surface(context),
        child: CircleAvatar(
          radius: 25,
          backgroundColor: accent.withValues(alpha: 0.85),
          backgroundImage: hasLogo ? NetworkImage(ApiService.getPhotoUrl(team.logoUrl!)) : null,
          child: !hasLogo
              ? Text(
                  team.teamName.isNotEmpty ? team.teamName[0].toUpperCase() : '?',
                  style: GoogleFonts.poppins(
                      color: Colors.white, fontWeight: FontWeight.w800, fontSize: 18),
                )
              : null,
        ),
      ),
    );
  }
}

class _TypeBadge extends StatelessWidget {
  final bool isSchool;
  final Color accent;
  const _TypeBadge({required this.isSchool, required this.accent});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            accent.withValues(alpha: 0.18),
            accent.withValues(alpha: 0.08),
          ],
        ),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: accent.withValues(alpha: 0.45), width: 0.8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isSchool ? Icons.school_outlined : Icons.sports_cricket,
            size: 13,
            color: accent,
          ),
          const SizedBox(width: 4),
          Text(
            isSchool ? 'SCHOOL' : 'CLUB',
            style: GoogleFonts.poppins(
              fontSize: 10.5,
              fontWeight: FontWeight.w800,
              color: accent,
              letterSpacing: 0.6,
            ),
          ),
        ],
      ),
    );
  }
}

class _CountBadge extends StatelessWidget {
  final int count;
  const _CountBadge({required this.count});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.primaryGreen.withValues(alpha: 0.18),
            AppTheme.lightGreen.withValues(alpha: 0.10),
          ],
        ),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.primaryGreen.withValues(alpha: 0.35), width: 0.8),
      ),
      child: Text(
        '$count',
        style: GoogleFonts.poppins(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: AppTheme.primaryGreen,
        ),
      ),
    );
  }
}

class _LoadingState extends StatelessWidget {
  final String label;
  const _LoadingState({required this.label});
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Lottie.asset('assets/images/lottie/Bat ball.json',
              width: 120, height: 120, repeat: true),
          const SizedBox(height: 8),
          Text(label,
              style: GoogleFonts.poppins(fontSize: 13, color: AppTheme.ts(context))),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final String message;
  const _EmptyState({required this.message});
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Lottie.asset('assets/images/lottie/Bat ball.json',
              width: 150, height: 150, repeat: true),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              message,
              style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.ts(context)),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }
}
