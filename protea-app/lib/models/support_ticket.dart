class TicketResponseItem {
  final String id;
  final String ticketId;
  final String? authorId;
  final String? authorName;
  final String message;
  final bool isInternal;
  final DateTime createdAt;

  TicketResponseItem({
    required this.id,
    required this.ticketId,
    this.authorId,
    this.authorName,
    required this.message,
    required this.isInternal,
    required this.createdAt,
  });

  factory TicketResponseItem.fromJson(Map<String, dynamic> json) {
    return TicketResponseItem(
      id: json['id'] as String,
      ticketId: json['ticket_id'] as String,
      authorId: json['author_id'] as String?,
      authorName: json['author_name'] as String?,
      message: json['message'] as String? ?? '',
      isInternal: json['is_internal'] as bool? ?? false,
      createdAt: DateTime.tryParse(json['created_at'] as String? ?? '') ?? DateTime.now(),
    );
  }
}

class SupportTicket {
  final String id;
  final String subject;
  final String description;
  final String? category;
  final String status;   // open / in_progress / resolved / closed
  final String priority; // low / normal / high / urgent
  final String? reporterId;
  final String? reporterEmail;
  final String? assignedToId;
  final bool escalated;
  final String? escalationReason;
  final DateTime? resolvedAt;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<TicketResponseItem> responses;

  SupportTicket({
    required this.id,
    required this.subject,
    required this.description,
    this.category,
    required this.status,
    required this.priority,
    this.reporterId,
    this.reporterEmail,
    this.assignedToId,
    required this.escalated,
    this.escalationReason,
    this.resolvedAt,
    required this.createdAt,
    required this.updatedAt,
    this.responses = const [],
  });

  factory SupportTicket.fromJson(Map<String, dynamic> json) {
    return SupportTicket(
      id: json['id'] as String,
      subject: json['subject'] as String? ?? '',
      description: json['description'] as String? ?? '',
      category: json['category'] as String?,
      status: json['status'] as String? ?? 'open',
      priority: json['priority'] as String? ?? 'normal',
      reporterId: json['reporter_id'] as String?,
      reporterEmail: json['reporter_email'] as String?,
      assignedToId: json['assigned_to_id'] as String?,
      escalated: json['escalated'] as bool? ?? false,
      escalationReason: json['escalation_reason'] as String?,
      resolvedAt: json['resolved_at'] != null ? DateTime.tryParse(json['resolved_at'] as String) : null,
      createdAt: DateTime.tryParse(json['created_at'] as String? ?? '') ?? DateTime.now(),
      updatedAt: DateTime.tryParse(json['updated_at'] as String? ?? '') ?? DateTime.now(),
      responses: ((json['responses'] as List?) ?? [])
          .map((e) => TicketResponseItem.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
