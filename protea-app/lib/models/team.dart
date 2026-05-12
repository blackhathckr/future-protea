class Team {
  final String id;
  final String? teamCode;
  final String teamName;
  final String? schoolName;
  final String? clubName;
  final String teamType; // 'school' or 'club'
  final String? logoUrl;
  final String? createdBy;
  final List<TeamPlayer>? players;

  Team({
    required this.id,
    this.teamCode,
    required this.teamName,
    this.schoolName,
    this.clubName,
    required this.teamType,
    this.logoUrl,
    this.createdBy,
    this.players,
  });

  factory Team.fromJson(Map<String, dynamic> json) {
    return Team(
      id: json['id'].toString(),
      teamCode: json['team_code'],
      teamName: json['team_name'] ?? json['name'] ?? '',
      schoolName: json['school_name'],
      clubName: json['club_name'],
      teamType: json['team_type'] ?? 'school',
      logoUrl: json['logo_url'],
      createdBy: json['created_by']?.toString(),
      players: json['players'] != null
          ? (json['players'] as List).map((p) => TeamPlayer.fromJson(p)).toList()
          : null,
    );
  }

  String get displayName {
    if (teamType == 'school' && schoolName != null) {
      return '$schoolName - $teamName';
    }
    if (teamType == 'club' && clubName != null) {
      return '$clubName - $teamName';
    }
    return teamName;
  }

  String get organizationName => schoolName ?? clubName ?? '';
}

class TeamPlayer {
  final String id;
  final String teamId;
  final String playerId;
  final String playerName;
  final String? dateOfBirth;
  final String? photoUrl;
  final bool isCaptain;
  final bool isWicketKeeper;

  TeamPlayer({
    required this.id,
    required this.teamId,
    required this.playerId,
    required this.playerName,
    this.dateOfBirth,
    this.photoUrl,
    this.isCaptain = false,
    this.isWicketKeeper = false,
  });

  factory TeamPlayer.fromJson(Map<String, dynamic> json) {
    return TeamPlayer(
      id: (json['id'] ?? '').toString(),
      teamId: (json['team_id'] ?? '').toString(),
      playerId: (json['player_id'] ?? json['id'] ?? '').toString(),
      playerName: json['player_name'] ?? json['name'] ?? '',
      dateOfBirth: json['date_of_birth'] ?? json['dob'],
      photoUrl: json['photo_url'],
      isCaptain: json['is_captain'] ?? false,
      isWicketKeeper: json['is_wicket_keeper'] ?? false,
    );
  }
}
