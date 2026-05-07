import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../models/match.dart';
import '../../services/api_service.dart';
import '../../services/auth_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/protea_header.dart';
import '../../widgets/theme_toggle.dart';
import 'guest_match_detail_screen.dart';

class GuestLiveScreen extends StatefulWidget {
  const GuestLiveScreen({super.key});

  @override
  State<GuestLiveScreen> createState() => _GuestLiveScreenState();
}

class _GuestLiveScreenState extends State<GuestLiveScreen> {
  List<CricketMatch> _liveMatches = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadLiveMatches();
  }

  Future<void> _loadLiveMatches() async {
    setState(() => _loading = true);
    try {
      _liveMatches = await ApiService.getPublicLiveMatches();
    } catch (_) {}
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            Stack(
              children: [
                const ProteaHeader(height: 185),
                // Back / Sign In button
                Positioned(
                  top: MediaQuery.of(context).padding.top + 8,
                  left: 8,
                  child: IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => context.read<AuthProvider>().logout(),
                    tooltip: 'Back to Sign In',
                  ),
                ),
                Positioned(
                  top: MediaQuery.of(context).padding.top + 8,
                  right: 100,
                  child: const ThemeToggleButton(),
                ),
                Positioned(
                  top: MediaQuery.of(context).padding.top + 8,
                  right: 8,
                  child: TextButton.icon(
                    onPressed: () => context.read<AuthProvider>().logout(),
                    icon: Icon(Icons.login, color: Colors.white, size: 18),
                    label: Text('Sign In',
                        style: GoogleFonts.poppins(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            ),

            // Title
            Padding(
              padding: const EdgeInsets.only(top: 4, bottom: 4),
              child: Text(
                'Live Matches',
                style: GoogleFonts.poppins(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.tp(context),
                ),
              ),
            ),
            Text(
              'Watching as Guest',
              style: GoogleFonts.poppins(fontSize: 13, color: AppTheme.ts(context)),
            ),
            const SizedBox(height: 12),

            // Live indicator
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 24),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: _liveMatches.isNotEmpty
                    ? AppTheme.liveRed.withValues(alpha: 0.1)
                    : AppTheme.surfaceLight(context),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: _liveMatches.isNotEmpty
                      ? AppTheme.liveRed.withValues(alpha: 0.3)
                      : AppTheme.divider(context),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (_liveMatches.isNotEmpty) ...[
                    Container(
                      width: 10,
                      height: 10,
                      decoration: const BoxDecoration(
                        color: AppTheme.liveRed,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  Text(
                    _liveMatches.isNotEmpty
                        ? '${_liveMatches.length} LIVE ${_liveMatches.length == 1 ? "MATCH" : "MATCHES"}'
                        : 'No live matches right now',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                      color: _liveMatches.isNotEmpty ? AppTheme.liveRed : AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Match list
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen))
                  : _liveMatches.isEmpty
                      ? _buildEmptyState()
                      : RefreshIndicator(
                          onRefresh: _loadLiveMatches,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _liveMatches.length,
                            itemBuilder: (context, index) =>
                                _LiveMatchCard(
                                  match: _liveMatches[index],
                                  onTap: () {
                                    Navigator.push(context, MaterialPageRoute(
                                      builder: (_) => GuestMatchDetailScreen(matchId: _liveMatches[index].id),
                                    ));
                                  },
                                ),
                          ),
                        ),
            ),

            // Sign in prompt at bottom
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.surface(context),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, -2)),
                ],
              ),
              child: Column(
                children: [
                  Text(
                    'Sign in to access all features',
                    style: GoogleFonts.poppins(fontSize: 12, color: AppTheme.ts(context)),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    height: 44,
                    child: ElevatedButton(
                      onPressed: () => context.read<AuthProvider>().logout(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.buttonGreen,
                        foregroundColor: Colors.white,
                      ),
                      child: Text('SIGN IN / CREATE ACCOUNT',
                          style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 13, letterSpacing: 1)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.live_tv, size: 72, color: AppTheme.ts(context).withValues(alpha: 0.3)),
          const SizedBox(height: 16),
          Text('No live matches at the moment',
              style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.ts(context))),
          const SizedBox(height: 8),
          Text('Check back later or sign in to see\nupcoming and completed matches',
              style: GoogleFonts.poppins(fontSize: 13, color: AppTheme.ts(context)),
              textAlign: TextAlign.center),
          const SizedBox(height: 24),
          OutlinedButton.icon(
            onPressed: _loadLiveMatches,
            icon: const Icon(Icons.refresh),
            label: const Text('Refresh'),
          ),
        ],
      ),
    );
  }
}

