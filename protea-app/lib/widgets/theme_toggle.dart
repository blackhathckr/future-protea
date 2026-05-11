import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';

/// Theme toggle icon button for use in header Stacks.
/// Place inside a Positioned widget in the header Stack.
class ThemeToggleButton extends StatelessWidget {
  const ThemeToggleButton({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = context.watch<ThemeProvider>();
    return IconButton(
      icon: Icon(
        theme.isDark ? Icons.light_mode : Icons.dark_mode,
        color: Colors.white,
      ),
      tooltip: theme.isDark ? 'Light mode' : 'Dark mode',
      onPressed: () => theme.toggle(),
    );
  }
}
