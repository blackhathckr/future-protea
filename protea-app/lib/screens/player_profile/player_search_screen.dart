import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/user.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import 'other_player_profile_screen.dart';

class PlayerSearchScreen extends StatefulWidget {
  const PlayerSearchScreen({super.key});

  @override
  State<PlayerSearchScreen> createState() => _PlayerSearchScreenState();
}

class _PlayerSearchScreenState extends State<PlayerSearchScreen> {
  List<User> _all = [];
  List<User> _filtered = [];
  bool _loading = true;
  String? _error;
  final _searchCtrl = TextEditingController();
  final _searchFocus = FocusNode();

  // Filter state
  String? _selectedBattingStyle;
  String? _selectedBowlingStyle;

  @override
  void initState() {
    super.initState();
    _searchFocus.addListener(() => setState(() {}));
    _load();
    _searchCtrl.addListener(_filter);
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final players = await ApiService.getAllPlayers();
      setState(() {
        _all = players;
        _filtered = players;
        _loading = false;
      });
    } catch (e) {
      setState(() { _loading = false; _error = e.toString(); });
    }
  }

  void _filter() {
    final q = _searchCtrl.text.toLowerCase();
    setState(() {
      _filtered = _all.where((p) {
        final nameMatch = p.name.toLowerCase().contains(q);
        final battMatch = _selectedBattingStyle == null || (p.battingStyle?.toLowerCase() == _selectedBattingStyle!.toLowerCase());
        final bowlMatch = _selectedBowlingStyle == null || (p.bowlingStyle?.toLowerCase().contains(_selectedBowlingStyle!.toLowerCase()) == true);
        return nameMatch && battMatch && bowlMatch;
      }).toList();
    });
  }

  void _clearFilters() {
    setState(() {
      _selectedBattingStyle = null;
      _selectedBowlingStyle = null;
    });
    _filter();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Search bar
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _searchCtrl,
                  focusNode: _searchFocus,
                  style: GoogleFonts.poppins(fontSize: 13.5, color: AppTheme.tp(context)),
                  decoration: InputDecoration(
                    hintText: 'Search by name, school or club...',
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
                              _filter();
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
                    fillColor: AppTheme.surfaceLight(context),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed: _showFilterSheet,
                icon: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    const Icon(Icons.filter_list),
                    if (_selectedBattingStyle != null || _selectedBowlingStyle != null)
                      Positioned(
                        top: -4, right: -4,
                        child: Container(
                          width: 10, height: 10,
                          decoration: const BoxDecoration(color: AppTheme.accentGold, shape: BoxShape.circle),
                        ),
                      ),
                  ],
                ),
                style: IconButton.styleFrom(
                  backgroundColor: Theme.of(context).cardColor,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ),

        // Stats row
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Text('${_filtered.length} players', style: TextStyle(fontSize: 13, color: AppTheme.ts(context), fontWeight: FontWeight.w500)),
              const Spacer(),
              if (_selectedBattingStyle != null || _selectedBowlingStyle != null)
                GestureDetector(
                  onTap: _clearFilters,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: AppTheme.wicketRed.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                    child: const Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.clear, size: 12, color: AppTheme.wicketRed),
                      SizedBox(width: 4),
                      Text('Clear filters', style: TextStyle(fontSize: 11, color: AppTheme.wicketRed, fontWeight: FontWeight.w600)),
                    ]),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 8),

        // Content
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: AppTheme.accentGold))
              : _error != null
                  ? Center(child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, color: AppTheme.wicketRed, size: 48),
                        const SizedBox(height: 12),
                        Text('Failed to load players', style: TextStyle(color: AppTheme.ts(context))),
                        const SizedBox(height: 8),
                        ElevatedButton(onPressed: _load, child: const Text('Retry')),
                      ],
                    ))
                  : _filtered.isEmpty
                      ? Center(child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.person_search, size: 64, color: AppTheme.ts(context).withValues(alpha: 0.3)),
                            const SizedBox(height: 16),
                            Text('No players found', style: TextStyle(color: AppTheme.ts(context), fontSize: 16)),
                          ],
                        ))
                      : RefreshIndicator(
                          onRefresh: _load,
                          color: AppTheme.accentGold,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _filtered.length,
                            itemBuilder: (ctx, i) => _buildPlayerCard(_filtered[i], i),
                          ),
                        ),
        ),
      ],
    );
  }

  Widget _buildPlayerCard(User player, int index) {
    final initial = player.name.isNotEmpty ? player.name[0].toUpperCase() : '?';
    final photo = player.photoUrl;

    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => OtherPlayerProfileScreen(playerId: player.id, playerName: player.name)),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: Theme.of(context).cardColor,
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Row(
          children: [
            _playerAvatar(photo, initial),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(player.name, style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.tp(context))),
                  const SizedBox(height: 4),
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: [
                      if (player.battingStyle != null)
                        _stylePill(player.battingStyle!, AppTheme.lightGreen),
                      if (player.bowlingStyle != null && player.bowlingStyle != 'None')
                        _stylePill(player.bowlingStyle!, AppTheme.accentAmber),
                    ],
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (!player.approved)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: AppTheme.accentAmber.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(6)),
                    child: const Text('Pending', style: TextStyle(fontSize: 9, color: AppTheme.accentAmber, fontWeight: FontWeight.bold)),
                  )
                else
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: AppTheme.lightGreen.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(6)),
                    child: const Text('Approved', style: TextStyle(fontSize: 9, color: AppTheme.lightGreen, fontWeight: FontWeight.bold)),
                  ),
                const SizedBox(height: 6),
                const Icon(Icons.chevron_right, size: 18, color: AppTheme.textSecondary),
              ],
            ),
          ],
        ),
      ).animate().slideX(begin: 0.05, delay: (index * 40).ms).fadeIn(),
    );
  }

  Widget _playerAvatar(String? photo, String initial) {
    if (photo != null && photo.isNotEmpty) {
      final url = ApiService.getPhotoUrl(photo);
      return CircleAvatar(
        radius: 26,
        backgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.2),
        child: ClipOval(
          child: Image.network(
            url,
            width: 52,
            height: 52,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => Text(
              initial,
              style: GoogleFonts.poppins(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primaryGreen),
            ),
            loadingBuilder: (_, child, progress) => progress == null
                ? child
                : Container(
                    width: 52,
                    height: 52,
                    color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                    alignment: Alignment.center,
                    child: Text(initial,
                        style: GoogleFonts.poppins(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primaryGreen)),
                  ),
          ),
        ),
      );
    }
    return CircleAvatar(
      radius: 26,
      backgroundColor: AppTheme.primaryGreen.withValues(alpha: 0.2),
      child: Text(initial,
          style: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppTheme.primaryGreen)),
    );
  }

  Widget _stylePill(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)),
      child: Text(label, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis, maxLines: 1),
    );
  }

  void _showFilterSheet() {
    final battingOptions = [null, 'Right Handed', 'Left Handed'];
    final bowlingOptions = [null, 'Right Arm', 'Left Arm', 'Spin', 'Fast', 'Medium'];

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text('Filter Players', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w700)),
                  const Spacer(),
                  TextButton(onPressed: () {
                    setModalState(() {});
                    setState(() { _selectedBattingStyle = null; _selectedBowlingStyle = null; });
                    _filter();
                    Navigator.pop(ctx);
                  }, child: const Text('Clear All')),
                ],
              ),
              const SizedBox(height: 12),
              Text('Batting Style', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.ts(context))),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8, runSpacing: 8,
                children: battingOptions.map((opt) {
                  final selected = _selectedBattingStyle == opt;
                  return GestureDetector(
                    onTap: () {
                      setModalState(() {});
                      setState(() => _selectedBattingStyle = opt);
                      _filter();
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                      decoration: BoxDecoration(
                        color: selected ? AppTheme.primaryGreen : Theme.of(context).cardColor,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: selected ? AppTheme.primaryGreen : Theme.of(context).dividerColor),
                      ),
                      child: Text(opt ?? 'All', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: selected ? Colors.white : AppTheme.tp(context))),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              Text('Bowling Style', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.ts(context))),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8, runSpacing: 8,
                children: bowlingOptions.map((opt) {
                  final selected = _selectedBowlingStyle == opt;
                  return GestureDetector(
                    onTap: () {
                      setModalState(() {});
                      setState(() => _selectedBowlingStyle = opt);
                      _filter();
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                      decoration: BoxDecoration(
                        color: selected ? AppTheme.accentAmber : Theme.of(context).cardColor,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: selected ? AppTheme.accentAmber : Theme.of(context).dividerColor),
                      ),
                      child: Text(opt ?? 'All', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: selected ? Colors.white : AppTheme.tp(context))),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                  child: const Text('Apply'),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}
