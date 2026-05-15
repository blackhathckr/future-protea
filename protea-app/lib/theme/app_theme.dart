import 'package:flutter/material.dart';
import 'color_palettes.dart';
import 'color_utils.dart';
import 'font_configs.dart';
import 'theme_depth.dart';

/// Central theme registry.
///
/// Brand color fields (`primaryGreen`, `accentGold`, etc.) are **mutable**
/// statics that get rewritten by `AppTheme.applyPalette(...)` whenever the
/// user changes their palette. Existing screens read these directly and
/// will reflect the new palette on rebuild.
class AppTheme {
  // ---------------------------------------------------------------------------
  // Brand colors — mutable so palette changes propagate to every screen that
  // reads them directly. Defaults match Future Protea brand greens; rewritten
  // by `applyPalette(...)` whenever the user picks a palette / custom color.
  // ---------------------------------------------------------------------------
  static Color primaryGreen = const Color(0xFF1B5E20);
  static Color darkGreen = const Color(0xFF0D3B12);
  static Color lightGreen = const Color(0xFF4CAF50);
  static Color accentGold = const Color(0xFFFFD600);
  static Color accentAmber = const Color(0xFFFFA000);
  static Color buttonGreen = const Color(0xFF2E7D32);
  static Color buttonYellow = const Color(0xFFFFD54F);

  // Light theme surfaces
  static Color scaffoldBg = const Color(0xFFF5F5F5);
  static Color cardBg = Colors.white;
  static Color surfaceCard = Colors.white;
  static Color surfaceCardLight = const Color(0xFFF0F0F0);

  // Dark theme surfaces
  static Color darkScaffoldBg = const Color(0xFF000000);
  static Color darkCardBg = const Color(0xFF0D0D0D);
  static Color darkSurfaceCard = const Color(0xFF0D0D0D);
  static Color darkSurfaceCardLight = const Color(0xFF1A1A1A);

  // Text colors for light theme
  static Color textPrimary = const Color(0xFF212121);
  static Color textSecondary = const Color(0xFF757575);
  static Color textOnGreen = Colors.white;
  static Color textOnGold = const Color(0xFF212121);

  // Text colors for dark theme
  static Color darkTextPrimary = const Color(0xFFE0E0E0);
  static Color darkTextSecondary = const Color(0xFF9E9E9E);

  // Cricket-specific colors — these encode meaning (team / wicket / 4 / 6)
  // so they DON'T follow the palette.
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

