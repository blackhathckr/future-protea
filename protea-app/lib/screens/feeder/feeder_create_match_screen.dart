import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../models/team.dart';
import '../../models/tournament.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../shared/widgets/section_label.dart';
import '../../shared/utils/snackbar_utils.dart';

class FeederCreateMatchScreen extends StatefulWidget {
  const FeederCreateMatchScreen({super.key});

  @override
  State<FeederCreateMatchScreen> createState() => _FeederCreateMatchScreenState();
}

class _FeederCreateMatchScreenState extends State<FeederCreateMatchScreen> {
  final _formKey = GlobalKey<FormState>();
  final _venueCtrl = TextEditingController();
  final _umpireCtrl = TextEditingController();
  int _overs = 20;
  DateTime _matchDate = DateTime.now().add(const Duration(days: 1));
  TimeOfDay _matchTime = const TimeOfDay(hour: 10, minute: 0);
  bool _loading = false;

  // Teams
  List<Team> _teams = [];
  Team? _teamA;
  Team? _teamB;
  bool _loadingTeams = true;

  // Match type
  String _matchType = 'T20';
  static const _matchTypes = {
    'T10': 10,
    'T20': 20,
    'ODI': 50,
    '40 Over': 40,
    'Custom': 0,
  };

  // Tournament linkage
  List<Tournament> _tournaments = [];
  String? _selectedTournamentId;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final teams = await ApiService.getTeams();
      if (mounted) setState(() { _teams = teams; _loadingTeams = false; });
    } catch (_) {
      if (mounted) setState(() => _loadingTeams = false);
    }
    try {
      final tournaments = await ApiService.getTournaments();
      if (mounted) setState(() => _tournaments = tournaments);
    } catch (_) {}
  }

  void _onMatchTypeChanged(String type) {
    setState(() {
      _matchType = type;
      final preset = _matchTypes[type] ?? 20;
      if (preset > 0) _overs = preset;
    });
  }

  Future<void> _create() async {
    if (_teamA == null || _teamB == null) {
      SnackbarUtils.showError(context, 'Please select both teams');
      return;
    }
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final date = DateTime(
        _matchDate.year, _matchDate.month, _matchDate.day,
        _matchTime.hour, _matchTime.minute,
      );
      await ApiService.createMatch(
        team1Name: _teamA!.teamName,
        team2Name: _teamB!.teamName,
        venue: _venueCtrl.text.trim().isNotEmpty ? _venueCtrl.text.trim() : null,
        totalOvers: _overs,
        matchDate: date,
        matchType: _matchType == 'Custom' ? 'Custom' : _matchType,
        tournamentId: _selectedTournamentId,
        umpire: _umpireCtrl.text.trim().isNotEmpty ? _umpireCtrl.text.trim() : null,
      );
      if (mounted) Navigator.pop(context, true);
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
    final isCustomOvers = _matchType == 'Custom';

    return Scaffold(
      appBar: AppBar(title: const Text('Create Match')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Teams ─────────────────────────────────────────
              const SectionLabel('Teams'),
              const SizedBox(height: 12),
              if (_loadingTeams)
                const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
              else if (_teams.isEmpty)
                Text('No teams found. Please create teams first.',
                    style: GoogleFonts.poppins(fontSize: 13, color: AppTheme.wicketRed))
              else ...[
                DropdownButtonFormField<Team>(
                  value: _teamA,
                  decoration: InputDecoration(
                    hintText: 'Select Team A',
                    prefixIcon: Container(
                      width: 12, height: 12,
                      margin: const EdgeInsets.all(12),
                      decoration: const BoxDecoration(color: AppTheme.team1Color, shape: BoxShape.circle),
                    ),
                  ),
                  isExpanded: true,
                  items: _teams
                      .where((t) => t.id != _teamB?.id)
                      .map((t) => DropdownMenuItem(value: t, child: Text(t.displayName, overflow: TextOverflow.ellipsis)))
                      .toList(),
                  onChanged: (v) => setState(() => _teamA = v),
                ),
                const SizedBox(height: 12),
                Center(
                  child: Text('VS', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.primaryGreen)),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<Team>(
                  value: _teamB,
                  decoration: InputDecoration(
                    hintText: 'Select Team B',
                    prefixIcon: Container(
                      width: 12, height: 12,
                      margin: const EdgeInsets.all(12),
                      decoration: const BoxDecoration(color: AppTheme.team2Color, shape: BoxShape.circle),
                    ),
                  ),
                  isExpanded: true,
                  items: _teams
                      .where((t) => t.id != _teamA?.id)
                      .map((t) => DropdownMenuItem(value: t, child: Text(t.displayName, overflow: TextOverflow.ellipsis)))
                      .toList(),
                  onChanged: (v) => setState(() => _teamB = v),
                ),
              ],
              const SizedBox(height: 24),

              // ── Match Type ────────────────────────────────────
              const SectionLabel('Match Type'),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _matchTypes.keys.map((type) {
                  final selected = _matchType == type;
                  return ChoiceChip(
                    label: Text(type),
                    selected: selected,
                    onSelected: (_) => _onMatchTypeChanged(type),
                    selectedColor: AppTheme.primaryGreen,
                    labelStyle: TextStyle(
                      color: selected ? Colors.white : AppTheme.ts(context),
                      fontWeight: FontWeight.w600,
                    ),
                    avatar: selected
                        ? const Icon(Icons.check, size: 16, color: Colors.white)
                        : null,
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),

              // ── Overs ─────────────────────────────────────────
              const SectionLabel('Overs'),
              const SizedBox(height: 8),
              if (isCustomOvers)
                Row(
                  children: [
                    SizedBox(
                      width: 100,
                      child: TextFormField(
                        initialValue: '$_overs',
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          hintText: 'Overs',
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                        ),
                        onChanged: (v) {
                          final parsed = int.tryParse(v);
                          if (parsed != null && parsed > 0) _overs = parsed;
                        },
                        validator: (v) {
                          final n = int.tryParse(v ?? '');
                          if (n == null || n <= 0) return 'Invalid';
                          return null;
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text('overs', style: GoogleFonts.poppins(color: AppTheme.ts(context))),
                  ],
                )
              else
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryGreen.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.primaryGreen.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.sports_cricket, size: 18, color: AppTheme.primaryGreen),
                      const SizedBox(width: 8),
                      Text('$_overs overs per side',
                          style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14, color: AppTheme.primaryGreen)),
                    ],
                  ),
                ),
              const SizedBox(height: 24),

              // ── Match Details ─────────────────────────────────
              const SectionLabel('Match Details'),
              const SizedBox(height: 12),
              TextFormField(
                controller: _venueCtrl,
                decoration: const InputDecoration(
                  hintText: 'Venue (optional)',
                  prefixIcon: Icon(Icons.location_on_outlined),
                ),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _umpireCtrl,
                decoration: const InputDecoration(
                  hintText: 'Umpire (optional)',
                  prefixIcon: Icon(Icons.person_outline),
                ),
              ),
              const SizedBox(height: 24),

              // ── Tournament Linkage ────────────────────────────
              const SectionLabel('Tournament (optional)'),
              const SizedBox(height: 10),
              _tournaments.isEmpty
                      ? Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Text('No tournaments available',
                              style: GoogleFonts.poppins(fontSize: 13, color: AppTheme.ts(context))),
                        )
                      : DropdownButtonFormField<String?>(
                          initialValue: _selectedTournamentId,
                          decoration: InputDecoration(
                            hintText: 'Select tournament',
                            prefixIcon: const Icon(Icons.emoji_events_outlined),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          isExpanded: true,
                          items: [
                            const DropdownMenuItem<String?>(
                              value: null,
                              child: Text('None (standalone match)'),
                            ),
                            ..._tournaments.map((t) => DropdownMenuItem<String?>(
                              value: t.id,
                              child: Text(t.name, overflow: TextOverflow.ellipsis),
                            )),
                          ],
                          onChanged: (v) => setState(() => _selectedTournamentId = v),
                        ),
              const SizedBox(height: 24),

              // ── Schedule ──────────────────────────────────────
              const SectionLabel('Schedule'),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: _matchDate,
                          firstDate: DateTime.now(),
                          lastDate: DateTime.now().add(const Duration(days: 365)),
                        );
                        if (picked != null) setState(() => _matchDate = picked);
                      },
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.surfaceLight(context),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.calendar_today, size: 18, color: AppTheme.ts(context)),
                            const SizedBox(width: 8),
                            Text(DateFormat('dd MMM yyyy').format(_matchDate)),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: GestureDetector(
                      onTap: () async {
                        final picked = await showTimePicker(context: context, initialTime: _matchTime);
                        if (picked != null) setState(() => _matchTime = picked);
                      },
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.surfaceLight(context),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.access_time, size: 18, color: AppTheme.ts(context)),
                            const SizedBox(width: 8),
                            Text(_matchTime.format(context)),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 40),

              // ── Create Button ─────────────────────────────────
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: _loading ? null : _create,
                  icon: _loading
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.sports_cricket),
                  label: const Text('Create Match'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _venueCtrl.dispose();
    _umpireCtrl.dispose();
    super.dispose();
  }
}
