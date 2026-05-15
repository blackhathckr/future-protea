import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../models/player.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/theme_toggle.dart';
import '../../widgets/protea_buttons.dart';
import 'edit_player_screen.dart';

class PlayerRegisteredScreen extends StatelessWidget {
  final Player player;

  const PlayerRegisteredScreen({super.key, required this.player});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        top: false,
        child: SingleChildScrollView(
          child: Column(
            children: [
              Stack(
                children: [
                  const ProteaHeader(height: 120),
                  Positioned(
                    top: MediaQuery.of(context).padding.top + 8,
                    right: 8,
                    child: const ThemeToggleButton(),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.check_circle, color: AppTheme.completedGreen, size: 32),
                  const SizedBox(width: 8),
                  Text(
                    'Player Registered!',
                    style: GoogleFonts.poppins(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.tp(context),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'The player has been successfully registered.',
                style: GoogleFonts.poppins(color: AppTheme.ts(context), fontSize: 13),
              ),
              const SizedBox(height: 24),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Card(
                  elevation: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (player.playerId != null)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryGreen,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              'Player ID: ${player.playerId}',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                          ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(player.name,
                                      style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w700)),
                                  if (player.dateOfBirth != null)
                                    Text('Date: ${_formatDate(player.dateOfBirth!)}',
                                        style: TextStyle(color: AppTheme.ts(context))),
                                ],
                              ),
                            ),
                            _PlayerAvatar(player: player, radius: 32),
                          ],
                        ),
                        const Divider(height: 24),
                        if (player.schoolName != null) ...[
                          _InfoRow(label: 'School:', value: player.schoolName!),
                          const SizedBox(height: 8),
                        ],
                        if (player.clubName != null) ...[
                          _InfoRow(label: 'Club Name:', value: player.clubName!),
                          const SizedBox(height: 8),
                        ],
                        if (player.teamsPlayed != null && player.teamsPlayed!.isNotEmpty)
                          _InfoRow(label: 'Teams Played:', value: player.teamsPlayed!.join(', ')),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  children: [
                    YellowButton(
                      label: 'EDIT PLAYER',
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => EditPlayerScreen(player: player)),
                        );
                      },
                    ),
                    const SizedBox(height: 12),
                    GreenButton(
                      label: 'MAIN MENU',
                      onPressed: () => Navigator.popUntil(context, (route) => route.isFirst),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(String date) {
    try {
      return DateFormat('dd MMMM yyyy').format(DateTime.parse(date));
    } catch (_) {
      return date;
    }
  }
}

class _PlayerAvatar extends StatelessWidget {
  final Player player;
  final double radius;
  const _PlayerAvatar({required this.player, this.radius = 28});

  @override
  Widget build(BuildContext context) {
    if (player.photoUrl != null && player.photoUrl!.isNotEmpty) {
      return CircleAvatar(
        radius: radius,
        backgroundImage: NetworkImage(ApiService.getPhotoUrl(player.photoUrl!)),
        backgroundColor: AppTheme.primaryGreen,
      );
    }
    return CircleAvatar(
      radius: radius,
      backgroundColor: AppTheme.primaryGreen,
      child: Text(
        player.name.isNotEmpty ? player.name[0].toUpperCase() : '?',
        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: radius * 0.7),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 120,
          child: Text(label,
              style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: AppTheme.ts(context))),
        ),
        Expanded(child: Text(value, style: GoogleFonts.poppins(fontWeight: FontWeight.w500))),
      ],
    );
  }
}
