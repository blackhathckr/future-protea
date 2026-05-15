enum ThemeDepth { subtle, soft, vivid, immersive }

extension ThemeDepthX on ThemeDepth {
  String get id {
    switch (this) {
      case ThemeDepth.subtle:
        return 'subtle';
      case ThemeDepth.soft:
        return 'soft';
      case ThemeDepth.vivid:
        return 'vivid';
      case ThemeDepth.immersive:
        return 'immersive';
    }
  }

  String get label {
    switch (this) {
      case ThemeDepth.subtle:
        return 'Subtle';
      case ThemeDepth.soft:
        return 'Soft';
      case ThemeDepth.vivid:
        return 'Vivid';
      case ThemeDepth.immersive:
        return 'Immersive';
    }
  }

  String get description {
    switch (this) {
      case ThemeDepth.subtle:
        return 'Buttons & accents only';
      case ThemeDepth.soft:
        return 'Tinted borders & cards';
      case ThemeDepth.vivid:
        return 'Rich colors throughout';
      case ThemeDepth.immersive:
        return 'Complete transformation';
    }
  }

  /// Mix factor for tinting neutral surfaces (cards, inputs) with the palette
  /// primary. Higher = more visibly tinted.
  double get surfaceTint {
    switch (this) {
      case ThemeDepth.subtle:
        return 0.0;
      case ThemeDepth.soft:
        return 0.04;
      case ThemeDepth.vivid:
        return 0.10;
      case ThemeDepth.immersive:
        return 0.18;
    }
  }

  /// Mix factor for tinting scaffold/app bar surfaces.
  double get scaffoldTint {
    switch (this) {
      case ThemeDepth.subtle:
        return 0.0;
      case ThemeDepth.soft:
        return 0.0;
      case ThemeDepth.vivid:
        return 0.05;
      case ThemeDepth.immersive:
        return 0.14;
    }
  }

  /// Whether the app bar should use the palette primary as its background.
  bool get appBarUsesPrimary => this == ThemeDepth.immersive;
}

const ThemeDepth kDefaultThemeDepth = ThemeDepth.immersive;

ThemeDepth themeDepthFromId(String? id) {
  switch (id) {
    case 'subtle':
      return ThemeDepth.subtle;
    case 'soft':
      return ThemeDepth.soft;
    case 'vivid':
      return ThemeDepth.vivid;
    case 'immersive':
      return ThemeDepth.immersive;
    default:
      return kDefaultThemeDepth;
  }
}
