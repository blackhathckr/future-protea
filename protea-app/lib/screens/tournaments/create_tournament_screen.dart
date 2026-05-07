import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../models/team.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/theme_toggle.dart';
import '../../widgets/protea_buttons.dart';

class CreateTournamentScreen extends StatefulWidget {
  const CreateTournamentScreen({super.key});

  @override
  State<CreateTournamentScreen> createState() => _CreateTournamentScreenState();
}

class _CreateTournamentScreenState extends State<CreateTournamentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _venueCtrl = TextEditingController();
  final _organizerCtrl = TextEditingController();
  String _type = 'T20';
  int _overs = 20;
  DateTime? _startDate;
  DateTime? _endDate;
  List<Team> _allTeams = [];
  final List<Team> _selectedTeams = [];
  bool _loading = false;
  bool _dataLoading = true;
  File? _logoFile;

  Future<void> _pickLogo() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked != null) {
      setState(() => _logoFile = File(picked.path));
    }
  }

  @override
  void initState() {
    super.initState();
    _loadTeams();
  }

  Future<void> _loadTeams() async {
    try {
      _allTeams = await ApiService.getTeams();
    } catch (_) {}
    setState(() => _dataLoading = false);
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final tournament = await ApiService.createTournament(
        name: _nameCtrl.text.trim(),
        type: _type,
        overs: _overs,
        startDate: _startDate,
        endDate: _endDate,
        venue: _venueCtrl.text.trim().isNotEmpty ? _venueCtrl.text.trim() : null,
        organizer: _organizerCtrl.text.trim().isNotEmpty ? _organizerCtrl.text.trim() : null,
      );
      // Upload logo if selected
      if (_logoFile != null) {
        try {
          await ApiService.uploadTournamentLogo(tournament.id, _logoFile!.path);
        } catch (e) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Tournament saved but logo upload failed: $e'), backgroundColor: AppTheme.accentAmber),
            );
          }
        }
      }
      // Add teams
      for (final team in _selectedTeams) {
        try {
          await ApiService.addTeamToTournament(tournament.id, team.id);
        } catch (_) {}
      }
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', '')),
              backgroundColor: AppTheme.wicketRed),
        );
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
        child: SingleChildScrollView(
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
              Text('Create Tournament',
                  style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Tournament Name', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _nameCtrl,
                        decoration: const InputDecoration(hintText: 'Enter tournament name'),
                        validator: (v) => v!.isEmpty ? 'Required' : null,
                      ),
                      const SizedBox(height: 16),
                      Text('Type', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<String>(
                        value: _type,
                        decoration: const InputDecoration(),
                        items: ['T20', 'ODI', 'T10', 'Test']
                            .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                            .toList(),
                        onChanged: (v) => setState(() {
                          _type = v ?? 'T20';
                          switch (_type) {
                            case 'T20': _overs = 20; break;
                            case 'ODI': _overs = 50; break;
                            case 'T10': _overs = 10; break;
                            case 'Test': _overs = 90; break;
                          }
                        }),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Overs', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                                const SizedBox(height: 8),
                                DropdownButtonFormField<int>(
                                  value: _overs,
                                  decoration: const InputDecoration(),
                                  items: [5, 10, 15, 20, 30, 50, 90]
                                      .map((o) => DropdownMenuItem(value: o, child: Text('$o Overs')))
                                      .toList(),
                                  onChanged: (v) => setState(() => _overs = v ?? 20),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Start Date', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                                const SizedBox(height: 8),
                                GestureDetector(
                                  onTap: () async {
                                    final picked = await showDatePicker(
                                      context: context,
                                      initialDate: _startDate ?? DateTime.now(),
                                      firstDate: DateTime.now(),
                                      lastDate: DateTime.now().add(const Duration(days: 730)),
                                    );
                                    if (picked != null) setState(() => _startDate = picked);
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                                    decoration: BoxDecoration(
                                      border: Border.all(color: AppTheme.divider(context)),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      _startDate != null
                                          ? DateFormat('dd MMM yyyy').format(_startDate!)
                                          : 'Select start date',
                                      style: TextStyle(
                                        color: _startDate != null ? AppTheme.tp(context) : AppTheme.ts(context),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('End Date', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                                const SizedBox(height: 8),
                                GestureDetector(
                                  onTap: () async {
                                    final picked = await showDatePicker(
                                      context: context,
                                      initialDate: _endDate ?? (_startDate ?? DateTime.now()),
                                      firstDate: _startDate ?? DateTime.now(),
                                      lastDate: DateTime.now().add(const Duration(days: 730)),
                                    );
                                    if (picked != null) setState(() => _endDate = picked);
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                                    decoration: BoxDecoration(
                                      border: Border.all(color: AppTheme.divider(context)),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      _endDate != null
                                          ? DateFormat('dd MMM yyyy').format(_endDate!)
                                          : 'Select end date',
                                      style: TextStyle(
                                        color: _endDate != null ? AppTheme.tp(context) : AppTheme.ts(context),
                                      ),
                                    ),
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
                                Text('Venue', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                                const SizedBox(height: 8),
                                TextFormField(
                                  controller: _venueCtrl,
                                  decoration: const InputDecoration(hintText: 'Enter venue'),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text('Organizer', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _organizerCtrl,
                        decoration: const InputDecoration(hintText: 'Enter organizer name'),
                      ),
                      const SizedBox(height: 16),
                      // Teams section
                      Text('Teams', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      if (!_dataLoading)
                        YellowButton(
                          label: '+ ADD TEAMS',
                          onPressed: () => _showTeamSelector(),
                        ),
                      if (_selectedTeams.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        ..._selectedTeams.map((t) => ListTile(
                              dense: true,
                              leading: CircleAvatar(
                                radius: 16,
                                backgroundColor: AppTheme.primaryGreen,
                                child: Text(t.teamName[0], style: const TextStyle(color: Colors.white, fontSize: 12)),
                              ),
                              title: Text(t.displayName, style: const TextStyle(fontSize: 13)),
                              trailing: IconButton(
                                icon: const Icon(Icons.close, size: 18),
                                onPressed: () => setState(() => _selectedTeams.remove(t)),
                              ),
                            )),
                      ],
                      const SizedBox(height: 16),
                      // Upload logo
                      GestureDetector(
                        onTap: _pickLogo,
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: _logoFile != null
                                  ? AppTheme.primaryGreen
                                  : AppTheme.divider(context),
                              width: _logoFile != null ? 2 : 1,
                            ),
                            borderRadius: BorderRadius.circular(8),
                            color: AppTheme.surfaceLight(context),
                          ),
                          child: _logoFile != null
                              ? Column(
                                  children: [
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(8),
                                      child: Image.file(_logoFile!, height: 80, width: 80, fit: BoxFit.cover),
                                    ),
                                    const SizedBox(height: 8),
                                    Text('Tap to change logo',
                                        style: GoogleFonts.poppins(fontSize: 12, color: AppTheme.primaryGreen, fontWeight: FontWeight.w600)),
                                  ],
                                )
                              : Column(
                                  children: [
                                    Icon(Icons.camera_alt, size: 32, color: AppTheme.ts(context)),
                                    const SizedBox(height: 4),
                                    Text('Upload Tournament Logo',
                                        style: GoogleFonts.poppins(fontSize: 13, color: AppTheme.ts(context))),
                                    Text('(optional)',
                                        style: GoogleFonts.poppins(fontSize: 11, color: AppTheme.ts(context))),
                                  ],
                                ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      GreenButton(
                        label: 'SAVE TOURNAMENT',
                        onPressed: _save,
                        loading: _loading,
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

  void _showTeamSelector() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.all(20),
          height: MediaQuery.of(context).size.height * 0.6,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Select Teams', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              Expanded(
                child: ListView.builder(
                  itemCount: _allTeams.length,
                  itemBuilder: (context, index) {
                    final team = _allTeams[index];
                    final isSelected = _selectedTeams.any((t) => t.id == team.id);
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: AppTheme.primaryGreen,
                        child: Text(team.teamName[0], style: const TextStyle(color: Colors.white)),
                      ),
                      title: Text(team.displayName),
                      trailing: isSelected
                          ? const Icon(Icons.check_circle, color: AppTheme.completedGreen)
                          : Icon(Icons.add_circle_outline, color: AppTheme.ts(context)),
                      onTap: () {
                        setState(() {
                          if (isSelected) {
                            _selectedTeams.removeWhere((t) => t.id == team.id);
                          } else {
                            _selectedTeams.add(team);
                          }
                        });
                        Navigator.pop(ctx);
                        _showTeamSelector();
                      },
                    );
                  },
                ),
              ),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Done'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _venueCtrl.dispose();
    _organizerCtrl.dispose();
    super.dispose();
  }
}
