import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_theme.dart';

class SectionLabel extends StatelessWidget {
  final String text;
  final IconData? icon;
  final Color? color;
  final double fontSize;
  final FontWeight fontWeight;

  const SectionLabel(
    this.text, {
    super.key,
    this.icon,
    this.color,
    this.fontSize = 14,
    this.fontWeight = FontWeight.w600,
  });

  @override
  Widget build(BuildContext context) {
    final labelColor = color ?? AppTheme.accentAmber;

    if (icon != null) {
      return Row(
        children: [
          Icon(icon, size: 11, color: AppTheme.primaryGreen),
          const SizedBox(width: 4),
          Text(
            text,
            style: GoogleFonts.poppins(
              fontSize: 9,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.7,
              color: AppTheme.primaryGreen,
            ),
          ),
        ],
      );
    }

    return Text(
      text,
      style: GoogleFonts.poppins(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: labelColor,
      ),
    );
  }
}
