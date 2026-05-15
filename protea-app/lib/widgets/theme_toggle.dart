import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import '../screens/settings/theme_settings_screen.dart';

/// Header pair: light/dark toggle + Appearance entry.
///
/// Renders two IconButtons side-by-side wherever it's placed (inside a
/// `Positioned` in a Stack, or inside a Row/Column). Every main screen that
/// shows the existing theme toggle automatically gains the palette button.
class ThemeToggleButton extends StatelessWidget {
  /// If `true`, only the light/dark toggle is rendered (no palette icon).
  /// Default is `false` — both buttons show.
  final bool toggleOnly;

  const ThemeToggleButton({super.key, this.toggleOnly = false});

  @override
  Widget build(BuildContext context) {
    final theme = context.watch<ThemeProvider>();
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          icon: Icon(
            theme.isDark ? Icons.light_mode : Icons.dark_mode,
            color: Colors.white,
          ),
          tooltip: theme.isDark ? 'Light mode' : 'Dark mode',
          onPressed: theme.toggle,
        ),
        if (!toggleOnly)
          IconButton(
            icon: const Icon(Icons.palette_outlined, color: Colors.white),
            tooltip: 'Appearance',
            onPressed: () => _openSettings(context),
          ),
      ],
    );
  }

  static void _openSettings(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const ThemeSettingsScreen()),
    );
  }
}

/// Standalone palette icon → opens `ThemeSettingsScreen`. Use this when a
/// screen already renders its own inline light/dark IconButton and just
/// needs the Appearance entry added beside it.
class AppearanceButton extends StatelessWidget {
  final Color iconColor;
  const AppearanceButton({super.key, this.iconColor = Colors.white});

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: Icon(Icons.palette_outlined, color: iconColor),
      tooltip: 'Appearance',
      onPressed: () => ThemeToggleButton._openSettings(context),
    );
  }
}
