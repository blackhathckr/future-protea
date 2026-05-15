import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lottie/lottie.dart';
import '../../theme/app_theme.dart';

class EmptyState extends StatelessWidget {
  final String message;
  final String? subtitle;
  final VoidCallback? onRefresh;
  final double size;

  const EmptyState({
    super.key,
    required this.message,
    this.subtitle,
    this.onRefresh,
    this.size = 150,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final hasBoundedHeight = constraints.hasBoundedHeight;
        final lottieSize = hasBoundedHeight
            ? (constraints.maxHeight * 0.35).clamp(60.0, size)
            : size;

        final content = Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: lottieSize,
                height: lottieSize,
                child: Lottie.asset('assets/images/lottie/Bat ball.json', repeat: true),
              ),
              const SizedBox(height: 12),
              Text(
                message,
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.tp(context),
                ),
                textAlign: TextAlign.center,
              ).animate().fadeIn(delay: 300.ms),
              if (subtitle != null) ...[
                const SizedBox(height: 8),
                Text(
                  subtitle!,
                  style: GoogleFonts.poppins(fontSize: 13, color: AppTheme.ts(context)),
                  textAlign: TextAlign.center,
                ).animate().fadeIn(delay: 500.ms),
              ],
              if (onRefresh != null) ...[
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: onRefresh,
                  icon: const Icon(Icons.refresh_rounded, size: 18),
                  label: const Text('Refresh'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGreen,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                  ),
                ).animate().fadeIn(delay: 700.ms).slideY(begin: 0.15),
              ],
            ],
          ),
        );

        if (!hasBoundedHeight) {
          return Center(child: content);
        }

        return SingleChildScrollView(
          physics: const NeverScrollableScrollPhysics(),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: Center(child: content),
          ),
        );
      },
    );
  }
}
