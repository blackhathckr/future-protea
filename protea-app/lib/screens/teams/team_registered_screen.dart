import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../models/team.dart';
import '../../models/player.dart';
import '../../services/api_service.dart';
import '../../providers/auth_provider.dart';
import '../../shared/utils/snackbar_utils.dart';
import '../../theme/app_theme.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/theme_toggle.dart';
import '../players/player_detail_screen.dart';
import 'search_add_player_screen.dart'; // used by FAB
import 'team_stats_screen.dart';

class TeamRegisteredScreen extends StatefulWidget {
  final String teamId;

  const TeamRegisteredScreen({super.key, required this.teamId});

  @override
  State<TeamRegisteredScreen> createState() => _TeamRegisteredScreenState();
}

class _TeamRegisteredScreenState extends State<TeamRegisteredScreen> {
  Team? _team;
  bool _loading = true;
  final _picker = ImagePicker();
  bool _isEditing = false;
  final _teamNameCtrl = TextEditingController();
  final _orgNameCtrl = TextEditingController();
  String _teamType = 'school';

  bool get _canEdit {
    final role = context.read<AuthProvider>().role;
    return role == 'admin';
  }

  @override
  void initState() {
    super.initState();
    _loadTeam();
  }

  Future<void> _loadTeam() async {
    setState(() => _loading = true);
    try {
      _team = await ApiService.getTeam(widget.teamId);
      if (_team != null) {
        _teamNameCtrl.text = _team!.teamName;
        _orgNameCtrl.text = _team!.organizationName;
        _teamType = _team!.teamType;
      }
    } catch (_) {}
    setState(() => _loading = false);
  }

