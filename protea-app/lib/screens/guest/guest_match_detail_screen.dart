import 'package:flutter/material.dart';
import '../viewer/match_detail_screen.dart';

/// Guest match detail now reuses the viewer's enhanced match detail screen.
/// The viewer screen uses public API endpoints so it works without auth.
class GuestMatchDetailScreen extends StatelessWidget {
  final String matchId;
  const GuestMatchDetailScreen({super.key, required this.matchId});

  @override
  Widget build(BuildContext context) {
    return MatchDetailScreen(matchId: matchId, isGuest: true);
  }
}
