import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/player.dart';
import '../../services/api_service.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import '../../shared/widgets/loading_state.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/count_badge.dart';
import '../../shared/utils/snackbar_utils.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/theme_toggle.dart';
import 'register_player_screen.dart';
import 'player_detail_screen.dart';
import 'edit_player_screen.dart';

class PlayersHomeScreen extends StatefulWidget {
  const PlayersHomeScreen({super.key});

  @override
  State<PlayersHomeScreen> createState() => _PlayersHomeScreenState();
}

class _PlayersHomeScreenState extends State<PlayersHomeScreen> {
  List<Player> _allPlayers = [];
  bool _loading = true;
  final _searchCtrl = TextEditingController();
  final _searchFocus = FocusNode();

  List<Player> get _filteredPlayers {
    if (_searchCtrl.text.trim().isEmpty) return _allPlayers;
    final query = _searchCtrl.text.trim().toLowerCase();
    return _allPlayers.where((p) =>
      p.name.toLowerCase().contains(query) ||
      (p.playerId?.toLowerCase().contains(query) ?? false) ||
      (p.schoolName?.toLowerCase().contains(query) ?? false) ||
      (p.clubName?.toLowerCase().contains(query) ?? false)
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
    _loadPlayers();
  }

  Future<void> _loadPlayers() async {
    setState(() => _loading = true);
    try {
      _allPlayers = await ApiService.getRegisteredPlayers();
    } catch (_) {}
    setState(() => _loading = false);
  }

  void _onSearchChanged() => setState(() {});

  Future<void> _backfillAccounts() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Create Player Logins'),
        content: const Text(
          'This will create login accounts (password: player123) for all registered players who have an email but no login yet.\n\nExisting accounts will not be changed.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Proceed')),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    try {
      final msg = await ApiService.backfillPlayerAccounts();
      if (mounted) SnackbarUtils.showSuccess(context, msg);
    } catch (e) {
      if (mounted) SnackbarUtils.showError(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final canEdit = _canEdit;
    final filtered = _filteredPlayers;

    return Scaffold(
      resizeToAvoidBottomInset: false,
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
                  Text('Players',
                      style: GoogleFonts.poppins(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.tp(context),
                        letterSpacing: -0.3,
                      )),
                  const SizedBox(width: 8),
                  if (!_loading) CountBadge(count: _allPlayers.length),
                  const Spacer(),
                  if (context.read<AuthProvider>().role == 'feeder')
                    Tooltip(
                      message: 'Create login accounts for all registered players with emails',
                      child: IconButton(
                        icon: const Icon(Icons.manage_accounts_outlined, size: 20),
                        color: AppTheme.ts(context),
                        onPressed: _backfillAccounts,
                      ),
                    ),
                ],
              ),
            ),

            // ── Search bar ───────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                curve: Curves.easeOut,
                decoration: BoxDecoration(
                  color: AppTheme.surfaceLight(context),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: _searchFocus.hasFocus
                        ? AppTheme.primaryGreen.withValues(alpha: 0.55)
                        : AppTheme.divider(context),
                    width: _searchFocus.hasFocus ? 1.4 : 1,
                  ),
                  boxShadow: _searchFocus.hasFocus
                      ? [BoxShadow(
                          color: AppTheme.primaryGreen.withValues(alpha: 0.10),
                          blurRadius: 10, offset: const Offset(0, 3))]
                      : null,
                ),
                child: TextField(
                  controller: _searchCtrl,
                  focusNode: _searchFocus,
                  style: GoogleFonts.poppins(fontSize: 13.5, color: AppTheme.tp(context)),
                  decoration: InputDecoration(
                    hintText: 'Search by name, school, club or player ID…',
                    hintStyle: GoogleFonts.poppins(fontSize: 13, color: AppTheme.ts(context)),
                    prefixIcon: Icon(Icons.search,
                        size: 19,
                        color: _searchFocus.hasFocus
                            ? AppTheme.primaryGreen
                            : AppTheme.ts(context)),
                    suffixIcon: _searchCtrl.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.close, size: 18),
                            color: AppTheme.ts(context),
                            onPressed: () {
                              _searchCtrl.clear();
                              _onSearchChanged();
                            },
                          )
                        : null,
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    isDense: true,
                  ),
                  onChanged: (_) => _onSearchChanged(),
                ),
              ),
            ),

            // ── List ─────────────────────────────────────────────────────
            Expanded(
              child: _loading
                  ? const LoadingState(label: 'Loading players…', size: 90)
                  : filtered.isEmpty
                      ? EmptyState(
                          message: _searchCtrl.text.isNotEmpty
                              ? 'No players match "${_searchCtrl.text}"'
                              : 'No players registered yet',
                        )
                      : RefreshIndicator(
                          color: AppTheme.accentGold,
                          backgroundColor: AppTheme.surface(context),
                          onRefresh: _loadPlayers,
                          child: ListView.builder(
                            padding: const EdgeInsets.fromLTRB(14, 6, 14, 100),
                            itemCount: filtered.length,
                            itemBuilder: (context, index) => _PlayerCard(
                              player: filtered[index],
                              canEdit: canEdit,
                              onRefresh: _loadPlayers,
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
                heroTag: 'players_home_register',
                onPressed: () async {
                  final result = await Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const RegisterPlayerScreen()),
                  );
                  if (result == true) _loadPlayers();
                },
                backgroundColor: AppTheme.accentGold,
                foregroundColor: AppTheme.textPrimary,
                elevation: 0,
                icon: const Icon(Icons.person_add_alt_1, size: 20),
                label: Text('Register Player',
                    style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 13.5)),
              ),
            )
          : null,
    );
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _searchFocus.dispose();
    super.dispose();
  }
}

