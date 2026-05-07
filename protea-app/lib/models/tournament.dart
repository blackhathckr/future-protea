class Tournament {
  final int id;
  final String name;
  final String type; // 'T20', 'ODI', 'Test'
  final int overs;
  final DateTime? startDate;
  final DateTime? endDate;
  final String? venue;
  final String? organizer;
  final String? logoUrl;
  final String status; // 'upcoming', 'in_progress', 'completed'
  final int? createdBy;
  final List<TournamentTeam>? teams;

  Tournament({
    required this.id,
    required this.name,
    required this.type,
    this.overs = 20,
    this.startDate,
    this.endDate,
    this.venue,
    this.organizer,
    this.logoUrl,
    this.status = 'upcoming',
    this.createdBy,
    this.teams,
  });

  factory Tournament.fromJson(Map<String, dynamic> json) {
    return Tournament(
      id: json['id'],
      name: json['name'] ?? '',
      type: json['type'] ?? 'T20',
      overs: json['overs'] ?? 20,
      startDate: json['start_date'] != null ? DateTime.parse(json['start_date']) : null,
      endDate: json['end_date'] != null ? DateTime.parse(json['end_date']) : null,
      venue: json['venue'],
      organizer: json['organizer'],
      logoUrl: json['logo_url'],
      status: json['status'] ?? 'upcoming',
      createdBy: json['created_by'],
      teams: json['teams'] != null
          ? (json['teams'] as List).map((t) => TournamentTeam.fromJson(t)).toList()
          : null,
    );
  }

  String get statusLabel {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return 'Upcoming';
    }
  }
}

class TournamentTeam {
  final int id;
  final int tournamentId;
  final int teamId;
  final String teamName;
  final String? group;
  final int played;
  final int won;
  final int lost;
  final int noResult;
  final double points;
  final double nrr;

  TournamentTeam({
    required this.id,
    required this.tournamentId,
    required this.teamId,
    required this.teamName,
    this.group,
    this.played = 0,
    this.won = 0,
    this.lost = 0,
    this.noResult = 0,
    this.points = 0,
    this.nrr = 0,
  });

  factory TournamentTeam.fromJson(Map<String, dynamic> json) {
    return TournamentTeam(
      id: json['id'] ?? 0,
      tournamentId: json['tournament_id'] ?? 0,
      teamId: json['team_id'] ?? 0,
      teamName: json['team_name'] ?? json['name'] ?? '',
      group: json['group_name'] ?? json['group'],
      played: json['played'] ?? 0,
      won: json['won'] ?? 0,
      lost: json['lost'] ?? 0,
      noResult: json['no_result'] ?? 0,
      points: (json['points'] ?? 0).toDouble(),
      nrr: (json['nrr'] ?? 0).toDouble(),
    );
  }
}

class TournamentFixture {
  final int id;
  final int tournamentId;
  final int? matchId;
  final String team1Name;
  final String team2Name;
  final DateTime matchDate;
  final String? venue;
  final String status;
  final String? group;
  final String? winner;
  final String? team1Logo;
  final String? team2Logo;
  final int? team1Score;
  final int? team1Wickets;
  final double? team1Overs;
  final int? team2Score;
  final int? team2Wickets;
  final double? team2Overs;
  final String? playerOfMatch;

  TournamentFixture({
    required this.id,
    required this.tournamentId,
    this.matchId,
    required this.team1Name,
    required this.team2Name,
    required this.matchDate,
    this.venue,
    this.status = 'upcoming',
    this.group,
    this.winner,
    this.team1Logo,
    this.team2Logo,
    this.team1Score,
    this.team1Wickets,
    this.team1Overs,
    this.team2Score,
    this.team2Wickets,
    this.team2Overs,
    this.playerOfMatch,
  });

  factory TournamentFixture.fromJson(Map<String, dynamic> json) {
    return TournamentFixture(
      id: json['id'],
      tournamentId: json['tournament_id'] ?? 0,
      matchId: json['match_id'],
      team1Name: json['team1_name'] ?? '',
      team2Name: json['team2_name'] ?? '',
      matchDate: DateTime.parse(json['match_date']),
      venue: json['venue'],
      status: json['status'] ?? 'upcoming',
      group: json['group_name'] ?? json['group'],
      winner: json['winner'],
      team1Logo: json['team1_logo'],
      team2Logo: json['team2_logo'],
      team1Score: json['team1_score'],
      team1Wickets: json['team1_wickets'],
      team1Overs: json['team1_overs'] != null ? (json['team1_overs'] as num).toDouble() : null,
      team2Score: json['team2_score'],
      team2Wickets: json['team2_wickets'],
      team2Overs: json['team2_overs'] != null ? (json['team2_overs'] as num).toDouble() : null,
      playerOfMatch: json['player_of_match'],
    );
  }
}