  Future<void> _uploadLogo() async {
    final pickedFile = await _picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      try {
        setState(() => _loading = true);
        await ApiService.uploadTeamLogo(widget.teamId, pickedFile.path);
        await _loadTeam();
        if (mounted) SnackbarUtils.showSuccess(context, 'Logo uploaded successfully');
      } catch (e) {
        if (mounted) SnackbarUtils.showError(context, e);
      } finally {
        if (mounted) setState(() => _loading = false);
      }
    }
  }

  Future<void> _deleteLogo() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Logo'),
        content: const Text('Are you sure you want to delete this team logo?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: AppTheme.wicketRed)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      setState(() => _loading = true);
      await ApiService.deleteTeamLogo(widget.teamId);
      await _loadTeam();
      if (mounted) {
        SnackbarUtils.showSuccess(context, 'Logo deleted successfully');
      }
    } catch (e) {
      if (mounted) {
        SnackbarUtils.showError(context, e);
      }
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _saveEdit() async {
    try {
      setState(() => _loading = true);
      await ApiService.updateTeam(
        widget.teamId,
        teamName: _teamNameCtrl.text.trim(),
        teamType: _teamType,
        schoolName: _teamType == 'school' ? _orgNameCtrl.text.trim() : null,
        clubName: _teamType == 'club' ? _orgNameCtrl.text.trim() : null,
      );
      await _loadTeam();
      setState(() => _isEditing = false);
      if (mounted) {
        SnackbarUtils.showSuccess(context, 'Team updated successfully');
      }
    } catch (e) {
      if (mounted) {
        SnackbarUtils.showError(context, e);
      }
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final canEdit = _canEdit;

    return Scaffold(
      floatingActionButton: canEdit && !_isEditing
          ? Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                FloatingActionButton(
                  heroTag: 'add_player',
                  onPressed: () async {
                    final result = await Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (_) => SearchAddPlayerScreen(teamId: widget.teamId)),
                    );
                    if (result == true) _loadTeam();
                  },
                  backgroundColor: AppTheme.accentGold,
                  foregroundColor: AppTheme.darkGreen,
                  child: const Icon(Icons.person_add),
                ),
                const SizedBox(height: 10),
                FloatingActionButton.extended(
                  heroTag: 'edit_team',
                  onPressed: () => setState(() => _isEditing = true),
                  backgroundColor: AppTheme.primaryGreen,
                  foregroundColor: Colors.white,
                  icon: const Icon(Icons.edit),
                  label: Text('Edit Team',
                      style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                ),
              ],
            )
          : null,
      body: SafeArea(
        top: false,
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
            : _team == null
                ? const Center(child: Text('Team not found'))
                : SingleChildScrollView(
                    child: Column(
                      children: [
                        // ── Header ──────────────────────────────────────────
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
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (canEdit)
                                    IconButton(
                                      icon: const Icon(Icons.delete, color: Colors.white),
                                      onPressed: _deleteTeam,
                                      tooltip: 'Delete Team',
                                    ),
                                  const ThemeToggleButton(),
                                ],
                              ),
                            ),
                          ],
                        ),

                        // ── Hero info card ───────────────────────────────────
                        Transform.translate(
                          offset: const Offset(0, -20),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Card(
                              elevation: 4,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Row(
                                  children: [
                                    // Logo
                                    GestureDetector(
                                      onTap: canEdit ? _uploadLogo : null,
                                      child: Stack(
                                        children: [
                                          Container(
                                            width: 80,
                                            height: 80,
                                            decoration: BoxDecoration(
                                              color: AppTheme.primaryGreen.withValues(alpha: 0.08),
                                              borderRadius: BorderRadius.circular(12),
                                              border: Border.all(
                                                  color: AppTheme.primaryGreen.withValues(alpha: 0.2)),
                                            ),
                                            child: _team!.logoUrl != null && _team!.logoUrl!.isNotEmpty
                                                ? ClipRRect(
                                                    borderRadius: BorderRadius.circular(11),
                                                    child: Image.network(
                                                      ApiService.getPhotoUrl(_team!.logoUrl!),
                                                      fit: BoxFit.cover,
                                                      errorBuilder: (_, __, ___) => const Icon(
                                                          Icons.shield, size: 40, color: AppTheme.primaryGreen),
                                                    ),
                                                  )
                                                : const Icon(Icons.shield_outlined, size: 40, color: AppTheme.primaryGreen),
                                          ),
                                          if (canEdit)
                                            Positioned(
                                              bottom: 0,
                                              right: 0,
                                              child: Container(
                                                padding: const EdgeInsets.all(4),
                                                decoration: BoxDecoration(
                                                  color: AppTheme.accentGold,
                                                  shape: BoxShape.circle,
                                                  border: Border.all(color: Colors.white, width: 1.5),
                                                ),
                                                child: const Icon(Icons.camera_alt,
                                                    color: AppTheme.darkGreen, size: 12),
                                              ),
                                            ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 16),
                                    // Name + badges
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          if (!_isEditing) ...
                                            [
                                              Text(_team!.organizationName,
                                                  style: GoogleFonts.poppins(
                                                      fontSize: 18, fontWeight: FontWeight.w700)),
                                              Text(_team!.teamName,
                                                  style: GoogleFonts.poppins(
                                                      fontSize: 13, color: AppTheme.ts(context))),
                                            ],
                                          const SizedBox(height: 8),
                                          Wrap(
                                            spacing: 6,
                                            children: [
                                              Container(
                                                padding: const EdgeInsets.symmetric(
                                                    horizontal: 10, vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: AppTheme.primaryGreen,
                                                  borderRadius: BorderRadius.circular(6),
                                                ),
                                                child: Text(
                                                  _team!.teamCode != null && _team!.teamCode!.isNotEmpty
                                                      ? 'ID: ${_team!.teamCode}'
                                                      : 'ID: ${_team!.id}',
                                                  style: const TextStyle(
                                                      color: Colors.white,
                                                      fontWeight: FontWeight.bold,
                                                      fontSize: 11),
                                                ),
                                              ),
                                              Container(
                                                padding: const EdgeInsets.symmetric(
                                                    horizontal: 10, vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: _team!.teamType == 'school'
                                                      ? AppTheme.primaryGreen.withValues(alpha: 0.12)
                                                      : AppTheme.accentGold.withValues(alpha: 0.2),
                                                  borderRadius: BorderRadius.circular(6),
                                                ),
                                                child: Row(
                                                  mainAxisSize: MainAxisSize.min,
                                                  children: [
                                                    Icon(
                                                      _team!.teamType == 'school'
                                                          ? Icons.school
                                                          : Icons.sports_cricket,
                                                      size: 12,
                                                      color: _team!.teamType == 'school'
                                                          ? AppTheme.primaryGreen
                                                          : AppTheme.accentAmber,
                                                    ),
                                                    const SizedBox(width: 4),
                                                    Text(
                                                      _team!.teamType.toUpperCase(),
                                                      style: TextStyle(
                                                        fontSize: 11,
                                                        fontWeight: FontWeight.bold,
                                                        color: _team!.teamType == 'school'
                                                            ? AppTheme.primaryGreen
                                                            : AppTheme.accentAmber,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ],
                                          ),
                                          if (canEdit && _team!.logoUrl != null &&
                                              _team!.logoUrl!.isNotEmpty) ...
                                            [
                                              const SizedBox(height: 6),
                                              TextButton.icon(
                                                onPressed: _deleteLogo,
                                                style: TextButton.styleFrom(
                                                  padding: const EdgeInsets.symmetric(
                                                      horizontal: 8, vertical: 2),
                                                  minimumSize: Size.zero,
                                                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                                ),
                                                icon: const Icon(Icons.delete_outline,
                                                    size: 14, color: AppTheme.wicketRed),
                                                label: Text('Remove logo',
                                                    style: GoogleFonts.poppins(
                                                        fontSize: 11,
                                                        color: AppTheme.wicketRed)),
                                              ),
                                            ],
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),

                        // ── Editing form ─────────────────────────────────────
                        if (_isEditing)
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                            child: Card(
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Edit Team',
                                        style: GoogleFonts.poppins(
                                            fontSize: 15, fontWeight: FontWeight.w700)),
                                    const SizedBox(height: 12),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: GestureDetector(
                                            onTap: () => setState(() => _teamType = 'school'),
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(vertical: 8),
                                              decoration: BoxDecoration(
                                                color: _teamType == 'school'
                                                    ? AppTheme.primaryGreen
                                                    : AppTheme.surface(context),
                                                borderRadius: const BorderRadius.horizontal(
                                                    left: Radius.circular(8)),
                                                border: Border.all(color: AppTheme.primaryGreen),
                                              ),
                                              alignment: Alignment.center,
                                              child: Text('School',
                                                  style: GoogleFonts.poppins(
                                                      fontWeight: FontWeight.w600,
                                                      fontSize: 12,
                                                      color: _teamType == 'school'
                                                          ? Colors.white
                                                          : AppTheme.primaryGreen)),
                                            ),
                                          ),
                                        ),
                                        Expanded(
                                          child: GestureDetector(
                                            onTap: () => setState(() => _teamType = 'club'),
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(vertical: 8),
                                              decoration: BoxDecoration(
                                                color: _teamType == 'club'
                                                    ? AppTheme.primaryGreen
                                                    : AppTheme.surface(context),
                                                borderRadius: const BorderRadius.horizontal(
                                                    right: Radius.circular(8)),
                                                border: Border.all(color: AppTheme.primaryGreen),
                                              ),
                                              alignment: Alignment.center,
                                              child: Text('Club',
                                                  style: GoogleFonts.poppins(
                                                      fontWeight: FontWeight.w600,
                                                      fontSize: 12,
                                                      color: _teamType == 'club'
                                                          ? Colors.white
                                                          : AppTheme.primaryGreen)),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    TextFormField(
                                      controller: _orgNameCtrl,
                                      decoration: InputDecoration(
                                          labelText: _teamType == 'school' ? 'School Name' : 'Club Name',
                                          prefixIcon: Icon(_teamType == 'school'
                                              ? Icons.school
                                              : Icons.sports_cricket)),
                                    ),
                                    const SizedBox(height: 10),
                                    TextFormField(
                                      controller: _teamNameCtrl,
                                      decoration: const InputDecoration(
                                          labelText: 'Team Name',
                                          prefixIcon: Icon(Icons.shield_outlined)),
                                    ),
                                    const SizedBox(height: 16),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: OutlinedButton(
                                            onPressed: () => setState(() {
                                              _isEditing = false;
                                              _teamNameCtrl.text = _team!.teamName;
                                              _orgNameCtrl.text = _team!.organizationName;
                                              _teamType = _team!.teamType;
                                            }),
                                            style: OutlinedButton.styleFrom(
                                              side: const BorderSide(color: AppTheme.wicketRed),
                                              padding: const EdgeInsets.symmetric(vertical: 12),
                                            ),
                                            child: Text('Cancel',
                                                style: GoogleFonts.poppins(
                                                    fontWeight: FontWeight.w600,
                                                    color: AppTheme.wicketRed)),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: ElevatedButton(
                                            onPressed: _saveEdit,
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: AppTheme.primaryGreen,
                                              foregroundColor: Colors.white,
                                              padding: const EdgeInsets.symmetric(vertical: 12),
                                            ),
                                            child: Text('Save',
                                                style: GoogleFonts.poppins(
                                                    fontWeight: FontWeight.w600)),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        const SizedBox(height: 4),

                        // Team stats link
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
                          child: Card(
                            margin: EdgeInsets.zero,
                            child: ListTile(
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => TeamStatsScreen(
                                    teamId: widget.teamId,
                                    teamName: _team!.teamName,
                                  ),
                                ),
                              ),
                              leading: Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: AppTheme.accentAmber.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(Icons.bar_chart_rounded,
                                    color: AppTheme.accentAmber, size: 22),
                              ),
                              title: Text('Team Stats',
                                  style: GoogleFonts.poppins(
                                      fontWeight: FontWeight.w600, fontSize: 15)),
                              subtitle: Text(
                                'Matches, W/L, highest total, top performers',
                                style: TextStyle(
                                    fontSize: 12, color: AppTheme.ts(context)),
                              ),
                              trailing: const Icon(Icons.chevron_right),
                            ),
                          ),
                        ),

                        // Players section
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Row(
                            children: [
                              Container(width: 4, height: 16, decoration: BoxDecoration(color: AppTheme.primaryGreen, borderRadius: BorderRadius.circular(2))),
                              const SizedBox(width: 8),
                              Text('Players',
                                  style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 16)),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text('${_team!.players?.length ?? 0}',
                                    style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 12, color: AppTheme.primaryGreen)),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 8),

                        if (_team!.players != null && _team!.players!.isNotEmpty)
                          ..._team!.players!.map((p) => Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 3),
                                child: Card(
                                  margin: EdgeInsets.zero,
                                  child: InkWell(
                                    borderRadius: BorderRadius.circular(12),
                                    onTap: () {
                                      // Navigate to player detail by creating a Player from TeamPlayer
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => PlayerDetailScreen(
                                            player: Player(
                                              id: p.playerId,
                                              name: p.playerName,
                                              dateOfBirth: p.dateOfBirth,
                                              photoUrl: p.photoUrl,
                                              playerId: null,
                                            ),
                                          ),
                                        ),
                                      );
                                    },
                                    onLongPress: canEdit ? () {
                                      _showPlayerRoleMenu(p);
                                    } : null,
                                    child: Padding(
                                      padding: const EdgeInsets.all(12),
                                      child: Row(
                                        children: [
                                          CircleAvatar(
                                            radius: 22,
                                            backgroundColor: AppTheme.primaryGreen,
                                            backgroundImage: p.photoUrl != null && p.photoUrl!.isNotEmpty
                                                ? NetworkImage(ApiService.getPhotoUrl(p.photoUrl!))
                                                : null,
                                            child: p.photoUrl == null || p.photoUrl!.isEmpty
                                                ? Text(
                                                    p.playerName.isNotEmpty ? p.playerName[0].toUpperCase() : '?',
                                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                                                  )
                                                : null,
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Row(
                                                  children: [
                                                    Flexible(
                                                      child: Text(p.playerName,
                                                          style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14)),
                                                    ),
                                                    if (p.isCaptain) ...[
                                                      const SizedBox(width: 6),
                                                      Container(
                                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                        decoration: BoxDecoration(
                                                          color: AppTheme.primaryGreen,
                                                          borderRadius: BorderRadius.circular(4),
                                                        ),
                                                        child: Text('C',
                                                            style: GoogleFonts.poppins(
                                                                fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white)),
                                                      ),
                                                    ],
                                                    if (p.isWicketKeeper) ...[
                                                      const SizedBox(width: 6),
                                                      Container(
                                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                        decoration: BoxDecoration(
                                                          color: Colors.orange,
                                                          borderRadius: BorderRadius.circular(4),
                                                        ),
                                                        child: Text('WK',
                                                            style: GoogleFonts.poppins(
                                                                fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white)),
                                                      ),
                                                    ],
                                                  ],
                                                ),
                                                if (p.dateOfBirth != null)
                                                  Text(
                                                    _formatDate(p.dateOfBirth!),
                                                    style: TextStyle(fontSize: 12, color: AppTheme.ts(context)),
                                                  ),
                                              ],
                                            ),
                                          ),
                                          if (canEdit)
                                            IconButton(
                                              icon: const Icon(Icons.remove_circle_outline, size: 20),
                                              color: AppTheme.wicketRed,
                                              onPressed: () => _removePlayer(p),
                                              tooltip: 'Remove from team',
                                            )
                                          else
                                            Icon(Icons.chevron_right, color: AppTheme.ts(context), size: 20),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ))
                        else
                          Padding(
                            padding: const EdgeInsets.all(24),
                            child: Text('No players in this team yet',
                                style: GoogleFonts.poppins(color: AppTheme.ts(context))),
                          ),

                        const SizedBox(height: 80),
                      ],
                    ),
                  ),
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return '${months[date.month - 1]} ${date.day}, ${date.year}';
    } catch (_) {
      return dateStr;
    }
  }

  void _showPlayerRoleMenu(TeamPlayer player) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              player.playerName,
              style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: Icon(
                player.isCaptain ? Icons.check_circle : Icons.circle_outlined,
                color: player.isCaptain ? AppTheme.primaryGreen : null,
              ),
              title: Text('Captain', style: GoogleFonts.poppins()),
              onTap: () async {
                Navigator.pop(ctx);
                await _updatePlayerRole(player, isCaptain: !player.isCaptain);
              },
            ),
            ListTile(
              leading: Icon(
                player.isWicketKeeper ? Icons.check_circle : Icons.circle_outlined,
                color: player.isWicketKeeper ? Colors.orange : null,
              ),
              title: Text('Wicket Keeper', style: GoogleFonts.poppins()),
              onTap: () async {
                Navigator.pop(ctx);
                await _updatePlayerRole(player, isWicketKeeper: !player.isWicketKeeper);
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _updatePlayerRole(TeamPlayer player, {bool? isCaptain, bool? isWicketKeeper}) async {
    setState(() => _loading = true);
    try {
      await ApiService.updatePlayerRole(
        _team!.id,
        player.playerId,
        isCaptain: isCaptain,
        isWicketKeeper: isWicketKeeper,
      );
      await _loadTeam();
      if (mounted) {
        SnackbarUtils.showSuccess(context, 'Player role updated successfully');
      }
    } catch (e) {
      if (mounted) {
        SnackbarUtils.showError(context, e);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _deleteTeam() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Delete Team', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
        content: Text(
          'Are you sure you want to delete "${_team!.teamName}"? This action cannot be undone and will remove all associated data.',
          style: GoogleFonts.poppins(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel', style: GoogleFonts.poppins()),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppTheme.wicketRed),
            child: Text('Delete', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _loading = true);
    try {
      await ApiService.deleteTeam(_team!.id);
      if (mounted) {
        SnackbarUtils.showSuccess(context, 'Team deleted successfully');
        Navigator.pop(context, true); // Return to previous screen
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        SnackbarUtils.showError(context, 'Failed to delete team: $e');
      }
    }
  }

  Future<void> _removePlayer(TeamPlayer player) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Remove Player', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
        content: Text(
          'Remove ${player.playerName} from ${_team!.teamName}?',
          style: GoogleFonts.poppins(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel', style: GoogleFonts.poppins()),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppTheme.wicketRed),
            child: Text('Remove', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _loading = true);
    try {
      await ApiService.removePlayerFromTeam(_team!.id, player.playerId);
      await _loadTeam();
      if (mounted) {
        SnackbarUtils.showSuccess(context, 'Player removed from team');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        SnackbarUtils.showError(context, 'Failed to remove player: $e');
      }
    }
  }

  @override
  void dispose() {
    _teamNameCtrl.dispose();
    _orgNameCtrl.dispose();
    super.dispose();
  }
}
