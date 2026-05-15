import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/support_ticket.dart';
import 'api_service.dart';

/// Support-ticket client. Reuses ApiService.baseUrl so the ngrok URL only
/// needs to be maintained in one place.
class SupportService {
  // Single source of truth — keep in sync with ApiService.
  static String get baseUrl => ApiService.baseUrl;

  static Future<Map<String, String>> _headers() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': '69420',
      'User-Agent': 'Mozilla/5.0',
    };
    if (token != null) headers['Authorization'] = 'Bearer $token';
    return headers;
  }

  /// GET /users/support-tickets/mine — tickets filed by the signed-in user.
  static Future<List<SupportTicket>> listMine({String? status}) async {
    final qp = <String, String>{ 'limit': '100', if (status != null) 'status': status };
    final uri = Uri.parse('$baseUrl/users/support-tickets/mine').replace(queryParameters: qp);
    final resp = await http.get(uri, headers: await _headers());
    if (resp.statusCode != 200) return [];
    final list = (jsonDecode(resp.body)['data'] as List?) ?? [];
    return list.map((e) => SupportTicket.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// GET /users/support-tickets/:id — reporter or admin can read.
  static Future<SupportTicket?> getOne(String id) async {
    final resp = await http.get(Uri.parse('$baseUrl/users/support-tickets/$id'), headers: await _headers());
    if (resp.statusCode != 200) return null;
    final data = jsonDecode(resp.body)['data'];
    if (data == null) return null;
    return SupportTicket.fromJson(data as Map<String, dynamic>);
  }

  /// POST /users/support-tickets — any authenticated user can file a ticket.
  static Future<SupportTicket?> create({
    required String subject,
    required String description,
    String? category,
    String priority = 'normal',
  }) async {
    final resp = await http.post(
      Uri.parse('$baseUrl/users/support-tickets'),
      headers: await _headers(),
      body: jsonEncode({
        'subject': subject,
        'description': description,
        if (category != null && category.isNotEmpty) 'category': category,
        'priority': priority,
      }),
    );
    if (resp.statusCode != 200 && resp.statusCode != 201) return null;
    final data = jsonDecode(resp.body)['data'];
    if (data == null) return null;
    return SupportTicket.fromJson(data as Map<String, dynamic>);
  }

  /// POST /users/support-tickets/:id/responses — reporter or admin can reply.
  static Future<bool> addResponse(String ticketId, String message) async {
    final resp = await http.post(
      Uri.parse('$baseUrl/users/support-tickets/$ticketId/responses'),
      headers: await _headers(),
      body: jsonEncode({ 'message': message }),
    );
    return resp.statusCode == 200 || resp.statusCode == 201;
  }
}