class _PlayerCard extends StatelessWidget {
  final Player player;
  final bool canEdit;
  final VoidCallback onRefresh;
  const _PlayerCard({required this.player, required this.canEdit, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            Navigator.push(context, MaterialPageRoute(
              builder: (_) => PlayerDetailScreen(player: player),
            ));
          },
          child: Ink(
            decoration: BoxDecoration(
              color: AppTheme.surface(context),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.divider(context).withValues(alpha: 0.7), width: 0.8),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: AppTheme.isDark(context) ? 0.25 : 0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Padding(
                    padding: const EdgeInsets.fromLTRB(14, 12, 12, 12),
                    child: Row(
                      children: [
                        _PlayerAvatar(player: player),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Flexible(
                                    child: Text(player.name,
                                        style: GoogleFonts.poppins(
                                          fontWeight: FontWeight.w700,
                                          fontSize: 15,
                                          color: AppTheme.tp(context),
                                          letterSpacing: -0.2,
                                        ),
                                        overflow: TextOverflow.ellipsis),
                                  ),
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.all(2),
                                    decoration: BoxDecoration(
                                      color: AppTheme.completedGreen.withValues(alpha: 0.15),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.verified,
                                        color: AppTheme.completedGreen, size: 14),
                                  ),
                                ],
                              ),
                              if (player.dateOfBirth != null) ...[
                                const SizedBox(height: 2),
                                Row(
                                  children: [
                                    Icon(Icons.cake_outlined,
                                        size: 12, color: AppTheme.ts(context)),
                                    const SizedBox(width: 4),
                                    Text(_formatDate(player.dateOfBirth!),
                                        style: GoogleFonts.poppins(
                                            fontSize: 11.5,
                                            color: AppTheme.ts(context),
                                            fontWeight: FontWeight.w500)),
                                  ],
                                ),
                              ],
                              const SizedBox(height: 6),
                              Wrap(
                                spacing: 6,
                                runSpacing: 4,
                                children: [
                                  if (player.schoolName != null)
                                    _MetaChip(
                                      icon: Icons.school_outlined,
                                      label: player.schoolName!,
                                      color: AppTheme.primaryGreen,
                                    ),
                                  if (player.clubName != null)
                                    _MetaChip(
                                      icon: Icons.sports_cricket_outlined,
                                      label: player.clubName!,
                                      color: AppTheme.accentAmber,
                                    ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        if (canEdit) ...[
                          const SizedBox(width: 6),
                          _EditButton(
                            onTap: () async {
                              final result = await Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => EditPlayerScreen(player: player)),
                              );
                              if (result == true) onRefresh();
                            },
                          ),
                        ],
                      ],
                    ),
            ),
          ),
        ),
      ),
    );
  }

  String _formatDate(String date) {
    try {
      return DateFormat('dd MMM yyyy').format(DateTime.parse(date));
    } catch (_) {
      return date;
    }
  }
}

class _MetaChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  const _MetaChip({required this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.25), width: 0.6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 11, color: color),
          const SizedBox(width: 4),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 110),
            child: Text(
              label,
              style: GoogleFonts.poppins(
                fontSize: 10.5,
                fontWeight: FontWeight.w600,
                color: color,
              ),
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
            ),
          ),
        ],
      ),
    );
  }
}

class _EditButton extends StatelessWidget {
  final VoidCallback onTap;
  const _EditButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onTap,
        child: Ink(
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [AppTheme.primaryGreen, AppTheme.darkGreen],
            ),
            borderRadius: BorderRadius.circular(10),
            boxShadow: [
              BoxShadow(
                color: AppTheme.primaryGreen.withValues(alpha: 0.35),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.edit_outlined, size: 13, color: Colors.white),
                const SizedBox(width: 4),
                Text('EDIT',
                    style: GoogleFonts.poppins(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      letterSpacing: 0.5,
                    )),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _PlayerAvatar extends StatelessWidget {
  final Player player;
  const _PlayerAvatar({required this.player});

  @override
  Widget build(BuildContext context) {
    final hasPhoto = player.photoUrl != null && player.photoUrl!.isNotEmpty;
    return Container(
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppTheme.accentGold, AppTheme.primaryGreen],
        ),
      ),
      child: CircleAvatar(
        radius: 26,
        backgroundColor: AppTheme.surface(context),
        child: CircleAvatar(
          radius: 24,
          backgroundColor: AppTheme.primaryGreen,
          backgroundImage: hasPhoto ? NetworkImage(ApiService.getPhotoUrl(player.photoUrl!)) : null,
          child: !hasPhoto
              ? Text(
                  player.name.isNotEmpty ? player.name[0].toUpperCase() : '?',
                  style: GoogleFonts.poppins(
                      color: Colors.white, fontWeight: FontWeight.w700, fontSize: 18),
                )
              : null,
        ),
      ),
    );
  }
}
