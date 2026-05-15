import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/font_configs.dart';

class FontProvider extends ChangeNotifier {
  static const _key = 'app_font_id';

  String _fontId = kDefaultFontId;
  SharedPreferences? _prefs;
  bool _loaded = false;

  String get fontId => _fontId;
  bool get isDefault => _fontId == kDefaultFontId;
  FontConfig get font => fontById(_fontId) ?? defaultFont;
  bool get isLoaded => _loaded;

  FontProvider() {
    _load();
  }

  Future<void> _load() async {
    _prefs = await SharedPreferences.getInstance();
    final saved = _prefs!.getString(_key);
    if (saved != null && fontById(saved) != null) {
      _fontId = saved;
    }
    _loaded = true;
    notifyListeners();
  }

  void setFont(String id) {
    if (fontById(id) == null) return;
    if (id == _fontId) return;
    _fontId = id;
    notifyListeners();
    _prefs?.setString(_key, id);
  }

  void resetFont() {
    if (_fontId == kDefaultFontId) return;
    _fontId = kDefaultFontId;
    notifyListeners();
    _prefs?.remove(_key);
  }
}
