import 'package:flutter/material.dart';
import '../models/user.dart';
import 'api_service.dart';

class AuthProvider extends ChangeNotifier {
  User? _user;
  bool _loading = true;
  bool _isGuest = false;

  User? get user => _user;
  bool get loading => _loading;
  bool get isLoggedIn => _user != null || _isGuest;
  bool get isGuest => _isGuest;
  String get role => _isGuest ? 'guest' : (_user?.role ?? '');

  Future<void> init() async {
    _loading = true;
    _user = await ApiService.getCurrentUser();
    _loading = false;
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    final data = await ApiService.login(email, password);
    _user = User.fromJson(data['user']);
    _isGuest = false;
    notifyListeners();
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
    required String role,
    String? phone,
    String? battingStyle,
    String? bowlingStyle,
    String? dateOfBirth,
  }) async {
    final data = await ApiService.register(
      name: name,
      email: email,
      password: password,
      role: role,
      phone: phone,
      battingStyle: battingStyle,
      bowlingStyle: bowlingStyle,
      dateOfBirth: dateOfBirth,
    );
    _user = User.fromJson(data['user']);
    _isGuest = false;
    notifyListeners();
  }

  void continueAsGuest() {
    _user = null;
    _isGuest = true;
    notifyListeners();
  }

  void setUser(User user) {
    _user = user;
    notifyListeners();
  }

  Future<void> logout() async {
    try {
      await ApiService.logout();
    } catch (_) {}
    _user = null;
    _isGuest = false;
    notifyListeners();
  }
}
