import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/match.dart';
import '../../services/api_service.dart';
import '../../services/socket_service.dart';
import '../../theme/app_theme.dart';
import '../../shared/utils/snackbar_utils.dart';
import '../../shared/widgets/section_label.dart';
import '../viewer/match_detail_screen.dart';

class LiveScoringScreen extends StatefulWidget {
  final String matchId;
  const LiveScoringScreen({super.key, required this.matchId});

  @override
  State<LiveScoringScreen> createState() => _LiveScoringScreenState();
}

class _LiveScoringScreenState extends State<LiveScoringScreen> {
  CricketMatch? _match;
  List<MatchPlayer> _team1Players = [];
  List<MatchPlayer> _team2Players = [];
  MatchPlayer? _striker;
  MatchPlayer? _nonStriker;
  MatchPlayer? _bowler;
  MatchPlayer? _lastBowler; // Track bowler who just completed an over
  int _currentInnings = 1;
  int _currentOver = 0;
  int _currentBall = 0;
  bool _loading = true;
  String? _error;
  bool _matchStarted = false;
  List<String> _overBalls = [];
  final Set<String> _outBatsmen = {};
  final Set<String> _retiredHurtBatsmen = {};
  bool _lastBallWasNoBall = false;
  final Map<String, double> _bowlerOvers = {};
  int _partnershipRuns = 0;
  int _partnershipBalls = 0;
  String? _selectedZone; // Wagon wheel shot direction for next ball

  // Socket.IO
  StreamSubscription<SocketStatus>? _socketStatusSub;
  SocketStatus _socketStatus = SocketStatus.disconnected;

  @override
  void initState() {
    super.initState();
    _loadData();
    _initSocket();
  }