class _LiveMatchCard extends StatelessWidget {
  final CricketMatch match;
  final VoidCallback onTap;

  const _LiveMatchCard({required this.match, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 3,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: AppTheme.liveRed.withValues(alpha: 0.3)),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              // LIVE badge
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppTheme.liveRed,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6, height: 6,
                          decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                        ),
                        const SizedBox(width: 4),
                        Text('LIVE', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                  const Spacer(),
                  if (match.venue != null)
                    Text(match.venue!, style: TextStyle(fontSize: 11, color: AppTheme.ts(context))),
                ],
              ),
              const SizedBox(height: 12),
              // Teams and scores
              () {
                // Map innings scores to correct team names
                // match.team1Score = innings 1 score, match.team2Score = innings 2 score
                // But we need to show scores under correct team names based on toss
                
                bool team1BatsFirst;
                if (match.tossWinner == match.team1Name) {
                  team1BatsFirst = match.tossDecision == 'bat';
                } else {
                  team1BatsFirst = match.tossDecision == 'bowl';
                }
                
                // Which team batted in innings 1?
                final innings1Team = team1BatsFirst ? 1 : 2;
                final innings2Team = team1BatsFirst ? 2 : 1;
                
                // Get each team's actual score based on which innings they batted
                final team1Score = innings1Team == 1 ? match.team1Score : match.team2Score;
                final team1Wickets = innings1Team == 1 ? match.team1Wickets : match.team2Wickets;
                final team1Overs = innings1Team == 1 ? match.team1Overs : match.team2Overs;
                
                final team2Score = innings2Team == 1 ? match.team1Score : match.team2Score;
                final team2Wickets = innings2Team == 1 ? match.team1Wickets : match.team2Wickets;
                final team2Overs = innings2Team == 1 ? match.team1Overs : match.team2Overs;
                
                return Row(
                  children: [
                    // Team 1
                    Expanded(
                      child: Column(
                        children: [
                          CircleAvatar(
                            radius: 22,
                            backgroundColor: AppTheme.primaryGreen,
                            backgroundImage: match.team1LogoUrl != null && match.team1LogoUrl!.isNotEmpty
                                ? NetworkImage(ApiService.getPhotoUrl(match.team1LogoUrl!))
                                : null,
                            child: match.team1LogoUrl == null || match.team1LogoUrl!.isEmpty
                                ? Text(match.team1Name[0],
                                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16))
                                : null,
                          ),
                          const SizedBox(height: 6),
                          Text(match.team1Name,
                              style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13),
                              textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis),
                          Text('$team1Score/$team1Wickets (${team1Overs.toStringAsFixed(1)})',
                              style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.primaryGreen)),
                        ],
                      ),
                    ),
                    // VS
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      child: Text('VS',
                          style: GoogleFonts.poppins(
                              fontWeight: FontWeight.w700, fontSize: 14, color: AppTheme.ts(context))),
                    ),
                    // Team 2
                    Expanded(
                      child: Column(
                        children: [
                          CircleAvatar(
                            radius: 22,
                            backgroundColor: AppTheme.team2Color,
                            backgroundImage: match.team2LogoUrl != null && match.team2LogoUrl!.isNotEmpty
                                ? NetworkImage(ApiService.getPhotoUrl(match.team2LogoUrl!))
                                : null,
                            child: match.team2LogoUrl == null || match.team2LogoUrl!.isEmpty
                                ? Text(match.team2Name[0],
                                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16))
                                : null,
                          ),
                          const SizedBox(height: 6),
                          Text(match.team2Name,
                              style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13),
                              textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis),
                          Text('$team2Score/$team2Wickets (${team2Overs.toStringAsFixed(1)})',
                              style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.primaryGreen)),
                        ],
                      ),
                    ),
                  ],
                );
              }(),
              const SizedBox(height: 10),
              // Tap to view
              Text('Tap to view scorecard',
                  style: GoogleFonts.poppins(fontSize: 11, color: AppTheme.primaryGreen, fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      ),
    );
  }
}
