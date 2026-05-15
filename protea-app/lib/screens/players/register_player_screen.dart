import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../shared/utils/snackbar_utils.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/theme_toggle.dart';
import '../../widgets/protea_buttons.dart';
import 'player_registered_screen.dart';

class RegisterPlayerScreen extends StatefulWidget {
  const RegisterPlayerScreen({super.key});

  @override
  State<RegisterPlayerScreen> createState() => _RegisterPlayerScreenState();
}

class _RegisterPlayerScreenState extends State<RegisterPlayerScreen> {
  final _formKey = GlobalKey<FormState>();
  
  // Basic Info
  final _nameCtrl = TextEditingController();
  DateTime? _dateOfBirth;
  
  // Contact Info
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emergencyContactCtrl = TextEditingController();
  final _emergencyContactNameCtrl = TextEditingController();
  
  // Address
  final _addressCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _stateCtrl = TextEditingController();
  final _countryCtrl = TextEditingController();
  final _postalCodeCtrl = TextEditingController();
  
  // Physical Stats
  final _heightCtrl = TextEditingController();
  final _weightCtrl = TextEditingController();
  String? _bloodGroup;
  
  // Cricket Details
  final _schoolCtrl = TextEditingController();
  final _clubCtrl = TextEditingController();
  String? _battingStyle;
  String? _bowlingStyle;
  String? _playingRole;
  final _jerseyNumberCtrl = TextEditingController();
  
  // Family Info
  final _fatherNameCtrl = TextEditingController();
  final _motherNameCtrl = TextEditingController();
  final _guardianNameCtrl = TextEditingController();
  final _nationalityCtrl = TextEditingController();
  
  XFile? _pickedImage;
  bool _loading = false;

  final _picker = ImagePicker();

  Future<void> _pickImage(ImageSource source) async {
    try {
      final image = await _picker.pickImage(
        source: source,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );
      if (image != null) {
        setState(() => _pickedImage = image);
      }
    } catch (e) {
      if (mounted) {
        SnackbarUtils.showError(context, 'Could not pick image: $e');
      }
    }
  }

