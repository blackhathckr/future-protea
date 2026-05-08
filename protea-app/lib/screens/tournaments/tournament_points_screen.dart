import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../models/tournament.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/theme_toggle.dart';

class TournamentPointsScreen extends StatefulWidget {
  final String tournamentId;
  final String tournamentName;
  final DateTime? startDate;
  final DateTime? endDate;

  const TournamentPointsScreen({
    super.key,
    required this.tournamentId,
    required this.tournamentName,
    this.startDate,
    this.endDate,
  });

  @override
  State<TournamentPointsScreen> createState() => _TournamentPointsScreenState();
}

class _TournamentPointsScreenState extends State<TournamentPointsScreen> {
  List<TournamentTeam> _standings = [];
  bool _loading = true;
  String _selectedGroup = 'Group A';
  List<String> _groups = [];

  @override
  void initState() {
    super.initState();
    _loadStandings();
  }

  Future<void> _loadStandings() async {
    setState(() => _loading = true);
    try {
      _standings = await ApiService.getTournamentStandings(widget.tournamentId);
      final groups = _standings
          .where((t) => t.group != null && t.group!.isNotEmpty)
          .map((t) => t.group!)
          .toSet()
          .toList();
      groups.sort();
      setState(() {
        _groups = groups.isEmpty ? ['Group A'] : groups;
        _selectedGroup = _groups.first;
      });
    } catch (_) {}
    setState(() => _loading = false);
  }

  List<TournamentTeam> get _filteredStandings {
    if (_groups.isEmpty) return _standings;
    return _standings.where((t) => t.group == _selectedGroup).toList();
  }

  @override
  Widget build(BuildContext context) {
    final dateStr = [
      if (widget.startDate != null) DateFormat('dd MMM yyyy').format(widget.startDate!),
      if (widget.endDate != null) DateFormat('dd MMM yyyy').format(widget.endDate!),
    ].join(' \u2013 ');

    return Scaffold(
      body: SafeArea(
        top: false,
        child: Column(
          children: [
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
                  child: const ThemeToggleButton(),
                ),
              ],
            ),
            Text(widget.tournamentName,
                style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.w700),
                textAlign: TextAlign.center),
            if (dateStr.isNotEmpty)
              Text(dateStr,
                  style: GoogleFonts.poppins(fontSize: 13, color: AppTheme.ts(context))),
            const SizedBox(height: 12),
            // Points Table header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.primaryGreen,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text('Points Table',
                  style: GoogleFonts.poppins(
                      color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14)),
            ),
            const SizedBox(height: 12),
            // Group tabs
            if (_groups.length > 1)
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: _groups.map((g) {
                    final selected = _selectedGroup == g;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(g),
                        selected: selected,
                        onSelected: (_) => setState(() => _selectedGroup = g),
                        selectedColor: AppTheme.primaryGreen,
                        labelStyle: TextStyle(
                          color: selected ? Colors.white : AppTheme.tp(context),
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            const SizedBox(height: 8),
            // Table
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
                  : _standings.isEmpty
                      ? Center(child: Text('No standings data yet',
                          style: GoogleFonts.poppins(color: AppTheme.ts(context))))
                      : SingleChildScrollView(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: _buildTable(),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTable() {
    final teams = _filteredStandings;
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: AppTheme.divider(context)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          // Header row
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: const BoxDecoration(
              color: AppTheme.primaryGreen,
              borderRadius: BorderRadius.vertical(top: Radius.circular(7)),
            ),
            child: Row(
              children: [
                Expanded(flex: 3, child: Text('Team', style: _headerStyle)),
                Expanded(child: Text('P', textAlign: TextAlign.center, style: _headerStyle)),
                Expanded(child: Text('W', textAlign: TextAlign.center, style: _headerStyle)),
                Expanded(child: Text('L', textAlign: TextAlign.center, style: _headerStyle)),
                Expanded(child: Text('NR', textAlign: TextAlign.center, style: _headerStyle)),
                Expanded(flex: 2, child: Text('NRR', textAlign: TextAlign.center, style: _headerStyle)),
                Expanded(child: Text('Pts', textAlign: TextAlign.center, style: _headerStyle)),
              ],
            ),
          ),
          // Data rows
          ...List.generate(teams.length, (i) {
            final team = teams[i];
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: i % 2 == 0
                    ? (AppTheme.isDark(context) ? const Color(0xFF2C2C1A) : const Color(0xFFFFF9C4))
                    : AppTheme.surface(context),
                border: Border(top: BorderSide(color: AppTheme.divider(context))),
              ),
              child: Row(
                children: [
                  Expanded(
                    flex: 3,
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 12,
                          backgroundColor: AppTheme.primaryGreen,
                          child: Text(team.teamName.isNotEmpty ? team.teamName[0] : '?',
                              style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(team.teamName,
                              style: GoogleFonts.poppins(fontWeight: FontWeight.w500, fontSize: 12),
                              overflow: TextOverflow.ellipsis),
                        ),
                      ],
                    ),
                  ),
                  Expanded(child: Text('${team.played}', textAlign: TextAlign.center, style: _cellStyle)),
                  Expanded(child: Text('${team.won}', textAlign: TextAlign.center, style: _cellStyle)),
                  Expanded(child: Text('${team.lost}', textAlign: TextAlign.center, style: _cellStyle)),
                  Expanded(child: Text('${team.noResult}', textAlign: TextAlign.center, style: _cellStyle)),
                  Expanded(
                    flex: 2,
                    child: Text(
                      team.nrr == 0 ? '0.00' : (team.nrr > 0 ? '+${team.nrr.toStringAsFixed(2)}' : team.nrr.toStringAsFixed(2)),
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w600,
                        fontSize: 11,
                        color: team.nrr == 0
                          ? AppTheme.ts(context)
                          : (team.nrr > 0 ? AppTheme.completedGreen : AppTheme.wicketRed),
                      ),
                    ),
                  ),
                  Expanded(
                    child: Text(
                      '${team.points.toInt()}',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: AppTheme.primaryGreen,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  TextStyle get _headerStyle => GoogleFonts.poppins(
      color: Colors.white, fontWeight: FontWeight.w600, fontSize: 12);

  TextStyle get _cellStyle => GoogleFonts.poppins(fontSize: 12);
}
