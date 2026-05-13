class CricketMatch {
  final String id;
  final String team1Name;
  final String team2Name;
  final String? team1LogoUrl;
  final String? team2LogoUrl;
  final String? venue;
  final int totalOvers;
  final String status;
  final String? tossWinner;
  final String? tossDecision;
  final String? winner;
  final int team1Score;
  final int team1Wickets;
  final double team1Overs;
  final int team2Score;
  final int team2Wickets;
  final double team2Overs;
  final int currentInnings;
  final DateTime matchDate;
  final String? createdByName;
  final List<MatchPlayer>? players;
  final List<PlayerScore>? scores;
  final int team1PlayerCount;
  final int team2PlayerCount;
  final String? umpire;
  final String? playerOfMatch;
  final String? matchType;
  final int ballsPerOver;

  CricketMatch({
    required this.id,
    required this.team1Name,
    required this.team2Name,
    this.team1LogoUrl,
    this.team2LogoUrl,
    this.venue,
    this.totalOvers = 20,
    this.status = 'upcoming',
    this.tossWinner,
    this.tossDecision,
    this.winner,
    this.team1Score = 0,
    this.team1Wickets = 0,
    this.team1Overs = 0,
    this.team2Score = 0,
    this.team2Wickets = 0,
    this.team2Overs = 0,
    this.currentInnings = 1,
    required this.matchDate,
    this.createdByName,
    this.players,
    this.scores,
    this.team1PlayerCount = 0,
    this.umpire,
    this.playerOfMatch,
    this.matchType,
    this.team2PlayerCount = 0,
    this.ballsPerOver = 6,
  });

  factory CricketMatch.fromJson(Map<String, dynamic> json) {
    return CricketMatch(
      id: json['id'].toString(),
      team1Name: json['team1_name'] ?? '',
      team2Name: json['team2_name'] ?? '',
      team1LogoUrl: json['team1_logo_url'] as String?,
      team2LogoUrl: json['team2_logo_url'] as String?,
      venue: json['venue'] as String?,
      totalOvers: json['total_overs'] ?? 20,
      status: json['status'] ?? 'upcoming',
      tossWinner: json['toss_winner'],
      tossDecision: json['toss_decision'],
      winner: json['winner'],
      team1Score: json['team1_score'] ?? 0,
      team1Wickets: json['team1_wickets'] ?? 0,
      team1Overs: (json['team1_overs'] ?? 0).toDouble(),
      team2Score: json['team2_score'] ?? 0,
      team2Wickets: json['team2_wickets'] ?? 0,
      team2Overs: (json['team2_overs'] ?? 0).toDouble(),
      currentInnings: json['current_innings'] ?? 1,
      matchDate: DateTime.parse(json['match_date']),
      createdByName: json['created_by_name'],
      team1PlayerCount: json['team1_player_count'] ?? 0,
      team2PlayerCount: json['team2_player_count'] ?? 0,
      umpire: json['umpire'] as String?,
      playerOfMatch: json['player_of_match'] as String?,
      matchType: json['match_type'] as String?,
      ballsPerOver: json['balls_per_over'] ?? 6,
      players: json['players'] != null
          ? (json['players'] as List).map((p) => MatchPlayer.fromJson(p)).toList()
          : null,
      scores: json['scores'] != null
          ? (json['scores'] as List).map((s) => PlayerScore.fromJson(s)).toList()
          : null,
    );
  }

  String get team1Display => '$team1Score/$team1Wickets (${team1Overs.toStringAsFixed(1)})';
  String get team2Display => '$team2Score/$team2Wickets (${team2Overs.toStringAsFixed(1)})';

  String get statusLabel {
    switch (status) {
      case 'live':
        return 'LIVE';
      case 'completed':
        return 'Completed';
      default:
        return 'Upcoming';
    }
  }

  // ----- Live-match derived stats -----

  /// Team number (1 or 2) that batted first, derived from toss winner + decision.
  /// Returns null if toss info is missing or doesn't match either team name.
  int? get _battingFirstTeam {
    if (tossWinner == null || tossDecision == null) return null;
    final int? winnerTeam = tossWinner == team1Name
        ? 1
        : tossWinner == team2Name
            ? 2
            : null;
    if (winnerTeam == null) return null;
    final chosenBat = tossDecision == 'bat';
    return chosenBat ? winnerTeam : (winnerTeam == 1 ? 2 : 1);
  }

  /// Team number (1 or 2) currently batting, or null if unknown.
  int? get battingTeam {
    final first = _battingFirstTeam;
    if (first == null) return null;
    return currentInnings == 1 ? first : (first == 1 ? 2 : 1);
  }

  String? get battingTeamName {
    final t = battingTeam;
    if (t == null) return null;
    return t == 1 ? team1Name : team2Name;
  }

  int get battingScore => battingTeam == 1 ? team1Score : team2Score;
  double get battingOvers => battingTeam == 1 ? team1Overs : team2Overs;

  /// Score of the team that batted first (for second-innings target).
  int get firstInningsScore {
    final first = _battingFirstTeam;
    if (first == null) return 0;
    return first == 1 ? team1Score : team2Score;
  }

  /// Convert a cricket overs value like 12.3 (= 12 overs and 3 balls) to total balls.
  int _oversToBalls(double overs) {
    final whole = overs.floor();
    final frac = ((overs - whole) * 10).round();
    return whole * ballsPerOver + frac;
  }

  /// Current run rate of the batting team (runs per over).
  double get currentRunRate {
    final overs = battingOvers;
    if (overs <= 0) return 0;
    final balls = _oversToBalls(overs);
    if (balls <= 0) return 0;
    return battingScore * ballsPerOver / balls;
  }

  bool get isSecondInnings => currentInnings == 2;

  /// Target the chasing team needs to win (first innings score + 1).
  int get target => firstInningsScore + 1;

  /// Runs the batting team still needs to win.
  int get runsNeeded {
    final n = target - battingScore;
    return n < 0 ? 0 : n;
  }

  /// Balls left in the current innings.
  int get ballsRemaining {
    final used = _oversToBalls(battingOvers);
    final total = totalOvers * ballsPerOver;
    final left = total - used;
    return left < 0 ? 0 : left;
  }

  /// Required run rate for the chasing team (runs per over).
  double get requiredRunRate {
    final balls = ballsRemaining;
    if (balls <= 0) return 0;
    return runsNeeded * ballsPerOver / balls;
  }

  /// Human-readable toss summary, e.g. "Sharks won the toss, chose to bat first".
  String? get tossSummary {
    if (tossWinner == null || tossDecision == null) return null;
    final choice = tossDecision == 'bat' ? 'bat first' : 'bowl first';
    return '$tossWinner won the toss, chose to $choice';
  }
}

