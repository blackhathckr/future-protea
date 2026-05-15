import 'package:flutter/material.dart';
import '../../models/notification.dart';
import '../../services/notification_service.dart';

/// Universal Notifications inbox available to every role.
/// Pulls /api/notifications for the signed-in user and also surfaces any
/// active /api/users/announcements/active that target their role.
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _loading = true;
  List<NotificationItem> _items = [];
  List<AnnouncementItem> _announcements = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final res = await Future.wait([
      NotificationService.list(limit: 100),
      NotificationService.activeAnnouncements(),
    ]);
    if (!mounted) return;
    setState(() {
      _items = res[0] as List<NotificationItem>;
      _announcements = res[1] as List<AnnouncementItem>;
      _loading = false;
    });
  }

  Future<void> _markRead(NotificationItem n) async {
    if (n.isRead) return;
    await NotificationService.markRead(n.id);
    _load();
  }

  Future<void> _markAllRead() async {
    await NotificationService.markAllRead();
    _load();
  }

  Future<void> _delete(String id) async {
    await NotificationService.remove(id);
    setState(() => _items.removeWhere((n) => n.id == id));
  }

  Future<void> _confirmAndClear({required bool readOnly}) async {
    final messenger = ScaffoldMessenger.of(context);
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(readOnly ? 'Clear read notifications?' : 'Delete all notifications?'),
        content: Text(readOnly
            ? 'This removes every notification you have already read.'
            : 'This empties your entire inbox. This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: readOnly ? null : Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(readOnly ? 'Clear read' : 'Delete all'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    final count = await NotificationService.removeAll(readOnly: readOnly);
    if (!mounted) return;
    messenger.showSnackBar(SnackBar(content: Text(readOnly ? 'Cleared $count read notifications' : 'Deleted $count notifications')));
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final unread = _items.where((n) => !n.isRead).length;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (unread > 0)
            IconButton(
              tooltip: 'Mark all read',
              onPressed: _markAllRead,
              icon: const Icon(Icons.done_all),
            ),
          if (_items.isNotEmpty)
            PopupMenuButton<String>(
              tooltip: 'More',
              icon: const Icon(Icons.more_vert),
              onSelected: (v) {
                if (v == 'clear_read') _confirmAndClear(readOnly: true);
                if (v == 'clear_all') _confirmAndClear(readOnly: false);
              },
              itemBuilder: (_) => [
                if (_items.any((n) => n.isRead))
                  const PopupMenuItem(
                    value: 'clear_read',
                    child: ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Icon(Icons.cleaning_services_outlined, size: 20),
                      title: Text('Clear read'),
                    ),
                  ),
                const PopupMenuItem(
                  value: 'clear_all',
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Icon(Icons.delete_sweep_outlined, color: Colors.red, size: 20),
                    title: Text('Delete all', style: TextStyle(color: Colors.red)),
                  ),
                ),
              ],
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                children: [
                  if (_announcements.isNotEmpty) ...[
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                      child: Text('Announcements', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                    ..._announcements.map(_announcementCard),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 4, vertical: 12),
                      child: Text('Inbox', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ],
                  if (_items.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 64),
                      child: Center(child: Text('No notifications yet')),
                    )
                  else
                    ..._items.map(_notificationTile),
                ],
              ),
      ),
    );
  }

  Widget _announcementCard(AnnouncementItem a) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      color: Colors.amber.withValues(alpha: 0.08),
      shape: RoundedRectangleBorder(
        side: BorderSide(color: Colors.amber.withValues(alpha: 0.4)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.campaign, color: Colors.amber, size: 18),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(a.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(a.content, style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
            if (a.expiresAt != null) ...[
              const SizedBox(height: 6),
              Text(
                'Expires ${_fmt(a.expiresAt!)}',
                style: const TextStyle(fontSize: 11, color: Colors.grey),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _notificationTile(NotificationItem n) {
    final icon = _iconForCategory(n.category);
    return Dismissible(
      key: ValueKey(n.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 16),
        color: Colors.red.withValues(alpha: 0.15),
        child: const Icon(Icons.delete_outline, color: Colors.red),
      ),
      onDismissed: (_) => _delete(n.id),
      child: Card(
        margin: const EdgeInsets.only(bottom: 8),
        color: n.isRead ? null : Theme.of(context).colorScheme.primary.withValues(alpha: 0.05),
        child: ListTile(
          onTap: () => _markRead(n),
          leading: CircleAvatar(
            backgroundColor: n.isRead ? Colors.grey.shade300 : Theme.of(context).colorScheme.primary,
            child: Icon(icon, color: n.isRead ? Colors.grey : Colors.white, size: 18),
          ),
          title: Text(
            n.title,
            style: TextStyle(fontWeight: n.isRead ? FontWeight.w500 : FontWeight.bold),
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(n.message, maxLines: 2, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 2),
              Text(_fmt(n.createdAt), style: const TextStyle(fontSize: 11, color: Colors.grey)),
            ],
          ),
          trailing: n.isRead ? null : const Icon(Icons.fiber_manual_record, color: Colors.green, size: 10),
        ),
      ),
    );
  }

  IconData _iconForCategory(String? category) {
    switch (category) {
      case 'announcement': return Icons.campaign;
      case 'match': return Icons.sports_cricket;
      case 'tournament': return Icons.emoji_events;
      case 'system': return Icons.settings;
      default: return Icons.notifications;
    }
  }

  String _fmt(DateTime d) {
    final diff = DateTime.now().difference(d);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${d.day}/${d.month}/${d.year}';
  }
}