  // Gradients — also rebuilt by applyPalette().
  static LinearGradient headerGradient = const LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF0D3B12), Color(0xFF1B5E20), Color(0xFF2E7D32)],
  );

  static LinearGradient goldCurveGradient = const LinearGradient(
    colors: [Color(0xFFFFD600), Color(0xFFFFA000)],
  );

  // ---------------------------------------------------------------------------
  // Theme-aware helpers
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Palette → brand color mapping. Called by main.dart whenever the
  // ColorThemeProvider's state changes; rewrites the mutable statics above so
  // every screen reading them reflects the chosen palette.
  // ---------------------------------------------------------------------------
  static void applyPalette({
    required PaletteColors light,
    required PaletteColors dark,
    required ThemeDepth depth,
  }) {
    primaryGreen = light.primary;
    darkGreen = shiftLightness(light.primary, -0.10);
    lightGreen = shiftLightness(light.primary, 0.08);
    buttonGreen = light.primary;

    accentGold = light.accent;
    accentAmber = shiftLightness(light.accent, -0.05);
    buttonYellow = shiftLightness(light.accent, 0.05);

    textOnGreen = contrastingForeground(light.primary);
    textOnGold = contrastingForeground(light.accent);

    final tint = depth.surfaceTint;
    final scaffoldT = depth.scaffoldTint;

    scaffoldBg =
        Color.lerp(const Color(0xFFF5F5F5), light.primary, scaffoldT)!;
    cardBg = Color.lerp(Colors.white, light.primary, tint * 0.5)!;
    surfaceCard = cardBg;
    surfaceCardLight =
        Color.lerp(const Color(0xFFF0F0F0), light.primary, tint)!;

    darkScaffoldBg =
        Color.lerp(const Color(0xFF000000), dark.primary, scaffoldT * 0.8)!;
    darkCardBg =
        Color.lerp(const Color(0xFF0D0D0D), dark.primary, tint * 0.6)!;
    darkSurfaceCard = darkCardBg;
    darkSurfaceCardLight =
        Color.lerp(const Color(0xFF1A1A1A), dark.primary, tint)!;

    headerGradient = LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: [
        shiftLightness(light.primary, -0.18),
        light.primary,
        shiftLightness(light.primary, 0.06),
      ],
    );

    goldCurveGradient = LinearGradient(
      colors: [light.accent, shiftLightness(light.accent, -0.08)],
    );
  }

  // ---------------------------------------------------------------------------
  // ThemeData builders
  // ---------------------------------------------------------------------------

  /// Build a complete ThemeData from a palette + font + depth + brightness.
  /// Used by the MaterialApp wrapper after the providers settle.
  static ThemeData buildTheme({
    required PaletteColors colors,
    required FontConfig font,
    required ThemeDepth depth,
    required Brightness brightness,
  }) {
    final isDark = brightness == Brightness.dark;
    final baseTextTheme = font.textThemeBuilder(
      isDark ? ThemeData.dark().textTheme : ThemeData.light().textTheme,
    );

    final scaffold = isDark ? darkScaffoldBg : scaffoldBg;
    final card = isDark ? darkCardBg : cardBg;
    final dividerColor =
        isDark ? const Color(0xFF2A2A2A) : const Color(0xFFE0E0E0);
    final txtPrimary = isDark ? darkTextPrimary : textPrimary;
    final txtSecondary = isDark ? darkTextSecondary : textSecondary;

    final colorScheme = isDark
        ? ColorScheme.dark(
            primary: colors.primary,
            onPrimary: colors.primaryForeground,
            secondary: colors.accent,
            onSecondary: colors.accentForeground,
            surface: card,
            surfaceContainerHighest: Color.lerp(
                const Color(0xFF1A1A1A), colors.primary, depth.surfaceTint)!,
            surfaceContainer: Color.lerp(
                const Color(0xFF111111), colors.primary, depth.surfaceTint)!,
            error: wicketRed,
          )
        : ColorScheme.light(
            primary: colors.primary,
            onPrimary: colors.primaryForeground,
            secondary: colors.accent,
            onSecondary: colors.accentForeground,
            surface: card,
            error: wicketRed,
          );

    final appBarBg = depth.appBarUsesPrimary
        ? colors.primary
        : (isDark ? const Color(0xFF0D0D0D) : darkGreen);
    final appBarFg = depth.appBarUsesPrimary
        ? colors.primaryForeground
        : Colors.white;

    final inputFill = isDark
        ? Color.lerp(const Color(0xFF111111), colors.primary, depth.surfaceTint)!
        : Color.lerp(Colors.white, colors.primary, depth.surfaceTint * 0.3)!;
    final inputBorderColor = depth == ThemeDepth.subtle
        ? dividerColor
        : Color.lerp(dividerColor, colors.primary, 0.3)!;

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      scaffoldBackgroundColor: scaffold,
      primaryColor: colors.primary,
      colorScheme: colorScheme,
      textTheme: baseTextTheme.apply(
        bodyColor: txtPrimary,
        displayColor: txtPrimary,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: appBarBg,
        foregroundColor: appBarFg,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: font.textThemeBuilder(const TextTheme()).titleLarge?.copyWith(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: appBarFg,
            ),
      ),
      cardTheme: CardThemeData(
        color: card,
        elevation: 2,
        shadowColor: isDark ? Colors.black26 : Colors.black12,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: colors.primary,
          foregroundColor: colors.primaryForeground,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          textStyle: baseTextTheme.labelLarge?.copyWith(
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
          elevation: 2,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: colors.primary),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: colors.primary,
          side: BorderSide(color: colors.primary),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: inputFill,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: inputBorderColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: inputBorderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: colors.primary, width: 2),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        hintStyle: TextStyle(color: txtSecondary),
        prefixIconColor: txtSecondary,
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: colors.accent,
        foregroundColor: colors.accentForeground,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: isDark ? darkSurfaceCardLight : surfaceCardLight,
        selectedColor: colors.primary,
        labelStyle: baseTextTheme.labelMedium ?? const TextStyle(fontSize: 13),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: isDark ? const Color(0xFF000000) : Colors.white,
        selectedItemColor: colors.primary,
        unselectedItemColor: txtSecondary,
        elevation: 8,
      ),
      dividerColor: dividerColor,
      tabBarTheme: TabBarThemeData(
        labelColor: colors.primary,
        unselectedLabelColor: txtSecondary,
        indicatorColor: colors.primary,
        labelStyle: baseTextTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: card,
        titleTextStyle: baseTextTheme.titleLarge?.copyWith(
          color: txtPrimary,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
        contentTextStyle:
            baseTextTheme.bodyMedium?.copyWith(color: txtSecondary, fontSize: 16),
      ),
    );
  }
}
