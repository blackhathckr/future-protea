import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/color_palettes.dart';
import '../theme/color_utils.dart';
import '../theme/theme_depth.dart';

enum ColorThemeMode { palette, custom }

class ColorThemeProvider extends ChangeNotifier {
  static const _modeKey = 'cvp_theme_mode';
  static const _paletteKey = 'cvp_palette';
  static const _customColorKey = 'cvp_custom_color';
  static const _depthKey = 'cvp_theme_depth';

  ColorThemeMode _mode = ColorThemeMode.palette;
  String _paletteId = kDefaultPaletteId;
  Color? _customColor;
  ThemeDepth _depth = kDefaultThemeDepth;
  SharedPreferences? _prefs;
  bool _loaded = false;

  ColorThemeMode get mode => _mode;
  String get paletteId => _paletteId;
  Color? get customColor => _customColor;
  ThemeDepth get depth => _depth;
  bool get isLoaded => _loaded;

  bool get isDefault =>
      _mode == ColorThemeMode.palette &&
      _paletteId == kDefaultPaletteId &&
      _depth == kDefaultThemeDepth;

  ColorPalette get palette => paletteById(_paletteId) ?? defaultPalette;

  ColorThemeProvider() {
    _load();
  }

  Future<void> _load() async {
    _prefs = await SharedPreferences.getInstance();

    final savedMode = _prefs!.getString(_modeKey);
    if (savedMode == 'custom') _mode = ColorThemeMode.custom;

    final savedPalette = _prefs!.getString(_paletteKey);
    if (savedPalette != null && paletteById(savedPalette) != null) {
      _paletteId = savedPalette;
    }

    final savedColor = _prefs!.getString(_customColorKey);
    if (savedColor != null && isValidHex(savedColor)) {
      _customColor = hexToColor(savedColor);
    }

    final savedDepth = _prefs!.getString(_depthKey);
    if (savedDepth != null) {
      _depth = themeDepthFromId(savedDepth);
    }

    _loaded = true;
    notifyListeners();
  }

  /// Resolves the effective palette colors for a given brightness, accounting
  /// for whether the user is on a named palette or a custom-color theme.
  PaletteColors resolvedColors(Brightness brightness) {
    if (_mode == ColorThemeMode.custom && _customColor != null) {
      return buildCustomPaletteColors(_customColor!, brightness);
    }
    return palette.colorsFor(brightness);
  }

  void setPalette(String id) {
    if (paletteById(id) == null) return;
    _mode = ColorThemeMode.palette;
    _paletteId = id;
    notifyListeners();
    _prefs?.setString(_modeKey, 'palette');
    _prefs?.setString(_paletteKey, id);
  }

  void setCustomColor(Color color) {
    _mode = ColorThemeMode.custom;
    _customColor = color;
    notifyListeners();
    _prefs?.setString(_modeKey, 'custom');
    _prefs?.setString(_customColorKey, colorToHex(color));
  }

  void setDepth(ThemeDepth depth) {
    if (_depth == depth) return;
    _depth = depth;
    notifyListeners();
    _prefs?.setString(_depthKey, depth.id);
  }

  void resetToDefault() {
    _mode = ColorThemeMode.palette;
    _paletteId = kDefaultPaletteId;
    _customColor = null;
    _depth = kDefaultThemeDepth;
    notifyListeners();
    _prefs?.remove(_modeKey);
    _prefs?.remove(_paletteKey);
    _prefs?.remove(_customColorKey);
    _prefs?.remove(_depthKey);
  }
}
