import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../models/player.dart';
import '../../services/api_service.dart';
import '../../providers/auth_provider.dart';
import '../../shared/widgets/loading_state.dart';
import '../../shared/utils/snackbar_utils.dart';
import '../../providers/theme_provider.dart';
import '../../theme/app_theme.dart';
import '../support/support_screen.dart';
import '../../widgets/theme_toggle.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _dateOfBirthController = TextEditingController();
  final _battingStyleController = TextEditingController();
  final _bowlingStyleController = TextEditingController();

  DateTime? _selectedDateOfBirth;

  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isEditing = false;
  bool _isChangingPassword = false;
  bool _loading = false;

  Player? _registeredPlayer;
  bool _profileLoaded = false;

  bool _obscureCurrentPassword = true;
  bool _obscureNewPassword = true;
  bool _obscureConfirmPassword = true;

  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadUserData();
    _loadRegisteredPlayer();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _dateOfBirthController.dispose();
    _battingStyleController.dispose();
    _bowlingStyleController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _loadUserData() {
    final user = context.read<AuthProvider>().user;
    if (user != null) {
      _nameController.text = user.name;
      _phoneController.text = user.phone ?? '';
      _selectedDateOfBirth = user.dateOfBirth;
      if (user.dateOfBirth != null) {
        _dateOfBirthController.text = _formatDate(user.dateOfBirth!);
      }
      _battingStyleController.text = user.battingStyle ?? '';
      _bowlingStyleController.text = user.bowlingStyle ?? '';
    }
  }

  Future<void> _loadRegisteredPlayer() async {
    try {
      final data = await ApiService.getMyProfile();
      final rpData = data['registered_player'];
      if (rpData != null && mounted) {
        setState(() {
          _registeredPlayer = Player.fromJson(rpData as Map<String, dynamic>);
          _profileLoaded = true;
        });
      } else if (mounted) {
        setState(() => _profileLoaded = true);
      }
    } catch (_) {
      if (mounted) setState(() => _profileLoaded = true);
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);

    if (pickedFile != null) {
      setState(() => _loading = true);
      try {
        final updatedUser = await ApiService.uploadProfilePhoto(pickedFile.path);
        if (mounted) {
          context.read<AuthProvider>().setUser(updatedUser);
          SnackbarUtils.showSuccess(context, 'Profile photo updated successfully');
        }
      } catch (e) {
        if (mounted) {
          SnackbarUtils.showError(context, 'Failed to upload photo: $e');
        }
      } finally {
        if (mounted) setState(() => _loading = false);
      }
    }
  }

  Future<void> _deletePhoto() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Photo'),
        content: const Text('Are you sure you want to delete your profile photo?'),
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
      final updatedUser = await ApiService.deleteProfilePhoto();
      if (mounted) {
        context.read<AuthProvider>().setUser(updatedUser);
        SnackbarUtils.showSuccess(context, 'Photo deleted successfully');
      }
    } catch (e) {
      if (mounted) {
        SnackbarUtils.showError(context, 'Failed to delete photo: $e');
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _updateProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);
    try {
      final user = context.read<AuthProvider>().user;
      final updatedUser = await ApiService.updateProfile(
        name: _nameController.text,
        phone: _phoneController.text.isEmpty ? null : _phoneController.text,
        dateOfBirth: _selectedDateOfBirth,
        battingStyle: user?.role == 'player' && _battingStyleController.text.isNotEmpty
            ? _battingStyleController.text
            : null,
        bowlingStyle: user?.role == 'player' && _bowlingStyleController.text.isNotEmpty
            ? _bowlingStyleController.text
            : null,
      );
      if (mounted) {
        context.read<AuthProvider>().setUser(updatedUser);
        setState(() => _isEditing = false);
        SnackbarUtils.showSuccess(context, 'Profile updated successfully');
      }
    } catch (e) {
      if (mounted) {
        SnackbarUtils.showError(context, 'Failed to update profile: $e');
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _changePassword() async {
    if (_newPasswordController.text != _confirmPasswordController.text) {
      SnackbarUtils.showInfo(context, 'New passwords do not match');
      return;
    }

    if (_newPasswordController.text.length < 6) {
      SnackbarUtils.showInfo(context, 'Password must be at least 6 characters');
      return;
    }

    setState(() => _loading = true);
    try {
      await ApiService.changePassword(
        currentPassword: _currentPasswordController.text,
        newPassword: _newPasswordController.text,
      );
      if (mounted) {
        setState(() => _isChangingPassword = false);
        _currentPasswordController.clear();
        _newPasswordController.clear();
        _confirmPasswordController.clear();
        SnackbarUtils.showSuccess(context, 'Password changed successfully');
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
    final user = context.watch<AuthProvider>().user;
    if (user == null) {
      return const SizedBox.shrink();
    }
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: NestedScrollView(
        headerSliverBuilder: (context, _) => [
          SliverAppBar(
            expandedHeight: 260,
            pinned: true,
            automaticallyImplyLeading: false,
            backgroundColor: AppTheme.darkGreen,
            actions: [
              Consumer<ThemeProvider>(
                builder: (_, theme, __) => IconButton(
                  icon: Icon(
                    theme.isDark ? Icons.light_mode : Icons.dark_mode,
                    color: Colors.white,
                  ),
                  tooltip: theme.isDark ? 'Light mode' : 'Dark mode',
                  onPressed: theme.toggle,
                ),
              ),
              const AppearanceButton(),
            ],
            flexibleSpace: FlexibleSpaceBar(
              collapseMode: CollapseMode.pin,
              background: Container(
                decoration: BoxDecoration(
                  gradient: AppTheme.headerGradient,
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 52),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Avatar with gold border + camera overlay
                        GestureDetector(
                          onTap: _pickImage,
                          child: Stack(
                            children: [
                              Container(
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(color: AppTheme.accentGold, width: 3),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.3),
                                      blurRadius: 12,
                                      spreadRadius: 2,
                                    ),
                                  ],
                                ),
                                child: Builder(builder: (_) {
                                  final effectivePhoto = (user.photoUrl != null && user.photoUrl!.isNotEmpty)
                                      ? user.photoUrl!
                                      : (_registeredPlayer?.photoUrl != null && _registeredPlayer!.photoUrl!.isNotEmpty
                                          ? _registeredPlayer!.photoUrl!
                                          : null);
                                  return CircleAvatar(
                                    radius: 44,
                                    backgroundColor: AppTheme.primaryGreen,
                                    backgroundImage: effectivePhoto != null
                                        ? NetworkImage(ApiService.getPhotoUrl(effectivePhoto))
                                        : null,
                                    child: effectivePhoto == null
                                        ? Text(
                                            user.name[0].toUpperCase(),
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 32,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          )
                                        : null,
                                  );
                                }),
                              ),
                              Positioned(
                                bottom: 0,
                                right: 0,
                                child: Container(
                                  padding: const EdgeInsets.all(5),
                                  decoration: BoxDecoration(
                                    color: AppTheme.accentGold,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.white, width: 2),
                                  ),
                                  child: Icon(
                                    Icons.camera_alt,
                                    color: AppTheme.darkGreen,
                                    size: 14,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          user.name,
                          style: GoogleFonts.poppins(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        _RoleBadge(role: user.role),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            bottom: TabBar(
              controller: _tabController,
              indicatorColor: AppTheme.accentGold,
              indicatorWeight: 3,
              labelColor: AppTheme.accentGold,
              unselectedLabelColor: Colors.white70,
              labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13),
              tabs: const [
                Tab(icon: Icon(Icons.person_outline, size: 18), text: 'Profile'),
                Tab(icon: Icon(Icons.lock_outline, size: 18), text: 'Security'),
              ],
            ),
          ),
        ],
        body: _loading
            ? LoadingState(label: 'Saving...')
            : TabBarView(
                controller: _tabController,
                children: [
                  // ── Tab 1: Profile ──────────────────────────────────────
                  SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Remove photo button (only when photo exists)
                        if (user.photoUrl != null && user.photoUrl!.isNotEmpty)
                          Align(
                            alignment: Alignment.center,
                            child: TextButton.icon(
                              onPressed: _deletePhoto,
                              icon: const Icon(Icons.delete_outline,
                                  color: AppTheme.wicketRed, size: 16),
                              label: Text('Remove profile photo',
                                  style: GoogleFonts.poppins(
                                      fontSize: 12,
                                      color: AppTheme.wicketRed,
                                      fontWeight: FontWeight.w500)),
                              style: TextButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 6),
                                side: const BorderSide(
                                    color: AppTheme.wicketRed, width: 0.8),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(20)),
                              ),
                            ),
                          ),
                        if (user.photoUrl != null && user.photoUrl!.isNotEmpty)
                          const SizedBox(height: 12),
                        // Quick info pills row
                        Row(
                          children: [
                            if (user.email.isNotEmpty)
                              Flexible(
                                child: _InfoPill(
                                  icon: Icons.email_outlined,
                                  label: user.email,
                                  isDark: isDark,
                                ),
                              ),
                          ],
                        ).animate().fadeIn(duration: 300.ms),
                        if (user.phone != null && user.phone!.isNotEmpty) ...
                          [
                            const SizedBox(height: 8),
                            _InfoPill(
                              icon: Icons.phone_outlined,
                              label: user.phone!,
                              isDark: isDark,
                            ).animate().fadeIn(duration: 300.ms, delay: 50.ms),
                          ],
                        if (user.dateOfBirth != null) ...
                          [
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Expanded(
                                  child: _InfoPill(
                                    icon: Icons.cake_outlined,
                                    label: _formatDate(user.dateOfBirth!),
                                    isDark: isDark,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: _InfoPill(
                                    icon: Icons.person_outline,
                                    label: '${_calculateAge(user.dateOfBirth!)} yrs old',
                                    isDark: isDark,
                                  ),
                                ),
                              ],
                            ).animate().fadeIn(duration: 300.ms, delay: 100.ms),
                          ],
                        if (user.createdAt != null) ...
                          [
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Expanded(
                                  child: _InfoPill(
                                    icon: Icons.calendar_today_outlined,
                                    label: 'Since ${_formatDate(user.createdAt!)}',
                                    isDark: isDark,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: _InfoPill(
                                    icon: Icons.access_time,
                                    label: _getAccountAge(user.createdAt!),
                                    isDark: isDark,
                                  ),
                                ),
                              ],
                            ).animate().fadeIn(duration: 300.ms, delay: 150.ms),
                          ],
                        if (user.lastLogin != null) ...
                          [
                            const SizedBox(height: 8),
                            _InfoPill(
                              icon: Icons.login,
                              label: 'Last login: ${_formatDateTime(user.lastLogin!)}',
                              isDark: isDark,
                            ).animate().fadeIn(duration: 300.ms, delay: 200.ms),
                          ],

                        const SizedBox(height: 24),

                        // Complete profile banner
                        if (_profileLoaded && user.role == 'player') ...[
                          if (_registeredPlayer == null)
                            _buildCompleteProfileBanner(noRecord: true),
                          if (_registeredPlayer != null && _isProfileIncomplete(_registeredPlayer!))
                            _buildCompleteProfileBanner(noRecord: false),
                        ],

                        // Registered player info card (read-only)
                        if (_registeredPlayer != null) ...[  
                          _buildRegisteredPlayerCard(_registeredPlayer!),
                          const SizedBox(height: 16),
                        ],

                        // Edit form
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Form(
                              key: _formKey,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text('Edit Information',
                                          style: GoogleFonts.poppins(
                                              fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.tp(context))),
                                      if (!_isEditing)
                                        FilledButton.tonal(
                                          onPressed: () => setState(() => _isEditing = true),
                                          style: FilledButton.styleFrom(
                                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                            minimumSize: Size.zero,
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              const Icon(Icons.edit, size: 15),
                                              const SizedBox(width: 4),
                                              Text('Edit', style: GoogleFonts.poppins(fontSize: 13)),
                                            ],
                                          ),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 16),
                                  TextFormField(
                                    controller: _nameController,
                                    enabled: _isEditing,
                                    decoration: InputDecoration(
                                      labelText: 'Full Name',
                                      labelStyle: TextStyle(color: AppTheme.ts(context)),
                                      prefixIcon: Icon(Icons.person_outline, color: AppTheme.ts(context)),
                                    ),
                                    validator: (v) => v == null || v.isEmpty ? 'Name is required' : null,
                                  ),
                                  const SizedBox(height: 12),
                                  TextFormField(
                                    controller: _phoneController,
                                    enabled: _isEditing,
                                    keyboardType: TextInputType.phone,
                                    decoration: InputDecoration(
                                      labelText: 'Phone Number',
                                      labelStyle: TextStyle(color: AppTheme.ts(context)),
                                      prefixIcon: Icon(Icons.phone_outlined, color: AppTheme.ts(context)),
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  TextFormField(
                                    controller: _dateOfBirthController,
                                    enabled: _isEditing,
                                    readOnly: true,
                                    decoration: InputDecoration(
                                      labelText: 'Date of Birth',
                                      labelStyle: TextStyle(color: AppTheme.ts(context)),
                                      prefixIcon: Icon(Icons.cake_outlined, color: AppTheme.ts(context)),
                                      suffixIcon: Icon(Icons.calendar_today, size: 18, color: AppTheme.ts(context)),
                                    ),
                                    onTap: _isEditing
                                        ? () async {
                                            final date = await showDatePicker(
                                              context: context,
                                              initialDate: _selectedDateOfBirth ??
                                                  DateTime.now().subtract(const Duration(days: 365 * 18)),
                                              firstDate: DateTime(1950),
                                              lastDate: DateTime.now(),
                                            );
                                            if (date != null) {
                                              setState(() {
                                                _selectedDateOfBirth = date;
                                                _dateOfBirthController.text = _formatDate(date);
                                              });
                                            }
                                          }
                                        : null,
                                  ),
                                  if (user.role == 'player') ...[
                                    const SizedBox(height: 12),
                                    TextFormField(
                                      controller: _battingStyleController,
                                      enabled: _isEditing,
                                      decoration: const InputDecoration(
                                        labelText: 'Batting Style',
                                        prefixIcon: Icon(Icons.sports_cricket),
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    TextFormField(
                                      controller: _bowlingStyleController,
                                      enabled: _isEditing,
                                      decoration: const InputDecoration(
                                        labelText: 'Bowling Style',
                                        prefixIcon: Icon(Icons.sports_baseball),
                                      ),
                                    ),
                                  ],
                                  if (_isEditing) ...[
                                    const SizedBox(height: 16),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: OutlinedButton(
                                            onPressed: () {
                                              setState(() => _isEditing = false);
                                              _loadUserData();
                                            },
                                            child: const Text('Cancel'),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: ElevatedButton(
                                            onPressed: _updateProfile,
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: AppTheme.primaryGreen,
                                              foregroundColor: Colors.white,
                                            ),
                                            child: const Text('Save Changes'),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        ).animate().fadeIn(duration: 350.ms, delay: 100.ms),

                        // ── Help & Support card ─────────────────────────────
                        const SizedBox(height: 16),
                        Card(
                          child: InkWell(
                            borderRadius: BorderRadius.circular(12),
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => const SupportScreen()),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                children: [
                                  Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color: AppTheme.primaryGreen
                                          .withValues(alpha: 0.10),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Icon(
                                      Icons.help_outline,
                                      color: AppTheme.primaryGreen,
                                      size: 22,
                                    ),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Help & Support',
                                          style: GoogleFonts.poppins(
                                            fontSize: 15,
                                            fontWeight: FontWeight.w700,
                                            color:
                                                AppTheme.tp(context),
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          'Raise a ticket, view past tickets, or contact us.',
                                          style: GoogleFonts.poppins(
                                            fontSize: 11,
                                            color: AppTheme.ts(context),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Icon(
                                    Icons.chevron_right,
                                    color: AppTheme.ts(context),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ).animate().fadeIn(duration: 350.ms, delay: 200.ms),
                      ],
                    ),
                  ),

                  // ── Tab 2: Security ─────────────────────────────────────
                  SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                    child: Column(
                      children: [
                        // Change Password card
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: AppTheme.accentAmber.withValues(alpha: 0.12),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Icon(Icons.lock_outline, color: AppTheme.accentAmber, size: 20),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text('Change Password',
                                          style: GoogleFonts.poppins(
                                              fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.tp(context))),
                                    ),
                                    if (!_isChangingPassword)
                                      FilledButton.tonal(
                                        onPressed: () => setState(() => _isChangingPassword = true),
                                        style: FilledButton.styleFrom(
                                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                          minimumSize: Size.zero,
                                        ),
                                        child: Text('Change', style: GoogleFonts.poppins(fontSize: 13)),
                                      ),
                                  ],
                                ),
                                if (!_isChangingPassword) ...[
                                  const SizedBox(height: 12),
                                  Text('Keep your account secure with a strong password.',
                                      style: GoogleFonts.poppins(
                                          fontSize: 13, color: AppTheme.ts(context))),
                                ],
                                if (_isChangingPassword) ...[
                                  const SizedBox(height: 16),
                                  TextFormField(
                                    controller: _currentPasswordController,
                                    obscureText: _obscureCurrentPassword,
                                    decoration: InputDecoration(
                                      labelText: 'Current Password',
                                      prefixIcon: const Icon(Icons.lock_outline),
                                      suffixIcon: IconButton(
                                        icon: Icon(_obscureCurrentPassword
                                            ? Icons.visibility_off
                                            : Icons.visibility),
                                        onPressed: () => setState(
                                            () => _obscureCurrentPassword = !_obscureCurrentPassword),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  TextFormField(
                                    controller: _newPasswordController,
                                    obscureText: _obscureNewPassword,
                                    decoration: InputDecoration(
                                      labelText: 'New Password',
                                      prefixIcon: const Icon(Icons.lock),
                                      suffixIcon: IconButton(
                                        icon: Icon(_obscureNewPassword
                                            ? Icons.visibility_off
                                            : Icons.visibility),
                                        onPressed: () => setState(
                                            () => _obscureNewPassword = !_obscureNewPassword),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  TextFormField(
                                    controller: _confirmPasswordController,
                                    obscureText: _obscureConfirmPassword,
                                    decoration: InputDecoration(
                                      labelText: 'Confirm New Password',
                                      prefixIcon: const Icon(Icons.lock),
                                      suffixIcon: IconButton(
                                        icon: Icon(_obscureConfirmPassword
                                            ? Icons.visibility_off
                                            : Icons.visibility),
                                        onPressed: () => setState(
                                            () => _obscureConfirmPassword = !_obscureConfirmPassword),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: OutlinedButton(
                                          onPressed: () {
                                            setState(() => _isChangingPassword = false);
                                            _currentPasswordController.clear();
                                            _newPasswordController.clear();
                                            _confirmPasswordController.clear();
                                          },
                                          child: const Text('Cancel'),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: ElevatedButton(
                                          onPressed: _changePassword,
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: AppTheme.primaryGreen,
                                            foregroundColor: Colors.white,
                                          ),
                                          child: const Text('Update'),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ).animate().fadeIn(duration: 350.ms),

                        const SizedBox(height: 16),

                        // Danger zone — logout
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: AppTheme.wicketRed.withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: const Icon(Icons.logout, color: AppTheme.wicketRed, size: 20),
                                    ),
                                    const SizedBox(width: 12),
                                    Text('Sign Out',
                                        style: GoogleFonts.poppins(
                                            fontSize: 15, fontWeight: FontWeight.w700)),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text('You will be returned to the login screen.',
                                    style: GoogleFonts.poppins(
                                        fontSize: 13, color: AppTheme.ts(context))),
                                const SizedBox(height: 12),
                                SizedBox(
                                  width: double.infinity,
                                  child: OutlinedButton.icon(
                                    onPressed: () => _confirmLogout(context),
                                    icon: const Icon(Icons.logout, color: AppTheme.wicketRed),
                                    label: Text('Logout',
                                        style: GoogleFonts.poppins(
                                            color: AppTheme.wicketRed, fontWeight: FontWeight.w600)),
                                    style: OutlinedButton.styleFrom(
                                      side: const BorderSide(color: AppTheme.wicketRed),
                                      padding: const EdgeInsets.symmetric(vertical: 12),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ).animate().fadeIn(duration: 350.ms, delay: 100.ms),
                      ],
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  bool _isProfileIncomplete(Player p) {
    final filled = [
      p.phone, p.address, p.city, p.schoolName, p.clubName,
      p.battingStyle, p.bowlingStyle, p.playingRole,
      p.fatherName, p.motherName,
    ].where((v) => v != null && v.isNotEmpty).length;
    return filled < 3;
  }

  Widget _buildCompleteProfileBanner({required bool noRecord}) {
    final message = noRecord
        ? 'Your cricket profile is not set up yet. Ask your coach/feeder to register you, or complete your details below so your stats and info are fully visible.'
        : 'Your profile is missing some details. Please fill in your address, school, batting/bowling style, family info, etc. to complete your cricket profile.';
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.accentAmber.withValues(alpha: 0.15), AppTheme.primaryGreen.withValues(alpha: 0.10)],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.accentAmber.withValues(alpha: 0.5)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline, color: AppTheme.accentAmber, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: GoogleFonts.poppins(fontSize: 12.5, color: AppTheme.accentAmber, fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 300.ms);
  }

  Widget _buildRegisteredPlayerCard(Player p) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(7),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryGreen.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.sports_cricket, color: AppTheme.primaryGreen, size: 18),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text('Cricket Profile',
                      style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.tp(context))),
                ),
                if (p.playerId != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.primaryGreen.withValues(alpha: 0.35)),
                    ),
                    child: Text(p.playerId!,
                        style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.primaryGreen)),
                  ),
              ],
            ),
            const SizedBox(height: 14),
            // Cricket Details
            _rpSection('Cricket Details', [
              _rpRow(Icons.sports_cricket, 'Batting Style', p.battingStyle),
              _rpRow(Icons.sports_baseball, 'Bowling Style', p.bowlingStyle),
              _rpRow(Icons.person_pin_circle_outlined, 'Playing Role', p.playingRole),
              _rpRow(Icons.tag, 'Jersey Number', p.jerseyNumber?.toString()),
              _rpRow(Icons.school_outlined, 'School', p.schoolName),
              _rpRow(Icons.group_outlined, 'Club', p.clubName),
            ]),
            // Contact & Address
            _rpSection('Contact & Address', [
              _rpRow(Icons.location_city_outlined, 'City', p.city),
              _rpRow(Icons.map_outlined, 'State', p.state),
              _rpRow(Icons.public_outlined, 'Country', p.country),
              _rpRow(Icons.home_outlined, 'Address', p.address),
              _rpRow(Icons.markunread_mailbox_outlined, 'Postal Code', p.postalCode),
              _rpRow(Icons.phone_outlined, 'Emergency Contact', p.emergencyContact),
              _rpRow(Icons.contact_emergency_outlined, 'Emergency Name', p.emergencyContactName),
            ]),
            // Physical Stats
            _rpSection('Physical', [
              _rpRow(Icons.height, 'Height', p.height != null ? '${p.height} cm' : null),
              _rpRow(Icons.monitor_weight_outlined, 'Weight', p.weight != null ? '${p.weight} kg' : null),
              _rpRow(Icons.bloodtype_outlined, 'Blood Group', p.bloodGroup),
              _rpRow(Icons.flag_outlined, 'Nationality', p.nationality),
            ]),
            // Family
            _rpSection('Family', [
              _rpRow(Icons.person_outlined, 'Father', p.fatherName),
              _rpRow(Icons.person_outlined, 'Mother', p.motherName),
              _rpRow(Icons.person_outlined, 'Guardian', p.guardianName),
            ]),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 350.ms, delay: 80.ms);
  }

  Widget _rpSection(String title, List<_RpEntry> entries) {
    final visible = entries.where((e) => e.value != null && e.value!.isNotEmpty).toList();
    if (visible.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 4, bottom: 6),
          child: Text(title,
              style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w700,
                  color: AppTheme.primaryGreen, letterSpacing: 0.5)),
        ),
        ...visible.map((e) => _buildRpRow(e.icon, e.label, e.value!)),
        const SizedBox(height: 8),
      ],
    );
  }

  _RpEntry _rpRow(IconData icon, String label, String? value) => _RpEntry(icon, label, value);

  Widget _buildRpRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 15, color: AppTheme.primaryGreen),
          const SizedBox(width: 8),
          SizedBox(
            width: 110,
            child: Text(label,
                style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.ts(context))),
          ),
          Expanded(
            child: Text(value,
                style: GoogleFonts.poppins(fontSize: 12, color: AppTheme.ts(context))),
          ),
        ],
      ),
    );
  }

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final navigator = Navigator.of(context);
              navigator.popUntil((route) => route.isFirst);
              await context.read<AuthProvider>().logout();
            },
            child: const Text('Logout', style: TextStyle(color: AppTheme.wicketRed)),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }

  String _formatDateTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    // If within last minute
    if (difference.inSeconds < 60) {
      return 'Just now';
    }
    // If within last hour
    else if (difference.inMinutes < 60) {
      final mins = difference.inMinutes;
      return '$mins ${mins == 1 ? 'minute' : 'minutes'} ago';
    }
    // If within last 24 hours
    else if (difference.inHours < 24) {
      final hours = difference.inHours;
      return '$hours ${hours == 1 ? 'hour' : 'hours'} ago';
    }
    // If within last 7 days
    else if (difference.inDays < 7) {
      final days = difference.inDays;
      return '$days ${days == 1 ? 'day' : 'days'} ago';
    }
    // Otherwise show full date and time
    else {
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      final hour = dateTime.hour > 12 ? dateTime.hour - 12 : (dateTime.hour == 0 ? 12 : dateTime.hour);
      final period = dateTime.hour >= 12 ? 'PM' : 'AM';
      final minute = dateTime.minute.toString().padLeft(2, '0');
      return '${months[dateTime.month - 1]} ${dateTime.day}, ${dateTime.year} at $hour:$minute $period';
    }
  }

  int _calculateAge(DateTime birthDate) {
    final now = DateTime.now();
    int age = now.year - birthDate.year;
    if (now.month < birthDate.month || (now.month == birthDate.month && now.day < birthDate.day)) {
      age--;
    }
    return age;
  }

  String _getAccountAge(DateTime createdAt) {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

    if (difference.inDays < 30) {
      return '${difference.inDays} days';
    } else if (difference.inDays < 365) {
      final months = (difference.inDays / 30).floor();
      return '$months ${months == 1 ? 'month' : 'months'}';
    } else {
      final years = (difference.inDays / 365).floor();
      final remainingMonths = ((difference.inDays % 365) / 30).floor();
      if (remainingMonths == 0) {
        return '$years ${years == 1 ? 'year' : 'years'}';
      }
      return '$years ${years == 1 ? 'year' : 'years'}, $remainingMonths ${remainingMonths == 1 ? 'month' : 'months'}';
    }
  }

}