  void _showImageSourceDialog() {
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
              Text('Upload Player Photo',
                  style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 16),
              ListTile(
                leading: Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(Icons.camera_alt, color: AppTheme.primaryGreen),
                ),
                title: const Text('Take Photo'),
                subtitle: const Text('Use camera to take a new photo'),
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
                  child: Icon(Icons.photo_library, color: AppTheme.primaryGreen),
                ),
                title: const Text('Choose from Gallery'),
                subtitle: const Text('Select an existing photo'),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImage(ImageSource.gallery);
                },
              ),
              if (_pickedImage != null)
                ListTile(
                  leading: Container(
                    width: 44, height: 44,
                    decoration: BoxDecoration(
                      color: AppTheme.wicketRed.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.delete, color: AppTheme.wicketRed),
                  ),
                  title: const Text('Remove Photo'),
                  onTap: () {
                    Navigator.pop(ctx);
                    setState(() => _pickedImage = null);
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
      // Register player with comprehensive data
      var player = await ApiService.registerPlayer(
        name: _nameCtrl.text.trim(),
        dateOfBirth: _dateOfBirth != null
            ? DateFormat('yyyy-MM-dd').format(_dateOfBirth!)
            : null,
        email: _emailCtrl.text.trim().isNotEmpty ? _emailCtrl.text.trim() : null,
        phone: _phoneCtrl.text.trim().isNotEmpty ? _phoneCtrl.text.trim() : null,
        emergencyContact: _emergencyContactCtrl.text.trim().isNotEmpty ? _emergencyContactCtrl.text.trim() : null,
        emergencyContactName: _emergencyContactNameCtrl.text.trim().isNotEmpty ? _emergencyContactNameCtrl.text.trim() : null,
        address: _addressCtrl.text.trim().isNotEmpty ? _addressCtrl.text.trim() : null,
        city: _cityCtrl.text.trim().isNotEmpty ? _cityCtrl.text.trim() : null,
        state: _stateCtrl.text.trim().isNotEmpty ? _stateCtrl.text.trim() : null,
        country: _countryCtrl.text.trim().isNotEmpty ? _countryCtrl.text.trim() : null,
        postalCode: _postalCodeCtrl.text.trim().isNotEmpty ? _postalCodeCtrl.text.trim() : null,
        height: _heightCtrl.text.trim().isNotEmpty ? double.tryParse(_heightCtrl.text.trim()) : null,
        weight: _weightCtrl.text.trim().isNotEmpty ? double.tryParse(_weightCtrl.text.trim()) : null,
        bloodGroup: _bloodGroup,
        schoolName: _schoolCtrl.text.trim().isNotEmpty ? _schoolCtrl.text.trim() : null,
        clubName: _clubCtrl.text.trim().isNotEmpty ? _clubCtrl.text.trim() : null,
        battingStyle: _battingStyle,
        bowlingStyle: _bowlingStyle,
        playingRole: _playingRole,
        jerseyNumber: _jerseyNumberCtrl.text.trim().isNotEmpty ? int.tryParse(_jerseyNumberCtrl.text.trim()) : null,
        fatherName: _fatherNameCtrl.text.trim().isNotEmpty ? _fatherNameCtrl.text.trim() : null,
        motherName: _motherNameCtrl.text.trim().isNotEmpty ? _motherNameCtrl.text.trim() : null,
        guardianName: _guardianNameCtrl.text.trim().isNotEmpty ? _guardianNameCtrl.text.trim() : null,
        nationality: _nationalityCtrl.text.trim().isNotEmpty ? _nationalityCtrl.text.trim() : null,
      );

      // Upload photo if selected
      if (_pickedImage != null) {
        try {
          player = await ApiService.uploadPlayerPhoto(player.id, _pickedImage!.path);
        } catch (_) {
          // Player created but photo failed - still navigate to success
        }
      }

      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => PlayerRegisteredScreen(player: player)),
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
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Text('Register Player',
                    style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w700)),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // BASIC INFORMATION
                      _buildSectionHeader('Basic Information'),
                      _buildTextField('Player Name', _nameCtrl, required: true),
                      _buildDateField(),
                      _buildTextField('Nationality', _nationalityCtrl, hint: 'e.g., South African'),
                      
                      // CONTACT INFORMATION
                      _buildSectionHeader('Contact Information'),
                      _buildTextField('Email', _emailCtrl, hint: 'player@example.com', keyboardType: TextInputType.emailAddress),
                      _buildTextField('Phone', _phoneCtrl, hint: '+27 123 456 7890', keyboardType: TextInputType.phone),
                      _buildTextField('Emergency Contact Name', _emergencyContactNameCtrl, hint: 'Parent/Guardian name'),
                      _buildTextField('Emergency Contact Number', _emergencyContactCtrl, hint: '+27 123 456 7890', keyboardType: TextInputType.phone),
                      
                      // ADDRESS
                      _buildSectionHeader('Address'),
                      _buildTextField('Street Address', _addressCtrl, hint: 'Street address'),
                      Row(
                        children: [
                          Expanded(child: _buildTextField('City', _cityCtrl, hint: 'City')),
                          const SizedBox(width: 12),
                          Expanded(child: _buildTextField('Postal Code', _postalCodeCtrl, hint: 'Code', keyboardType: TextInputType.number)),
                        ],
                      ),
                      Row(
                        children: [
                          Expanded(child: _buildTextField('State/Province', _stateCtrl, hint: 'State')),
                          const SizedBox(width: 12),
                          Expanded(child: _buildTextField('Country', _countryCtrl, hint: 'Country')),
                        ],
                      ),
                      
                      // PHYSICAL STATS
                      _buildSectionHeader('Physical Stats'),
                      Row(
                        children: [
                          Expanded(child: _buildTextField('Height (cm)', _heightCtrl, hint: '175', keyboardType: TextInputType.number)),
                          const SizedBox(width: 12),
                          Expanded(child: _buildTextField('Weight (kg)', _weightCtrl, hint: '70', keyboardType: TextInputType.number)),
                        ],
                      ),
                      _buildDropdown('Blood Group', _bloodGroup, ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'], (v) => setState(() => _bloodGroup = v)),
                      
                      // CRICKET DETAILS
                      _buildSectionHeader('Cricket Details'),
                      _buildTextField('School Name', _schoolCtrl, hint: 'School name'),
                      _buildTextField('Club Name', _clubCtrl, hint: 'Club name'),
                      _buildDropdown('Playing Role', _playingRole, ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'], (v) => setState(() => _playingRole = v)),
                      _buildDropdown('Batting Style', _battingStyle, ['Right-hand bat', 'Left-hand bat'], (v) => setState(() => _battingStyle = v)),
                      _buildDropdown('Bowling Style', _bowlingStyle, ['Right-arm fast', 'Left-arm fast', 'Right-arm medium', 'Left-arm medium', 'Right-arm spin', 'Left-arm spin', 'Leg-spin', 'Off-spin'], (v) => setState(() => _bowlingStyle = v)),
                      _buildTextField('Jersey Number', _jerseyNumberCtrl, hint: 'e.g., 7', keyboardType: TextInputType.number),
                      
                      // FAMILY INFORMATION
                      _buildSectionHeader('Family Information'),
                      _buildTextField('Father Name', _fatherNameCtrl, hint: 'Father\'s full name'),
                      _buildTextField('Mother Name', _motherNameCtrl, hint: 'Mother\'s full name'),
                      _buildTextField('Guardian Name', _guardianNameCtrl, hint: 'Guardian name (if applicable)'),
                      
                      // PLAYER PHOTO
                      _buildSectionHeader('Player Photo'),
                      GestureDetector(
                        onTap: _showImageSourceDialog,
                        child: _pickedImage != null
                            ? _buildPhotoPreview()
                            : _buildPhotoPlaceholder(),
                      ),
                      
                      const SizedBox(height: 32),
                      GreenButton(
                        label: 'SAVE PLAYER',
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

  Widget _buildPhotoPlaceholder() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        border: Border.all(color: AppTheme.divider(context)),
        borderRadius: BorderRadius.circular(8),
        color: AppTheme.surfaceLight(context),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.primaryGreen,
            ),
            child: Icon(Icons.add, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 8),
          Text('+ UPLOAD PHOTO',
              style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14)),
          const SizedBox(width: 16),
          Icon(Icons.camera_alt, color: AppTheme.ts(context)),
        ],
      ),
    );
  }

  Widget _buildPhotoPreview() {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        border: Border.all(color: AppTheme.primaryGreen, width: 2),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Stack(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: Image.file(
              File(_pickedImage!.path),
              height: 160,
              width: double.infinity,
              fit: BoxFit.cover,
            ),
          ),
          Positioned(
            top: 8,
            right: 8,
            child: Row(
              children: [
                _photoActionButton(Icons.edit, 'Change', () => _showImageSourceDialog()),
                const SizedBox(width: 6),
                _photoActionButton(Icons.delete, 'Remove', () {
                  setState(() => _pickedImage = null);
                }, color: AppTheme.wicketRed),
              ],
            ),
          ),
          Positioned(
            bottom: 8,
            left: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.primaryGreen,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check, color: Colors.white, size: 14),
                  SizedBox(width: 4),
                  Text('Photo selected', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _photoActionButton(IconData icon, String label, VoidCallback onTap, {Color? color}) {
    color ??= AppTheme.primaryGreen;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: AppTheme.surface(context),
          borderRadius: BorderRadius.circular(6),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.15), blurRadius: 4)],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 3),
            Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: color)),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(top: 24, bottom: 12),
      child: Text(
        title,
        style: GoogleFonts.poppins(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: AppTheme.primaryGreen,
        ),
      ),
    );
  }

  Widget _buildTextField(
    String label,
    TextEditingController controller, {
    String? hint,
    bool required = false,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 12),
        Row(
          children: [
            Text(label, style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14)),
            if (required)
              Text(' *', style: TextStyle(color: AppTheme.wicketRed, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          decoration: InputDecoration(
            hintText: hint ?? label,
            hintStyle: TextStyle(color: AppTheme.ts(context).withValues(alpha: 0.5)),
          ),
          validator: required ? (v) => v!.isEmpty ? 'Required field' : null : null,
        ),
      ],
    );
  }

  Widget _buildDateField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 12),
        Text('Date of Birth', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14)),
        const SizedBox(height: 6),
        GestureDetector(
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: DateTime(2008, 1, 1),
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
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    _dateOfBirth != null
                        ? DateFormat('dd / MM / yyyy').format(_dateOfBirth!)
                        : 'DD / MM / YYYY',
                    style: TextStyle(
                      color: _dateOfBirth != null ? AppTheme.tp(context) : AppTheme.ts(context),
                      fontSize: 15,
                    ),
                  ),
                ),
                Icon(Icons.calendar_today, color: AppTheme.ts(context), size: 20),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdown(
    String label,
    String? value,
    List<String> options,
    Function(String?) onChanged,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 12),
        Text(label, style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14)),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: value,
          decoration: InputDecoration(
            hintText: 'Select $label',
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
          items: options.map((option) {
            return DropdownMenuItem(
              value: option,
              child: Text(option, style: GoogleFonts.poppins(fontSize: 14)),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _emergencyContactCtrl.dispose();
    _emergencyContactNameCtrl.dispose();
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
    _nationalityCtrl.dispose();
    super.dispose();
  }
}
