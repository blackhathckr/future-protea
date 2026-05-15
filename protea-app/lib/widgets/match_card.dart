import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/match.dart';
import '../theme/app_theme.dart';

class MatchCard extends StatelessWidget {
  final CricketMatch match;
  final VoidCallback? onTap;

  const MatchCard({super.key, required this.match, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              // Status & date row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _statusBadge(),
                  Text(
                    DateFormat('dd MMM, hh:mm a').format(match.matchDate),
                    style: TextStyle(fontSize: 12, color: AppTheme.ts(context)),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              // Teams row
              Row(
                children: [
                  Expanded(
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 24,
                          backgroundColor: AppTheme.team1Color,
                          child: Text(
                            match.team1Name.substring(0, match.team1Name.length > 2 ? 2 : match.team1Name.length).toUpperCase(),
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(match.team1Name,
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                            textAlign: TextAlign.center,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis),
                        if (match.status != 'upcoming')
                          Text(match.team1Display,
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.accentGold)),
                      ],
                    ),
                  ),
                  // VS divider
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppTheme.surfaceCardLight,
                    ),
                    child: Text('VS',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppTheme.accentGold)),
                  ),
                  Expanded(
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 24,
                          backgroundColor: AppTheme.team2Color,
                          child: Text(
                            match.team2Name.substring(0, match.team2Name.length > 2 ? 2 : match.team2Name.length).toUpperCase(),
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(match.team2Name,
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                            textAlign: TextAlign.center,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis),
                        if (match.status != 'upcoming')
                          Text(match.team2Display,
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.accentGold)),
                      ],
                    ),
                  ),
                ],
              ),
              // Venue & overs
              if (match.venue != null || match.status != 'upcoming') ...[
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (match.venue != null) ...[
                      Icon(Icons.location_on, size: 14, color: AppTheme.ts(context)),
                      const SizedBox(width: 4),
                      Text(match.venue!,
                          style: TextStyle(fontSize: 12, color: AppTheme.ts(context))),
                    ],
                    if (match.venue != null && match.totalOvers > 0)
                      Text('  |  ', style: TextStyle(color: AppTheme.ts(context))),
                    Text('${match.totalOvers} overs',
                        style: TextStyle(fontSize: 12, color: AppTheme.ts(context))),
                  ],
                ),
              ],
              // Winner
              if (match.winner != null) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppTheme.accentGold.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${match.winner} won!',
                    style: TextStyle(color: AppTheme.accentGold, fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _statusBadge() {
    Color color;
    IconData? icon;
    switch (match.status) {
      case 'live':
        color = AppTheme.wicketRed;
        icon = Icons.fiber_manual_record;
        break;
      case 'completed':
        color = AppTheme.lightGreen;
        icon = Icons.check_circle;
        break;
      default:
        color = AppTheme.team1Color;
        icon = Icons.access_time;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: color),
          const SizedBox(width: 4),
          Text(match.statusLabel,
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }
}
