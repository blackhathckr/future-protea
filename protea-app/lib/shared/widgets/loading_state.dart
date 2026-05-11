import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lottie/lottie.dart';
import '../../theme/app_theme.dart';

class LoadingState extends StatelessWidget {
  final String label;
  final double size;

  const LoadingState({
    super.key,
    this.label = 'Loading…',
    this.size = 120,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Lottie.asset(
            'assets/images/lottie/Bat ball.json',
            width: size,
            height: size,
            repeat: true,
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: GoogleFonts.poppins(fontSize: 13, color: AppTheme.ts(context)),
          ),
        ],
      ),
    );
  }
}