class _RoleBadge extends StatelessWidget {
  final String role;
  const _RoleBadge({required this.role});

  @override
  Widget build(BuildContext context) {
    Color color;
    IconData icon;
    switch (role) {
      case 'feeder':
        color = AppTheme.primaryGreen;
        icon = Icons.edit_note;
        break;
      case 'player':
        color = AppTheme.upcomingBlue;
        icon = Icons.sports_cricket;
        break;
      case 'viewer':
        color = AppTheme.accentAmber;
        icon = Icons.visibility;
        break;
      case 'admin':
        color = AppTheme.team2Color;
        icon = Icons.admin_panel_settings;
        break;
      default:
        color = AppTheme.textSecondary;
        icon = Icons.person;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.25),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.6)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: Colors.white),
          const SizedBox(width: 4),
          Text(
            role.toUpperCase(),
            style: GoogleFonts.poppins(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: Colors.white,
              letterSpacing: 0.8,
            ),
          ),
        ],
      ),
    );
  }
}

class _RpEntry {
  final IconData icon;
  final String label;
  final String? value;
  const _RpEntry(this.icon, this.label, this.value);
}

class _InfoPill extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isDark;
  const _InfoPill({required this.icon, required this.label, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: isDark
            ? AppTheme.darkSurfaceCardLight
            : AppTheme.surfaceCardLight,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isDark
              ? const Color(0xFF424242)
              : const Color(0xFFE0E0E0),
        ),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: AppTheme.primaryGreen),
          const SizedBox(width: 10),
          Flexible(
            child: Text(
              label,
              style: GoogleFonts.poppins(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: isDark ? AppTheme.darkTextPrimary : AppTheme.textPrimary,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
