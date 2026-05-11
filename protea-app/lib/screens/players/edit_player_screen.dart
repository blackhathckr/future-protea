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
  late final TextEditingController _nameCtrl;
  late final TextEditingController _schoolCtrl;
  late final TextEditingController _clubCtrl;
  DateTime? _dateOfBirth;
  XFile? _pickedImage;
  bool _loading = false;
  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    final p = widget.player;
    _nameCtrl = TextEditingController(text: p.name);
    _schoolCtrl = TextEditingController(text: p.schoolName ?? '');
    _clubCtrl = TextEditingController(text: p.clubName ?? '');
    if (p.dateOfBirth != null) {
      try {
        _dateOfBirth = DateTime.parse(p.dateOfBirth!);
      } catch (_) {}
    }
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

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final updates = <String, dynamic>{
        'name': _nameCtrl.text.trim(),
        'school_name': _schoolCtrl.text.trim().isNotEmpty ? _schoolCtrl.text.trim() : null,
        'club_name': _clubCtrl.text.trim().isNotEmpty ? _clubCtrl.text.trim() : null,
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

                      Text('Player Name', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _nameCtrl,
                        decoration: const InputDecoration(hintText: 'Enter name'),
                        validator: (v) => v!.isEmpty ? 'Enter player name' : null,
                      ),
                      const SizedBox(height: 16),

                      Text('Date of Birth', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
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
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                          decoration: BoxDecoration(
                            color: AppTheme.surface(context),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppTheme.divider(context)),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  _dateOfBirth != null
                                      ? DateFormat('dd / MM / yyyy').format(_dateOfBirth!)
                                      : 'DD / MM / YYYY',
                                  style: TextStyle(
                                    color: _dateOfBirth != null ? AppTheme.tp(context) : AppTheme.ts(context),
                                    fontSize: 16,
                                  ),
                                ),
                              ),
                              Icon(Icons.calendar_today, color: AppTheme.ts(context)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      Text('School Name', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                      Text('(optional)', style: TextStyle(color: AppTheme.ts(context), fontSize: 12)),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _schoolCtrl,
                        decoration: const InputDecoration(hintText: 'Enter school name (optional)'),
                      ),
                      const SizedBox(height: 16),

                      Text('Club Name', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                      Text('(optional)', style: TextStyle(color: AppTheme.ts(context), fontSize: 12)),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _clubCtrl,
                        decoration: const InputDecoration(hintText: 'Enter club name (optional)'),
                      ),
                      const SizedBox(height: 32),

                      YellowButton(
                        label: 'SAVE CHANGES',
                        onPressed: _save,
                        loading: _loading,
                      ),
                      const SizedBox(height: 12),
                      GreenButton(
                        label: 'CANCEL',
                        onPressed: () => Navigator.pop(context),
                      ),
                      const SizedBox(height: 20),
                      // Delete Player Button
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

  @override
  void dispose() {
    _nameCtrl.dispose();
    _schoolCtrl.dispose();
    _clubCtrl.dispose();
    super.dispose();
  }
}