class MatchPlayer {
  final String id;
  final String matchId;
  final String playerId;
  final int? team;
  final String status;
  final String name;
  final String? battingStyle;
  final String? bowlingStyle;
  final String? phone;
  final bool isCaptain;
  final bool isWicketKeeper;
  final bool isPlaying;

  MatchPlayer({
    required this.id,
    required this.matchId,
    required this.playerId,
    this.team,
    required this.status,
    required this.name,
    this.battingStyle,
    this.bowlingStyle,
    this.phone,
    this.isCaptain = false,
    this.isWicketKeeper = false,
    this.isPlaying = false,
  });

  factory MatchPlayer.fromJson(Map<String, dynamic> json) {
    return MatchPlayer(
      id: json['id'].toString(),
      matchId: json['match_id'].toString(),
      playerId: json['player_id'].toString(),
      team: json['team'],
      status: json['status'] ?? 'pending',
      name: json['name'],
      battingStyle: json['batting_style'],
      bowlingStyle: json['bowling_style'],
      phone: json['phone'],
      isCaptain: json['is_captain'] ?? false,
      isWicketKeeper: json['is_wicket_keeper'] ?? false,
      isPlaying: json['is_playing'] ?? false,
    );
  }
}

class PlayerScore {
  final String id;
  final String matchId;
  final String playerId;
  final int? team;
  final String name;
  final int runsScored;
  final int ballsFaced;
  final int fours;
  final int sixes;
  final bool isOut;
  final String? outType;
  final double oversBowled;
  final int runsConceded;
  final int wicketsTaken;
  final int maidens;
  final int catches;
  final int runOuts;
  final bool isCaptain;
  final bool isWicketKeeper;

  // Match context fields (from journey endpoint)
  final String? team1Name;
  final String? team2Name;
  final DateTime? matchDate;
  final String? matchStatus;
  final int? team1Score;
  final int? team1Wickets;
  final int? team2Score;
  final int? team2Wickets;
  final String? venue;
  final String? matchWinner;

