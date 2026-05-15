import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/match.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/protea_header.dart';
import '../../shared/utils/snackbar_utils.dart';

class SelectPlayingXIScreen extends StatefulWidget {
  final String matchId;

  const SelectPlayingXIScreen({super.key, required this.matchId});

  @override
  State<SelectPlayingXIScreen> createState() => _SelectPlayingXIScreenState();
}

class _SelectPlayingXIScreenState extends State<SelectPlayingXIScreen> {
  bool _loading = true;
  bool _saving = false;
  bool _hasChanges = false;
  CricketMatch? _match;
  List<MatchPlayer> _team1Players = [];
  List<MatchPlayer> _team2Players = [];
  int _selectedTeam = 1;
  Set<String> _selectedPlayerIds = {};

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final match = await ApiService.getMatch(widget.matchId);
      final matchPlayers = match.players ?? [];
      
      print('=== SELECT PLAYING XI DEBUG ===');
      print('Match ID: ${widget.matchId}');
      print('Total players in match: ${matchPlayers.length}');
      print('Players: ${matchPlayers.map((p) => '${p.name} (team=${p.team}, status=${p.status})').join(', ')}');
      
      // Get all approved players regardless of team assignment
      final allApproved = matchPlayers.where((p) => p.status == 'approved').toList();
      
      // Separate by team (null team will be treated as unassigned)
      final t1 = allApproved.where((p) => p.team == 1).toList();
      final t2 = allApproved.where((p) => p.team == 2).toList();
      final unassigned = allApproved.where((p) => p.team == null || (p.team != 1 && p.team != 2)).toList();
      
      print('Team 1 approved: ${t1.length} players');
      print('Team 2 approved: ${t2.length} players');
      print('Unassigned approved: ${unassigned.length} players');
      print('===============================');
      
