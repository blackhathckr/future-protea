class NotificationItem {
  final String id;
  final String userId;
  final String title;
  final String message;
  final String type;
  final String? category;
  final String? link;
  final Map<String, dynamic>? metadata;
  final bool isRead;
  final DateTime? readAt;
  final DateTime createdAt;

  NotificationItem({
    required this.id,
    required this.userId,
    required this.title,
    required this.message,
    required this.type,
    this.category,
    this.link,
    this.metadata,
    required this.isRead,
    this.readAt,
    required this.createdAt,
  });

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      title: json['title'] as String? ?? '',
      message: json['message'] as String? ?? '',
      type: json['type'] as String? ?? 'info',
      category: json['category'] as String?,
      link: json['link'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
      isRead: json['is_read'] as bool? ?? false,
      readAt: json['read_at'] != null ? DateTime.tryParse(json['read_at'] as String) : null,
      createdAt: DateTime.tryParse(json['created_at'] as String? ?? '') ?? DateTime.now(),
    );
  }
}

class AnnouncementItem {
  final String id;
  final String title;
  final String content;
  final List<String> targetRoles;
  final bool isActive;
  final DateTime? publishedAt;
  final DateTime? expiresAt;
  final DateTime createdAt;

  AnnouncementItem({
    required this.id,
    required this.title,
    required this.content,
    required this.targetRoles,
    required this.isActive,
    this.publishedAt,
    this.expiresAt,
    required this.createdAt,
  });

  factory AnnouncementItem.fromJson(Map<String, dynamic> json) {
    return AnnouncementItem(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      content: json['content'] as String? ?? '',
      targetRoles: ((json['target_roles'] as List?) ?? []).map((e) => e.toString()).toList(),
      isActive: json['is_active'] as bool? ?? false,
      publishedAt: json['published_at'] != null ? DateTime.tryParse(json['published_at'] as String) : null,
      expiresAt: json['expires_at'] != null ? DateTime.tryParse(json['expires_at'] as String) : null,
      createdAt: DateTime.tryParse(json['created_at'] as String? ?? '') ?? DateTime.now(),
    );
  }
}
