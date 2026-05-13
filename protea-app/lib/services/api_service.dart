import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/match.dart';
import '../models/ball.dart';
import '../models/user.dart';
import '../models/player.dart';
import '../models/team.dart';
import '../models/tournament.dart';

class ApiService {
  static const String baseUrl = 'https://eustolia-jural-unaspiringly.ngrok-free.dev/api';
  // static const String baseUrl = 'http://10.66.199.18:5000/api'; // Local fallback

  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  static Future<Map<String, String>> _headers() async {
    final token = await _getToken();
    return {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': '69420',
      'User-Agent': 'Mozilla/5.0',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // ==================== AUTH ====================

  static Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    required String role,
    String? phone,
    String? battingStyle,
    String? bowlingStyle,
    String? dateOfBirth,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/register'),
      headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '69420', 'User-Agent': 'Mozilla/5.0'},
      body: jsonEncode({
        'name': name,
        'email': email,
        'password': password,
        'role': role,
        'phone': phone,
        'batting_style': battingStyle,
        'bowling_style': bowlingStyle,
        'date_of_birth': dateOfBirth,
      }),
    );
    final data = jsonDecode(response.body);
    if (response.statusCode == 201) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', data['token']);
      await prefs.setString('user', jsonEncode(data['user']));
      return data;
    }
    throw Exception(data['error'] ?? 'Registration failed');
  }

  static Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/login'),
      headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '69420', 'User-Agent': 'Mozilla/5.0'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final data = jsonDecode(response.body);
    if (response.statusCode == 200) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', data['token']);
      await prefs.setString('user', jsonEncode(data['user']));
      return data;
    }
    throw Exception(data['error'] ?? 'Login failed');
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  static Future<User?> getCurrentUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString('user');
    if (userStr == null) return null;
    try {
      return User.fromJson(jsonDecode(userStr));
    } catch (_) {
      // Cached user shape is stale (e.g. from before CUID migration). Drop it.
      await prefs.remove('user');
      await prefs.remove('token');
      return null;
    }
  }

  static Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token') != null;
  }

  static Future<User> updateProfile({
    String? name,
    String? phone,
    DateTime? dateOfBirth,
    String? battingStyle,
    String? bowlingStyle,
  }) async {
    final headers = await _headers();
    final body = <String, dynamic>{};
    if (name != null) body['name'] = name;
    if (phone != null) body['phone'] = phone;
    if (dateOfBirth != null) {
      // Format as YYYY-MM-DD to avoid timezone issues
      final year = dateOfBirth.year.toString().padLeft(4, '0');
      final month = dateOfBirth.month.toString().padLeft(2, '0');
      final day = dateOfBirth.day.toString().padLeft(2, '0');
      body['date_of_birth'] = '$year-$month-$day';
    }
    if (battingStyle != null) body['batting_style'] = battingStyle;
    if (bowlingStyle != null) body['bowling_style'] = bowlingStyle;

    final response = await http.put(
      Uri.parse('$baseUrl/profile'),
      headers: headers,
      body: jsonEncode(body),
    );
    if (response.statusCode == 200) {
      final userData = jsonDecode(response.body);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user', jsonEncode(userData));
      return User.fromJson(userData);
    }
    throw Exception('Failed to update profile');
  }

  static Future<User> uploadProfilePhoto(String imagePath) async {
    final token = await _getToken();
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/profile/photo'),
    );
    request.headers['Authorization'] = 'Bearer $token';
    request.headers['ngrok-skip-browser-warning'] = '69420';
    request.files.add(await http.MultipartFile.fromPath('photo', imagePath));

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    if (response.statusCode == 200) {
      final userData = jsonDecode(response.body);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user', jsonEncode(userData));
      return User.fromJson(userData);
    }
    throw Exception('Failed to upload photo');
  }

  static Future<User> deleteProfilePhoto() async {
    final headers = await _headers();
    final response = await http.delete(
      Uri.parse('$baseUrl/profile/photo'),
      headers: headers,
    );
    if (response.statusCode == 200) {
      final userData = jsonDecode(response.body);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user', jsonEncode(userData));
      return User.fromJson(userData);
    }
    throw Exception('Failed to delete photo');
  }

  static Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final headers = await _headers();
    final response = await http.post(
      Uri.parse('$baseUrl/change-password'),
      headers: headers,
      body: jsonEncode({
        'current_password': currentPassword,
        'new_password': newPassword,
      }),
    );
    if (response.statusCode != 200) {
      final data = jsonDecode(response.body);
      throw Exception(data['error'] ?? 'Failed to change password');
    }
  }

  static Future<void> forgotPassword(String email) async {
    final response = await http.post(
      Uri.parse('$baseUrl/forgot-password'),
      headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '69420', 'User-Agent': 'Mozilla/5.0'},
      body: jsonEncode({'email': email}),
    );
    if (response.statusCode != 200) {
      final data = jsonDecode(response.body);
      throw Exception(data['error'] ?? 'Failed to send OTP');
    }
  }

  static Future<void> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/reset-password'),
      headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '69420', 'User-Agent': 'Mozilla/5.0'},
      body: jsonEncode({
        'email': email,
        'otp': otp,
        'new_password': newPassword,
      }),
    );
    if (response.statusCode != 200) {
      final data = jsonDecode(response.body);
      throw Exception(data['error'] ?? 'Failed to reset password');
    }
  }

  // ==================== MATCHES ====================

  static Future<List<CricketMatch>> getMatches({String? status}) async {
    final headers = await _headers();
    String url = '$baseUrl/matches';
    if (status != null) url += '?status=$status';
    final response = await http.get(Uri.parse(url), headers: headers);
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((m) => CricketMatch.fromJson(m)).toList();
    }
    throw Exception('Failed to load matches');
  }

  static Future<CricketMatch> getMatch(String id) async {
    final headers = await _headers();
    final response = await http.get(Uri.parse('$baseUrl/matches/$id'), headers: headers);
    if (response.statusCode == 200) {
      return CricketMatch.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to load match');
  }

  static Future<CricketMatch> createMatch({
    required String team1Name,
    required String team2Name,
    String? venue,
    int totalOvers = 20,
    required DateTime matchDate,
    String? tournamentId,
    String? matchType,
    int ballsPerOver = 6,
    String? umpire,
  }) async {
    final headers = await _headers();
    final response = await http.post(
      Uri.parse('$baseUrl/matches'),
      headers: headers,
      body: jsonEncode({
        'team1_name': team1Name,
        'team2_name': team2Name,
        'venue': venue,
        'total_overs': totalOvers,
        'match_date': matchDate.toIso8601String(),
        'tournament_id': tournamentId,
        'match_type': matchType,
        'balls_per_over': ballsPerOver,
        'umpire': umpire,
      }),
    );
    if (response.statusCode == 201) {
      return CricketMatch.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to create match');
  }

  static Future<CricketMatch> updateMatch(String id, Map<String, dynamic> updates) async {
    final headers = await _headers();
    final response = await http.put(
      Uri.parse('$baseUrl/matches/$id'),
      headers: headers,
      body: jsonEncode(updates),
    );
    if (response.statusCode == 200) {
      return CricketMatch.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to update match: ${response.statusCode} - ${response.body}');
  }

  // ==================== MATCH PLAYERS ====================

  static Future<void> joinMatch(String matchId, {int? team}) async {
    final headers = await _headers();
    final response = await http.post(
      Uri.parse('$baseUrl/matches/$matchId/join'),
      headers: headers,
      body: jsonEncode({'team': team}),
    );
    if (response.statusCode != 201) {
      final data = jsonDecode(response.body);
      throw Exception(data['error'] ?? 'Failed to join match');
    }
  }

  static Future<List<MatchPlayer>> getMatchPlayers(String matchId) async {
    final headers = await _headers();
    final response = await http.get(Uri.parse('$baseUrl/matches/$matchId/players'), headers: headers);
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((p) => MatchPlayer.fromJson(p)).toList();
    }
    throw Exception('Failed to load players');
  }

  static Future<void> populateMatchPlayers(String matchId) async {
    final headers = await _headers();
    final response = await http.post(
      Uri.parse('$baseUrl/matches/$matchId/populate-players'),
      headers: headers,
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to populate match players');
    }
  }

  static Future<List<MatchPlayer>> getApprovedPlayers(String matchId) async {
    final headers = await _headers();
    final response = await http.get(Uri.parse('$baseUrl/matches/$matchId/approved-players'), headers: headers);
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((p) => MatchPlayer.fromJson(p)).toList();
    }
    throw Exception('Failed to load approved players');
  }

  static Future<void> approvePlayer(String matchPlayerId, {String status = 'approved', int? team}) async {
    final headers = await _headers();
    final response = await http.put(
      Uri.parse('$baseUrl/match-players/$matchPlayerId/approve'),
      headers: headers,
      body: jsonEncode({'status': status, 'team': team}),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to approve player');
    }
  }

  static Future<void> togglePlayerPlaying(String matchId, String playerId, bool isPlaying) async {
    final headers = await _headers();
    final response = await http.put(
      Uri.parse('$baseUrl/matches/$matchId/players/$playerId/toggle-playing'),
      headers: headers,
      body: jsonEncode({'is_playing': isPlaying}),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to update playing status');
    }
  }

  // ==================== SCORING ====================

  static Future<Map<String, dynamic>> addBall({
    required String matchId,
    required int innings,
    required int overNumber,
    required int ballNumber,
    String? batsmanId,
    String? bowlerId,
    int runs = 0,
    bool isWide = false,
    bool isNoball = false,
    bool isBye = false,
    bool isLegbye = false,
    bool isWicket = false,
    String? wicketType,
    int extras = 0,
    int overthrows = 0,
    String? shotDirection,
  }) async {
    final headers = await _headers();
    final response = await http.post(
      Uri.parse('$baseUrl/matches/$matchId/ball'),
      headers: headers,
      body: jsonEncode({
        'innings': innings,
        'over_number': overNumber,
        'ball_number': ballNumber,
        'batsman_id': batsmanId,
        'bowler_id': bowlerId,
        'runs': runs,
        'is_wide': isWide,
        'is_noball': isNoball,
        'is_bye': isBye,
        'is_legbye': isLegbye,
        'overthrows': overthrows,
        'shot_direction': shotDirection,
        'is_wicket': isWicket,
        'wicket_type': wicketType,
        'extras': extras,
      }),
    );
    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to add ball');
  }

  static Future<Map<String, dynamic>> deleteLastBall(String matchId, {int? innings}) async {
    final headers = await _headers();
    String url = '$baseUrl/matches/$matchId/ball/last';
    if (innings != null) url += '?innings=$innings';
    final response = await http.delete(Uri.parse(url), headers: headers);
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to delete ball');
  }

  static Future<List<Ball>> getBalls(String matchId, {int? innings}) async {
    final headers = await _headers();
    String url = '$baseUrl/matches/$matchId/balls';
    if (innings != null) url += '?innings=$innings';
    final response = await http.get(Uri.parse(url), headers: headers);
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((b) => Ball.fromJson(b)).toList();
    }
    throw Exception('Failed to load balls');
  }

  static Future<Map<String, dynamic>> getScorecard(String matchId) async {
    final headers = await _headers();
    final response = await http.get(Uri.parse('$baseUrl/matches/$matchId/scorecard'), headers: headers);
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to load scorecard');
  }

  static Future<void> markRetiredHurt(String matchId, String playerId) async {
    final headers = await _headers();
    final response = await http.put(
      Uri.parse('$baseUrl/matches/$matchId/players/$playerId/retired-hurt'),
      headers: headers,
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to mark player as retired hurt');
    }
  }

  static Future<void> clearRetiredHurt(String matchId, String playerId) async {
    final headers = await _headers();
    final response = await http.delete(
      Uri.parse('$baseUrl/matches/$matchId/players/$playerId/retired-hurt'),
      headers: headers,
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to clear retired hurt status');
    }
  }

  static Future<Map<String, dynamic>> abandonMatch(String matchId, {String? reason}) async {
    final headers = await _headers();
    final response = await http.post(
      Uri.parse('$baseUrl/matches/$matchId/abandon'),
      headers: headers,
      body: jsonEncode({'reason': reason}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    final data = jsonDecode(response.body);
    throw Exception(data['error'] ?? 'Failed to abandon match');
  }

  static Future<Map<String, dynamic>> penaltyRuns(
    String matchId, {
    required int innings,
    required int runs,
    String? reason,
  }) async {
    final headers = await _headers();
    final response = await http.post(
      Uri.parse('$baseUrl/matches/$matchId/penalty'),
      headers: headers,
      body: jsonEncode({'innings': innings, 'runs': runs, 'reason': reason}),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    final data = jsonDecode(response.body);
    throw Exception(data['error'] ?? 'Failed to apply penalty runs');
  }

  // ==================== PLAYERS (User-based) ====================

  static Future<List<User>> getPlayers() async {
    final headers = await _headers();
    final response = await http.get(Uri.parse('$baseUrl/players'), headers: headers);
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((u) => User.fromJson(u)).toList();
    }
    throw Exception('Failed to load players');
  }

  static Future<void> approveUser(String playerId) async {
    final headers = await _headers();
    final response = await http.put(
      Uri.parse('$baseUrl/players/$playerId/approve'),
      headers: headers,
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to approve player');
    }
  }

  // ==================== REGISTERED PLAYERS ====================

  static Future<List<Player>> getRegisteredPlayers({String? search}) async {
    final headers = await _headers();
    String url = '$baseUrl/registered-players';
    if (search != null && search.isNotEmpty) url += '?search=$search';
    final response = await http.get(Uri.parse(url), headers: headers);
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((p) => Player.fromJson(p)).toList();
    }
    throw Exception('Failed to load registered players');
  }

  static Future<Player> registerPlayer({
    required String name,
    String? dateOfBirth,
    String? email,
    String? phone,
    String? emergencyContact,
    String? emergencyContactName,
    String? address,
    String? city,
    String? state,
    String? country,
    String? postalCode,
    double? height,
    double? weight,
    String? bloodGroup,
    String? schoolName,
    String? clubName,
    String? battingStyle,
    String? bowlingStyle,
    String? playingRole,
    int? jerseyNumber,
    String? fatherName,
    String? motherName,
    String? guardianName,
    String? nationality,
  }) async {
    final headers = await _headers();
    final response = await http.post(
      Uri.parse('$baseUrl/registered-players'),
      headers: headers,
      body: jsonEncode({
        'name': name,
        'date_of_birth': dateOfBirth,
        'email': email,
        'phone': phone,
        'emergency_contact': emergencyContact,
        'emergency_contact_name': emergencyContactName,
        'address': address,
        'city': city,
        'state': state,
        'country': country,
        'postal_code': postalCode,
        'height': height,
        'weight': weight,
        'blood_group': bloodGroup,
        'school_name': schoolName,
        'club_name': clubName,
        'batting_style': battingStyle,
        'bowling_style': bowlingStyle,
        'playing_role': playingRole,
        'jersey_number': jerseyNumber,
        'father_name': fatherName,
        'mother_name': motherName,
        'guardian_name': guardianName,
        'nationality': nationality,
      }),
    );
    if (response.statusCode == 201) {
      return Player.fromJson(jsonDecode(response.body));
    }
    final data = jsonDecode(response.body);
    throw Exception(data['error'] ?? 'Failed to register player');
  }

  static Future<Player> updatePlayer(String id, Map<String, dynamic> updates) async {
    final headers = await _headers();
    final response = await http.put(
      Uri.parse('$baseUrl/registered-players/$id'),
      headers: headers,
      body: jsonEncode(updates),
    );
    if (response.statusCode == 200) {
      return Player.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to update player');
  }

  static Future<Player> uploadPlayerPhoto(String playerId, String filePath) async {
    final token = await _getToken();
    final uri = Uri.parse('$baseUrl/registered-players/$playerId/photo');
    final request = http.MultipartRequest('POST', uri);
    request.headers['Authorization'] = 'Bearer $token';
    request.headers['ngrok-skip-browser-warning'] = '69420';
    request.headers['User-Agent'] = 'Mozilla/5.0';
    request.files.add(await http.MultipartFile.fromPath('photo', filePath));
    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    if (response.statusCode == 200) {
      return Player.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to upload photo');
  }

  static Future<Player> deletePlayerPhoto(String playerId) async {
    final headers = await _headers();
    final response = await http.delete(
      Uri.parse('$baseUrl/registered-players/$playerId/photo'),
      headers: headers,
    );
    if (response.statusCode == 200) {
      return Player.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to delete photo');
  }

  static Future<void> deletePlayer(String playerId) async {
    final headers = await _headers();
    final response = await http.delete(
      Uri.parse('$baseUrl/registered-players/$playerId'),
      headers: headers,
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to delete player');
    }
  }

  static Future<String> backfillPlayerAccounts() async {
    final headers = await _headers();
    final response = await http.post(
      Uri.parse('$baseUrl/registered-players/backfill-accounts'),
      headers: headers,
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['message'] as String;
    }
    throw Exception('Failed to backfill accounts');
  }

  /// Get the full URL for a photo path (e.g. /uploads/player_123.jpg)
  static String getPhotoUrl(String photoPath) {
    if (photoPath.startsWith('http')) return photoPath;
    // Remove /api from baseUrl to get the server root
    final serverRoot = baseUrl.replaceAll('/api', '');
    return '$serverRoot$photoPath';
  }

  // ==================== TEAMS ====================

  static Future<List<Team>> getTeams() async {
    final headers = await _headers();
    final response = await http.get(Uri.parse('$baseUrl/teams'), headers: headers);
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((t) => Team.fromJson(t)).toList();
    }
    throw Exception('Failed to load teams');
  }

  static Future<Team> getTeam(String id) async {
    final headers = await _headers();
    final response = await http.get(Uri.parse('$baseUrl/teams/$id'), headers: headers);
    if (response.statusCode == 200) {
      return Team.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to load team');
  }

  static Future<Map<String, dynamic>> getTeamStats(String id) async {
    final headers = await _headers();
    final response = await http.get(Uri.parse('$baseUrl/teams/$id/stats'), headers: headers);
    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    throw Exception('Failed to load team stats');
  }

  static Future<Team> createTeam({
    required String teamName,
    required String teamType,
    String? schoolName,
    String? clubName,
  }) async {
    final headers = await _headers();
    final response = await http.post(
      Uri.parse('$baseUrl/teams'),
      headers: headers,
      body: jsonEncode({
        'team_name': teamName,
        'team_type': teamType,
        'school_name': schoolName,
        'club_name': clubName,
      }),
    );
    if (response.statusCode == 201) {
      return Team.fromJson(jsonDecode(response.body));
    }
    final data = jsonDecode(response.body);
    throw Exception(data['error'] ?? 'Failed to create team');
  }

  static Future<void> addPlayerToTeam(String teamId, String playerId) async {
    final headers = await _headers();
    final response = await http.post(
      Uri.parse('$baseUrl/teams/$teamId/players'),
      headers: headers,
      body: jsonEncode({'player_id': playerId}),
    );
    if (response.statusCode != 201) {
      final data = jsonDecode(response.body);
      throw Exception(data['error'] ?? 'Failed to add player to team');
    }
  }

  static Future<void> updatePlayerRole(String teamId, String playerId, {bool? isCaptain, bool? isWicketKeeper}) async {
    final headers = await _headers();
    final body = <String, dynamic>{};
    if (isCaptain != null) body['is_captain'] = isCaptain;
    if (isWicketKeeper != null) body['is_wicket_keeper'] = isWicketKeeper;
    
    final response = await http.put(
      Uri.parse('$baseUrl/teams/$teamId/players/$playerId/role'),
      headers: headers,
      body: jsonEncode(body),
    );
    if (response.statusCode != 200) {
      final data = jsonDecode(response.body);
      throw Exception(data['error'] ?? 'Failed to update player role');
    }
  }

  static Future<void> removePlayerFromTeam(String teamId, String playerId) async {
    final headers = await _headers();
    final response = await http.delete(
      Uri.parse('$baseUrl/teams/$teamId/players/$playerId'),
      headers: headers,
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to remove player from team');
    }
  }

  static Future<Team> updateTeam(String teamId, {
    String? teamName,
    String? teamType,
    String? schoolName,
    String? clubName,
  }) async {
    final headers = await _headers();
    final response = await http.put(
      Uri.parse('$baseUrl/teams/$teamId'),
      headers: headers,
      body: jsonEncode({
        if (teamName != null) 'team_name': teamName,
        if (teamType != null) 'team_type': teamType,
        if (schoolName != null) 'school_name': schoolName,
        if (clubName != null) 'club_name': clubName,
      }),
    );
    if (response.statusCode == 200) {
      return Team.fromJson(jsonDecode(response.body));
    }
    final data = jsonDecode(response.body);
    throw Exception(data['error'] ?? 'Failed to update team');
  }

  static Future<Team> uploadTeamLogo(String teamId, String filePath) async {
    final token = await _getToken();
    final uri = Uri.parse('$baseUrl/teams/$teamId/logo');
    final request = http.MultipartRequest('POST', uri);
    request.headers['Authorization'] = 'Bearer $token';
    request.headers['ngrok-skip-browser-warning'] = '69420';
    request.headers['User-Agent'] = 'Mozilla/5.0';
    request.files.add(await http.MultipartFile.fromPath('logo', filePath));
    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    if (response.statusCode == 200) {
      return Team.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to upload logo');
  }

  static Future<void> deleteTeam(String teamId) async {
    final headers = await _headers();
    final response = await http.delete(
      Uri.parse('$baseUrl/teams/$teamId'),
      headers: headers,
    );
    if (response.statusCode != 200) {
      final data = jsonDecode(response.body);
      throw Exception(data['error'] ?? 'Failed to delete team');
    }
  }

  static Future<Team> deleteTeamLogo(String teamId) async {
    final headers = await _headers();
    final response = await http.delete(
      Uri.parse('$baseUrl/teams/$teamId/logo'),
      headers: headers,
    );
    if (response.statusCode == 200) {
      return Team.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to delete logo');
  }

  // ==================== TOURNAMENTS ====================

  static Future<List<Tournament>> getTournaments({String? status}) async {
    final headers = await _headers();
    String url = '$baseUrl/tournaments';
    if (status != null) url += '?status=$status';
    final response = await http.get(Uri.parse(url), headers: headers);
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((t) => Tournament.fromJson(t)).toList();
    }
    throw Exception('Failed to load tournaments');
  }

  static Future<Tournament> getTournament(String id) async {
    final headers = await _headers();
    final response = await http.get(Uri.parse('$baseUrl/tournaments/$id'), headers: headers);
    if (response.statusCode == 200) {
      return Tournament.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to load tournament');
  }

  static Future<Tournament> createTournament({
    required String name,
    required String type,
    int overs = 20,
    DateTime? startDate,
    DateTime? endDate,
    String? venue,
    String? organizer,
  }) async {
    final headers = await _headers();
    final response = await http.post(
      Uri.parse('$baseUrl/tournaments'),
      headers: headers,
      body: jsonEncode({
        'name': name,
        'type': type,
        'overs': overs,
        'start_date': startDate?.toIso8601String(),
        'end_date': endDate?.toIso8601String(),
        'venue': venue,
        'organizer': organizer,
      }),
    );
    if (response.statusCode == 201) {
      return Tournament.fromJson(jsonDecode(response.body));
    }
    final data = jsonDecode(response.body);
    throw Exception(data['error'] ?? 'Failed to create tournament');
  }

  static Future<void> addTeamToTournament(String tournamentId, String teamId, {String? group}) async {
    final headers = await _headers();
    final response = await http.post(
      Uri.parse('$baseUrl/tournaments/$tournamentId/teams'),
      headers: headers,
      body: jsonEncode({'team_id': teamId, 'group': group}),
    );
    if (response.statusCode != 201) {
      final data = jsonDecode(response.body);
      throw Exception(data['error'] ?? 'Failed to add team to tournament');
    }
  }

  static Future<List<TournamentFixture>> getTournamentFixtures(String tournamentId) async {
    final headers = await _headers();
    final response = await http.get(Uri.parse('$baseUrl/tournaments/$tournamentId/fixtures'), headers: headers);
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((f) => TournamentFixture.fromJson(f)).toList();
    }
    throw Exception('Failed to load fixtures');
  }

  static Future<List<TournamentTeam>> getTournamentStandings(String tournamentId) async {
    final headers = await _headers();
    final response = await http.get(Uri.parse('$baseUrl/tournaments/$tournamentId/standings'), headers: headers);
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((t) => TournamentTeam.fromJson(t)).toList();
    }
    throw Exception('Failed to load standings');
  }

  static Future<Map<String, dynamic>> getTournamentStats(String tournamentId) async {
    final headers = await _headers();
    final response = await http.get(Uri.parse('$baseUrl/tournaments/$tournamentId/stats'), headers: headers);
    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    }
    throw Exception('Failed to load tournament stats');
  }

  static Future<Tournament> uploadTournamentLogo(String tournamentId, String filePath) async {
    final token = await _getToken();
    // Upload to Supabase via the player photo endpoint pattern, but we only have the logo URL
    // We use a simpler approach: upload as multipart to a generic endpoint
    final uri = Uri.parse('$baseUrl/tournaments/$tournamentId/logo');
    final request = http.MultipartRequest('POST', uri);
    if (token != null) request.headers['Authorization'] = 'Bearer $token';
    request.headers['ngrok-skip-browser-warning'] = '69420';
    request.files.add(await http.MultipartFile.fromPath('logo', filePath));
    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);
    if (response.statusCode == 200) {
      return Tournament.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to upload logo');
  }

  static Future<Tournament> updateTournament(String tournamentId, Map<String, dynamic> updates) async {
    final headers = await _headers();
    final response = await http.put(
      Uri.parse('$baseUrl/tournaments/$tournamentId'),
      headers: headers,
      body: jsonEncode(updates),
    );
    if (response.statusCode == 200) {
      return Tournament.fromJson(jsonDecode(response.body));
    }
    throw Exception('Failed to update tournament');
  }

  // ==================== PLAYER PROFILE (logged-in player) ====================

  static Future<Map<String, dynamic>> getMyProfile() async {
    final headers = await _headers();
    final response = await http.get(Uri.parse('$baseUrl/players/me/profile'), headers: headers);
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to load profile');
  }

  static Future<List<User>> getAllPlayers() async {
    final headers = await _headers();
    final response = await http.get(Uri.parse('$baseUrl/players/all'), headers: headers);
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((u) => User.fromJson(u)).toList();
    }
    throw Exception('Failed to load players (${response.statusCode}): ${response.body}');
  }

  // ==================== JOURNEY ====================

  static Future<Map<String, dynamic>> getPlayerJourney(String playerId) async {
    final headers = await _headers();
    final response = await http.get(Uri.parse('$baseUrl/players/$playerId/journey'), headers: headers);
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to load journey');
  }

  static Future<Map<String, dynamic>> getPlayerJourneyByName(String name) async {
    final headers = await _headers();
    final response = await http.get(
      Uri.parse('$baseUrl/players/journey-by-name?name=${Uri.encodeComponent(name)}'),
      headers: headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to load journey');
  }

  // ==================== PUBLIC (Guest access, no auth) ====================

  static Map<String, String> get _publicHeaders => {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420',
    'User-Agent': 'Mozilla/5.0',
  };

  static Future<List<CricketMatch>> getPublicLiveMatches() async {
    final response = await http.get(
      Uri.parse('$baseUrl/public/live-matches'),
      headers: _publicHeaders,
    );
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((m) => CricketMatch.fromJson(m)).toList();
    }
    throw Exception('Failed to load live matches');
  }

  static Future<Map<String, dynamic>> getPublicMatch(String id) async {
    final response = await http.get(
      Uri.parse('$baseUrl/public/matches/$id'),
      headers: _publicHeaders,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to load match');
  }

  static Future<Map<String, dynamic>> getPublicScorecard(String matchId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/public/matches/$matchId/scorecard'),
      headers: _publicHeaders,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to load scorecard');
  }

  static Future<List<Ball>> getPublicBalls(String matchId, {int? innings}) async {
    String url = '$baseUrl/public/matches/$matchId/balls';
    if (innings != null) url += '?innings=$innings';
    final response = await http.get(Uri.parse(url), headers: _publicHeaders);
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((b) => Ball.fromJson(b)).toList();
    }
    throw Exception('Failed to load balls');
  }

  static Future<List<CricketMatch>> getPublicMatches({String? status, int? limit}) async {
    String url = '$baseUrl/public/matches';
    final params = <String>[];
    if (status != null) params.add('status=$status');
    if (limit != null) params.add('limit=$limit');
    if (params.isNotEmpty) url += '?${params.join('&')}';
    final response = await http.get(Uri.parse(url), headers: _publicHeaders);
    if (response.statusCode == 200) {
      final List list = jsonDecode(response.body);
      return list.map((m) => CricketMatch.fromJson(m)).toList();
    }
    return [];
  }

  static Future<Map<String, dynamic>> getPublicTopPlayers() async {
    final response = await http.get(
      Uri.parse('$baseUrl/public/top-players'),
      headers: _publicHeaders,
    );
    if (response.statusCode == 200) return jsonDecode(response.body);
    return {'top_run_scorers': [], 'top_wicket_takers': []};
  }

  static Future<Map<String, dynamic>> getPublicNews() async {
    final response = await http.get(
      Uri.parse('$baseUrl/public/news'),
      headers: _publicHeaders,
    );
    if (response.statusCode == 200) return jsonDecode(response.body);
    return {'articles': []};
  }

  static Future<Map<String, dynamic>> publicSearch(String query) async {
    final encoded = Uri.encodeQueryComponent(query);
    final response = await http.get(
      Uri.parse('$baseUrl/public/search?q=$encoded'),
      headers: _publicHeaders,
    );
    if (response.statusCode == 200) return jsonDecode(response.body);
    return {'matches': [], 'players': []};
  }
}

