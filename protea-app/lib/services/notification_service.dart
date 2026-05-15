import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/notification.dart';
import 'api_service.dart';

/// Notification & Announcement client. Reuses ApiService.baseUrl so the ngrok
/// URL only needs to be maintained in one place.
class NotificationService {
  // Single source of truth — keep in sync with ApiService.
  static String get baseUrl => ApiService.baseUrl;

  static Future<Map<String, String>> _headers() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    return {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': '69420',
      'User-Agent': 'Mozilla/5.0',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<List<NotificationItem>> list({int limit = 50, bool unreadOnly = false}) async {
    final qp = <String, String>{ 'limit': '$limit', if (unreadOnly) 'unread': 'true' };
    final uri = Uri.parse('$baseUrl/notifications').replace(queryParameters: qp);
    final resp = await http.get(uri, headers: await _headers());
    if (resp.statusCode != 200) return [];
    final body = jsonDecode(resp.body);
    final list = (body['data'] as List?) ?? [];
    return list.map((e) => NotificationItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<int> unreadCount() async {
    final resp = await http.get(Uri.parse('$baseUrl/notifications/unread-count'), headers: await _headers());
    if (resp.statusCode != 200) return 0;
    return (jsonDecode(resp.body)['count'] as num?)?.toInt() ?? 0;
  }

  static Future<bool> markRead(String id) async {
    final resp = await http.post(Uri.parse('$baseUrl/notifications/$id/read'), headers: await _headers());
    return resp.statusCode == 200;
  }

  static Future<bool> markAllRead() async {
    final resp = await http.post(Uri.parse('$baseUrl/notifications/read-all'), headers: await _headers());
    return resp.statusCode == 200;
  }

  static Future<bool> remove(String id) async {
    final resp = await http.delete(Uri.parse('$baseUrl/notifications/$id'), headers: await _headers());
    return resp.statusCode == 200;
  }

  /// Bulk delete. readOnly=true wipes only already-read items; default wipes
  /// the entire inbox.
  static Future<int> removeAll({bool readOnly = false}) async {
    final uri = readOnly
        ? Uri.parse('$baseUrl/notifications').replace(queryParameters: {'read': '1'})
        : Uri.parse('$baseUrl/notifications');
    final resp = await http.delete(uri, headers: await _headers());
    if (resp.statusCode != 200) return 0;
    final data = jsonDecode(resp.body)['data'];
    return (data is Map && data['count'] is num) ? (data['count'] as num).toInt() : 0;
  }

  // ── Announcements visible to the signed-in user ──────────────────────────
  static Future<List<AnnouncementItem>> activeAnnouncements() async {
    final resp = await http.get(Uri.parse('$baseUrl/users/announcements/active'), headers: await _headers());
    if (resp.statusCode != 200) return [];
    final list = (jsonDecode(resp.body)['data'] as List?) ?? [];
    return list.map((e) => AnnouncementItem.fromJson(e as Map<String, dynamic>)).toList();
  }
}
