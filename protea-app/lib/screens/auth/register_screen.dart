import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../shared/utils/snackbar_utils.dart';
import '../../providers/theme_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/protea_header.dart';
import '../core/home_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();
  DateTime? _dateOfBirth;
  String _selectedRole = 'viewer';
  bool _loading = false;
  bool _obscure = true;
  bool _obscureConfirm = true;
  bool _agreeTerms = false;

  final _roles = [
    {
      'value': 'viewer',
      'label': 'Viewer',
      'icon': Icons.visibility,
      'desc': 'Watch live matches & view scores',
    },
    {
      'value': 'player',
      'label': 'Player',
      'icon': Icons.sports_cricket,
      'desc': 'Join matches & track your journey',
    },
    {
      'value': 'feeder',
      'label': 'Score Feeder',
      'icon': Icons.edit_note,
      'desc': 'Manage matches, teams & score',
    },
  ];

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_agreeTerms) {
      SnackbarUtils.showError(context, 'Please agree to the Terms and Conditions');
      return;
    }
    setState(() => _loading = true);
    try {
      await context.read<AuthProvider>().register(
            name: _nameCtrl.text.trim(),
            email: _emailCtrl.text.trim(),
            password: _passwordCtrl.text,
            role: _selectedRole,
            dateOfBirth: _dateOfBirth != null
                ? DateFormat('yyyy-MM-dd').format(_dateOfBirth!)
                : null,
          );
      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const HomeScreen()),
          (_) => false,
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

  InputDecoration _fieldDecoration({
    required String label,
    required IconData prefix,
    Widget? suffix,
    bool isDark = false,
  }) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(prefix, color: AppTheme.primaryGreen, size: 20),
      suffixIcon: suffix,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide:
            BorderSide(color: isDark ? Colors.white24 : Colors.black12),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide:
            const BorderSide(color: AppTheme.primaryGreen, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppTheme.wicketRed),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppTheme.wicketRed, width: 2),
      ),
      filled: true,
      fillColor: isDark
          ? Colors.white.withValues(alpha: 0.04)
          : Colors.grey.shade50,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      body: SafeArea(
        top: false,
        child: SingleChildScrollView(
          child: Column(
            children: [
              // ── Header banner ──────────────────────────────────────
              Stack(
                children: [
                  const ProteaHeader(height: 185),
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
                    child: Consumer<ThemeProvider>(
                      builder: (context, theme, _) => IconButton(
                        icon: Icon(
                          theme.isDark ? Icons.light_mode : Icons.dark_mode,
                          color: Colors.white,
                        ),
                        onPressed: theme.toggle,
                      ),
                    ),
                  ),
                ],
              ),

              // ── Form card ──────────────────────────────────────────
              Transform.translate(
                offset: const Offset(0, -24),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Card(
                    elevation: 6,
                    shadowColor: Colors.black26,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20)),
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Title
                            Text(
                              'Create Account',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.poppins(
                                fontSize: 22,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.tp(context),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Join Future Protea today',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.poppins(
                                fontSize: 13,
                                color: AppTheme.ts(context),
                              ),
                            ),
                            const SizedBox(height: 24),

                            // ─ Role selection ───────────────────────────
                            Text(
                              'I am a…',
                              style: GoogleFonts.poppins(
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                                color: AppTheme.ts(context),
                              ),
                            ),
                            const SizedBox(height: 8),
                            ...List.generate(_roles.length, (i) {
                              final role = _roles[i];
                              final selected =
                                  _selectedRole == role['value'];
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: GestureDetector(
                                  onTap: () => setState(
                                      () => _selectedRole =
                                          role['value'] as String),
                                  child: AnimatedContainer(
                                    duration:
                                        const Duration(milliseconds: 200),
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 14, vertical: 10),
                                    decoration: BoxDecoration(
                                      color: selected
                                          ? AppTheme.primaryGreen
                                              .withValues(alpha: 0.08)
                                          : isDark
                                              ? Colors.white
                                                  .withValues(alpha: 0.04)
                                              : Colors.grey.shade50,
                                      borderRadius:
                                          BorderRadius.circular(12),
                                      border: Border.all(
                                        color: selected
                                            ? AppTheme.primaryGreen
                                            : isDark
                                                ? Colors.white24
                                                : Colors.black12,
                                        width: selected ? 2 : 1,
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(7),
                                          decoration: BoxDecoration(
                                            color: selected
                                                ? AppTheme.primaryGreen
                                                    .withValues(alpha: 0.15)
                                                : AppTheme.primaryGreen
                                                    .withValues(alpha: 0.07),
                                            shape: BoxShape.circle,
                                          ),
                                          child: Icon(
                                            role['icon'] as IconData,
                                            color: selected
                                                ? AppTheme.primaryGreen
                                                : AppTheme.textSecondary,
                                            size: 20,
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                role['label'] as String,
                                                style: GoogleFonts.poppins(
                                                  fontWeight: FontWeight.w600,
                                                  fontSize: 13,
                                                  color: selected
                                                      ? AppTheme.primaryGreen
                                                      : AppTheme.tp(context),
                                                ),
                                              ),
                                              Text(
                                                role['desc'] as String,
                                                style: GoogleFonts.poppins(
                                                  fontSize: 11,
                                                  color: AppTheme.ts(context),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        if (selected)
                                          const Icon(
                                            Icons.check_circle,
                                            color: AppTheme.primaryGreen,
                                            size: 20,
                                          ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            }),
                            const SizedBox(height: 16),

                            // ─ Personal fields ───────────────────────
                            TextFormField(
                              controller: _nameCtrl,
                              textCapitalization:
                                  TextCapitalization.words,
                              decoration: _fieldDecoration(
                                label: 'Full Name',
                                prefix: Icons.person_outline,
                                isDark: isDark,
                              ),
                              validator: (v) =>
                                  v!.isEmpty ? 'Enter your name' : null,
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              controller: _emailCtrl,
                              keyboardType: TextInputType.emailAddress,
                              decoration: _fieldDecoration(
                                label: 'Email',
                                prefix: Icons.email_outlined,
                                isDark: isDark,
                              ),
                              validator: (v) =>
                                  v!.isEmpty ? 'Enter your email' : null,
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              controller: _passwordCtrl,
                              obscureText: _obscure,
                              decoration: _fieldDecoration(
                                label: 'Password',
                                prefix: Icons.lock_outline,
                                isDark: isDark,
                                suffix: IconButton(
                                  icon: Icon(
                                    _obscure
                                        ? Icons.visibility_off_outlined
                                        : Icons.visibility_outlined,
                                    color: AppTheme.ts(context),
                                    size: 20,
                                  ),
                                  onPressed: () => setState(
                                      () => _obscure = !_obscure),
                                ),
                              ),
                              validator: (v) => v != null && v.length < 6
                                  ? 'Min 6 characters'
                                  : null,
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              controller: _confirmPasswordCtrl,
                              obscureText: _obscureConfirm,
                              decoration: _fieldDecoration(
                                label: 'Confirm Password',
                                prefix: Icons.lock_outline,
                                isDark: isDark,
                                suffix: IconButton(
                                  icon: Icon(
                                    _obscureConfirm
                                        ? Icons.visibility_off_outlined
                                        : Icons.visibility_outlined,
                                    color: AppTheme.ts(context),
                                    size: 20,
                                  ),
                                  onPressed: () => setState(
                                      () =>
                                          _obscureConfirm = !_obscureConfirm),
                                ),
                              ),
                              validator: (v) =>
                                  v != _passwordCtrl.text
                                      ? 'Passwords do not match'
                                      : null,
                            ),
                            const SizedBox(height: 12),

                            // ─ Date of Birth ────────────────────────
                            GestureDetector(
                              onTap: () async {
                                final picked = await showDatePicker(
                                  context: context,
                                  initialDate: DateTime(2000, 1, 1),
                                  firstDate: DateTime(1950),
                                  lastDate: DateTime.now(),
                                  builder: (context, child) =>
                                      Theme(
                                    data: Theme.of(context).copyWith(
                                      colorScheme: const ColorScheme.light(
                                        primary: AppTheme.primaryGreen,
                                      ),
                                    ),
                                    child: child!,
                                  ),
                                );
                                if (picked != null)
                                  setState(() => _dateOfBirth = picked);
                              },
                              child: Container(
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 14, vertical: 15),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? Colors.white.withValues(alpha: 0.04)
                                      : Colors.grey.shade50,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isDark
                                        ? Colors.white24
                                        : Colors.black12,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.cake_outlined,
                                        color: AppTheme.primaryGreen,
                                        size: 20),
                                    const SizedBox(width: 12),
                                    Text(
                                      _dateOfBirth != null
                                          ? DateFormat('dd MMM yyyy')
                                              .format(_dateOfBirth!)
                                          : 'Date of Birth (optional)',
                                      style: GoogleFonts.poppins(
                                        fontSize: 14,
                                        color: _dateOfBirth != null
                                            ? AppTheme.tp(context)
                                            : AppTheme.ts(context),
                                      ),
                                    ),
                                    const Spacer(),
                                    Icon(Icons.calendar_today_outlined,
                                        size: 16,
                                        color: AppTheme.ts(context)),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),

                            // ─ Terms checkbox ──────────────────────
                            Row(
                              crossAxisAlignment:
                                  CrossAxisAlignment.center,
                              children: [
                                SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: Checkbox(
                                    value: _agreeTerms,
                                    onChanged: (v) => setState(
                                        () => _agreeTerms = v ?? false),
                                    activeColor: AppTheme.primaryGreen,
                                    shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(4)),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: RichText(
                                    text: TextSpan(
                                      style: GoogleFonts.poppins(
                                          fontSize: 12,
                                          color: AppTheme.ts(context)),
                                      children: [
                                        const TextSpan(
                                            text: 'I agree to the '),
                                        TextSpan(
                                          text: 'Terms & Conditions',
                                          style: GoogleFonts.poppins(
                                            fontWeight: FontWeight.w700,
                                            color: AppTheme.primaryGreen,
                                            decoration:
                                                TextDecoration.underline,
                                            decorationColor:
                                                AppTheme.primaryGreen,
                                          ),
                                        ),
                                        const TextSpan(
                                            text: ' and Privacy Policy'),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),

                            // ─ Sign Up button ───────────────────────
                            SizedBox(
                              height: 52,
                              child: ElevatedButton(
                                onPressed: _loading ? null : _register,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.primaryGreen,
                                  foregroundColor: Colors.white,
                                  elevation: 0,
                                  shape: RoundedRectangleBorder(
                                      borderRadius:
                                          BorderRadius.circular(14)),
                                ),
                                child: _loading
                                    ? const SizedBox(
                                        width: 22,
                                        height: 22,
                                        child: CircularProgressIndicator(
                                            strokeWidth: 2.5,
                                            color: Colors.white),
                                      )
                                    : Text(
                                        'CREATE ACCOUNT',
                                        style: GoogleFonts.poppins(
                                          fontWeight: FontWeight.w700,
                                          fontSize: 15,
                                          letterSpacing: 0.8,
                                        ),
                                      ),
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Already have account
                            Row(
                              mainAxisAlignment:
                                  MainAxisAlignment.center,
                              children: [
                                Text(
                                  'Already have an account?  ',
                                  style: GoogleFonts.poppins(
                                      fontSize: 13,
                                      color: AppTheme.ts(context)),
                                ),
                                GestureDetector(
                                  onTap: () => Navigator.pop(context),
                                  child: Text(
                                    'Sign In',
                                    style: GoogleFonts.poppins(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 13,
                                      color: AppTheme.primaryGreen,
                                      decoration:
                                          TextDecoration.underline,
                                      decorationColor:
                                          AppTheme.primaryGreen,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    super.dispose();
  }
}
