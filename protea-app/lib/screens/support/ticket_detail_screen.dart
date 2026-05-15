import 'package:flutter/material.dart';
import '../../models/support_ticket.dart';
import '../../services/support_service.dart';

/// Thread view for one ticket — original description + admin replies, plus a
/// reply box at the bottom. Reporter can reply; admin replies are surfaced
/// here too (internal notes are stripped server-side for the reporter).
class TicketDetailScreen extends StatefulWidget {
  final String ticketId;
  const TicketDetailScreen({super.key, required this.ticketId});

  @override
  State<TicketDetailScreen> createState() => _TicketDetailScreenState();
}

class _TicketDetailScreenState extends State<TicketDetailScreen> {
  bool _loading = true;
  SupportTicket? _ticket;
  final _reply = TextEditingController();
  bool _sending = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _reply.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final t = await SupportService.getOne(widget.ticketId);
    if (!mounted) return;
    setState(() {
      _ticket = t;
      _loading = false;
    });
  }

  Future<void> _send() async {
    final msg = _reply.text.trim();
    if (msg.isEmpty || _ticket == null) return;
    setState(() => _sending = true);
    final ok = await SupportService.addResponse(_ticket!.id, msg);
    if (!mounted) return;
    if (ok) {
      _reply.clear();
      await _load();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to send reply')));
    }
    if (mounted) setState(() => _sending = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_ticket?.subject ?? 'Ticket')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _ticket == null
              ? const Center(child: Text('Ticket not found'))
              : Column(children: [
                  Expanded(
                    child: RefreshIndicator(
                      onRefresh: _load,
                      child: ListView(
                        padding: const EdgeInsets.all(12),
                        children: [
                          _headerCard(_ticket!),
                          const SizedBox(height: 12),
                          if (_ticket!.responses.isEmpty)
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: 24),
                              child: Center(child: Text('No replies yet. The admin will be notified.', style: TextStyle(color: Colors.grey))),
                            )
                          else
                            ..._ticket!.responses.map(_replyBubble),
                        ],
                      ),
                    ),
                  ),
                  _replyBar(),
                ]),
    );
  }

  Widget _headerCard(SupportTicket t) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              _statusChip(t.status),
              const SizedBox(width: 6),
              _priorityChip(t.priority),
              if (t.escalated) ...[
                const SizedBox(width: 6),
                _chip('ESCALATED', Colors.deepOrange),
              ],
            ]),
            const SizedBox(height: 10),
            Text(t.subject, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            Text(t.description),
            const SizedBox(height: 8),
            Text(
              'Filed ${t.createdAt.toLocal()}',
              style: const TextStyle(fontSize: 11, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _replyBubble(TicketResponseItem r) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              const Icon(Icons.account_circle, size: 16, color: Colors.grey),
              const SizedBox(width: 4),
              Text(r.authorName ?? 'Support', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              const SizedBox(width: 6),
              Text(r.createdAt.toLocal().toString().substring(0, 16), style: const TextStyle(fontSize: 11, color: Colors.grey)),
            ]),
            const SizedBox(height: 4),
            Text(r.message),
          ],
        ),
      ),
    );
  }

  Widget _replyBar() {
    final canReply = _ticket != null && _ticket!.status != 'resolved' && _ticket!.status != 'closed';
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
        child: Row(children: [
          Expanded(
            child: TextField(
              controller: _reply,
              enabled: canReply,
              minLines: 1, maxLines: 4,
              decoration: InputDecoration(
                hintText: canReply ? 'Reply to admin…' : 'Ticket closed',
                border: const OutlineInputBorder(),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
            ),
          ),
          const SizedBox(width: 8),
          IconButton.filled(
            onPressed: (canReply && !_sending) ? _send : null,
            icon: _sending
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.send),
          ),
        ]),
      ),
    );
  }

  Widget _chip(String label, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.5), width: 0.8),
        ),
        child: Text(label.toUpperCase(), style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: color, letterSpacing: 0.5)),
      );

  Widget _statusChip(String s) {
    Color c;
    switch (s) {
      case 'resolved':    c = Colors.green;       break;
      case 'closed':      c = Colors.grey;        break;
      case 'in_progress': c = Colors.amber.shade700; break;
      default:            c = Colors.blue;
    }
    return _chip(s.replaceAll('_', ' '), c);
  }

  Widget _priorityChip(String p) {
    Color c;
    switch (p) {
      case 'urgent': c = Colors.red;       break;
      case 'high':   c = Colors.orange;    break;
      case 'low':    c = Colors.blueGrey;  break;
      default:       c = Colors.blue;
    }
    return _chip(p, c);
  }
}