  PlayerScore({
    required this.id,
    required this.matchId,
    required this.playerId,
    this.team,
    required this.name,
    this.runsScored = 0,
    this.ballsFaced = 0,
    this.fours = 0,
    this.sixes = 0,
    this.isOut = false,
    this.outType,
    this.oversBowled = 0,
    this.runsConceded = 0,
    this.wicketsTaken = 0,
    this.maidens = 0,
    this.catches = 0,
    this.runOuts = 0,
    this.isCaptain = false,
    this.isWicketKeeper = false,
    this.team1Name,
    this.team2Name,
    this.matchDate,
    this.matchStatus,
    this.team1Score,
    this.team1Wickets,
    this.team2Score,
    this.team2Wickets,
    this.venue,
    this.matchWinner,
  });

  factory PlayerScore.fromJson(Map<String, dynamic> json) {
    return PlayerScore(
      id: json['id'].toString(),
      matchId: json['match_id'].toString(),
      playerId: json['player_id'].toString(),
      team: json['team'],
      name: json['name'] ?? '',
      runsScored: json['runs_scored'] ?? 0,
      ballsFaced: json['balls_faced'] ?? 0,
      fours: json['fours'] ?? 0,
      sixes: json['sixes'] ?? 0,
      isOut: json['is_out'] ?? false,
      outType: json['out_type'],
      oversBowled: (json['overs_bowled'] ?? 0).toDouble(),
      runsConceded: json['runs_conceded'] ?? 0,
      wicketsTaken: json['wickets_taken'] ?? 0,
      maidens: json['maidens'] ?? 0,
      catches: json['catches'] ?? 0,
      runOuts: json['run_outs'] ?? 0,
      isCaptain: json['is_captain'] ?? false,
      isWicketKeeper: json['is_wicket_keeper'] ?? false,
      team1Name: json['team1_name'],
      team2Name: json['team2_name'],
      matchDate: json['match_date'] != null ? DateTime.parse(json['match_date']) : null,
      matchStatus: json['match_status'],
      team1Score: json['team1_score'],
      team1Wickets: json['team1_wickets'],
      team2Score: json['team2_score'],
      team2Wickets: json['team2_wickets'],
      venue: json['venue'],
      matchWinner: json['winner'],
    );
  }

  double get strikeRate => ballsFaced > 0 ? (runsScored * 100 / ballsFaced) : 0;
  double get economyRate => oversBowled > 0 ? (runsConceded / oversBowled) : 0;
}

class CareerStats {
  final int totalMatches;
  final int totalRuns;
  final int highestScore;
  final int totalBallsFaced;
  final int totalFours;
  final int totalSixes;
  final int fifties;
  final int hundreds;
  final int totalWickets;
  final int totalCatches;
  final double strikeRate;
  final double battingAverage;
  final double totalOversBowled;
  final int totalRunsConceded;
  final double bowlingEconomy;
  final double bowlingAverage;
  final String bestBowling;

  CareerStats({
    required this.totalMatches,
    required this.totalRuns,
    required this.highestScore,
    required this.totalBallsFaced,
    required this.totalFours,
    required this.totalSixes,
    required this.fifties,
    required this.hundreds,
    required this.totalWickets,
    required this.totalCatches,
    required this.strikeRate,
    required this.battingAverage,
    required this.totalOversBowled,
    required this.totalRunsConceded,
    required this.bowlingEconomy,
    required this.bowlingAverage,
    required this.bestBowling,
  });

  factory CareerStats.fromJson(Map<String, dynamic> json) {
    return CareerStats(
      totalMatches: int.parse(json['total_matches'].toString()),
      totalRuns: int.parse(json['total_runs'].toString()),
      highestScore: int.parse(json['highest_score'].toString()),
      totalBallsFaced: int.parse(json['total_balls_faced'].toString()),
      totalFours: int.parse(json['total_fours'].toString()),
      totalSixes: int.parse(json['total_sixes'].toString()),
      fifties: int.parse((json['fifties'] ?? 0).toString()),
      hundreds: int.parse((json['hundreds'] ?? 0).toString()),
      totalWickets: int.parse(json['total_wickets'].toString()),
      totalCatches: int.parse(json['total_catches'].toString()),
      strikeRate: double.parse(json['strike_rate'].toString()),
      battingAverage: double.parse(json['batting_average'].toString()),
      totalOversBowled: double.parse((json['total_overs_bowled'] ?? 0).toString()),
      totalRunsConceded: int.parse((json['total_runs_conceded'] ?? 0).toString()),
      bowlingEconomy: double.parse((json['bowling_economy'] ?? 0).toString()),
      bowlingAverage: double.parse((json['bowling_average'] ?? 0).toString()),
      bestBowling: (json['best_bowling'] ?? '-').toString(),
    );
  }
}
