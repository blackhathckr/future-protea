import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Wireframe-matching colors - Green & Gold cricket theme
  static const Color primaryGreen = Color(0xFF1B5E20);
  static const Color darkGreen = Color(0xFF0D3B12);
  static const Color lightGreen = Color(0xFF4CAF50);
  static const Color accentGold = Color(0xFFFFD600);
  static const Color accentAmber = Color(0xFFFFA000);
  static const Color buttonGreen = Color(0xFF2E7D32);
  static const Color buttonYellow = Color(0xFFFFD54F);

  // Light theme surfaces
  static const Color scaffoldBg = Color(0xFFF5F5F5);
  static const Color cardBg = Colors.white;
  static const Color surfaceCard = Colors.white;
  static const Color surfaceCardLight = Color(0xFFF0F0F0);

  // Dark theme surfaces
  static const Color darkScaffoldBg = Color(0xFF000000);
  static const Color darkCardBg = Color(0xFF0D0D0D);
  static const Color darkSurfaceCard = Color(0xFF0D0D0D);
  static const Color darkSurfaceCardLight = Color(0xFF1A1A1A);

  // Text colors for light theme
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
  static const Color textOnGreen = Colors.white;
  static const Color textOnGold = Color(0xFF212121);

  // Text colors for dark theme
  static const Color darkTextPrimary = Color(0xFFE0E0E0);
  static const Color darkTextSecondary = Color(0xFF9E9E9E);

  // Theme-aware helpers (use these instead of const colors)
  static bool isDark(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark;

  static Color tp(BuildContext context) =>
      isDark(context) ? darkTextPrimary : textPrimary;

  static Color ts(BuildContext context) =>
      isDark(context) ? darkTextSecondary : textSecondary;

  static Color surface(BuildContext context) =>
      Theme.of(context).colorScheme.surface;

  static Color divider(BuildContext context) =>
      isDark(context) ? const Color(0xFF2A2A2A) : const Color(0xFFE0E0E0);

  static Color surfaceLight(BuildContext context) =>
      isDark(context) ? darkSurfaceCardLight : surfaceCardLight;

  // Cricket-specific colors
  static const Color team1Color = Color(0xFF1565C0);
  static const Color team2Color = Color(0xFFE53935);
  static const Color wicketRed = Color(0xFFFF1744);
  static const Color fourColor = Color(0xFF00E676);
  static const Color sixColor = Color(0xFFFFD600);
  static const Color dotBallColor = Color(0xFF616161);
  static const Color liveRed = Color(0xFFD32F2F);
  static const Color upcomingBlue = Color(0xFF1976D2);
  static const Color completedGreen = Color(0xFF388E3C);
  static const Color inProgressOrange = Color(0xFFFF9800);

  // Gradient for header matching wireframe
  static const LinearGradient headerGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [
      Color(0xFF0D3B12),
      Color(0xFF1B5E20),
      Color(0xFF2E7D32),
    ],
  );

  static const LinearGradient goldCurveGradient = LinearGradient(
    colors: [Color(0xFFFFD600), Color(0xFFFFA000)],
  );

  // Pre-build font styles ONCE
  static final _poppinsTextThemeLight = GoogleFonts.poppinsTextTheme(ThemeData.light().textTheme);
  static final _poppinsTextThemeDark = GoogleFonts.poppinsTextTheme(ThemeData.dark().textTheme);
  static final _poppinsAppBarTitle = GoogleFonts.poppins(
    fontSize: 20, fontWeight: FontWeight.w600, color: Colors.white,
  );
  static final _poppinsButton = GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700);
  static final _poppinsChip = GoogleFonts.poppins(fontSize: 13);
  static final _poppinsTabLabel = GoogleFonts.poppins(fontWeight: FontWeight.w600);

  // CACHED theme data - built once, reused forever
  static final ThemeData lightTheme = _buildLightTheme();
  static final ThemeData darkTheme = _buildDarkTheme();

  static ThemeData _buildLightTheme() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: scaffoldBg,
      primaryColor: primaryGreen,
      colorScheme: const ColorScheme.light(
        primary: primaryGreen,
        secondary: accentGold,
        surface: cardBg,
        error: wicketRed,
        onPrimary: Colors.white,
        onSecondary: textPrimary,
      ),
      textTheme: _poppinsTextThemeLight,
      appBarTheme: AppBarTheme(
        backgroundColor: darkGreen,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: _poppinsAppBarTitle,
      ),
      cardTheme: CardThemeData(
        color: cardBg,
        elevation: 2,
        shadowColor: Colors.black12,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: buttonGreen,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: _poppinsButton,
          elevation: 2,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFFE0E0E0)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: primaryGreen, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        hintStyle: const TextStyle(color: textSecondary),
        prefixIconColor: textSecondary,
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: accentGold,
        foregroundColor: textPrimary,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: surfaceCardLight,
        selectedColor: primaryGreen,
        labelStyle: _poppinsChip,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: primaryGreen,
        unselectedItemColor: textSecondary,
        elevation: 8,
      ),
      dividerColor: const Color(0xFFE0E0E0),
      tabBarTheme: TabBarThemeData(
        labelColor: primaryGreen,
        unselectedLabelColor: textSecondary,
        indicatorColor: primaryGreen,
        labelStyle: _poppinsTabLabel,
      ),
    );
  }

  static ThemeData _buildDarkTheme() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: darkScaffoldBg,
      primaryColor: primaryGreen,
      colorScheme: const ColorScheme.dark(
        primary: lightGreen,
        secondary: accentGold,
        surface: darkCardBg,
        surfaceContainerHighest: Color(0xFF1A1A1A),
        surfaceContainer: Color(0xFF111111),
        error: wicketRed,
        onPrimary: Colors.white,
        onSecondary: darkTextPrimary,
      ),
      textTheme: _poppinsTextThemeDark,
      appBarTheme: AppBarTheme(
        backgroundColor: darkGreen,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: _poppinsAppBarTitle,
      ),
      cardTheme: CardThemeData(
        color: darkCardBg,
        elevation: 2,
        shadowColor: Colors.black26,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: buttonGreen,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: _poppinsButton,
          elevation: 2,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF111111),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFF2A2A2A)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: lightGreen, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        hintStyle: const TextStyle(color: darkTextSecondary),
        prefixIconColor: darkTextSecondary,
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: accentGold,
        foregroundColor: textPrimary,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: darkSurfaceCardLight,
        selectedColor: primaryGreen,
        labelStyle: _poppinsChip,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Color(0xFF000000),
        selectedItemColor: lightGreen,
        unselectedItemColor: darkTextSecondary,
        elevation: 8,
      ),
      dividerColor: const Color(0xFF2A2A2A),
      tabBarTheme: TabBarThemeData(
        labelColor: lightGreen,
        unselectedLabelColor: darkTextSecondary,
        indicatorColor: lightGreen,
        labelStyle: _poppinsTabLabel,
      ),
      dialogTheme: const DialogThemeData(
        backgroundColor: Color(0xFF0D0D0D),
        titleTextStyle: TextStyle(color: darkTextPrimary, fontSize: 20, fontWeight: FontWeight.w600),
        contentTextStyle: TextStyle(color: darkTextSecondary, fontSize: 16),
      ),
    );
  }
}
