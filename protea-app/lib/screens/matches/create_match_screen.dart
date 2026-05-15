import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../models/team.dart';
import '../../models/tournament.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../shared/utils/snackbar_utils.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/theme_toggle.dart';
import '../../widgets/protea_buttons.dart';
import 'toss_screen.dart';

class CreateMatchScreen extends StatefulWidget {
  const CreateMatchScreen({super.key});

  @override
  State<CreateMatchScreen> createState() => _CreateMatchScreenState();
}

class _CreateMatchScreenState extends State<CreateMatchScreen> {
  final _formKey = GlobalKey<FormState>();
  List<Team> _teams = [];
  List<Tournament> _tournaments = [];
  Team? _teamA;
  Team? _teamB;
  Tournament? _selectedTournament;
  String _matchType = 'T20';
  int _ballsPerOver = 6;
  DateTime _matchDate = DateTime.now().add(const Duration(days: 1));
  TimeOfDay _matchTime = const TimeOfDay(hour: 8, minute: 0);
  bool _loading = false;
  bool _dataLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final teams = await ApiService.getTeams();
      List<Tournament> tournaments = [];
      try {
        tournaments = await ApiService.getTournaments();
      } catch (_) {}
      setState(() {
        _teams = teams;
        _tournaments = tournaments;
        _dataLoading = false;
      });
    } catch (_) {
      setState(() => _dataLoading = false);
    }
  }

  Future<void> _create() async {
    if (_teamA == null || _teamB == null) {
      SnackbarUtils.showError(context, 'Select both teams');
      return;
    }
    setState(() => _loading = true);
    try {
      final date = DateTime(
        _matchDate.year, _matchDate.month, _matchDate.day,
        _matchTime.hour, _matchTime.minute,
      );
      int overs;
      switch (_matchType) {
        case 'T20':
          overs = 20;
          break;
        case 'ODI':
          overs = 50;
          break;
        case 'T10':
          overs = 10;
          break;
        case 'Test':
          overs = 90;
          break;
        default:
          overs = 20;
      }
      final match = await ApiService.createMatch(
        team1Name: _teamA!.teamName,
        team2Name: _teamB!.teamName,
        totalOvers: overs,
        matchDate: date,
        tournamentId: _selectedTournament?.id,
        matchType: _matchType,
        ballsPerOver: _ballsPerOver,
      );
      if (mounted) {
        // Navigate to toss screen
        await Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => TossScreen(matchId: match.id, match: match)),
        );
      }
    } catch (e) {
      if (mounted) {
        SnackbarUtils.showError(context, e);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        top: false,
        child: _dataLoading
            ? Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
            : SingleChildScrollView(
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
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Tournament selector
                            Text('Select Tournament',
                                style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                            Text('(optional)',
                                style: TextStyle(color: AppTheme.ts(context), fontSize: 12)),
                            const SizedBox(height: 8),
                            DropdownButtonFormField<Tournament>(
                              value: _selectedTournament,
                              decoration: const InputDecoration(
                                hintText: 'Select Tournament',
                              ),
                              items: [
                                const DropdownMenuItem(value: null, child: Text('None')),
                                ..._tournaments.map((t) =>
                                    DropdownMenuItem(value: t, child: Text(t.name))),
                              ],
                              onChanged: (v) => setState(() => _selectedTournament = v),
                            ),
                            const SizedBox(height: 20),

                            // Create Match header
                            Center(
                              child: Text('Create Match',
                                  style: GoogleFonts.poppins(
                                      fontSize: 20, fontWeight: FontWeight.w700)),
                            ),
                            const SizedBox(height: 16),

                            // Team A
                            Text('Team A', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                            const SizedBox(height: 8),
                            DropdownButtonFormField<Team>(
                              value: _teamA,
                              decoration: const InputDecoration(hintText: 'Select Team'),
                              items: _teams
                                  .where((t) => t.id != _teamB?.id)
                                  .map((t) => DropdownMenuItem(
                                      value: t, child: Text(t.displayName)))
                                  .toList(),
                              onChanged: (v) => setState(() => _teamA = v),
                            ),
                            const SizedBox(height: 16),

                            // Team B
                            Text('Team B', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                            const SizedBox(height: 8),
                            DropdownButtonFormField<Team>(
                              value: _teamB,
                              decoration: const InputDecoration(hintText: 'Select Team'),
                              items: _teams
                                  .where((t) => t.id != _teamA?.id)
                                  .map((t) => DropdownMenuItem(
                                      value: t, child: Text(t.displayName)))
                                  .toList(),
                              onChanged: (v) => setState(() => _teamB = v),
                            ),
                            const SizedBox(height: 16),

                            // Match Type & Balls Per Over
                            Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('Match Type',
                                          style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                                      const SizedBox(height: 8),
                                      DropdownButtonFormField<String>(
                                        value: _matchType,
                                        decoration: const InputDecoration(),
                                        items: ['T20', 'ODI', 'T10', 'Test']
                                            .map((t) =>
                                                DropdownMenuItem(value: t, child: Text(t)))
                                            .toList(),
                                        onChanged: (v) =>
                                            setState(() => _matchType = v ?? 'T20'),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('Balls Per Over',
                                          style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                                      const SizedBox(height: 8),
                                      DropdownButtonFormField<int>(
                                        value: _ballsPerOver,
                                        decoration: const InputDecoration(),
                                        items: [6, 8]
                                            .map((b) => DropdownMenuItem(
                                                value: b, child: Text('$b')))
                                            .toList(),
                                        onChanged: (v) =>
                                            setState(() => _ballsPerOver = v ?? 6),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),

                            // Date & Time
                            Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('Date',
                                          style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                                      const SizedBox(height: 8),
                                      GestureDetector(
                                        onTap: () async {
                                          final picked = await showDatePicker(
                                            context: context,
                                            initialDate: _matchDate,
                                            firstDate: DateTime.now(),
                                            lastDate:
                                                DateTime.now().add(const Duration(days: 365)),
                                          );
                                          if (picked != null) {
                                            setState(() => _matchDate = picked);
                                          }
                                        },
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 12, vertical: 14),
                                          decoration: BoxDecoration(
                                            border:
                                                Border.all(color: AppTheme.divider(context)),
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Text(
                                              DateFormat('dd MMM yyyy').format(_matchDate)),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('Start Time',
                                          style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                                      const SizedBox(height: 8),
                                      GestureDetector(
                                        onTap: () async {
                                          final picked = await showTimePicker(
                                              context: context, initialTime: _matchTime);
                                          if (picked != null) {
                                            setState(() => _matchTime = picked);
                                          }
                                        },
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 12, vertical: 14),
                                          decoration: BoxDecoration(
                                            border:
                                                Border.all(color: AppTheme.divider(context)),
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Text(_matchTime.format(context)),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 32),

                            YellowButton(
                              label: 'CREATE MATCH',
                              onPressed: _create,
                              loading: _loading,
                            ),
                            const SizedBox(height: 12),
                            GreenButton(
                              label: 'MAIN MENU',
                              onPressed: () => Navigator.pop(context),
                            ),
                            const SizedBox(height: 32),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}
