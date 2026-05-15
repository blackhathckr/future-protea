import 'dart:async';
import 'package:flutter/material.dart';
import '../services/notification_service.dart';
import '../screens/notifications/notifications_screen.dart';

/// Bell icon with an unread-count badge. Tapping pushes the inbox.
///
/// Drop this into any AppBar.actions list or into the ProteaScaffold actions.
/// Polls /api/notifications/unread-count every 30 seconds while mounted.
class NotificationBell extends StatefulWidget {
  /// Color of the bell icon (defaults to white for green headers).
  final Color iconColor;
  final double iconSize;

  const NotificationBell({
    super.key,
    this.iconColor = Colors.white,
    this.iconSize = 24,
  });

  @override
  State<NotificationBell> createState() => _NotificationBellState();
}

class _NotificationBellState extends State<NotificationBell> {
  int _count = 0;
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    _refresh();
    _poll = Timer.periodic(const Duration(seconds: 30), (_) => _refresh());
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  Future<void> _refresh() async {
    try {
      final c = await NotificationService.unreadCount();
      if (mounted) setState(() => _count = c);
    } catch (_) {/* silent */}
  }

  Future<void> _openInbox() async {
    await Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => const NotificationsScreen(),
    ));
    // Refresh count once user comes back — they likely read some.
    _refresh();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      alignment: Alignment.center,
      children: [
        IconButton(
          tooltip: 'Notifications',
          icon: Icon(Icons.notifications_outlined, color: widget.iconColor, size: widget.iconSize),
          onPressed: _openInbox,
        ),
        if (_count > 0)
          Positioned(
            top: 6,
            right: 4,
            child: IgnorePointer(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                decoration: BoxDecoration(
                  color: Colors.red,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.white, width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.25),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    _count > 99 ? '99+' : '$_count',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      height: 1,
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}
