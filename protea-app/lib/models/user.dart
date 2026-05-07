class User {
  final int id;
  final String name;
  final String email;
  final String role;
  final String? phone;
  final String? photoUrl;
  final DateTime? dateOfBirth;
  final String? battingStyle;
  final String? bowlingStyle;
  final bool approved;
  final DateTime? createdAt;
  final DateTime? lastLogin;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phone,
    this.photoUrl,
    this.dateOfBirth,
    this.battingStyle,
    this.bowlingStyle,
    this.approved = false,
    this.createdAt,
    this.lastLogin,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      role: json['role'] ?? 'player',
      phone: json['phone'],
      photoUrl: json['photo_url'],
      dateOfBirth: json['date_of_birth'] != null ? DateTime.parse(json['date_of_birth']).toLocal() : null,
      battingStyle: json['batting_style'],
      bowlingStyle: json['bowling_style'],
      approved: json['approved'] ?? false,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
      lastLogin: json['last_login'] != null ? DateTime.parse(json['last_login']) : null,
    );
  }
}