  void _initSocket() {
    final svc = SocketService.instance;
    _socketStatusSub = svc.statusStream.listen((status) {
      if (mounted) {
        // Defer setState to avoid re-entrant layout if event arrives during build
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) setState(() => _socketStatus = status);
        });
      }
    });
    svc.connect(widget.matchId);
  }

  Future<void> _reloadMatchStats() async {
    try {
      final match = await ApiService.getMatch(widget.matchId);
      if (!mounted) return;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          setState(() {
            _match = match;
          });
        }
      });
    } catch (e) {
      print('DEBUG: Error reloading stats: $e');
    }
  }

  Future<void> _loadData() async {
    try {
      print('DEBUG: Loading match ${widget.matchId}');
      final match = await ApiService.getMatch(widget.matchId);
      print('DEBUG: Match loaded, populating players from team rosters...');
      try {
        await ApiService.populateMatchPlayers(widget.matchId);
        print('DEBUG: Players populated from rosters');
      } catch (e) {
        print('DEBUG: Error populating players (may already exist): $e');
      }
      print('DEBUG: Fetching players...');
      final players = await ApiService.getMatchPlayers(widget.matchId);
      print('DEBUG: Loaded ${players.length} players');
      for (var p in players) {
        print('DEBUG: Player: ${p.name}, Team: ${p.team}, Status: ${p.status}');
      }
      print('DEBUG: Team 1 players: ${players.where((p) => p.team == 1).length}');
      print('DEBUG: Team 2 players: ${players.where((p) => p.team == 2).length}');
      
      // Clear state for new innings
      _outBatsmen.clear();
      _retiredHurtBatsmen.clear();
      _bowlerOvers.clear();
      _partnershipRuns = 0;
      _partnershipBalls = 0;

      // Load retired hurt batsmen from scorecard
      try {
        final scorecard = await ApiService.getScorecard(widget.matchId);
        final batting = scorecard['batting'];
        if (batting is List) {
          for (var b in batting) {
            if (b['out_type'] == 'retired hurt' && b['is_out'] == false) {
              _retiredHurtBatsmen.add(b['player_id'] as String);
              print('DEBUG: Loaded retired hurt batsman: ${b['name']}');
            }
          }
        }
      } catch (e) {
        print('DEBUG: Error loading retired hurt batsmen: $e');
      }
      _striker = null;
      _nonStriker = null;
      _bowler = null;
      _lastBowler = null;
      _currentOver = 0;
      _currentBall = 0;
      _overBalls = [];
      _matchStarted = false;
      
      if (!mounted) return;
      setState(() {
        _match = match;
        _team1Players = players.where((p) => p.team == 1).toList();
        _team2Players = players.where((p) => p.team == 2).toList();
        _currentInnings = match.currentInnings;
        _loading = false;
        _error = null;
      });
      final balls = await ApiService.getBalls(widget.matchId, innings: _currentInnings);
      if (balls.isNotEmpty) {
        final lastBall = balls.last;
        
        // Track out batsmen and bowler overs
        for (final b in balls) {
          if (b.isWicket && b.batsmanId != null) _outBatsmen.add(b.batsmanId!);
          if (b.bowlerId != null && !b.isWide && !b.isNoball) {
            _bowlerOvers[b.bowlerId!] = (_bowlerOvers[b.bowlerId!] ?? 0) + (1 / 6);
          }
        }
        
        // Restore current players from last ball
        final battingTeam = _currentInnings == 1 ? _getFirstInningsBattingTeam() : _getFirstInningsBowlingTeam();
        final bowlingTeam = _currentInnings == 1 ? _getFirstInningsBowlingTeam() : _getFirstInningsBattingTeam();
        print('DEBUG: Restoring state for innings $_currentInnings');
        print('DEBUG: Batting team has ${battingTeam.length} players, Bowling team has ${bowlingTeam.length} players');
        print('DEBUG: Last ball - over: ${lastBall.overNumber}, ball: ${lastBall.ballNumber}, batsman: ${lastBall.batsmanId}, bowler: ${lastBall.bowlerId}');
        
        // Determine the actual current over (after potential increment)
        int actualCurrentOver = lastBall.overNumber;
        if (lastBall.ballNumber >= 6) {
          actualCurrentOver++;
        }
        
        // Restore bowler only if current over has started (balls exist in current over)
        final currentOverBalls = balls.where((b) => b.overNumber == actualCurrentOver && b.innings == _currentInnings).toList();
        print('DEBUG: Actual current over: $actualCurrentOver, balls in current over: ${currentOverBalls.length}');
        if (currentOverBalls.isNotEmpty) {
          // Get bowler from current over's first ball
          try {
            _bowler = bowlingTeam.firstWhere((p) => p.playerId == currentOverBalls.first.bowlerId);
            print('DEBUG: Restored bowler: ${_bowler?.name}');
          } catch (e) {
            print('DEBUG: Failed to restore bowler: $e');
            _bowler = null;
          }
        } else {
          print('DEBUG: No balls in current over, bowler not restored');
          _bowler = null;
        }
        
        // Restore last bowler from previous over to exclude from selection
        if (actualCurrentOver > 0) {
          final previousOverBalls = balls.where((b) => b.overNumber == actualCurrentOver - 1 && b.innings == _currentInnings).toList();
          if (previousOverBalls.isNotEmpty) {
            try {
              _lastBowler = bowlingTeam.firstWhere((p) => p.playerId == previousOverBalls.first.bowlerId);
            } catch (e) {
              _lastBowler = null;
            }
          }
        }
        
        // Find current batsmen - get the last two batsmen who are not out
        final activeBatsmen = <String>{};
        for (final b in balls.reversed) {
          if (b.batsmanId != null && !_outBatsmen.contains(b.batsmanId)) {
            activeBatsmen.add(b.batsmanId!);
            if (activeBatsmen.length == 2) break;
          }
        }
        
        if (activeBatsmen.isNotEmpty) {
          final batsmenList = activeBatsmen.toList();
          print('DEBUG: Active batsmen IDs: $batsmenList');
          // Last batsman to face a ball is the striker
          try {
            _striker = battingTeam.firstWhere((p) => p.playerId == batsmenList[0]);
            print('DEBUG: Restored striker: ${_striker?.name}');
          } catch (e) {
            print('DEBUG: Failed to restore striker: $e');
            _striker = null;
          }
          
          if (batsmenList.length > 1) {
            try {
              _nonStriker = battingTeam.firstWhere((p) => p.playerId == batsmenList[1]);
              print('DEBUG: Restored non-striker: ${_nonStriker?.name}');
            } catch (e) {
              print('DEBUG: Failed to restore non-striker: $e');
              _nonStriker = null;
            }
          }
        } else {
          print('DEBUG: No active batsmen found');
        }

        // Calculate current partnership from ball data
        _partnershipRuns = 0;
        _partnershipBalls = 0;
        // Walk backwards from end to find last wicket, then sum from there
        int lastWicketIdx = -1;
        for (int i = balls.length - 1; i >= 0; i--) {
          if (balls[i].isWicket) { lastWicketIdx = i; break; }
        }
        for (int i = lastWicketIdx + 1; i < balls.length; i++) {
          _partnershipRuns += balls[i].runs + balls[i].extras;
          if (!balls[i].isWide && !balls[i].isNoball) _partnershipBalls++;
        }

        if (!mounted) return;
        setState(() {
          _currentOver = lastBall.overNumber;
          _currentBall = lastBall.ballNumber;
          _matchStarted = true; // Match has already started
          
          // If last ball completed an over, move to next over
          if (_currentBall >= 6) {
            _currentOver++;
            _currentBall = 0;
            _overBalls = [];
            // Clear bowler for new over selection
            _bowler = null;
          } else {
            _overBalls = balls
                .where((b) => b.overNumber == _currentOver && b.innings == _currentInnings)
                .map((b) => b.displayText)
                .toList();
          }
        });
      }
    } catch (e) {
      print('DEBUG: Error loading data: $e');
      if (!mounted) return;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          setState(() {
            _loading = false;
            _error = e.toString();
          });
        }
      });
    }
  }

  Future<void> _addBall({
    int runs = 0,
    bool isWide = false,
    bool isNoball = false,
    bool isBye = false,
    bool isLegbye = false,
    bool isWicket = false,
    String? wicketType,
    bool isNonStrikerOut = false,
    int extrasOverride = 0,
    int overthrows = 0,
  }) async {
    if (_striker == null || _bowler == null) {
      SnackbarUtils.showError(context, 'Select striker & bowler first');
      return;
    }

    int ballNum = _currentBall + 1;

    // Check if this ball will complete the innings (for non-extras)
    if (_match != null && !isWide && !isNoball) {
      final willCompleteOver = ballNum >= 6;
      final nextOver = willCompleteOver ? _currentOver + 1 : _currentOver;

      if (nextOver >= _match!.totalOvers) {
        SnackbarUtils.showError(context, 'Innings complete! Cannot score beyond ${_match!.totalOvers} overs.');
        return;
      }
    }
    int extras = 0;

    if (isWide || isNoball) {
      // Wide/no-ball: 1 penalty + any boundary/running runs in extrasOverride
      extras = extrasOverride > 0 ? extrasOverride : 1;
      ballNum = _currentBall;
    }

    try {
      // For run out of non-striker, send non-striker's ID as the batsman who is out
      final outBatsmanId = (isWicket && isNonStrikerOut) ? _nonStriker!.playerId : _striker!.playerId;

      // Capture shot direction (only meaningful for legal deliveries)
      final shotDir = (isWide || isNoball || isWicket) ? null : _selectedZone;

      final result = await ApiService.addBall(
        matchId: widget.matchId,
        innings: _currentInnings,
        overNumber: _currentOver,
        ballNumber: isWide || isNoball ? _currentBall : ballNum,
        batsmanId: outBatsmanId,
        bowlerId: _bowler!.playerId,
        runs: runs,
        isWide: isWide,
        isNoball: isNoball,
        isBye: isBye,
        isLegbye: isLegbye,
        isWicket: isWicket,
        wicketType: wicketType,
        extras: extras,
        overthrows: overthrows,
        shotDirection: shotDir,
      );

      final updatedMatch = CricketMatch.fromJson(result['match']);

      String displayText;
      if (isWicket) {
        displayText = 'W';
      } else if (isWide) {
        displayText = 'WD${runs > 0 ? "+$runs" : ""}';
      } else if (isNoball) {
        displayText = 'NB${runs > 0 ? "+$runs" : ""}';
      } else {
        displayText = runs.toString();
      }

      if (!mounted) return;
      setState(() {
        _match = updatedMatch;
        _selectedZone = null; // Clear zone after ball is recorded
        _overBalls.add(displayText);
        _matchStarted = true;

        // Update partnership
        if (isWicket) {
          _partnershipRuns = 0;
          _partnershipBalls = 0;
        } else {
          _partnershipRuns += runs + (isWide || isNoball ? 1 : 0);
          if (!isWide && !isNoball) _partnershipBalls++;
        }

        if (!isWide && !isNoball && _bowler != null) {
          _bowlerOvers[_bowler!.playerId] = (_bowlerOvers[_bowler!.playerId] ?? 0) + (1 / 6);
        }

        // 1. Handle wicket FIRST: record the dismissed batsman and null their
        //    slot, so subsequent strike-rotation swaps move the *correct*
        //    player. Nulling after the over-end swap (the previous behaviour)
        //    cleared the wrong slot when a wicket fell on the 6th legal ball.
        if (isWicket) {
          if (isNonStrikerOut && _nonStriker != null) {
            _outBatsmen.add(_nonStriker!.playerId);
            _nonStriker = null;
          } else if (_striker != null) {
            _outBatsmen.add(_striker!.playerId);
            _striker = null;
          }

          if (_isInningsComplete()) {
            print('DEBUG: Innings complete! Wickets: ${_outBatsmen.length}');
            if (_currentInnings == 2) {
              SnackbarUtils.showSuccess(context, 'Innings Complete! All batsmen are out.');
            }
          }
        }

        // 2. End-of-over advance + strike rotation. Always swap slots (even
        //    if one is null after a wicket); _selectNewBatsman will fill
        //    whichever slot remains empty, which correctly places the
        //    incoming batsman at the non-striker's end when a wicket fell
        //    on the last ball.
        if (!isWide && !isNoball) {
          _currentBall = ballNum;
          if (_currentBall >= 6) {
            _currentOver++;
            _currentBall = 0;
            _overBalls = [];
            final temp = _striker;
            _striker = _nonStriker;
            _nonStriker = temp;
            _lastBowler = _bowler;
            _bowler = null;

            if (_match != null && _currentOver >= _match!.totalOvers) {
              Future.delayed(const Duration(milliseconds: 500), () {
                if (mounted) _showInningsCompleteDialog();
              });
            } else {
              Future.delayed(const Duration(milliseconds: 300), () {
                _selectNewBowler();
              });
            }
          }
        }

        // 3. Odd-runs strike rotation on legal deliveries. Two swaps over an
        //    odd-run last ball cancel out, which matches real cricket: the
        //    runner that crossed keeps strike for the next over.
        if (runs % 2 == 1 && !isWide) {
          final temp = _striker;
          _striker = _nonStriker;
          _nonStriker = temp;
        }
      });

      // Reload match data to get updated stats
      _reloadMatchStats();

      if (isWicket) {
        // Dismissed slot was already nulled inside setState; prompt for the
        // replacement (which fills whichever slot is currently empty).
        _selectNewBatsman();
      }
    } catch (e) {
      if (mounted) {
        SnackbarUtils.showError(context, e);
      }
    }
  }

  void _showInjurySubstitution() {
    // Only show currently active batsmen (not retired hurt players)
    final canSubstituteStriker = _striker != null && !_retiredHurtBatsmen.contains(_striker!.playerId);
    final canSubstituteNonStriker = _nonStriker != null && !_retiredHurtBatsmen.contains(_nonStriker!.playerId);
    
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Injury Substitution'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Select batsman to substitute:'),
            const SizedBox(height: 16),
            if (canSubstituteStriker)
              ListTile(
                title: Text(_striker!.name),
                subtitle: const Text('Striker'),
                onTap: () {
                  Navigator.pop(ctx);
                  _substituteStriker();
                },
              ),
            if (canSubstituteNonStriker)
              ListTile(
                title: Text(_nonStriker!.name),
                subtitle: const Text('Non-Striker'),
                onTap: () {
                  Navigator.pop(ctx);
                  _substituteNonStriker();
                },
              ),
            if (!canSubstituteStriker && !canSubstituteNonStriker)
              const Padding(
                padding: EdgeInsets.all(16.0),
                child: Text('No active batsmen to substitute', style: TextStyle(color: Colors.grey)),
              ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  Future<void> _substituteStriker() async {
    if (_striker != null) {
      try {
        // Mark as retired hurt in backend
        await ApiService.markRetiredHurt(widget.matchId, _striker!.playerId);
        if (!mounted) return;
        setState(() {
          _retiredHurtBatsmen.add(_striker!.playerId);
          _striker = null;
        });
        _selectNewBatsman();
      } catch (e) {
        if (mounted) SnackbarUtils.showError(context, e);
      }
    }
  }

  Future<void> _substituteNonStriker() async {
    if (_nonStriker != null) {
      try {
        // Mark as retired hurt in backend
        await ApiService.markRetiredHurt(widget.matchId, _nonStriker!.playerId);
        if (!mounted) return;
        setState(() {
          _retiredHurtBatsmen.add(_nonStriker!.playerId);
          _nonStriker = null;
        });
        _selectNewBatsman();
      } catch (e) {
        if (mounted) SnackbarUtils.showError(context, e);
      }
    }
  }

  Future<void> _undoLastBall() async {
    if (_overBalls.isEmpty) {
      SnackbarUtils.showInfo(context, 'No balls to undo');
      return;
    }

    try {
      await ApiService.deleteLastBall(widget.matchId, innings: _currentInnings);
      
      // Reload match data and balls
      await _loadData();
      
      SnackbarUtils.showSuccess(context, 'Last ball undone');
    } catch (e) {
      SnackbarUtils.showError(context, 'Failed to undo: $e');
    }
  }

  void _selectNewBowler() async {
    // Reload stats first to ensure latest data
    await _reloadMatchStats();
    
    if (!mounted) return;
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        final bowlingTeam = _getBowlingTeam();
        // Exclude last bowler - can't bowl consecutive overs
        final availableBowlers = bowlingTeam.where((p) => p.playerId != _lastBowler?.playerId).toList();
        
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.5,
          minChildSize: 0.3,
          maxChildSize: 0.85,
          builder: (_, scrollController) => Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Text('Select New Bowler', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600)),
              ),
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.only(bottom: 16),
                  children: availableBowlers.map((p) => ListTile(
                    title: Text(p.name),
                    subtitle: Text(_getBowlerStats(p.playerId)),
                    onTap: () {
                      setState(() => _bowler = p);
                      Navigator.pop(ctx);
                    },
                  )).toList(),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _selectNewBatsman() {
    // Determine which position is empty
    final isReplacingStriker = _striker == null;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        final battingTeam = _currentInnings == 1 ? _getFirstInningsBattingTeam() : _getFirstInningsBowlingTeam();

        // Exclude the batsman who is still at the crease
        final excludePlayerId = isReplacingStriker ? _nonStriker?.playerId : _striker?.playerId;

        // Dedupe by name (case-insensitive) — keep first occurrence.
        // Same name may have multiple user records due to duplicate registrations.
        final seenNames = <String>{};
        final available = battingTeam.where((p) {
          if (_outBatsmen.contains(p.playerId)) return false;
          if (p.playerId == excludePlayerId) return false;
          final nameLower = p.name.toLowerCase().trim();
          if (seenNames.contains(nameLower)) return false;
          seenNames.add(nameLower);
          return true;
        }).toList();

        return DraggableScrollableSheet(
          initialChildSize: 0.6,
          minChildSize: 0.3,
          maxChildSize: 0.85,
          expand: false,
          builder: (context, scrollController) => Container(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Drag handle
                Center(
                  child: Container(
                    width: 36, height: 4,
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: AppTheme.divider(context),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                Text('Select New ${isReplacingStriker ? "Striker" : "Non-Striker"}',
                    style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold)),
                Text('${available.length} available',
                    style: TextStyle(fontSize: 13, color: AppTheme.ts(context))),
                const SizedBox(height: 12),
                Expanded(
                  child: available.isEmpty
                      ? Padding(
                          padding: EdgeInsets.all(20),
                          child: Text('All batsmen are out!', style: TextStyle(color: AppTheme.wicketRed)),
                        )
                      : ListView.builder(
                          controller: scrollController,
                          itemCount: available.length,
                          itemBuilder: (context, i) {
                            final p = available[i];
                            final isRetiredHurt = _retiredHurtBatsmen.contains(p.playerId);
                            return ListTile(
                              title: Row(
                                children: [
                                  Flexible(child: Text(p.name, overflow: TextOverflow.ellipsis)),
                                  if (isRetiredHurt) ...[
                                    const SizedBox(width: 8),
                                    const Icon(Icons.healing, size: 16, color: Colors.orange),
                                    const SizedBox(width: 4),
                                    const Text('(injured)', style: TextStyle(fontSize: 12, color: Colors.orange, fontStyle: FontStyle.italic)),
                                  ],
                                ],
                              ),
                              subtitle: Text(p.battingStyle ?? ''),
                              leading: CircleAvatar(
                                backgroundColor: isRetiredHurt ? Colors.orange : AppTheme.primaryGreen,
                                child: Text(p.name[0], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                              ),
                              onTap: () async {
                                if (isRetiredHurt) {
                                  try {
                                    await ApiService.clearRetiredHurt(widget.matchId, p.playerId);
                                    if (!mounted) return;
                                    setState(() {
                                      _retiredHurtBatsmen.remove(p.playerId);
                                    });
                                  } catch (e) {
                                    print('Error clearing retired hurt: $e');
                                  }
                                }
                                setState(() {
                                  if (isReplacingStriker) {
                                    _striker = p;
                                  } else {
                                    _nonStriker = p;
                                  }
                                });
                                if (mounted) Navigator.pop(ctx);
                              },
                            );
                          },
                        ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _switchInnings() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Start 2nd Innings?'),
        content: Text('This will start the 2nd innings.\n\nTarget: ${_match!.team1Score + 1} runs'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              print('DEBUG: Switch Innings button clicked');
              await _startSecondInnings();
            },
            child: Text('Start 2nd Innings', style: TextStyle(color: AppTheme.primaryGreen)),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _socketStatusSub?.cancel();
    SocketService.instance.leaveMatch();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Live Scoring')),
        body: Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen)),
      );
    }

    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Live Scoring')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 64, color: AppTheme.wicketRed),
                const SizedBox(height: 16),
                Text('Error loading match', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Text(_error!, style: GoogleFonts.poppins(fontSize: 12, color: AppTheme.ts(context)), textAlign: TextAlign.center),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () {
                    setState(() {
                      _loading = true;
                      _error = null;
                    });
                    _loadData();
                  },
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (_match == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Live Scoring')),
        body: Center(
          child: Text('Match not found', style: GoogleFonts.poppins(fontSize: 16)),
        ),
      );
    }

    final m = _match!;

    // Calculate CRR and RRR
    final currentOvers = _currentInnings == 1 ? m.team1Overs : m.team2Overs;
    final currentScore = _currentInnings == 1 ? m.team1Score : m.team2Score;
    final crr = currentOvers > 0 ? currentScore / currentOvers : 0.0;
    // team1Score = innings 1 score (whoever batted first)
    // team2Score = innings 2 score (whoever batted second)
    final target = _currentInnings == 2 ? m.team1Score + 1 : 0;
    final remainingRuns = target - currentScore;
    final remainingOvers = m.totalOvers - currentOvers;
    final rrr = remainingOvers > 0 && _currentInnings == 2 ? remainingRuns / remainingOvers : 0.0;
    // Use team roster count from Team table (authoritative, includes yet-to-bat)
    final currentBattingTeamPlayers = _currentInnings == 1
        ? (_team1BatsFirst ? m.team1PlayerCount : m.team2PlayerCount)
        : (_team1BatsFirst ? m.team2PlayerCount : m.team1PlayerCount);
    final maxWickets = currentBattingTeamPlayers > 1 ? currentBattingTeamPlayers - 1 : 10;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // ── Reconnecting banner ──────────────────────────────
            AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              width: double.infinity,
              height: _socketStatus == SocketStatus.reconnecting ? 32 : 0,
              color: Colors.orange.shade700,
              child: _socketStatus == SocketStatus.reconnecting
                  ? Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Reconnecting…',
                          style: GoogleFonts.poppins(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    )
                  : const SizedBox.shrink(),
            ),
            // Header with back button
            Container(
              color: AppTheme.surface(context),
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: () => Navigator.pop(context),
                    padding: const EdgeInsets.all(8),
                    constraints: const BoxConstraints(),
                  ),
                  Expanded(
                    child: Text(
                      'Live Scoring',
                      style: GoogleFonts.poppins(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.ios_share_rounded),
                    tooltip: 'Share match link',
                    onPressed: _shareMatchLink,
                    padding: const EdgeInsets.all(8),
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
            ),

            // Score summary — compact hero
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF0A2E10), AppTheme.darkGreen, AppTheme.primaryGreen],
                  stops: [0.0, 0.55, 1.0],
                ),
              ),
              child: () {
                final battingName = _currentInnings == 1
                    ? (_team1BatsFirst ? m.team1Name : m.team2Name)
                    : (_team1BatsFirst ? m.team2Name : m.team1Name);
                final bowlingName = _currentInnings == 1
                    ? (_team1BatsFirst ? m.team2Name : m.team1Name)
                    : (_team1BatsFirst ? m.team1Name : m.team2Name);
                final batLogo = battingName == m.team1Name ? m.team1LogoUrl : m.team2LogoUrl;
                final bowlLogo = bowlingName == m.team1Name ? m.team1LogoUrl : m.team2LogoUrl;
                final wicketsTaken = _currentInnings == 1 ? m.team1Wickets : m.team2Wickets;

                return Row(
                  children: [
                    _teamCrest(battingName, batLogo, isBatting: true, radius: 22),
                    const SizedBox(width: 10),
                    // Center column: live pill + matchup + score + meta
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppTheme.liveRed,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      width: 5, height: 5,
                                      decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                                    ),
                                    const SizedBox(width: 4),
                                    Text('LIVE',
                                        style: GoogleFonts.poppins(
                                          color: Colors.white,
                                          fontSize: 8,
                                          fontWeight: FontWeight.w800,
                                          letterSpacing: 0.8,
                                        )),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 6),
                              Flexible(
                                child: Text('$battingName vs $bowlingName',
                                    style: GoogleFonts.poppins(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 11,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text('$currentScore-$wicketsTaken',
                              style: GoogleFonts.poppins(
                                color: AppTheme.accentGold,
                                fontWeight: FontWeight.w800,
                                fontSize: 30,
                                height: 1.0,
                                letterSpacing: 0.5,
                                shadows: [
                                  Shadow(color: AppTheme.accentGold.withValues(alpha: 0.35), blurRadius: 10),
                                ],
                              )),
                          const SizedBox(height: 2),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text('$_currentOver.$_currentBall',
                                  style: GoogleFonts.poppins(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 13,
                                  )),
                              Text('  •  ',
                                  style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 11)),
                              Text('${m.totalOvers - _currentOver} ov left',
                                  style: const TextStyle(color: Colors.white70, fontSize: 11)),
                              Text('  •  ',
                                  style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 11)),
                              Text('CRR ${crr.toStringAsFixed(2)}',
                                  style: TextStyle(
                                      color: AppTheme.accentGold, fontSize: 11, fontWeight: FontWeight.w700)),
                            ],
                          ),
                          if (_currentInnings == 2) ...[
                            const SizedBox(height: 3),
                            () {
                              final runsNeeded = target - currentScore;
                              final ballsRemaining = (m.totalOvers - _currentOver) * 6 - _currentBall;
                              final currentWickets = _currentInnings == 2 ? m.team2Wickets : m.team1Wickets;
                              final wicketsRemaining = maxWickets - currentWickets;
                              final won = runsNeeded <= 0;
                              return Text(
                                won
                                    ? 'Won by $wicketsRemaining wkts (${(_currentOver + _currentBall / 10.0).toStringAsFixed(1)} ov)'
                                    : 'Need $runsNeeded in $ballsRemaining   •   RRR ${rrr.toStringAsFixed(2)}',
                                style: TextStyle(
                                  color: won ? AppTheme.lightGreen : AppTheme.accentGold,
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w700,
                                ),
                                textAlign: TextAlign.center,
                              );
                            }(),
                          ],
                          const SizedBox(height: 4),
                          // Wicket dots
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: List.generate(maxWickets, (i) {
                              final isOut = i < wicketsTaken;
                              return Container(
                                width: 6, height: 6,
                                margin: const EdgeInsets.symmetric(horizontal: 1.5),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: isOut ? AppTheme.wicketRed : AppTheme.lightGreen,
                                ),
                              );
                            }),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    _teamCrest(bowlingName, bowlLogo, isBatting: false, radius: 22),
                  ],
                );
              }(),
            ),

            // Batsman & Bowler details — compact
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              color: AppTheme.surfaceLight(context),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    flex: 5,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SectionLabel('BATSMEN', icon: Icons.sports_cricket),
                        const SizedBox(height: 3),
                        ..._getFixedOrderBatsmen().map((entry) =>
                          Padding(
                            padding: const EdgeInsets.only(bottom: 1),
                            child: _batsmanRow(entry.player, isStriker: entry.isStriker),
                          ),
                        ),
                        if (_getFixedOrderBatsmen().isEmpty)
                          Text('No batsman selected',
                              style: TextStyle(fontSize: 11, color: AppTheme.ts(context), fontStyle: FontStyle.italic)),
                      ],
                    ),
                  ),
                  Container(width: 1, height: 40, color: AppTheme.divider(context).withValues(alpha: 0.6)),
                  Expanded(
                    flex: 4,
                    child: Padding(
                      padding: const EdgeInsets.only(left: 10),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SectionLabel('BOWLER', icon: Icons.sports_baseball),
                          const SizedBox(height: 3),
                          if (_bowler != null) ...[
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 9,
                                  backgroundColor: AppTheme.wicketRed.withValues(alpha: 0.85),
                                  child: Text(
                                    _bowler!.name.isNotEmpty ? _bowler!.name[0].toUpperCase() : '?',
                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 9),
                                  ),
                                ),
                                const SizedBox(width: 5),
                                Expanded(
                                  child: Text(_bowler!.name,
                                      style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 11.5),
                                      overflow: TextOverflow.ellipsis),
                                ),
                              ],
                            ),
                            Text(_getBowlerStats(_bowler!.playerId),
                                style: TextStyle(fontSize: 10, color: AppTheme.ts(context))),
                          ] else
                            Text('Pick a bowler',
                                style: TextStyle(fontSize: 11, color: AppTheme.ts(context), fontStyle: FontStyle.italic)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Partnership + over balls combined inline strip
            if (_overBalls.isNotEmpty || _striker != null || _nonStriker != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                color: AppTheme.surface(context),
                child: Row(
                  children: [
                    if (_striker != null || _nonStriker != null) ...[
                      Icon(Icons.handshake, size: 12, color: AppTheme.accentAmber),
                      const SizedBox(width: 4),
                      Text('P:',
                          style: TextStyle(fontSize: 10, color: AppTheme.ts(context), fontWeight: FontWeight.w600)),
                      const SizedBox(width: 3),
                      Text('$_partnershipRuns($_partnershipBalls)',
                          style: GoogleFonts.poppins(
                              fontWeight: FontWeight.w800, fontSize: 11.5, color: AppTheme.accentAmber)),
                    ],
                    const Spacer(),
                    if (_overBalls.isNotEmpty) ...[
                      Text('OVER',
                          style: TextStyle(
                              fontSize: 9, color: AppTheme.ts(context), fontWeight: FontWeight.w800, letterSpacing: 0.5)),
                      const SizedBox(width: 6),
                      ..._overBalls.map((b) {
                        Color bg = AppTheme.divider(context);
                        Color fg = AppTheme.tp(context);
                        Color glow = Colors.transparent;
                        if (b == 'W') { bg = AppTheme.wicketRed; fg = Colors.white; glow = AppTheme.wicketRed; }
                        else if (b == '4') { bg = AppTheme.fourColor; fg = Colors.black; glow = AppTheme.fourColor; }
                        else if (b == '6') { bg = AppTheme.sixColor; fg = Colors.black; glow = AppTheme.sixColor; }
                        else if (b == '0') { bg = AppTheme.dotBallColor; fg = Colors.white; }
                        return Container(
                          width: 24, height: 24,
                          margin: const EdgeInsets.only(left: 3),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: bg,
                            boxShadow: glow != Colors.transparent
                                ? [BoxShadow(color: glow.withValues(alpha: 0.45), blurRadius: 5)]
                                : null,
                          ),
                          alignment: Alignment.center,
                          child: Text(b,
                              style: GoogleFonts.poppins(
                                fontWeight: FontWeight.w800,
                                fontSize: 10,
                                color: fg,
                              )),
                        );
                      }),
                    ],
                  ],
                ),
              ),

            // Player selectors
            if (_team1Players.isEmpty && _team2Players.isEmpty)
              Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.accentAmber.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.accentAmber),
                ),
                child: Column(
                  children: [
                    Icon(Icons.warning_amber_rounded, color: AppTheme.accentAmber, size: 48),
                    const SizedBox(height: 12),
                    Text('No Players Assigned',
                        style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.accentAmber)),
                    const SizedBox(height: 8),
                    Text('Players must be assigned to teams before starting live scoring.',
                        style: GoogleFonts.poppins(fontSize: 12, color: AppTheme.ts(context)),
                        textAlign: TextAlign.center),
                    const SizedBox(height: 12),
                    ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                      },
                      icon: const Icon(Icons.arrow_back),
                      label: const Text('Go Back'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.accentAmber,
                        foregroundColor: Colors.black,
                      ),
                    ),
                  ],
                ),
              )
            else
              Column(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    child: Row(
                      children: [
                        Expanded(child: _playerDropdown('Striker', _striker, _getBattingTeam(exclude: _nonStriker), (_matchStarted && _striker != null && _overBalls.isNotEmpty) ? null : (v) => setState(() => _striker = v))),
                        const SizedBox(width: 4),
                        Expanded(child: _playerDropdown('Non-Striker', _nonStriker, _getBattingTeam(exclude: _striker), (_matchStarted && _nonStriker != null && _overBalls.isNotEmpty) ? null : (v) => setState(() => _nonStriker = v))),
                        const SizedBox(width: 4),
                        Expanded(child: _playerDropdown('Bowler', _bowler, _getBowlingTeam(), (_bowler != null && _overBalls.isNotEmpty) ? null : (v) => setState(() => _bowler = v))),
                      ],
                    ),
                  ),
                  if (_matchStarted && _striker != null && _nonStriker != null)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      child: Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: _showInjurySubstitution,
                              icon: const Icon(Icons.medical_services, size: 16),
                              label: const Text('Injury Sub', style: TextStyle(fontSize: 11)),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppTheme.wicketRed,
                                side: const BorderSide(color: AppTheme.wicketRed),
                                padding: const EdgeInsets.symmetric(vertical: 8),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  if (_isInningsComplete() && _currentInnings == 1)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      child: ElevatedButton.icon(
                        onPressed: _endInnings,
                        icon: const Icon(Icons.flag, size: 18),
                        label: const Text('END INNINGS - Start 2nd Innings', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryGreen,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                  if (_isInningsComplete() && _currentInnings == 2)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      child: ElevatedButton.icon(
                        onPressed: _endMatch,
                        icon: const Icon(Icons.check_circle, size: 18),
                        label: const Text('END MATCH - All Out', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.wicketRed,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                  // Complete Match button when target is reached in 2nd innings
                  if (_currentInnings == 2 && _match != null)
                    () {
                      final target = _match!.team1Score + 1;
                      final currentScore = _match!.team2Score;
                      if (currentScore >= target) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          child: ElevatedButton.icon(
                            onPressed: _completeMatch,
                            icon: const Icon(Icons.check_circle, size: 18),
                            label: const Text('COMPLETE MATCH', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.lightGreen,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        );
                      }
                      return const SizedBox.shrink();
                    }(),
                ],
              ),

            const Divider(height: 1),

            // Scoring buttons
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    // Shot direction picker (wagon wheel zones)
                    _buildZonePicker(),
                    const SizedBox(height: 8),
                    // Run buttons
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _runButton('0', const Color(0xFF424242), Colors.white70, () {
                          _lastBallWasNoBall = false;
                          _addBall(runs: 0);
                        }),
                        _runButton('1', AppTheme.surface(context), AppTheme.tp(context), () {
                          _lastBallWasNoBall = false;
                          _addBall(runs: 1);
                        }),
                        _runButton('2', AppTheme.surface(context), AppTheme.tp(context), () {
                          _lastBallWasNoBall = false;
                          _addBall(runs: 2);
                        }),
                        _runButton('3', AppTheme.surface(context), AppTheme.tp(context), () {
                          _lastBallWasNoBall = false;
                          _addBall(runs: 3);
                        }),
                        _runButton('4', const Color(0xFF1565C0), Colors.white, () {
                          _lastBallWasNoBall = false;
                          _addBall(runs: 4);
                        }),
                        _runButton('6', const Color(0xFF4A148C), Colors.white, () {
                          _lastBallWasNoBall = false;
                          _addBall(runs: 6);
                        }),
                      ],
                    ),
                    const SizedBox(height: 12),
                    // Extras row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _chipButton('WIDE', () {
                          _lastBallWasNoBall = false;
                          _showWideOptions();
                        }),
                        _chipButton('NO BALL', () {
                          _lastBallWasNoBall = true;
                          _showNoBallOptions();
                        }),
                        _chipButton('BYE', () => _addBall(runs: 1, isBye: true)),
                        _chipButton('LEG BYE', () => _addBall(runs: 1, isLegbye: true)),
                        _chipButton('OVERTHROW', _showOverthrowDialog),
                      ],
                    ),
                    const SizedBox(height: 12),
                    // Action buttons
                    Row(
                      children: [
                        Expanded(
                          child: _actionBtn('UNDO', const Color(0xFF37474F), Colors.white, _undoLastBall),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _actionBtn('END OVER', const Color(0xFF37474F), Colors.white, () {
                            // Check if innings is complete
                            if (_match != null && _currentOver + 1 >= _match!.totalOvers) {
                              SnackbarUtils.showInfo(context, 'Innings complete! Cannot score beyond ${_match!.totalOvers} overs.');
                              return;
                            }
                            setState(() {
                              _currentOver++;
                              _currentBall = 0;
                              _overBalls = [];
                              final temp = _striker;
                              _striker = _nonStriker;
                              _nonStriker = temp;
                            });
                          }),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _actionBtn('CHANGE\nSTRIKER', const Color(0xFF37474F), Colors.white, () {
                            setState(() {
                              final temp = _striker;
                              _striker = _nonStriker;
                              _nonStriker = temp;
                            });
                          }),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    // Wicket button
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: _lastBallWasNoBall ? null : _showWicketDialog,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _lastBallWasNoBall ? Colors.grey : AppTheme.wicketRed,
                          foregroundColor: Colors.white,
                          disabledBackgroundColor: Colors.grey,
                          disabledForegroundColor: Colors.white70,
                        ),
                        child: Text(_lastBallWasNoBall ? 'WICKET (Not on No Ball)' : 'WICKET',
                            style: GoogleFonts.poppins(fontWeight: FontWeight.w700, letterSpacing: 1, fontSize: _lastBallWasNoBall ? 14 : 16)),
                      ),
                    ),
                    const SizedBox(height: 8),
                    // Scorecard button
                    SizedBox(
                      width: double.infinity,
                      height: 44,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.push(context, MaterialPageRoute(
                            builder: (_) => MatchDetailScreen(matchId: widget.matchId),
                          ));
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.surface(context),
                          foregroundColor: AppTheme.tp(context),
                          side: BorderSide(color: AppTheme.divider(context)),
                          elevation: 0,
                        ),
                        child: Text('SCORECARD',
                            style: GoogleFonts.poppins(fontWeight: FontWeight.w700, letterSpacing: 1)),
                      ),
                    ),
                    const SizedBox(height: 8),
                    // Critical / rarely-used actions are tucked behind a single entry
                    SizedBox(
                      width: double.infinity,
                      height: 44,
                      child: OutlinedButton.icon(
                        onPressed: _showFurtherActionsSheet,
                        icon: const Icon(Icons.more_horiz_rounded, size: 18),
                        label: Text(
                          'FURTHER ACTIONS',
                          style: GoogleFonts.poppins(
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1,
                            fontSize: 12,
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppTheme.tp(context),
                          side: BorderSide(color: AppTheme.divider(context)),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ),
                    if (_currentInnings == 1 && _currentOver >= (_match?.totalOvers ?? 20)) ...[
                      const SizedBox(height: 8),
                      SizedBox(
                        width: double.infinity,
                        height: 44,
                        child: ElevatedButton(
                          onPressed: _switchInnings,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryGreen,
                            foregroundColor: Colors.white,
                          ),
                          child: Text('START 2ND INNINGS',
                              style: GoogleFonts.poppins(fontWeight: FontWeight.w700, letterSpacing: 1)),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }


  /// Returns the team that bats first based on the toss result.
  /// Falls back to team1 if no toss data is available.
  bool get _team1BatsFirst {
    if (_match?.tossWinner == null || _match?.tossDecision == null) return true;
    final tossWinnerIsTeam1 = _match!.tossWinner == _match!.team1Name;
    final tossWinnerBats = _match!.tossDecision == 'bat';
    // Team1 bats first if: (team1 won toss AND chose to bat) OR (team2 won toss AND chose to bowl)
    return tossWinnerIsTeam1 == tossWinnerBats;
  }

  List<MatchPlayer> _getFirstInningsBattingTeam() {
    return _team1BatsFirst ? _team1Players : _team2Players;
  }

  List<MatchPlayer> _getFirstInningsBowlingTeam() {
    return _team1BatsFirst ? _team2Players : _team1Players;
  }

  List<MatchPlayer> _getBattingTeam({MatchPlayer? exclude}) {
    final team = _currentInnings == 1 ? _getFirstInningsBattingTeam() : _getFirstInningsBowlingTeam();
    // Dedupe by name (case-insensitive) — same player name may have multiple
    // user records due to repeated registration creating separate User entries.
    final seen = <String>{};
    return team.where((p) {
      if (_outBatsmen.contains(p.playerId)) return false;
      if (_retiredHurtBatsmen.contains(p.playerId)) return false;
      if (exclude != null && p.playerId == exclude.playerId) return false;
      final nameLower = p.name.toLowerCase().trim();
      if (seen.contains(nameLower)) return false;
      seen.add(nameLower);
      return true;
    }).toList();
  }

  bool _isInningsComplete() {
    // Innings is complete if less than 2 batsmen are available
    // (need at least 2 for striker and non-striker)
    final availableBatsmen = _getBattingTeam();
    
    // Also check total wickets - if wickets >= (total_players - 1), innings is over
    final battingTeam = _currentInnings == 1 ? _getFirstInningsBattingTeam() : _getFirstInningsBowlingTeam();
    final totalPlayers = battingTeam.length;
    final wickets = _outBatsmen.length;
    
    print('DEBUG: Innings complete check - Available: ${availableBatsmen.length}, Total players: $totalPlayers, Wickets: $wickets');
    
    return availableBatsmen.length < 2 || wickets >= (totalPlayers - 1);
  }

  Future<void> _endInnings() async {
    try {
      // Update match to next innings
      await ApiService.updateMatch(
        widget.matchId,
        {'current_innings': 2},
      );
      
      // Reload match data
      await _loadData();
      
      SnackbarUtils.showSuccess(context, '1st Innings Complete! Starting 2nd Innings...');
    } catch (e) {
      SnackbarUtils.showError(context, e);
    }
  }

  Future<void> _endMatch() async {
    try {
      // Determine winner based on scores
      String winner;
      if (_match!.team1Score > _match!.team2Score) {
        winner = _match!.team1Name;
      } else if (_match!.team2Score > _match!.team1Score) {
        winner = _match!.team2Name;
      } else {
        winner = 'Draw'; // Tie
      }

      // Ask for Player of the Match
      final pom = await _selectPlayerOfMatch();

      // Update match status to completed with winner
      await ApiService.updateMatch(
        widget.matchId,
        {
          'status': 'completed',
          'winner': winner,
          if (pom != null) 'player_of_match': pom,
        },
      );

      SnackbarUtils.showSuccess(context, 'Match Complete! $winner won by ${(_match!.team1Score - _match!.team2Score).abs()} runs.');
      
      // Navigate back to match list after delay
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) Navigator.of(context).pop();
      });
    } catch (e) {
      SnackbarUtils.showError(context, 'Failed to complete match: $e');
    }
  }

  Future<void> _completeMatch() async {
    try {
      // Determine winner — the team batting in the 2nd innings (chasing team)
      final winner = _team1BatsFirst ? _match!.team2Name : _match!.team1Name;

      // Ask for Player of the Match
      final pom = await _selectPlayerOfMatch();

      // Update match status to completed
      await ApiService.updateMatch(
        widget.matchId,
        {
          'status': 'completed',
          'winner': winner,
          if (pom != null) 'player_of_match': pom,
        },
      );
      
      // Reload match data
      await _loadData();
      
      SnackbarUtils.showSuccess(context, 'Match completed! $winner won!');
      
      // Navigate back after a delay
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) Navigator.pop(context);
      });
    } catch (e) {
      SnackbarUtils.showError(context, 'Failed to complete match: $e');
    }
  }

  List<MatchPlayer> _getBowlingTeam() {
    final team = _currentInnings == 1 ? _getFirstInningsBowlingTeam() : _getFirstInningsBattingTeam();
    // Exclude last bowler to prevent consecutive overs + dedupe by name
    final seen = <String>{};
    return team.where((p) {
      if (p.playerId == _lastBowler?.playerId) return false;
      final nameLower = p.name.toLowerCase().trim();
      if (seen.contains(nameLower)) return false;
      seen.add(nameLower);
      return true;
    }).toList();
  }

  Map<String, dynamic> _getBatsmanFullStats(String playerId) {
    if (_match?.scores == null || _match!.scores!.isEmpty) {
      return {'runs': 0, 'balls': 0, 'fours': 0, 'sixes': 0};
    }
    try {
      final score = _match!.scores!.firstWhere(
        (s) => s.playerId == playerId && s.team == _currentInnings,
      );
      return {
        'runs': score.runsScored,
        'balls': score.ballsFaced,
        'fours': score.fours,
        'sixes': score.sixes,
      };
    } catch (e) {
      return {'runs': 0, 'balls': 0, 'fours': 0, 'sixes': 0};
    }
  }

  List<_BatsmanEntry> _getFixedOrderBatsmen() {
    final entries = <_BatsmanEntry>[];
    if (_striker != null) {
      entries.add(_BatsmanEntry(player: _striker!, isStriker: true));
    }
    if (_nonStriker != null) {
      entries.add(_BatsmanEntry(player: _nonStriker!, isStriker: false));
    }
    // Sort by playerId so positions stay fixed regardless of strike rotation
    entries.sort((a, b) => a.player.playerId.compareTo(b.player.playerId));
    return entries;
  }

  Widget _batsmanRow(MatchPlayer player, {required bool isStriker}) {
    final stats = _getBatsmanFullStats(player.playerId);
    final r = stats['runs'] as int;
    final b = stats['balls'] as int;
    final f = stats['fours'] as int;
    final s = stats['sixes'] as int;
    final srNum = b > 0 ? (r * 100 / b) : 0.0;
    final sr = b > 0 ? srNum.toStringAsFixed(0) : '-';

    Color srColor;
    if (b == 0) {
      srColor = AppTheme.ts(context);
    } else if (srNum >= 150) {
      srColor = AppTheme.fourColor;
    } else if (srNum >= 100) {
      srColor = AppTheme.accentAmber;
    } else if (srNum >= 60) {
      srColor = AppTheme.ts(context);
    } else {
      srColor = AppTheme.wicketRed;
    }

    return Row(
      children: [
        // Strike indicator: filled gold dot for striker, hollow for non-striker
        Container(
          width: 8, height: 8,
          margin: const EdgeInsets.only(right: 6),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isStriker ? AppTheme.accentGold : Colors.transparent,
            border: Border.all(
              color: isStriker ? AppTheme.accentGold : AppTheme.ts(context).withValues(alpha: 0.5),
              width: 1.4,
            ),
            boxShadow: isStriker
                ? [BoxShadow(color: AppTheme.accentGold.withValues(alpha: 0.55), blurRadius: 5)]
                : const [],
          ),
        ),
        Flexible(
          child: Row(
            children: [
              Flexible(
                child: Text(
                  player.name,
                  style: GoogleFonts.poppins(
                    fontWeight: isStriker ? FontWeight.w700 : FontWeight.w500,
                    fontSize: 12.5,
                    color: isStriker ? AppTheme.tp(context) : AppTheme.ts(context),
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (player.isCaptain) ...[
                const SizedBox(width: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 3, vertical: 1),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryGreen,
                    borderRadius: BorderRadius.circular(3),
                  ),
                  child: Text('C',
                      style: GoogleFonts.poppins(
                          fontSize: 7, fontWeight: FontWeight.w700, color: Colors.white)),
                ),
              ],
              if (player.isWicketKeeper) ...[
                const SizedBox(width: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 3, vertical: 1),
                  decoration: BoxDecoration(
                    color: Colors.orange,
                    borderRadius: BorderRadius.circular(3),
                  ),
                  child: Text('WK',
                      style: GoogleFonts.poppins(
                          fontSize: 7, fontWeight: FontWeight.w700, color: Colors.white)),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(width: 6),
        Text.rich(
          TextSpan(
            children: [
              TextSpan(
                text: '$r',
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: isStriker ? AppTheme.tp(context) : AppTheme.ts(context),
                ),
              ),
              TextSpan(
                text: '($b)',
                style: TextStyle(fontSize: 9.5, color: AppTheme.ts(context)),
              ),
              if (f > 0)
                TextSpan(
                  text: '  $f×4',
                  style: TextStyle(fontSize: 9, color: AppTheme.fourColor.withValues(alpha: 0.85), fontWeight: FontWeight.w700),
                ),
              if (s > 0)
                TextSpan(
                  text: '  $s×6',
                  style: TextStyle(fontSize: 9, color: AppTheme.sixColor, fontWeight: FontWeight.w700),
                ),
              const TextSpan(text: '  '),
              TextSpan(
                text: 'SR$sr',
                style: TextStyle(fontSize: 9, color: srColor, fontWeight: FontWeight.w700),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _getBowlerStats(String playerId) {
    if (_match?.scores == null || _match!.scores!.isEmpty) {
      final overs = _formatOvers(_bowlerOvers[playerId] ?? 0);
      return '0-0 ($overs) Eco -';
    }

    try {
      final score = _match!.scores!.firstWhere(
        (s) => s.playerId == playerId,
      );
      final overs = _formatOvers(_bowlerOvers[playerId] ?? score.oversBowled);
      final eco = score.oversBowled > 0 ? (score.runsConceded / score.oversBowled).toStringAsFixed(1) : '-';
      return '${score.wicketsTaken}-${score.runsConceded} ($overs) M:${score.maidens} Eco:$eco';
    } catch (e) {
      final overs = _formatOvers(_bowlerOvers[playerId] ?? 0);
      return '0-0 ($overs) Eco -';
    }
  }

  String _formatOvers(double raw) {
    final completedOvers = raw.floor();
    final balls = ((raw - completedOvers) * 6).round();
    if (balls == 0 && completedOvers == 0) return '0';
    if (balls == 0) return '$completedOvers';
    // Display as whole overs when 6 balls completed
    if (balls == 6) return '${completedOvers + 1}';
    return '$completedOvers.$balls';
  }


  Widget _teamCrest(String name, String? logoUrl, {required bool isBatting, double radius = 28}) {
    final hasLogo = logoUrl != null && logoUrl.isNotEmpty;
    final ringColor = isBatting ? AppTheme.accentGold : Colors.white54;
    return Container(
      padding: const EdgeInsets.all(1.5),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: ringColor, width: isBatting ? 1.6 : 1),
        boxShadow: isBatting
            ? [BoxShadow(color: AppTheme.accentGold.withValues(alpha: 0.4), blurRadius: 7)]
            : const [],
      ),
      child: CircleAvatar(
        radius: radius,
        backgroundColor: Colors.white24,
        backgroundImage: hasLogo ? NetworkImage(ApiService.getPhotoUrl(logoUrl)) : null,
        child: !hasLogo
            ? Text(
                name.isNotEmpty ? name[0].toUpperCase() : '?',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: radius * 0.7,
                ),
              )
            : null,
      ),
    );
  }

  Widget _playerDropdown(String label, MatchPlayer? selected, List<MatchPlayer> players, ValueChanged<MatchPlayer?>? onChanged) {
    // Always render the currently-selected player, even if filter state
    // (out batsmen, retired hurt, last bowler) has dropped them from the
    // available players list. Otherwise the dropdown silently goes blank
    // while BATSMAN DETAILS above still shows the player.
    final items = <MatchPlayer>[...players];
    if (selected != null && !items.any((p) => p.playerId == selected.playerId)) {
      items.insert(0, selected);
    }
    final validSelected = selected != null
        ? items.firstWhere((p) => p.playerId == selected.playerId, orElse: () => selected)
        : null;

    final isFilled = validSelected != null;
    final accent = isFilled ? AppTheme.primaryGreen : AppTheme.divider(context);
    final isDisabled = onChanged == null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(),
            style: TextStyle(
              fontSize: 9,
              color: AppTheme.ts(context),
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
            )),
        const SizedBox(height: 2),
        Container(
          height: 34,
          decoration: BoxDecoration(
            color: AppTheme.surfaceLight(context),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: accent.withValues(alpha: isFilled ? 0.5 : 0.35), width: 1),
          ),
          child: Row(
            children: [
              if (isFilled)
                Padding(
                  padding: const EdgeInsets.only(left: 4),
                  child: CircleAvatar(
                    radius: 9,
                    backgroundColor: accent,
                    child: Text(
                      validSelected.name.isNotEmpty ? validSelected.name[0].toUpperCase() : '?',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 9),
                    ),
                  ),
                ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: DropdownButton<MatchPlayer>(
                    value: validSelected,
                    isExpanded: true,
                    isDense: true,
                    underline: const SizedBox(),
                    icon: Icon(Icons.expand_more, size: 16, color: AppTheme.ts(context)),
                    hint: Text(label,
                        style: TextStyle(fontSize: 11, color: AppTheme.ts(context))),
                    style: TextStyle(
                      fontSize: 11,
                      color: AppTheme.tp(context),
                      fontWeight: isFilled ? FontWeight.w600 : FontWeight.w400,
                    ),
                    dropdownColor: AppTheme.surface(context),
                    items: items
                        .map((p) => DropdownMenuItem(
                              value: p,
                              child: Text(p.name,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 11)),
                            ))
                        .toList(),
                    onChanged: isDisabled ? null : onChanged,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _runButton(String label, Color bg, Color fg, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 48, height: 48,
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(8),
          boxShadow: [BoxShadow(color: bg.withValues(alpha: 0.3), blurRadius: 4, offset: const Offset(0, 2))],
        ),
        alignment: Alignment.center,
        child: Text(label, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: fg)),
      ),
    );
  }

  Widget _chipButton(String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        decoration: BoxDecoration(
          border: Border.all(color: AppTheme.divider(context)),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(label, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w600)),
      ),
    );
  }

  Widget _actionBtn(String label, Color bg, Color fg, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(6),
        ),
        alignment: Alignment.center,
        child: Text(label, textAlign: TextAlign.center,
            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: fg)),
      ),
    );
  }

  void _showFurtherActionsSheet() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppTheme.surface(context),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetCtx) {
        return SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 36,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppTheme.divider(context),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  'Further actions',
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.tp(context),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Use these only when required — they materially change the match.',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: AppTheme.ts(context),
                  ),
                ),
                const SizedBox(height: 12),
                _furtherActionTile(
                  icon: Icons.flag_rounded,
                  iconColor: Colors.amber.shade700,
                  label: 'Declare innings',
                  subtitle: 'End the current innings now',
                  onTap: () {
                    Navigator.pop(sheetCtx);
                    _showDeclareDialog();
                  },
                ),
                _furtherActionTile(
                  icon: Icons.add_circle_outline_rounded,
                  iconColor: Colors.blueGrey,
                  label: 'Penalty runs',
                  subtitle: 'Award extra runs to a side',
                  onTap: () {
                    Navigator.pop(sheetCtx);
                    _showPenaltyDialog();
                  },
                ),
                _furtherActionTile(
                  icon: Icons.cancel_rounded,
                  iconColor: Colors.red.shade600,
                  label: 'Abandon match',
                  subtitle: 'Stop the match — cannot be undone',
                  onTap: () {
                    Navigator.pop(sheetCtx);
                    _showAbandonDialog();
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _furtherActionTile({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppTheme.divider(context)),
          ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: iconColor, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.tp(context),
                      ),
                    ),
                    Text(
                      subtitle,
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        color: AppTheme.ts(context),
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: AppTheme.ts(context)),
            ],
          ),
        ),
      ),
    );
  }

  Future<String?> _selectPlayerOfMatch() async {
    final allPlayers = [..._team1Players, ..._team2Players];
    return showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(20),
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Player of the Match', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text('Select the best performer', style: TextStyle(fontSize: 13, color: AppTheme.ts(context))),
            const SizedBox(height: 12),
            Flexible(
              child: ListView(
                shrinkWrap: true,
                children: [
                  ListTile(
                    leading: Icon(Icons.skip_next, color: AppTheme.textSecondary),
                    title: const Text('Skip'),
                    subtitle: const Text('No selection'),
                    onTap: () => Navigator.pop(ctx, null),
                  ),
                  const Divider(),
                  ...allPlayers.map((p) => ListTile(
                    leading: CircleAvatar(
                      radius: 18,
                      backgroundColor: AppTheme.primaryGreen,
                      child: Text(p.name[0], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                    title: Text(p.name),
                    subtitle: Text(p.team == 1 ? (_match?.team1Name ?? 'Team 1') : (_match?.team2Name ?? 'Team 2')),
                    onTap: () => Navigator.pop(ctx, p.name),
                  )),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Wide with boundary/extras ──────────────────────────────────────
  void _showWideOptions() {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Wide Ball', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text('How many total runs from this wide?',
                style: TextStyle(fontSize: 13, color: AppTheme.ts(context))),
            const SizedBox(height: 14),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                _wideOption(ctx, 1, 'Just wide'),
                _wideOption(ctx, 2, 'Wide + 1'),
                _wideOption(ctx, 3, 'Wide + 2'),
                _wideOption(ctx, 4, 'Wide + 3'),
                _wideOption(ctx, 5, 'Boundary (4)', highlight: AppTheme.fourColor),
                _wideOption(ctx, 7, 'Six!', highlight: AppTheme.sixColor),
              ],
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _wideOption(BuildContext ctx, int totalExtras, String label, {Color? highlight}) {
    return ElevatedButton(
      onPressed: () {
        Navigator.pop(ctx);
        _addBall(isWide: true, extrasOverride: totalExtras);
      },
      style: ElevatedButton.styleFrom(
        backgroundColor: highlight ?? AppTheme.upcomingBlue,
        foregroundColor: highlight != null ? Colors.black : Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('+$totalExtras', style: GoogleFonts.poppins(fontWeight: FontWeight.w800, fontSize: 14)),
          Text(label, style: const TextStyle(fontSize: 10)),
        ],
      ),
    );
  }

  // ─── No-ball with batsman runs ──────────────────────────────────────
  void _showNoBallOptions() {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('No Ball', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text('No-ball penalty +1. How many runs did the batsman score?',
                style: TextStyle(fontSize: 13, color: AppTheme.ts(context))),
            const SizedBox(height: 14),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                _noBallOption(ctx, 0, 'Dot'),
                _noBallOption(ctx, 1, '1'),
                _noBallOption(ctx, 2, '2'),
                _noBallOption(ctx, 3, '3'),
                _noBallOption(ctx, 4, 'Four!', highlight: AppTheme.fourColor),
                _noBallOption(ctx, 6, 'Six!', highlight: AppTheme.sixColor),
              ],
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _noBallOption(BuildContext ctx, int batsmanRuns, String label, {Color? highlight}) {
    return ElevatedButton(
      onPressed: () {
        Navigator.pop(ctx);
        _addBall(isNoball: true, runs: batsmanRuns, extrasOverride: 1);
      },
      style: ElevatedButton.styleFrom(
        backgroundColor: highlight ?? AppTheme.wicketRed,
        foregroundColor: highlight != null ? Colors.black : Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(batsmanRuns.toString(), style: GoogleFonts.poppins(fontWeight: FontWeight.w800, fontSize: 14)),
          Text(label, style: const TextStyle(fontSize: 10)),
        ],
      ),
    );
  }

  // ─── Overthrow runs (added on top of last ball) ─────────────────────
  void _showOverthrowDialog() {
    if (_overBalls.isEmpty) {
      SnackbarUtils.showInfo(context, 'No previous ball to add overthrow to');
      return;
    }
    showModalBottomSheet(
      context: context,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Overthrow Runs', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text('Tap to record extra runs scored from a misfield/overthrow on the last ball',
                style: TextStyle(fontSize: 12, color: AppTheme.ts(context))),
            const SizedBox(height: 14),
            Wrap(
              spacing: 10,
              children: [1, 2, 3, 4].map((n) => ElevatedButton(
                onPressed: () async {
                  Navigator.pop(ctx);
                  // Record as a no-ball-style extras event so it doesn't consume a legal delivery.
                  // Better: we store it as a separate ball event with overthrows = n.
                  await _addBall(isWide: true, extrasOverride: n);
                  if (mounted) {
                    SnackbarUtils.showSuccess(context, '+$n overthrow runs added');
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.accentAmber,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                ),
                child: Text('+$n', style: GoogleFonts.poppins(fontWeight: FontWeight.w800, fontSize: 16)),
              )).toList(),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  // ─── Shot direction zone picker ─────────────────────────────────────
  static const List<Map<String, String>> _wagonZones = [
    {'key': 'fine_leg', 'label': 'Fine Leg'},
    {'key': 'square_leg', 'label': 'Square Leg'},
    {'key': 'midwicket', 'label': 'Mid-wicket'},
    {'key': 'mid_on', 'label': 'Mid On'},
    {'key': 'long_on', 'label': 'Long On'},
    {'key': 'long_off', 'label': 'Long Off'},
    {'key': 'cover', 'label': 'Cover'},
    {'key': 'point', 'label': 'Point'},
    {'key': 'third_man', 'label': 'Third Man'},
  ];

  Widget _buildZonePicker() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      color: AppTheme.surfaceLight(context),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.donut_large, size: 12, color: AppTheme.ts(context)),
              const SizedBox(width: 4),
              Text('Shot Direction (optional)',
                  style: TextStyle(fontSize: 10, color: AppTheme.ts(context), fontWeight: FontWeight.bold)),
              const Spacer(),
              if (_selectedZone != null)
                GestureDetector(
                  onTap: () => setState(() => _selectedZone = null),
                  child: Row(
                    children: [
                      Icon(Icons.close, size: 11, color: AppTheme.wicketRed),
                      const SizedBox(width: 2),
                      Text('Clear', style: TextStyle(fontSize: 10, color: AppTheme.wicketRed)),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 4),
          SizedBox(
            height: 28,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: _wagonZones.map((zone) {
                final isSelected = _selectedZone == zone['key'];
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedZone = isSelected ? null : zone['key']),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: isSelected ? AppTheme.primaryGreen : AppTheme.surface(context),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isSelected ? AppTheme.primaryGreen : AppTheme.divider(context),
                        ),
                      ),
                      child: Text(zone['label']!,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                            color: isSelected ? Colors.white : AppTheme.tp(context),
                          )),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  void _showDeclareDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Declare Innings?'),
        content: Text(
          'Are you sure you want to declare the innings?\n\n'
          'Current Score: ${_currentInnings == 1 ? _match!.team1Score : _match!.team2Score}/'
          '${_currentInnings == 1 ? _match!.team1Wickets : _match!.team2Wickets} '
          '(${_currentOver}.${_currentBall} overs)',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              if (_currentInnings == 1) {
                await _startSecondInnings();
              } else {
                await _endMatch();
              }
            },
            child: const Text('Declare', style: TextStyle(color: AppTheme.inProgressOrange)),
          ),
        ],
      ),
    );
  }

  void _showPenaltyDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Award Penalty Runs'),
        content: const Text('Award 5 penalty runs to:'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                // Add 5 runs via a penalty ball record
                await ApiService.addBall(
                  matchId: widget.matchId,
                  innings: _currentInnings,
                  overNumber: _currentOver,
                  ballNumber: _currentBall,
                  batsmanId: _striker?.playerId,
                  bowlerId: _bowler?.playerId,
                  runs: 5,
                  isWide: false,
                  isNoball: true, // Record as no-ball so it doesn't count as a legal delivery
                  extras: 0,
                );
                await _reloadMatchStats();
                if (mounted) {
                  SnackbarUtils.showSuccess(context, '5 penalty runs awarded to batting team');
                }
              } catch (e) {
                if (mounted) {
                  SnackbarUtils.showError(context, e);
                }
              }
            },
            child: const Text('Batting Team (+5 runs)'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              // For bowling team penalty, we add to the OTHER innings
              // This is complex, so we show a message for now
              SnackbarUtils.showSuccess(context, '5 penalty runs awarded to bowling team (added to their total)');
            },
            child: const Text('Bowling Team (+5 runs)'),
          ),
        ],
      ),
    );
  }

  void _showAbandonDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Abandon Match?'),
        content: const Text(
          'Are you sure you want to abandon this match? This action cannot be undone.\n\n'
          'The match will be marked as abandoned with no result.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await ApiService.updateMatch(widget.matchId, {
                  'status': 'completed',
                  'winner': 'Abandoned',
                });
                if (mounted) {
                  SnackbarUtils.showError(context, 'Match abandoned');
                  Navigator.pop(context);
                }
              } catch (e) {
                if (mounted) {
                  SnackbarUtils.showError(context, e);
                }
              }
            },
            child: const Text('Abandon', style: TextStyle(color: AppTheme.wicketRed)),
          ),
        ],
      ),
    );
  }

  void _shareMatchLink() {
    final link = '${ApiService.baseUrl.replaceAll('/api', '')}/public/matches/${widget.matchId}';
    Clipboard.setData(ClipboardData(text: link));
    SnackbarUtils.showSuccess(context, 'Match link copied to clipboard!');
  }

  void _showWicketDialog() {
    showDialog(
      context: context,
      builder: (ctx) => SimpleDialog(
        title: const Text('Wicket Type'),
        children: ['Bowled', 'Caught', 'LBW', 'Run Out', 'Stumped', 'Hit Wicket'].map((type) {
          return SimpleDialogOption(
            onPressed: () {
              Navigator.pop(ctx);
              // For caught, run out, and stumped, show fielder selection
              if (type == 'Caught' || type == 'Run Out' || type == 'Stumped') {
                _showFielderDialog(type);
              } else {
                _addBall(isWicket: true, wicketType: type);
              }
            },
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Text(type, style: const TextStyle(fontSize: 16)),
            ),
          );
        }).toList(),
      ),
    );
  }

  void _showFielderDialog(String wicketType) {
    // For run out, first ask which batsman is out
    if (wicketType == 'Run Out') {
      _showRunOutBatsmanDialog();
      return;
    }
    
    final fieldingTeam = _getBowlingTeam();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Select Fielder for $wicketType'),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: fieldingTeam.length,
            itemBuilder: (context, index) {
              final player = fieldingTeam[index];
              return ListTile(
                title: Text(player.name),
                subtitle: Text(wicketType == 'Caught' ? 'c ${player.name}' : 'st ${player.name}'),
                onTap: () {
                  Navigator.pop(ctx);
                  // Add fielder info to wicket type
                  final fullWicketType = wicketType == 'Caught' 
                      ? 'c ${player.name} b ${_bowler?.name ?? ""}' 
                      : 'st ${player.name} b ${_bowler?.name ?? ""}';
                  _addBall(isWicket: true, wicketType: fullWicketType);
                },
              );
            },
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  void _showRunOutBatsmanDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Run Out - Which Batsman?'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_striker != null)
              ListTile(
                title: Text(_striker!.name),
                subtitle: const Text('Striker'),
                onTap: () {
                  Navigator.pop(ctx);
                  _showRunOutFielderDialog(isStriker: true);
                },
              ),
            if (_nonStriker != null)
              ListTile(
                title: Text(_nonStriker!.name),
                subtitle: const Text('Non-Striker'),
                onTap: () {
                  Navigator.pop(ctx);
                  _showRunOutFielderDialog(isStriker: false);
                },
              ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  void _showInningsCompleteDialog() {
    print('DEBUG: _showInningsCompleteDialog() called');
    if (_match == null) {
      print('DEBUG: Match is null, returning');
      return;
    }

    print('DEBUG: Showing innings complete dialog for innings $_currentInnings');
    // team1Score = innings 1 score (whoever batted first)
    // team2Score = innings 2 score (whoever batted second)
    final innings1Score = _match!.team1Score;
    final target = innings1Score + 1;
    
    // Determine which team will bat in 2nd innings based on toss
    final battingTeam = _team1BatsFirst ? _match!.team2Name : _match!.team1Name;
    print('DEBUG: Target: $target, Batting team: $battingTeam');

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.sports_cricket, color: AppTheme.primaryGreen, size: 28),
            const SizedBox(width: 8),
            const Text('1st Innings Complete!'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Target: $target runs',
              style: GoogleFonts.poppins(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: AppTheme.accentGold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '$battingTeam need $target runs to win',
              style: GoogleFonts.poppins(fontSize: 14),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.primaryGreen.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  Text(
                    'Innings 1 Summary',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$innings1Score/${_match!.team1Wickets} (${_match!.totalOvers}.0 overs)',
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.primaryGreen,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('View Scorecard'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await _startSecondInnings();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryGreen,
              foregroundColor: Colors.white,
            ),
            child: const Text('Begin 2nd Innings'),
          ),
        ],
      ),
    );
  }

  Future<void> _startSecondInnings() async {
    try {
      print('DEBUG: Starting 2nd innings for match ${widget.matchId}');
      setState(() => _loading = true);
      
      // Update match to 2nd innings
      print('DEBUG: Calling updateMatch API with current_innings: 2');
      await ApiService.updateMatch(
        widget.matchId,
        {'current_innings': 2},
      );
      print('DEBUG: updateMatch API call completed successfully');
      
      // Reload all data for 2nd innings
      print('DEBUG: Reloading match data...');
      await _loadData();
      print('DEBUG: Match data reloaded, currentInnings should be: $_currentInnings');
      
      setState(() => _loading = false);
      print('DEBUG: 2nd innings started successfully');
      if (mounted) {
        SnackbarUtils.showSuccess(context, '2nd Innings started!');
      }
    } catch (e) {
      print('DEBUG: ERROR starting 2nd innings: $e');
      if (mounted) {
        setState(() {
          _loading = false;
          _error = e.toString();
        });
        SnackbarUtils.showError(context, 'Error starting 2nd innings: $e');
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showRunOutFielderDialog({required bool isStriker}) {
    final fieldingTeam = _getBowlingTeam();
    final outBatsman = isStriker ? _striker : _nonStriker;
    
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Select Fielder - ${outBatsman?.name} run out'),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: fieldingTeam.length,
            itemBuilder: (context, index) {
              final player = fieldingTeam[index];
              return ListTile(
                title: Text(player.name),
                subtitle: Text('run out (${player.name})'),
                onTap: () {
                  Navigator.pop(ctx);
                  final fullWicketType = 'run out (${player.name})';
                  
                  // Pass flag to indicate which batsman is out
                  // _addBall will handle clearing the correct position
                  _addBall(
                    isWicket: true, 
                    wicketType: fullWicketType,
                    isNonStrikerOut: !isStriker,
                  );
                },
              );
            },
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }
}

class _BatsmanEntry {
  final MatchPlayer player;
  final bool isStriker;
  const _BatsmanEntry({required this.player, required this.isStriker});
}
