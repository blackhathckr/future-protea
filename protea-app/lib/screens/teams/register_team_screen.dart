import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../../models/team.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../shared/utils/snackbar_utils.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/theme_toggle.dart';
import '../../widgets/protea_buttons.dart';
import 'team_registered_screen.dart';

class RegisterTeamScreen extends StatefulWidget {
  final Team? teamToEdit;
  
  const RegisterTeamScreen({super.key, this.teamToEdit});

  @override
  State<RegisterTeamScreen> createState() => _RegisterTeamScreenState();
}

class _RegisterTeamScreenState extends State<RegisterTeamScreen> {
  final _formKey = GlobalKey<FormState>();
  final _orgNameCtrl = TextEditingController();
  final _teamNameCtrl = TextEditingController();
  String _teamType = 'school';
  bool _loading = false;
  File? _logoFile;
  final _picker = ImagePicker();
  
  @override
  void initState() {
    super.initState();
    if (widget.teamToEdit != null) {
      _teamNameCtrl.text = widget.teamToEdit!.teamName;
      _teamType = widget.teamToEdit!.teamType;
      if (widget.teamToEdit!.schoolName != null) {
        _orgNameCtrl.text = widget.teamToEdit!.schoolName!;
      } else if (widget.teamToEdit!.clubName != null) {
        _orgNameCtrl.text = widget.teamToEdit!.clubName!;
      }
    }
  }

  Future<void> _pickLogo() async {
    final pickedFile = await _picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() => _logoFile = File(pickedFile.path));
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final team = widget.teamToEdit != null
          ? await ApiService.updateTeam(
              widget.teamToEdit!.id,
              teamName: _teamNameCtrl.text.trim(),
              teamType: _teamType,
              schoolName: _teamType == 'school' ? _orgNameCtrl.text.trim() : null,
              clubName: _teamType == 'club' ? _orgNameCtrl.text.trim() : null,
            )
          : await ApiService.createTeam(
              teamName: _teamNameCtrl.text.trim(),
              teamType: _teamType,
              schoolName: _teamType == 'school' ? _orgNameCtrl.text.trim() : null,
              clubName: _teamType == 'club' ? _orgNameCtrl.text.trim() : null,
            );
      
      // Upload logo if selected
      if (_logoFile != null) {
        await ApiService.uploadTeamLogo(team.id, _logoFile!.path);
      }
      
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => TeamRegisteredScreen(teamId: team.id)),
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
        child: SingleChildScrollView(
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
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Text('Register Team',
                    style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w700)),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 16),
                      // School / Club toggle
                      Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => _teamType = 'school'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                decoration: BoxDecoration(
                                  color: _teamType == 'school'
                                      ? AppTheme.primaryGreen
                                      : AppTheme.surface(context),
                                  borderRadius: const BorderRadius.horizontal(
                                      left: Radius.circular(8)),
                                  border: Border.all(color: AppTheme.primaryGreen),
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  'School',
                                  style: GoogleFonts.poppins(
                                    fontWeight: FontWeight.w600,
                                    color: _teamType == 'school'
                                        ? Colors.white
                                        : AppTheme.primaryGreen,
                                  ),
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => _teamType = 'club'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                decoration: BoxDecoration(
                                  color: _teamType == 'club'
                                      ? AppTheme.primaryGreen
                                      : AppTheme.surface(context),
                                  borderRadius: const BorderRadius.horizontal(
                                      right: Radius.circular(8)),
                                  border: Border.all(color: AppTheme.primaryGreen),
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  'Club',
                                  style: GoogleFonts.poppins(
                                    fontWeight: FontWeight.w600,
                                    color: _teamType == 'club'
                                        ? Colors.white
                                        : AppTheme.primaryGreen,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Center(
                        child: Text('Select one only',
                            style: GoogleFonts.poppins(
                                fontSize: 12, color: AppTheme.ts(context))),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        _teamType == 'school' ? 'School Name' : 'Club Name',
                        style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _orgNameCtrl,
                        decoration: InputDecoration(
                          hintText: _teamType == 'school'
                              ? 'Enter school name'
                              : 'Enter club name',
                        ),
                        validator: (v) => v!.isEmpty ? 'Required' : null,
                      ),
                      const SizedBox(height: 20),
                      Text('Team Name', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _teamNameCtrl,
                        decoration: const InputDecoration(hintText: 'Enter team name'),
                        validator: (v) => v!.isEmpty ? 'Enter team name' : null,
                      ),
                      const SizedBox(height: 20),
                      Text('Team Logo', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      GestureDetector(
                        onTap: _pickLogo,
                        child: Container(
                          width: double.infinity,
                          height: 200,
                          decoration: BoxDecoration(
                            border: Border.all(color: AppTheme.divider(context)),
                            borderRadius: BorderRadius.circular(12),
                            color: AppTheme.surfaceLight(context),
                          ),
                          child: _logoFile != null
                              ? ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: Stack(
                                    children: [
                                      Image.file(
                                        _logoFile!,
                                        width: double.infinity,
                                        height: double.infinity,
                                        fit: BoxFit.cover,
                                      ),
                                      Positioned(
                                        bottom: 8,
                                        right: 8,
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                          decoration: BoxDecoration(
                                            color: Colors.black54,
                                            borderRadius: BorderRadius.circular(20),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              const Icon(Icons.edit, color: Colors.white, size: 14),
                                              const SizedBox(width: 4),
                                              Text('Tap to change',
                                                  style: GoogleFonts.poppins(
                                                      fontSize: 11, color: Colors.white, fontWeight: FontWeight.w500)),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                )
                              : Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.add_photo_alternate, color: AppTheme.ts(context), size: 48),
                                    const SizedBox(height: 12),
                                    Text('+ UPLOAD LOGO',
                                        style: GoogleFonts.poppins(
                                            fontWeight: FontWeight.w600, fontSize: 16)),
                                    const SizedBox(height: 4),
                                    Text('Tap to select team logo (optional)',
                                        style: GoogleFonts.poppins(
                                            fontSize: 12, color: AppTheme.ts(context))),
                                  ],
                                ),
                        ),
                      ),
                      const SizedBox(height: 32),
                      GreenButton(
                        label: 'SAVE TEAM',
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

  @override
  void dispose() {
    _orgNameCtrl.dispose();
    _teamNameCtrl.dispose();
    super.dispose();
  }
}
