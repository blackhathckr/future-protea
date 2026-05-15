import 'package:flutter/material.dart';
import '../../models/support_ticket.dart';
import '../../services/support_service.dart';
import 'ticket_detail_screen.dart';

/// Universal support screen — every role can file and track their own tickets.
/// The admin sees all tickets from the web admin panel; users only see theirs.
class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  bool _loading = true;
  List<SupportTicket> _tickets = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final tickets = await SupportService.listMine();
    if (!mounted) return;
    setState(() {
      _tickets = tickets;
      _loading = false;
    });
  }

  Future<void> _openCreate() async {
    final created = await showModalBottomSheet<SupportTicket>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => const _NewTicketSheet(),
    );
    if (created != null) _load();
  }

  Future<void> _openDetail(SupportTicket t) async {
    await Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => TicketDetailScreen(ticketId: t.id),
    ));
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Support')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openCreate,
        icon: const Icon(Icons.add),
        label: const Text('New ticket'),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _tickets.isEmpty
                ? ListView(children: const [
                    SizedBox(height: 96),
                    Icon(Icons.support_agent, size: 64, color: Colors.grey),
                    SizedBox(height: 12),
                    Center(child: Text('No tickets yet', style: TextStyle(fontSize: 16))),
                    SizedBox(height: 4),
                    Center(child: Text('Tap "New ticket" to ask the admin for help.', style: TextStyle(color: Colors.grey))),
                  ])
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(12, 8, 12, 100),
                    itemCount: _tickets.length,
                    itemBuilder: (_, i) => _ticketCard(_tickets[i]),
                  ),
      ),
    );
  }

  Widget _ticketCard(SupportTicket t) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        onTap: () => _openDetail(t),
        leading: Container(
          width: 10, height: 40,
          decoration: BoxDecoration(
            color: _priorityColor(t.priority),
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        title: Text(
          t.subject,
          maxLines: 1, overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 2),
            Text(t.description, maxLines: 2, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 6),
            Row(children: [
              _chip(t.status.replaceAll('_', ' '), _statusColor(t.status)),
              const SizedBox(width: 6),
              _chip(t.priority, _priorityColor(t.priority)),
              if (t.escalated) ...[
                const SizedBox(width: 6),
                _chip('ESCALATED', Colors.deepOrange),
              ],
              const Spacer(),
              Text(_relative(t.createdAt), style: const TextStyle(fontSize: 11, color: Colors.grey)),
            ]),
          ],
        ),
        trailing: const Icon(Icons.chevron_right),
      ),
    );
  }

  Widget _chip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.5), width: 0.8),
      ),
      child: Text(
        label.toUpperCase(),
        style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: color, letterSpacing: 0.5),
      ),
    );
  }

  Color _priorityColor(String p) {
    switch (p) {
      case 'urgent': return Colors.red;
      case 'high':   return Colors.orange;
      case 'low':    return Colors.blueGrey;
      default:       return Colors.blue;
    }
  }

  Color _statusColor(String s) {
    switch (s) {
      case 'resolved':    return Colors.green;
      case 'closed':      return Colors.grey;
      case 'in_progress': return Colors.amber.shade700;
      default:            return Colors.blue;
    }
  }

  String _relative(DateTime d) {
    final diff = DateTime.now().difference(d);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${d.day}/${d.month}/${d.year}';
  }
}

class _NewTicketSheet extends StatefulWidget {
  const _NewTicketSheet();

  @override
  State<_NewTicketSheet> createState() => _NewTicketSheetState();
}

class _NewTicketSheetState extends State<_NewTicketSheet> {
  final _subject = TextEditingController();
  final _description = TextEditingController();
  final _category = TextEditingController();
  String _priority = 'normal';
  bool _saving = false;

  @override
  void dispose() {
    _subject.dispose();
    _description.dispose();
    _category.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_subject.text.trim().isEmpty || _description.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Subject and description are required')));
      return;
    }
    setState(() => _saving = true);
    final t = await SupportService.create(
      subject: _subject.text.trim(),
      description: _description.text.trim(),
      category: _category.text.trim().isEmpty ? null : _category.text.trim(),
      priority: _priority,
    );
    if (!mounted) return;
    setState(() => _saving = false);
    if (t == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to create ticket')));
    } else {
      Navigator.pop(context, t);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.4), borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 12),
          const Text('New support ticket', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          TextField(controller: _subject, decoration: const InputDecoration(labelText: 'Subject *', border: OutlineInputBorder())),
          const SizedBox(height: 10),
          TextField(controller: _description, maxLines: 4, decoration: const InputDecoration(labelText: 'Describe the issue *', border: OutlineInputBorder())),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: TextField(controller: _category, decoration: const InputDecoration(labelText: 'Category', hintText: 'e.g. scoring', border: OutlineInputBorder()))),
            const SizedBox(width: 10),
            Expanded(
              child: DropdownButtonFormField<String>(
                initialValue: _priority,
                decoration: const InputDecoration(labelText: 'Priority', border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: 'low', child: Text('Low')),
                  DropdownMenuItem(value: 'normal', child: Text('Normal')),
                  DropdownMenuItem(value: 'high', child: Text('High')),
                  DropdownMenuItem(value: 'urgent', child: Text('Urgent')),
                ],
                onChanged: (v) => setState(() => _priority = v ?? 'normal'),
              ),
            ),
          ]),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _saving ? null : _submit,
            icon: _saving
                ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.send),
            label: const Text('Submit'),
            style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
          ),
        ],
      ),
    );
  }
}
