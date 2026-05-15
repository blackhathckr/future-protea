import 'package:flutter/material.dart';
import '../screens/support/support_screen.dart';

/// Small "Help / Support" icon button intended to live in each role's header,
/// next to NotificationBell. Tapping opens the user's ticket list.
class SupportIconButton extends StatelessWidget {
  final Color iconColor;
  final double iconSize;

  const SupportIconButton({
    super.key,
    this.iconColor = Colors.white,
    this.iconSize = 22,
  });

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: 'Support',
      icon: Icon(Icons.help_outline, color: iconColor, size: iconSize),
      onPressed: () {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const SupportScreen()),
        );
      },
    );
  }
}
