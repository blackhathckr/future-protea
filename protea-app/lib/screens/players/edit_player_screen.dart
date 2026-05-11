import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../models/player.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../shared/utils/snackbar_utils.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/theme_toggle.dart';
import '../../widgets/protea_buttons.dart';

class EditPlayerScreen extends StatefulWidget {
  final Player player;
  const EditPlayerScreen({super.key, required this.player});

  @override
  State<EditPlayerScreen> createState() => _EditPlayerScreenState();
}

class _EditPlayerScreenState extends State<EditPlayerScreen> {
  final _formKey = GlobalKey<FormState>();

  // Basic Info
  late final TextEditingController _nameCtrl;
  DateTime? _dateOfBirth;
  late final TextEditingController _nationalityCtrl;

  // Contact Info
  late final TextEditingController _emailCtrl;
  late final TextEditingController _phoneCtrl;
  late final TextEditingController _emergencyContactCtrl;
  late final TextEditingController _emergencyContactNameCtrl;

  // Address
  late final TextEditingController _addressCtrl;
  late final TextEditingController _cityCtrl;
  late final TextEditingController _stateCtrl;
  late final TextEditingController _countryCtrl;
  late final TextEditingController _postalCodeCtrl;

  // Physical Stats
  late final TextEditingController _heightCtrl;
  late final TextEditingController _weightCtrl;
  String? _bloodGroup;

  // Cricket Details
  late final TextEditingController _schoolCtrl;
  late final TextEditingController _clubCtrl;
  String? _battingStyle;
  String? _bowlingStyle;
  String? _playingRole;
  late final TextEditingController _jerseyNumberCtrl;

  // Family Info
  late final TextEditingController _fatherNameCtrl;
  late final TextEditingController _motherNameCtrl;
  late final TextEditingController _guardianNameCtrl;

