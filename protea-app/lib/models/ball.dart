class Ball {
  final String id;
  final String matchId;
  final int innings;
  final int overNumber;
  final int ballNumber;
  final String? batsmanId;
  final String? bowlerId;
  final String? batsmanName;
  final String? bowlerName;
  final int runs;
  final bool isWide;
  final bool isNoball;
  final bool isBye;
  final bool isLegbye;
  final bool isWicket;
  final String? wicketType;
  final int extras;
  final int overthrows;
  final String? shotDirection;
  final String? commentary;

  Ball({
    required this.id,
    required this.matchId,
    required this.innings,
    required this.overNumber,
    required this.ballNumber,
    this.batsmanId,
    this.bowlerId,
    this.batsmanName,
    this.bowlerName,
    this.runs = 0,
    this.isWide = false,
    this.isNoball = false,
    this.isBye = false,
    this.isLegbye = false,
    this.isWicket = false,
    this.wicketType,
    this.extras = 0,
    this.overthrows = 0,
    this.shotDirection,
    this.commentary,
  });

  factory Ball.fromJson(Map<String, dynamic> json) {
    return Ball(
      id: json['id'].toString(),
      matchId: json['match_id'].toString(),
      innings: json['innings'],
      overNumber: json['over_number'],
      ballNumber: json['ball_number'],
      batsmanId: json['batsman_id']?.toString(),
      bowlerId: json['bowler_id']?.toString(),
      batsmanName: json['batsman_name'],
      bowlerName: json['bowler_name'],
      runs: json['runs'] ?? 0,
      isWide: json['is_wide'] ?? false,
      isNoball: json['is_noball'] ?? false,
      isBye: json['is_bye'] ?? false,
      isLegbye: json['is_legbye'] ?? false,
      isWicket: json['is_wicket'] ?? false,
      wicketType: json['wicket_type'],
      extras: json['extras'] ?? 0,
      overthrows: json['overthrows'] ?? 0,
      shotDirection: json['shot_direction'],
      commentary: json['commentary'],
    );
  }

  String get displayText {
    if (isWicket) return 'W';
    if (isWide) {
      // Wide with extra runs (e.g., wide that went for 4 = WD4, wide+1 = WD2)
      final total = extras + overthrows;
      return total > 1 ? 'WD$total' : 'WD';
    }
    if (isNoball) {
      // No-ball: penalty (1 extra) + batsman runs + overthrows
      final batRuns = runs + overthrows;
      return batRuns > 0 ? 'NB+$batRuns' : 'NB';
    }
    if (isBye) return '${runs + overthrows}B';
    if (isLegbye) return '${runs + overthrows}LB';
    if (overthrows > 0) return '${runs + overthrows}*'; // * indicates overthrow on regular ball
    return runs.toString();
  }

  int get totalRuns => runs + extras + overthrows;
}
