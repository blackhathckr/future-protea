import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'api_service.dart';

/// Possible connection states exposed to UI.
enum SocketStatus { disconnected, connecting, connected, reconnecting }

/// A singleton Socket.IO client with:
///   - match-scoped rooms (join_match / leave_match)
///   - exponential-backoff auto-reconnect
///   - a [ChangeNotifier]-style status stream for the reconnecting banner
class SocketService {
  SocketService._();
  static final SocketService instance = SocketService._();

  // ── internals ─────────────────────────────────────────────────────────────
  io.Socket? _socket;
  String? _currentMatchId;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 10;
  static const int _baseDelayMs = 1000;

  // ── streams ───────────────────────────────────────────────────────────────
  final _statusController =
      StreamController<SocketStatus>.broadcast();
  final _ballEventController =
      StreamController<Map<String, dynamic>>.broadcast();

  Stream<SocketStatus> get statusStream => _statusController.stream;
  Stream<Map<String, dynamic>> get ballEventStream =>
      _ballEventController.stream;

  SocketStatus _status = SocketStatus.disconnected;
  SocketStatus get status => _status;

  // ── public API ─────────────────────────────────────────────────────────────

  /// Call once when the Match Centre loads.
  /// Derives the WebSocket URL from the same base URL used by [ApiService].
  void connect(String matchId) {
    _currentMatchId = matchId;

    // Derive socket origin from api baseUrl (strip /api suffix)
    final origin = ApiService.baseUrl.replaceAll('/api', '');

    if (_socket != null) {
      // Already connected to the right server — just join the new room.
      if (_socket!.connected) {
        _joinRoom(matchId);
        return;
      }
      _socket!.dispose();
      _socket = null;
    }

    _setStatus(SocketStatus.connecting);

    _socket = io.io(
      origin,
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .disableAutoConnect()
          .setExtraHeaders({'ngrok-skip-browser-warning': '69420'})
          .disableReconnection() // We manage reconnect ourselves with backoff
          .build(),
    );

    _socket!.onConnect((_) {
      _reconnectAttempts = 0;
      _setStatus(SocketStatus.connected);
      debugPrint('[Socket] Connected — joining room match:$matchId');
      _joinRoom(matchId);
    });

    _socket!.on('ball_event', (data) {
      if (data is Map<String, dynamic>) {
        _ballEventController.add(data);
      } else if (data is Map) {
        _ballEventController.add(Map<String, dynamic>.from(data));
      }
    });

    _socket!.onDisconnect((reason) {
      debugPrint('[Socket] Disconnected: $reason');
      _setStatus(SocketStatus.disconnected);
      _scheduleReconnect();
    });

    _socket!.onError((err) {
      debugPrint('[Socket] Error: $err');
      _setStatus(SocketStatus.disconnected);
      _scheduleReconnect();
    });

    _socket!.onConnectError((err) {
      debugPrint('[Socket] Connect error: $err');
      _setStatus(SocketStatus.disconnected);
      _scheduleReconnect();
    });

    _socket!.connect();
  }

  /// Explicitly leave the current match room (e.g. screen dispose).
  void leaveMatch() {
    if (_currentMatchId != null && _socket != null && _socket!.connected) {
      _socket!.emit('leave_match', {'matchId': _currentMatchId});
    }
    _currentMatchId = null;
  }

  /// Disconnect fully and release resources.
  void disconnect() {
    leaveMatch();
    _socket?.dispose();
    _socket = null;
    _reconnectAttempts = 0;
    _setStatus(SocketStatus.disconnected);
  }

  void dispose() {
    disconnect();
    _statusController.close();
    _ballEventController.close();
  }

  // ── private helpers ────────────────────────────────────────────────────────

  void _joinRoom(String matchId) {
    _socket!.emit('join_match', {'matchId': matchId});
  }

  void _setStatus(SocketStatus s) {
    _status = s;
    if (!_statusController.isClosed) _statusController.add(s);
  }

  void _scheduleReconnect() {
    if (_reconnectAttempts >= _maxReconnectAttempts) {
      debugPrint('[Socket] Max reconnect attempts reached — giving up');
      _setStatus(SocketStatus.disconnected);
      return;
    }

    _reconnectAttempts++;
    // Exponential backoff: 1s, 2s, 4s, 8s … capped at 30s
    final delayMs =
        (_baseDelayMs * (1 << (_reconnectAttempts - 1))).clamp(0, 30000);

    _setStatus(SocketStatus.reconnecting);
    debugPrint(
        '[Socket] Reconnect attempt $_reconnectAttempts in ${delayMs}ms');

    Future.delayed(Duration(milliseconds: delayMs), () {
      if (_status == SocketStatus.reconnecting && _currentMatchId != null) {
        connect(_currentMatchId!);
      }
    });
  }
}