  XFile? _pickedImage;
  bool _loading = false;
  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    final p = widget.player;
    // Basic
    _nameCtrl = TextEditingController(text: p.name);
    _nationalityCtrl = TextEditingController(text: p.nationality ?? '');
    if (p.dateOfBirth != null) {
      try { _dateOfBirth = DateTime.parse(p.dateOfBirth!); } catch (_) {}
    }
    // Contact
    _emailCtrl = TextEditingController(text: p.email ?? '');
    _phoneCtrl = TextEditingController(text: p.phone ?? '');
    _emergencyContactNameCtrl = TextEditingController(text: p.emergencyContactName ?? '');
    _emergencyContactCtrl = TextEditingController(text: p.emergencyContact ?? '');
    // Address
    _addressCtrl = TextEditingController(text: p.address ?? '');
    _cityCtrl = TextEditingController(text: p.city ?? '');
    _stateCtrl = TextEditingController(text: p.state ?? '');
    _countryCtrl = TextEditingController(text: p.country ?? '');
    _postalCodeCtrl = TextEditingController(text: p.postalCode ?? '');
    // Physical
    _heightCtrl = TextEditingController(text: p.height != null ? p.height!.toStringAsFixed(1) : '');
    _weightCtrl = TextEditingController(text: p.weight != null ? p.weight!.toStringAsFixed(1) : '');
    _bloodGroup = p.bloodGroup;
    // Cricket
    _schoolCtrl = TextEditingController(text: p.schoolName ?? '');
    _clubCtrl = TextEditingController(text: p.clubName ?? '');
    _battingStyle = p.battingStyle;
    _bowlingStyle = p.bowlingStyle;
    _playingRole = p.playingRole;
    _jerseyNumberCtrl = TextEditingController(text: p.jerseyNumber != null ? '${p.jerseyNumber}' : '');
    // Family
    _fatherNameCtrl = TextEditingController(text: p.fatherName ?? '');
    _motherNameCtrl = TextEditingController(text: p.motherName ?? '');
    _guardianNameCtrl = TextEditingController(text: p.guardianName ?? '');
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final image = await _picker.pickImage(
        source: source,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );
      if (image != null) setState(() => _pickedImage = image);
    } catch (e) {
      if (mounted) {
        SnackbarUtils.showError(context, 'Could not pick image: $e');
      }
    }
  }

  void _showImageSourceDialog() {
    final hasPhoto = widget.player.photoUrl != null && widget.player.photoUrl!.isNotEmpty;
    
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Update Player Photo',
                  style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 16),
              ListTile(
                leading: Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.camera_alt, color: AppTheme.primaryGreen),
                ),
                title: const Text('Take Photo'),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.photo_library, color: AppTheme.primaryGreen),
                ),
                title: const Text('Choose from Gallery'),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImage(ImageSource.gallery);
                },
              ),
              if (hasPhoto)
                ListTile(
                  leading: Container(
                    width: 44, height: 44,
                    decoration: BoxDecoration(
                      color: AppTheme.wicketRed.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.delete, color: AppTheme.wicketRed),
                  ),
                  title: const Text('Delete Photo'),
                  onTap: () {
                    Navigator.pop(ctx);
                    _deletePhoto();
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  String? _txt(TextEditingController c) => c.text.trim().isNotEmpty ? c.text.trim() : null;

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final updates = <String, dynamic>{
        'name': _nameCtrl.text.trim(),
        'nationality': _txt(_nationalityCtrl),
        'email': _txt(_emailCtrl),
        'phone': _txt(_phoneCtrl),
        'emergency_contact_name': _txt(_emergencyContactNameCtrl),
        'emergency_contact': _txt(_emergencyContactCtrl),
        'address': _txt(_addressCtrl),
        'city': _txt(_cityCtrl),
        'state': _txt(_stateCtrl),
        'country': _txt(_countryCtrl),
        'postal_code': _txt(_postalCodeCtrl),
        'height': _txt(_heightCtrl),
        'weight': _txt(_weightCtrl),
        'blood_group': _bloodGroup,
        'school_name': _txt(_schoolCtrl),
        'club_name': _txt(_clubCtrl),
        'batting_style': _battingStyle,
        'bowling_style': _bowlingStyle,
        'playing_role': _playingRole,
        'jersey_number': _txt(_jerseyNumberCtrl),
        'father_name': _txt(_fatherNameCtrl),
        'mother_name': _txt(_motherNameCtrl),
        'guardian_name': _txt(_guardianNameCtrl),
      };
      if (_dateOfBirth != null) {
        updates['date_of_birth'] = DateFormat('yyyy-MM-dd').format(_dateOfBirth!);
      }

      var player = await ApiService.updatePlayer(widget.player.id, updates);

      if (_pickedImage != null) {
        try {
          player = await ApiService.uploadPlayerPhoto(player.id, _pickedImage!.path);
        } catch (_) {}
      }

      if (mounted) {
        SnackbarUtils.showSuccess(context, 'Player updated successfully');
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        SnackbarUtils.showError(context, e);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _deletePhoto() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Photo'),
        content: const Text('Are you sure you want to delete this player\'s photo?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: AppTheme.wicketRed)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _loading = true);
    try {
      await ApiService.deletePlayerPhoto(widget.player.id);
      if (mounted) {
        SnackbarUtils.showSuccess(context, 'Photo deleted successfully');
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        SnackbarUtils.showError(context, e);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _deletePlayer() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Player'),
        content: const Text('Are you sure you want to delete this player profile? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: AppTheme.wicketRed)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _loading = true);
    try {
      await ApiService.deletePlayer(widget.player.id);
      if (mounted) {
        SnackbarUtils.showSuccess(context, 'Player deleted successfully');
        Navigator.popUntil(context, (route) => route.isFirst);
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
                child: Text('Edit Player',
                    style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w700)),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Photo
                      Center(
                        child: Column(
                          children: [
                            GestureDetector(
                              onTap: _showImageSourceDialog,
                              child: Stack(
                                children: [
                                  CircleAvatar(
                                    radius: 48,
                                    backgroundColor: AppTheme.primaryGreen,
                                    backgroundImage: _pickedImage != null
                                        ? FileImage(File(_pickedImage!.path))
                                        : (widget.player.photoUrl != null && widget.player.photoUrl!.isNotEmpty
                                            ? NetworkImage(ApiService.getPhotoUrl(widget.player.photoUrl!))
                                            : null) as ImageProvider?,
                                    child: (_pickedImage == null &&
                                            (widget.player.photoUrl == null || widget.player.photoUrl!.isEmpty))
                                        ? Text(
                                            widget.player.name.isNotEmpty ? widget.player.name[0].toUpperCase() : '?',
                                            style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold),
                                          )
                                        : null,
                                  ),
                                  Positioned(
                                    bottom: 0,
                                    right: 0,
                                    child: Container(
                                      padding: const EdgeInsets.all(6),
                                      decoration: const BoxDecoration(
                                        color: AppTheme.accentGold,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(Icons.camera_alt, size: 16, color: AppTheme.textPrimary),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (widget.player.photoUrl != null && widget.player.photoUrl!.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              GestureDetector(
                                onTap: _deletePhoto,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: AppTheme.wicketRed.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.delete, size: 16, color: AppTheme.wicketRed),
                                      const SizedBox(width: 4),
                                      Text(
                                        'Delete Photo',
                                        style: GoogleFonts.poppins(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          color: AppTheme.wicketRed,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // ── BASIC INFORMATION ─────────────────────────────────
                      _sectionHeader('Basic Information'),
                      _field('Player Name', _nameCtrl, required: true),
                      _dateField(),
                      _field('Nationality', _nationalityCtrl, hint: 'e.g. South African'),

                      // ── CONTACT INFORMATION ───────────────────────────────
                      _sectionHeader('Contact Information'),
                      _field('Email', _emailCtrl, hint: 'player@example.com', keyboard: TextInputType.emailAddress),
                      _field('Phone', _phoneCtrl, hint: '+27 123 456 7890', keyboard: TextInputType.phone),
                      _field('Emergency Contact Name', _emergencyContactNameCtrl, hint: 'Parent/Guardian name'),
                      _field('Emergency Contact Number', _emergencyContactCtrl, hint: '+27 123 456 7890', keyboard: TextInputType.phone),

                      // ── ADDRESS ───────────────────────────────────────────
                      _sectionHeader('Address'),
                      _field('Street Address', _addressCtrl, hint: 'Street address'),
                      Row(children: [
                        Expanded(child: _field('City', _cityCtrl, hint: 'City')),
                        const SizedBox(width: 12),
                        Expanded(child: _field('Postal Code', _postalCodeCtrl, hint: 'Code', keyboard: TextInputType.number)),
                      ]),
                      Row(children: [
                        Expanded(child: _field('State/Province', _stateCtrl, hint: 'State')),
                        const SizedBox(width: 12),
                        Expanded(child: _field('Country', _countryCtrl, hint: 'Country')),
                      ]),

                      // ── PHYSICAL STATS ────────────────────────────────────
                      _sectionHeader('Physical Stats'),
                      Row(children: [
                        Expanded(child: _field('Height (cm)', _heightCtrl, hint: '175', keyboard: TextInputType.number)),
                        const SizedBox(width: 12),
                        Expanded(child: _field('Weight (kg)', _weightCtrl, hint: '70', keyboard: TextInputType.number)),
                      ]),
                      _dropdown('Blood Group', _bloodGroup, ['A+','A-','B+','B-','O+','O-','AB+','AB-'], (v) => setState(() => _bloodGroup = v)),

                      // ── CRICKET DETAILS ───────────────────────────────────
                      _sectionHeader('Cricket Details'),
                      _field('School Name', _schoolCtrl, hint: 'School name'),
                      _field('Club Name', _clubCtrl, hint: 'Club name'),
                      _dropdown('Playing Role', _playingRole, ['Batsman','Bowler','All-rounder','Wicket-keeper'], (v) => setState(() => _playingRole = v)),
                      _dropdown('Batting Style', _battingStyle, ['Right-hand bat','Left-hand bat'], (v) => setState(() => _battingStyle = v)),
                      _dropdown('Bowling Style', _bowlingStyle, ['Right-arm fast','Left-arm fast','Right-arm medium','Left-arm medium','Right-arm spin','Left-arm spin','Leg-spin','Off-spin'], (v) => setState(() => _bowlingStyle = v)),
                      _field('Jersey Number', _jerseyNumberCtrl, hint: 'e.g. 7', keyboard: TextInputType.number),

                      // ── FAMILY INFORMATION ────────────────────────────────
                      _sectionHeader('Family Information'),
                      _field("Father's Name", _fatherNameCtrl, hint: "Father's full name"),
                      _field("Mother's Name", _motherNameCtrl, hint: "Mother's full name"),
                      _field('Guardian Name', _guardianNameCtrl, hint: 'Guardian (if applicable)'),

                      const SizedBox(height: 32),
                      YellowButton(label: 'SAVE CHANGES', onPressed: _save, loading: _loading),
                      const SizedBox(height: 12),
                      GreenButton(label: 'CANCEL', onPressed: () => Navigator.pop(context)),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _deletePlayer,
                          icon: const Icon(Icons.delete, size: 18),
                          label: const Text('DELETE PLAYER'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.wicketRed,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
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

  // ── Helper widgets ─────────────────────────────────────────────────
  Widget _sectionHeader(String title) => Padding(
    padding: const EdgeInsets.only(top: 24, bottom: 8),
    child: Text(title, style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.primaryGreen)),
  );

  Widget _field(String label, TextEditingController ctrl, {String? hint, bool required = false, TextInputType keyboard = TextInputType.text}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 10),
        Row(children: [
          Text(label, style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13)),
          if (required) const Text(' *', style: TextStyle(color: AppTheme.wicketRed, fontWeight: FontWeight.bold)),
        ]),
        const SizedBox(height: 5),
        TextFormField(
          controller: ctrl,
          keyboardType: keyboard,
          decoration: InputDecoration(hintText: hint ?? label),
          validator: required ? (v) => v!.isEmpty ? 'Required' : null : null,
        ),
      ],
    );
  }

  Widget _dateField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 10),
        Text('Date of Birth', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13)),
        const SizedBox(height: 5),
        GestureDetector(
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: _dateOfBirth ?? DateTime(2008, 1, 1),
              firstDate: DateTime(1990),
              lastDate: DateTime.now(),
            );
            if (picked != null) setState(() => _dateOfBirth = picked);
          },
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: AppTheme.surface(context),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppTheme.divider(context)),
            ),
            child: Row(children: [
              Expanded(child: Text(
                _dateOfBirth != null ? DateFormat('dd / MM / yyyy').format(_dateOfBirth!) : 'DD / MM / YYYY',
                style: TextStyle(color: _dateOfBirth != null ? AppTheme.tp(context) : AppTheme.ts(context), fontSize: 15),
              )),
              Icon(Icons.calendar_today, color: AppTheme.ts(context), size: 20),
            ]),
          ),
        ),
      ],
    );
  }

  Widget _dropdown(String label, String? value, List<String> options, Function(String?) onChange) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 10),
        Text(label, style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13)),
        const SizedBox(height: 5),
        DropdownButtonFormField<String>(
          value: value,
          decoration: InputDecoration(hintText: 'Select $label'),
          items: options.map((o) => DropdownMenuItem(value: o, child: Text(o, style: GoogleFonts.poppins(fontSize: 13)))).toList(),
          onChanged: onChange,
        ),
      ],
    );
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _nationalityCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _emergencyContactNameCtrl.dispose();
    _emergencyContactCtrl.dispose();
    _addressCtrl.dispose();
    _cityCtrl.dispose();
    _stateCtrl.dispose();
    _countryCtrl.dispose();
    _postalCodeCtrl.dispose();
    _heightCtrl.dispose();
    _weightCtrl.dispose();
    _schoolCtrl.dispose();
    _clubCtrl.dispose();
    _jerseyNumberCtrl.dispose();
    _fatherNameCtrl.dispose();
    _motherNameCtrl.dispose();
    _guardianNameCtrl.dispose();
    super.dispose();
  }
}
