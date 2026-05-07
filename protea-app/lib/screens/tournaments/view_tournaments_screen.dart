import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../models/tournament.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/theme_toggle.dart';
import 'tournament_detail_screen.dart';

class ViewTournamentsScreen extends StatefulWidget {
  const ViewTournamentsScreen({super.key});

  @override
  State<ViewTournamentsScreen> createState() => _ViewTournamentsScreenState();
}

class _ViewTournamentsScreenState extends State<ViewTournamentsScreen> {
  List<Tournament> _tournaments = [];
  bool _loading = true;
  String _filter = 'All';
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadTournaments();
  }

  Future<void> _loadTournaments() async {
    setState(() => _loading = true);
    try {
      _tournaments = await ApiService.getTournaments();
    } catch (_) {}
    setState(() => _loading = false);
  }

  List<Tournament> get _filtered {
    var list = _tournaments;
    if (_filter == 'Current') {
      list = list.where((t) => t.status == 'in_progress').toList();
    } else if (_filter == 'Upcoming') {
      list = list.where((t) => t.status == 'upcoming').toList();
    } else if (_filter == 'Completed') {
      list = list.where((t) => t.status == 'completed').toList();
    }
    if (_searchCtrl.text.isNotEmpty) {
      list = list.where((t) => t.name.toLowerCase().contains(_searchCtrl.text.toLowerCase())).toList();
    }
    return list;
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
                const ProteaHeader(height: 175),
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
                  child: const ThemeToggleButton(),
                ),
              ],
            ),
            Text('View Tournaments',
                style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            // Search
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: TextField(
                controller: _searchCtrl,
                decoration: InputDecoration(
                  hintText: 'Search',
                  prefixIcon: const Icon(Icons.search),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  contentPadding: const EdgeInsets.symmetric(vertical: 10),
                ),
                onChanged: (_) => setState(() {}),
              ),
            ),
            const SizedBox(height: 8),
            // Filter chips
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: ['All', 'Current', 'Upcoming', 'Completed'].map((f) {
                  final selected = _filter == f;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(f),
                      selected: selected,
                      onSelected: (_) => setState(() => _filter = f),
                      selectedColor: AppTheme.primaryGreen,
                      labelStyle: TextStyle(
                        color: selected ? Colors.white : AppTheme.tp(context),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 8),
            // Tournament list
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
                  : _filtered.isEmpty
                      ? Center(child: Text('No tournaments found',
                          style: GoogleFonts.poppins(color: AppTheme.ts(context))))
                      : RefreshIndicator(
                          onRefresh: _loadTournaments,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _filtered.length,
                            itemBuilder: (context, index) {
                              final t = _filtered[index];
                              return _TournamentCard(
                                tournament: t,
                                onOpen: () {
                                  Navigator.push(context, MaterialPageRoute(
                                    builder: (_) => TournamentDetailScreen(tournamentId: t.id),
                                  ));
                                },
                              );
                            },
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }
}

class _TournamentCard extends StatelessWidget {
  final Tournament tournament;
  final VoidCallback onOpen;

  const _TournamentCard({required this.tournament, required this.onOpen});

  @override
  Widget build(BuildContext context) {
    final dateStr = [
      if (tournament.startDate != null) DateFormat('dd MMM yyyy').format(tournament.startDate!),
      if (tournament.endDate != null) DateFormat('dd MMM yyyy').format(tournament.endDate!),
    ].join(' - ');

    Color statusColor;
    switch (tournament.status) {
      case 'in_progress':
        statusColor = AppTheme.inProgressOrange;
        break;
      case 'completed':
        statusColor = AppTheme.completedGreen;
        break;
      default:
        statusColor = AppTheme.upcomingBlue;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: AppTheme.primaryGreen,
              child: const Icon(Icons.emoji_events, color: Colors.white),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(tournament.name,
                            style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 14)),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: statusColor,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(tournament.statusLabel,
                            style: const TextStyle(
                                color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  if (dateStr.isNotEmpty)
                    Text(dateStr, style: TextStyle(fontSize: 12, color: AppTheme.ts(context))),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      SizedBox(
                        height: 30,
                        child: ElevatedButton(
                          onPressed: onOpen,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryGreen,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            minimumSize: Size.zero,
                          ),
                          child: const Text('Open', style: TextStyle(fontSize: 11, color: Colors.white)),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        height: 30,
                        child: ElevatedButton(
                          onPressed: () {},
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryGreen,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            minimumSize: Size.zero,
                          ),
                          child: const Text('Edit', style: TextStyle(fontSize: 11, color: Colors.white)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
