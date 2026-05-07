import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/protea_buttons.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  final _newPasswordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();
  final _emailFormKey = GlobalKey<FormState>();
  final _otpFormKey = GlobalKey<FormState>();
  final _passwordFormKey = GlobalKey<FormState>();

  bool _loading = false;
  bool _obscureNew = true;
  bool _obscureConfirm = true;

  // 0 = email, 1 = otp, 2 = new password, 3 = success
  int _step = 0;

  Future<void> _sendOtp() async {
    if (!_emailFormKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await ApiService.forgotPassword(_emailCtrl.text.trim());
      if (mounted) {
        setState(() => _step = 1);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('OTP sent to your email'),
            backgroundColor: AppTheme.completedGreen,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: AppTheme.wicketRed,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _verifyOtp() async {
    if (!_otpFormKey.currentState!.validate()) return;
    // Client-side check for the hardcoded OTP
    if (_otpCtrl.text.trim() != '123456') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Invalid OTP. Please try again.'),
          backgroundColor: AppTheme.wicketRed,
        ),
      );
      return;
    }
    setState(() => _step = 2);
  }

  Future<void> _resetPassword() async {
    if (!_passwordFormKey.currentState!.validate()) return;
    if (_newPasswordCtrl.text != _confirmPasswordCtrl.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Passwords do not match'),
          backgroundColor: AppTheme.wicketRed,
        ),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      await ApiService.resetPassword(
        email: _emailCtrl.text.trim(),
        otp: _otpCtrl.text.trim(),
        newPassword: _newPasswordCtrl.text,
      );
      if (mounted) setState(() => _step = 3);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            backgroundColor: AppTheme.wicketRed,
          ),
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
              ],
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  children: [
                    const SizedBox(height: 8),
                    // Step indicator
                    _buildStepIndicator(),
                    const SizedBox(height: 24),
                    // Step content
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 300),
                      child: _buildStepContent(),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepIndicator() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _stepDot(0, 'Email'),
        _stepLine(0),
        _stepDot(1, 'OTP'),
        _stepLine(1),
        _stepDot(2, 'Reset'),
      ],
    ).animate().fadeIn(duration: 400.ms);
  }

  Widget _stepDot(int step, String label) {
    final isActive = _step >= step;
    final isCurrent = _step == step;
    return Column(
      children: [
        AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: isActive
                ? const LinearGradient(colors: [Color(0xFF1B5E20), Color(0xFF2E7D32)])
                : null,
            color: isActive ? null : AppTheme.surfaceLight(context),
            border: isCurrent
                ? Border.all(color: AppTheme.accentGold, width: 2)
                : null,
            boxShadow: isCurrent
                ? [BoxShadow(color: AppTheme.primaryGreen.withValues(alpha: 0.3), blurRadius: 8)]
                : null,
          ),
          child: Center(
            child: isActive && _step > step
                ? const Icon(Icons.check, color: Colors.white, size: 16)
                : Text('${step + 1}',
                    style: TextStyle(
                      color: isActive ? Colors.white : AppTheme.ts(context),
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    )),
          ),
        ),
        const SizedBox(height: 4),
        Text(label,
            style: GoogleFonts.poppins(
              fontSize: 10,
              fontWeight: isCurrent ? FontWeight.w600 : FontWeight.w400,
              color: isActive ? AppTheme.primaryGreen : AppTheme.ts(context),
            )),
      ],
    );
  }

  Widget _stepLine(int afterStep) {
    final isActive = _step > afterStep;
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        width: 40,
        height: 3,
        decoration: BoxDecoration(
          color: isActive ? AppTheme.primaryGreen : AppTheme.divider(context),
          borderRadius: BorderRadius.circular(2),
        ),
      ),
    );
  }

  Widget _buildStepContent() {
    switch (_step) {
      case 0:
        return _buildEmailStep();
      case 1:
        return _buildOtpStep();
      case 2:
        return _buildPasswordStep();
      case 3:
        return _buildSuccessStep();
      default:
        return const SizedBox.shrink();
    }
  }

  // ─── Step 0: Email ───────────────────────────────────────────────

  Widget _buildEmailStep() {
    return Form(
      key: _emailFormKey,
      child: Column(
        key: const ValueKey(0),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.primaryGreen.withValues(alpha: 0.1),
            ),
            child: Icon(Icons.lock_reset_rounded, size: 40, color: AppTheme.primaryGreen),
          ),
          const SizedBox(height: 16),
          Text('Forgot Password?',
              style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w700, color: AppTheme.tp(context))),
          const SizedBox(height: 8),
          Text("Enter your email and we'll send you a verification code",
              style: GoogleFonts.poppins(fontSize: 13, color: AppTheme.ts(context)),
              textAlign: TextAlign.center),
          const SizedBox(height: 24),
          TextFormField(
            controller: _emailCtrl,
            keyboardType: TextInputType.emailAddress,
            decoration: InputDecoration(
              hintText: 'Enter your email',
              prefixIcon: const Icon(Icons.email_outlined),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'Email is required';
              if (!v.contains('@') || !v.contains('.')) return 'Enter a valid email';
              return null;
            },
          ),
          const SizedBox(height: 20),
          GreenButton(label: 'SEND OTP', onPressed: _sendOtp, loading: _loading),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).slideX(begin: 0.05);
  }

  // ─── Step 1: OTP ─────────────────────────────────────────────────

  Widget _buildOtpStep() {
    return Form(
      key: _otpFormKey,
      child: Column(
        key: const ValueKey(1),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.accentGold.withValues(alpha: 0.15),
            ),
            child: Icon(Icons.mark_email_read_rounded, size: 40, color: AppTheme.accentAmber),
          ),
          const SizedBox(height: 16),
          Text('Verify OTP',
              style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w700, color: AppTheme.tp(context))),
          const SizedBox(height: 8),
          RichText(
            textAlign: TextAlign.center,
            text: TextSpan(
              style: GoogleFonts.poppins(fontSize: 13, color: AppTheme.ts(context)),
              children: [
                const TextSpan(text: 'Enter the 6-digit code sent to\n'),
                TextSpan(
                  text: _emailCtrl.text.trim(),
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: AppTheme.primaryGreen),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          TextFormField(
            controller: _otpCtrl,
            keyboardType: TextInputType.number,
            maxLength: 6,
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(fontSize: 24, fontWeight: FontWeight.w700, letterSpacing: 12),
            decoration: InputDecoration(
              hintText: '• • • • • •',
              hintStyle: GoogleFonts.poppins(fontSize: 24, letterSpacing: 8, color: AppTheme.ts(context)),
              counterText: '',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'Enter the OTP';
              if (v.trim().length != 6) return 'OTP must be 6 digits';
              return null;
            },
          ),
          const SizedBox(height: 20),
          GreenButton(label: 'VERIFY', onPressed: _verifyOtp, loading: _loading),
          const SizedBox(height: 12),
          TextButton(
            onPressed: _loading ? null : _sendOtp,
            child: Text('Resend OTP',
                style: GoogleFonts.poppins(color: AppTheme.primaryGreen, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).slideX(begin: 0.05);
  }

  // ─── Step 2: New Password ────────────────────────────────────────

  Widget _buildPasswordStep() {
    return Form(
      key: _passwordFormKey,
      child: Column(
        key: const ValueKey(2),
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.primaryGreen.withValues(alpha: 0.1),
            ),
            child: Icon(Icons.lock_rounded, size: 40, color: AppTheme.primaryGreen),
          ),
          const SizedBox(height: 16),
          Text('Set New Password',
              style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w700, color: AppTheme.tp(context))),
          const SizedBox(height: 8),
          Text('Choose a strong password for your account',
              style: GoogleFonts.poppins(fontSize: 13, color: AppTheme.ts(context)),
              textAlign: TextAlign.center),
          const SizedBox(height: 24),
          TextFormField(
            controller: _newPasswordCtrl,
            obscureText: _obscureNew,
            decoration: InputDecoration(
              hintText: 'New password',
              prefixIcon: const Icon(Icons.lock_outline),
              suffixIcon: IconButton(
                icon: Icon(_obscureNew ? Icons.visibility_off : Icons.visibility, color: AppTheme.ts(context)),
                onPressed: () => setState(() => _obscureNew = !_obscureNew),
              ),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
            validator: (v) {
              if (v == null || v.isEmpty) return 'Password is required';
              if (v.length < 6) return 'Must be at least 6 characters';
              return null;
            },
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _confirmPasswordCtrl,
            obscureText: _obscureConfirm,
            decoration: InputDecoration(
              hintText: 'Confirm new password',
              prefixIcon: const Icon(Icons.lock_outline),
              suffixIcon: IconButton(
                icon: Icon(_obscureConfirm ? Icons.visibility_off : Icons.visibility, color: AppTheme.ts(context)),
                onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
              ),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
            validator: (v) {
              if (v == null || v.isEmpty) return 'Confirm your password';
              if (v != _newPasswordCtrl.text) return 'Passwords do not match';
              return null;
            },
          ),
          const SizedBox(height: 20),
          GreenButton(label: 'RESET PASSWORD', onPressed: _resetPassword, loading: _loading),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).slideX(begin: 0.05);
  }

  // ─── Step 3: Success ─────────────────────────────────────────────

  Widget _buildSuccessStep() {
    return Column(
      key: const ValueKey(3),
      children: [
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(colors: [Color(0xFF1B5E20), Color(0xFF2E7D32)]),
            boxShadow: [BoxShadow(color: AppTheme.primaryGreen.withValues(alpha: 0.3), blurRadius: 16, spreadRadius: 2)],
          ),
          child: const Icon(Icons.check_rounded, size: 48, color: Colors.white),
        ).animate().scale(begin: const Offset(0.5, 0.5), duration: 500.ms, curve: Curves.elasticOut),
        const SizedBox(height: 24),
        Text('Password Reset!',
            style: GoogleFonts.poppins(fontSize: 24, fontWeight: FontWeight.w700, color: AppTheme.tp(context)))
            .animate().fadeIn(delay: 300.ms),
        const SizedBox(height: 8),
        Text('Your password has been updated successfully.\nYou can now sign in with your new password.',
            style: GoogleFonts.poppins(fontSize: 13, color: AppTheme.ts(context)),
            textAlign: TextAlign.center)
            .animate().fadeIn(delay: 500.ms),
        const SizedBox(height: 32),
        GreenButton(
          label: 'BACK TO SIGN IN',
          onPressed: () => Navigator.pop(context),
        ).animate().fadeIn(delay: 700.ms).slideY(begin: 0.1),
      ],
    );
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _otpCtrl.dispose();
    _newPasswordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    super.dispose();
  }
}
