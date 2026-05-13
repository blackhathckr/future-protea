import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/team.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/protea_header.dart';
import '../../shared/utils/snackbar_utils.dart';
import '../teams/register_team_screen.dart';

class ManageTeamsScreen extends StatefulWidget {
  const ManageTeamsScreen({super.key});

  @override
  State<ManageTeamsScreen> createState() => _ManageTeamsScreenState();
}

class _ManageTeamsScreenState extends State<ManageTeamsScreen> {
  bool _loading = true;
  List<Team> _teams = [];

  @override
  void initState() {
    super.initState();
    _loadTeams();
  }

  Future<void> _loadTeams() async {
    setState(() => _loading = true);
    try {
      final teams = await ApiService.getTeams();
      if (mounted) {
        setState(() {
          _teams = teams;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        SnackbarUtils.showError(context, 'Failed to load teams: $e');
      }
    }
  }

  Future<void> _deleteTeam(Team team) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Delete Team', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
        content: Text(
          'Are you sure you want to delete "${team.teamName}"? This action cannot be undone and will remove all associated data.',
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

    try {
      await ApiService.deleteTeam(team.id);
      if (mounted) {
        SnackbarUtils.showSuccess(context, 'Team deleted successfully');
        _loadTeams();
      }
    } catch (e) {
      if (mounted) {
        SnackbarUtils.showError(context, 'Failed to delete team: $e');
      }
    }
  }

  Future<void> _editTeam(Team team) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => RegisterTeamScreen(teamToEdit: team),
      ),
    );
    if (result == true) {
      _loadTeams();
    }
  }

  Future<void> _viewTeamDetails(Team team) async {
    try {
      final teamDetails = await ApiService.getTeam(team.id);
      if (!mounted) return;

      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (context) => _TeamDetailsSheet(
          team: teamDetails,
          onRemovePlayer: (playerId) => _removePlayerFromTeam(team.id, playerId),
        ),
      );
    } catch (e) {
      if (mounted) {
        SnackbarUtils.showError(context, 'Failed to load team details: $e');
      }
    }
  }

  Future<void> _removePlayerFromTeam(String teamId, String playerId) async {
    try {
      await ApiService.removePlayerFromTeam(teamId, playerId);
      if (mounted) {
        SnackbarUtils.showSuccess(context, 'Player removed from team');
        Navigator.pop(context); // Close bottom sheet
        _loadTeams();
      }
    } catch (e) {
      if (mounted) {
        SnackbarUtils.showError(context, 'Failed to remove player: $e');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        top: false,
        child: Column(
          children: [
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
                  top: MediaQuery.of(context).padding.top + 14,
                  left: 0,
                  right: 0,
                  child: Center(
                    child: Text('Manage Teams',
                        style: GoogleFonts.poppins(
                            color: Colors.white, fontWeight: FontWeight.w700, fontSize: 18)),
                  ),
                ),
              ],
            ),

            if (_loading)
              const Expanded(child: Center(child: CircularProgressIndicator()))
            else if (_teams.isEmpty)
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.shield_outlined, size: 64, color: AppTheme.ts(context).withValues(alpha: 0.3)),
                      const SizedBox(height: 16),
                      Text('No teams found',
                          style: GoogleFonts.poppins(fontSize: 16, color: AppTheme.ts(context))),
                      const SizedBox(height: 8),
                      ElevatedButton.icon(
                        onPressed: () async {
                          final result = await Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const RegisterTeamScreen()),
                          );
                          if (result == true) _loadTeams();
                        },
                        icon: const Icon(Icons.add),
                        label: Text('Create Team', style: GoogleFonts.poppins()),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryGreen,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              Expanded(
                child: RefreshIndicator(
                  onRefresh: _loadTeams,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _teams.length,
                    itemBuilder: (context, index) {
                      final team = _teams[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () => _viewTeamDetails(team),
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Row(
                              children: [
                                // Team logo
                                if (team.logoUrl != null)
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: Image.network(
                                      team.logoUrl!,
                                      width: 48,
                                      height: 48,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => _defaultLogo(),
                                    ),
                                  )
                                else
                                  _defaultLogo(),
                                
                                const SizedBox(width: 12),
                                
                                // Team info
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        team.teamName,
                                        style: GoogleFonts.poppins(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w600,
                                          color: AppTheme.tp(context),
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: AppTheme.primaryGreen.withValues(alpha: 0.15),
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: Text(
                                              team.teamType.toUpperCase(),
                                              style: GoogleFonts.poppins(
                                                fontSize: 10,
                                                fontWeight: FontWeight.w600,
                                                color: AppTheme.primaryGreen,
                                              ),
                                            ),
                                          ),
                                          if (team.schoolName != null) ...[
                                            const SizedBox(width: 6),
                                            Flexible(
                                              child: Text(
                                                team.schoolName!,
                                                style: GoogleFonts.poppins(
                                                  fontSize: 11,
                                                  color: AppTheme.ts(context),
                                                ),
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                          ],
                                          if (team.clubName != null) ...[
                                            const SizedBox(width: 6),
                                            Flexible(
                                              child: Text(
                                                team.clubName!,
                                                style: GoogleFonts.poppins(
                                                  fontSize: 11,
                                                  color: AppTheme.ts(context),
                                                ),
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                
                                // Action buttons
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.edit, size: 20),
                                      color: AppTheme.upcomingBlue,
                                      onPressed: () => _editTeam(team),
                                      tooltip: 'Edit',
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.delete, size: 20),
                                      color: AppTheme.wicketRed,
                                      onPressed: () => _deleteTeam(team),
                                      tooltip: 'Delete',
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const RegisterTeamScreen()),
          );
          if (result == true) _loadTeams();
        },
        icon: const Icon(Icons.add),
        label: Text('New Team', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
        backgroundColor: AppTheme.primaryGreen,
        foregroundColor: Colors.white,
      ),
    );
  }

  Widget _defaultLogo() {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: AppTheme.primaryGreen.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(Icons.shield, size: 28, color: AppTheme.primaryGreen),
    );
  }
}

class _TeamDetailsSheet extends StatelessWidget {
  final Team team;
  final Function(String) onRemovePlayer;

  const _TeamDetailsSheet({required this.team, required this.onRemovePlayer});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) {
          return Column(
            children: [
              Container(
                margin: const EdgeInsets.only(top: 8),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppTheme.ts(context).withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    if (team.logoUrl != null)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          team.logoUrl!,
                          width: 48,
                          height: 48,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: AppTheme.primaryGreen.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(Icons.shield, size: 28, color: AppTheme.primaryGreen),
                          ),
                        ),
                      )
                    else
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppTheme.primaryGreen.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(Icons.shield, size: 28, color: AppTheme.primaryGreen),
                      ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            team.teamName,
                            style: GoogleFonts.poppins(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.tp(context),
                            ),
                          ),
                          Text(
                            '${team.players?.length ?? 0} players',
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              color: AppTheme.ts(context),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: team.players == null || team.players!.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.people_outline, size: 48, color: AppTheme.ts(context).withValues(alpha: 0.3)),
                            const SizedBox(height: 8),
                            Text('No players in this team',
                                style: GoogleFonts.poppins(color: AppTheme.ts(context))),
                          ],
                        ),
                      )
                    : ListView.builder(
                        controller: scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: team.players!.length,
                        itemBuilder: (context, index) {
                          final player = team.players![index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.15),
                                child: Text(
                                  player.playerName[0].toUpperCase(),
                                  style: GoogleFonts.poppins(
                                    color: AppTheme.primaryGreen,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              title: Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      player.playerName,
                                      style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                                    ),
                                  ),
                                  if (player.isCaptain) ...[
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: AppTheme.accentGold.withValues(alpha: 0.2),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        'C',
                                        style: GoogleFonts.poppins(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                          color: AppTheme.accentGold,
                                        ),
                                      ),
                                    ),
                                  ],
                                  if (player.isWicketKeeper) ...[
                                    const SizedBox(width: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: AppTheme.team2Color.withValues(alpha: 0.2),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        'WK',
                                        style: GoogleFonts.poppins(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                          color: AppTheme.team2Color,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              trailing: IconButton(
                                icon: const Icon(Icons.remove_circle_outline),
                                color: AppTheme.wicketRed,
                                onPressed: () async {
                                  final confirm = await showDialog<bool>(
                                    context: context,
                                    builder: (context) => AlertDialog(
                                      title: Text('Remove Player', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                                      content: Text(
                                        'Remove ${player.playerName} from ${team.teamName}?',
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
                                  if (confirm == true) {
                                    onRemovePlayer(player.playerId);
                                  }
                                },
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}
