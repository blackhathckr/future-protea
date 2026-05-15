import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../models/player.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../shared/utils/snackbar_utils.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/theme_toggle.dart';

class SearchAddPlayerScreen extends StatefulWidget {
  final String teamId;

  const SearchAddPlayerScreen({super.key, required this.teamId});

  @override
  State<SearchAddPlayerScreen> createState() => _SearchAddPlayerScreenState();
}

class _SearchAddPlayerScreenState extends State<SearchAddPlayerScreen> {
  List<Player> _players = [];
  bool _loading = false;
  String _searchMode = 'name'; // 'name' or 'id'
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadAllPlayers();
  }

  Future<void> _loadAllPlayers() async {
    setState(() => _loading = true);
    try {
      _players = await ApiService.getRegisteredPlayers();
    } catch (_) {}
    setState(() => _loading = false);
  }

  Future<void> _search() async {
    setState(() => _loading = true);
    try {
      if (_searchCtrl.text.trim().isEmpty) {
        _players = await ApiService.getRegisteredPlayers();
      } else {
        _players = await ApiService.getRegisteredPlayers(search: _searchCtrl.text.trim());
      }
    } catch (_) {}
    setState(() => _loading = false);
  }

  Future<void> _addPlayer(Player player) async {
    try {
      await ApiService.addPlayerToTeam(widget.teamId, player.id);
      if (mounted) {
        SnackbarUtils.showSuccess(context, '${player.name} added to team');
        setState(() {
          _players.remove(player);
        });
      }
    } catch (e) {
      if (mounted) {
        SnackbarUtils.showError(context, e);
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
                const ProteaHeader(height: 120),
                Positioned(
                  top: MediaQuery.of(context).padding.top + 8,
                  left: 8,
                  child: IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.pop(context, true),
                  ),
                ),
                Positioned(
                  top: MediaQuery.of(context).padding.top + 8,
                  right: 8,
                  child: const ThemeToggleButton(),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Text('Search & Add Player',
                  style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.w700)),
            ),
            // Search mode toggle
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _searchMode = 'name'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: _searchMode == 'name'
                              ? AppTheme.primaryGreen
                              : AppTheme.surface(context),
                          borderRadius: const BorderRadius.horizontal(
                              left: Radius.circular(8)),
                          border: Border.all(color: AppTheme.primaryGreen),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          'Player Name',
                          style: GoogleFonts.poppins(
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                            color: _searchMode == 'name'
                                ? Colors.white
                                : AppTheme.primaryGreen,
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _searchMode = 'id'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: _searchMode == 'id'
                              ? AppTheme.primaryGreen
                              : AppTheme.surface(context),
                          borderRadius: const BorderRadius.horizontal(
                              right: Radius.circular(8)),
                          border: Border.all(color: AppTheme.primaryGreen),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          'Player ID',
                          style: GoogleFonts.poppins(
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                            color: _searchMode == 'id'
                                ? Colors.white
                                : AppTheme.primaryGreen,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Search bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
              child: TextField(
                controller: _searchCtrl,
                decoration: InputDecoration(
                  hintText: _searchMode == 'name'
                      ? 'Search by name'
                      : 'Search by Player ID',
                  prefixIcon: const Icon(Icons.search),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                ),
                onSubmitted: (_) => _search(),
              ),
            ),
            const SizedBox(height: 8),
            // Results
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text('Players',
                    style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w700, fontSize: 16)),
              ),
            ),
            Expanded(
              child: _loading
                  ? Center(
                      child: CircularProgressIndicator(color: AppTheme.primaryGreen))
                  : _players.isEmpty
                      ? Center(
                          child: Text(
                            'No players found',
                            style: GoogleFonts.poppins(color: AppTheme.ts(context)),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          itemCount: _players.length,
                          itemBuilder: (context, index) {
                            final player = _players[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: Padding(
                                padding: const EdgeInsets.all(12),
                                child: Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 22,
                                      backgroundColor: AppTheme.primaryGreen,
                                      backgroundImage: player.photoUrl != null && player.photoUrl!.isNotEmpty
                                          ? NetworkImage(ApiService.getPhotoUrl(player.photoUrl!))
                                          : null,
                                      child: player.photoUrl == null || player.photoUrl!.isEmpty
                                          ? Text(
                                              player.name.isNotEmpty
                                                  ? player.name[0].toUpperCase()
                                                  : '?',
                                              style: const TextStyle(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.bold),
                                            )
                                          : null,
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(player.name,
                                              style: GoogleFonts.poppins(
                                                  fontWeight: FontWeight.w600)),
                                          Text(
                                            [
                                              if (player.playerId != null) player.playerId!,
                                              if (player.dateOfBirth != null)
                                                _formatDate(player.dateOfBirth!),
                                            ].join(' - '),
                                            style: TextStyle(
                                                fontSize: 12,
                                                color: AppTheme.ts(context)),
                                          ),
                                          if (player.schoolName != null)
                                            Text(player.schoolName!,
                                                style: TextStyle(
                                                    fontSize: 12,
                                                    color: AppTheme.ts(context))),
                                        ],
                                      ),
                                    ),
                                    ElevatedButton(
                                      onPressed: () => _addPlayer(player),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppTheme.primaryGreen,
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 16, vertical: 8),
                                        minimumSize: Size.zero,
                                      ),
                                      child: const Text('ADD',
                                          style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold)),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
            // Close button
            Padding(
              padding: const EdgeInsets.all(24),
              child: SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context, true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.buttonGreen,
                    foregroundColor: Colors.white,
                  ),
                  child: Text('CLOSE',
                      style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w700, letterSpacing: 1)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String date) {
    try {
      final d = DateTime.parse(date);
      return DateFormat('dd MMM yyyy').format(d);
    } catch (_) {
      return date;
    }
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }
}