      if (mounted) {
        // Initialize selected players from existing isPlaying flags
        final initialSelected = allApproved
            .where((p) => p.isPlaying)
            .map((p) => p.playerId)
            .toSet();
        
        setState(() {
          _match = match;
          _team1Players = t1;
          _team2Players = t2;
          _selectedPlayerIds = initialSelected;
          _hasChanges = false;
          _loading = false;
        });
        
        // Show info if there are unassigned players
        if (unassigned.isNotEmpty) {
          Future.delayed(const Duration(milliseconds: 500), () {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('${unassigned.length} approved player(s) not assigned to any team'),
                  backgroundColor: Colors.orange,
                  duration: const Duration(seconds: 3),
                ),
              );
            }
          });
        }
      }
    } catch (e) {
      print('ERROR loading match data: $e');
      if (mounted) {
        setState(() => _loading = false);
        SnackbarUtils.showError(context, 'Failed to load match data: $e');
      }
    }
  }

  Future<void> _populatePlayers() async {
    try {
      // Show loading indicator
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                ),
                const SizedBox(width: 12),
                Text('Populating players from team rosters...',
                    style: GoogleFonts.poppins(fontSize: 13)),
              ],
            ),
            duration: const Duration(seconds: 30),
          ),
        );
      }

      await ApiService.populateMatchPlayers(widget.matchId);
      await _loadData(); // Reload to show new players
      
      if (mounted) {
        ScaffoldMessenger.of(context).clearSnackBars();
        SnackbarUtils.showSuccess(context, 'Players populated successfully! Now select your playing XI.');
      }
    } catch (e) {
      print('ERROR populating players: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).clearSnackBars();
        SnackbarUtils.showError(context, 'Failed to populate players: $e');
      }
    }
  }

  void _togglePlayer(MatchPlayer player) {
    setState(() {
      if (_selectedPlayerIds.contains(player.playerId)) {
        _selectedPlayerIds.remove(player.playerId);
      } else {
        _selectedPlayerIds.add(player.playerId);
      }
      _hasChanges = true;
    });
  }

  Future<void> _saveSelections() async {
    setState(() => _saving = true);
    try {
      // Get all players
      final allPlayers = [..._team1Players, ..._team2Players];
      
      // Update each player's playing status
      for (final player in allPlayers) {
        final shouldBePlaying = _selectedPlayerIds.contains(player.playerId);
        // Only update if changed
        if (player.isPlaying != shouldBePlaying) {
          await ApiService.togglePlayerPlaying(
            widget.matchId,
            player.playerId,
            shouldBePlaying,
          );
        }
      }
      
      if (mounted) {
        setState(() {
          _hasChanges = false;
          _saving = false;
        });
        SnackbarUtils.showSuccess(context, 'Playing XI saved successfully!');
        // Reload to get fresh data
        await _loadData();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        SnackbarUtils.showError(context, 'Failed to save selections: $e');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppTheme.isDark(context);
    final activePlayers = _selectedTeam == 1 ? _team1Players : _team2Players;
    final playingCount = activePlayers.where((p) => _selectedPlayerIds.contains(p.playerId)).length;

    return Scaffold(
      body: SafeArea(
        top: false,
        child: Stack(
          children: [
            Column(
              children: [
                // Header
                Stack(
                  children: [
                    const ProteaHeader(height: 115),
                    Positioned(
                      top: MediaQuery.of(context).padding.top + 6,
                      left: 4,
                      child: IconButton(
                        icon: const Icon(Icons.arrow_back, color: Colors.white),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ),
                  ],
                ),

                if (_loading)
                  Expanded(child: Center(child: CircularProgressIndicator()))
                else if (_match == null)
                  Expanded(child: Center(child: Text('Match not found')))
                else ...[
                  // Title
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                    child: Column(
                      children: [
                        Text('Select Playing XI',
                            style: GoogleFonts.poppins(
                                color: AppTheme.tp(context),
                                fontWeight: FontWeight.w700,
                                fontSize: 18)),
                        const SizedBox(height: 2),
                        Text('Choose up to 11 players per team',
                            style: GoogleFonts.poppins(
                                color: AppTheme.ts(context), fontSize: 12)),
                      ],
                    ),
                  ),

                  // Match info with logos
                  Container(
                margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0A1F0A), Color(0xFF0D2E10)],
                  ),
                  border: Border.all(color: const Color(0xFF1B5E20)),
                ),
                child: Row(
                  children: [
                    // Team 1 logo + name
                    Expanded(
                      child: Row(
                        children: [
                          if (_match!.team1LogoUrl != null)
                            ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: Image.network(
                                _match!.team1LogoUrl!,
                                width: 32,
                                height: 32,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Container(
                                  width: 32,
                                  height: 32,
                                  decoration: BoxDecoration(
                                    color: AppTheme.team1Color.withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Icon(Icons.shield,
                                      size: 18, color: AppTheme.team1Color),
                                ),
                              ),
                            )
                          else
                            Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: AppTheme.team1Color.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Icon(Icons.shield,
                                  size: 18, color: AppTheme.team1Color),
                            ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(_match!.team1Name,
                                style: GoogleFonts.poppins(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 13),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis),
                          ),
                        ],
                      ),
                    ),
                    // VS badge
                    Container(
                      margin: const EdgeInsets.symmetric(horizontal: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.upcomingBlue.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text('VS',
                          style: GoogleFonts.poppins(
                              color: AppTheme.upcomingBlue,
                              fontWeight: FontWeight.w800,
                              fontSize: 12)),
                    ),
                    // Team 2 logo + name
                    Expanded(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Expanded(
                            child: Text(_match!.team2Name,
                                style: GoogleFonts.poppins(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 13),
                                textAlign: TextAlign.right,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis),
                          ),
                          const SizedBox(width: 8),
                          if (_match!.team2LogoUrl != null)
                            ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: Image.network(
                                _match!.team2LogoUrl!,
                                width: 32,
                                height: 32,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Container(
                                  width: 32,
                                  height: 32,
                                  decoration: BoxDecoration(
                                    color: AppTheme.team2Color.withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Icon(Icons.shield,
                                      size: 18, color: AppTheme.team2Color),
                                ),
                              ),
                            )
                          else
                            Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                color: AppTheme.team2Color.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Icon(Icons.shield,
                                  size: 18, color: AppTheme.team2Color),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Team switcher
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
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
                        name: _match!.team1Name,
                        count: _team1Players.where((p) => _selectedPlayerIds.contains(p.playerId)).length,
                        total: _team1Players.length,
                        color: AppTheme.team1Color,
                        isDark: isDark,
                      ),
                      _teamChip(
                        teamNum: 2,
                        name: _match!.team2Name,
                        count: _team2Players.where((p) => _selectedPlayerIds.contains(p.playerId)).length,
                        total: _team2Players.length,
                        color: AppTheme.team2Color,
                        isDark: isDark,
                      ),
                    ],
                  ),
                ),
                  ),

                  const SizedBox(height: 8),

                  // Playing XI count indicator
                  Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Playing XI: $playingCount/11',
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: playingCount == 11
                            ? AppTheme.primaryGreen
                            : playingCount > 11
                                ? AppTheme.wicketRed
                                : AppTheme.ts(context),
                      ),
                    ),
                    if (playingCount > 11)
                      Text(
                        'Too many players selected!',
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          color: AppTheme.wicketRed,
                        ),
                      ),
                  ],
                ),
              ),

              const SizedBox(height: 8),

                  // Done button (shown when there are changes)
                  if (_hasChanges && activePlayers.isNotEmpty)
                    Container(
                  margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isDark 
                        ? AppTheme.accentGold.withValues(alpha: 0.1)
                        : AppTheme.accentGold.withValues(alpha: 0.25),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isDark 
                          ? AppTheme.accentGold.withValues(alpha: 0.3)
                          : AppTheme.accentGold.withValues(alpha: 0.6),
                      width: 1.5,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline, 
                          size: 20, 
                          color: isDark ? AppTheme.accentGold : const Color(0xFFB8860B)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text('You have unsaved changes',
                            style: GoogleFonts.poppins(
                                fontSize: 13,
                                color: isDark ? AppTheme.accentGold : const Color(0xFF8B6914),
                                fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                    ),

              // Player list
              Expanded(
                child: activePlayers.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.people_outline_rounded,
                                size: 56, color: AppTheme.ts(context).withValues(alpha: 0.25)),
                            const SizedBox(height: 10),
                            Text('No approved players',
                                style: GoogleFonts.poppins(
                                    fontSize: 13, color: AppTheme.ts(context))),
                            const SizedBox(height: 16),
                            ElevatedButton.icon(
                              onPressed: _populatePlayers,
                              icon: const Icon(Icons.group_add),
                              label: Text('Populate Players from Teams',
                                  style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primaryGreen,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 32),
                              child: Text(
                                'This will add all players from both team rosters to this match',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.poppins(
                                    fontSize: 11, color: AppTheme.ts(context)),
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(12, 4, 12, 100),
                        itemCount: activePlayers.length,
                        itemBuilder: (_, i) => _playerTile(activePlayers[i], i, isDark),
                      ),
                  ),
                ],
              ],
            ),
            
            // Floating Done button
            if (activePlayers.isNotEmpty)
              Positioned(
                bottom: 16,
                left: 16,
                right: 16,
                child: SafeArea(
                  child: ElevatedButton(
                    onPressed: _saving ? null : _saveSelections,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryGreen,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 8,
                    ),
                    child: _saving
                        ? Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Text('Saving...',
                                  style: GoogleFonts.poppins(
                                      fontSize: 16, fontWeight: FontWeight.w600)),
                            ],
                          )
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.check_circle_outline, size: 22),
                              const SizedBox(width: 8),
                              Text('Done - Save Playing XI',
                                  style: GoogleFonts.poppins(
                                      fontSize: 16, fontWeight: FontWeight.w600)),
                            ],
                          ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _teamChip({
    required int teamNum,
    required String name,
    required int count,
    required int total,
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
                ? [
                    BoxShadow(
                        color: color.withValues(alpha: 0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 3))
                  ]
                : [],
          ),
          child: Column(
            children: [
              Text(name,
                  style: GoogleFonts.poppins(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: isSelected ? Colors.white : AppTheme.tp(context)),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center),
              const SizedBox(height: 2),
              Text('$count/$total selected',
                  style: GoogleFonts.poppins(
                      fontSize: 9,
                      color: isSelected
                          ? Colors.white.withValues(alpha: 0.75)
                          : AppTheme.ts(context))),
            ],
          ),
        ),
      ),
    );
  }

  Widget _playerTile(MatchPlayer p, int i, bool isDark) {
    final activeColor = _selectedTeam == 1 ? AppTheme.team1Color : AppTheme.team2Color;
    final isSelected = _selectedPlayerIds.contains(p.playerId);
    
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: isSelected
            ? activeColor.withValues(alpha: isDark ? 0.15 : 0.1)
            : (isDark ? Colors.white.withValues(alpha: 0.04) : Colors.grey.withValues(alpha: 0.05)),
        border: Border.all(
          color: isSelected
              ? activeColor.withValues(alpha: 0.4)
              : (isDark
                  ? Colors.white.withValues(alpha: 0.07)
                  : Colors.black.withValues(alpha: 0.05)),
          width: isSelected ? 1.5 : 1,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () => _togglePlayer(p),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Row(
              children: [
                // Checkbox
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isSelected ? activeColor : Colors.transparent,
                    border: Border.all(
                      color: isSelected ? activeColor : AppTheme.ts(context).withValues(alpha: 0.3),
                      width: 2,
                    ),
                  ),
                  child: isSelected
                      ? const Icon(Icons.check, color: Colors.white, size: 16)
                      : null,
                ),
                const SizedBox(width: 12),
                // Name + badges
                Expanded(
                  child: Row(
                    children: [
                      Flexible(
                        child: Text(p.name,
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
          ),
        ),
      ),
    );
  }

  Widget _badge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(text,
          style:
              TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: color)),
    );
  }
}
