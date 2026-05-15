import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'color_utils.dart';

enum PaletteCategory { warm, cool, neutral, vibrant }

extension PaletteCategoryX on PaletteCategory {
  String get label {
    switch (this) {
      case PaletteCategory.warm:
        return 'Warm';
      case PaletteCategory.cool:
        return 'Cool';
      case PaletteCategory.neutral:
        return 'Neutral';
      case PaletteCategory.vibrant:
        return 'Vibrant';
    }
  }
}

class PaletteColors {
  final Color primary;
  final Color primaryForeground;
  final Color accent;
  final Color accentForeground;
  final Color secondary;
  final Color secondaryForeground;
  final Color muted;
  final Color mutedForeground;
  final Color ring;
  final List<Color> chart;

  const PaletteColors({
    required this.primary,
    required this.primaryForeground,
    required this.accent,
    required this.accentForeground,
    required this.secondary,
    required this.secondaryForeground,
    required this.muted,
    required this.mutedForeground,
    required this.ring,
    required this.chart,
  });

  factory PaletteColors.fromOklch({
    required String primary,
    required String primaryForeground,
    required String accent,
    required String accentForeground,
    required String secondary,
    required String secondaryForeground,
    required String muted,
    required String mutedForeground,
    required String ring,
    required List<String> chart,
  }) {
    return PaletteColors(
      primary: oklchStringToColor(primary),
      primaryForeground: oklchStringToColor(primaryForeground),
      accent: oklchStringToColor(accent),
      accentForeground: oklchStringToColor(accentForeground),
      secondary: oklchStringToColor(secondary),
      secondaryForeground: oklchStringToColor(secondaryForeground),
      muted: oklchStringToColor(muted),
      mutedForeground: oklchStringToColor(mutedForeground),
      ring: oklchStringToColor(ring),
      chart: chart.map(oklchStringToColor).toList(growable: false),
    );
  }
}

class ColorPalette {
  final String id;
  final String name;
  final String emoji;
  final String description;
  final PaletteCategory category;
  final PaletteColors light;
  final PaletteColors dark;

  const ColorPalette({
    required this.id,
    required this.name,
    required this.emoji,
    required this.description,
    required this.category,
    required this.light,
    required this.dark,
  });

  PaletteColors colorsFor(Brightness brightness) =>
      brightness == Brightness.dark ? dark : light;
}

const String kDefaultPaletteId = 'future-protea';

final List<ColorPalette> colorPalettes = [
  // 0. Future Protea — the original mobile brand (green + gold), DEFAULT.
  // Restored as the reset target so users who don't want customization land
  // back on the original look.
  ColorPalette(
    id: 'future-protea',
    name: 'Future Protea',
    emoji: '🏏',
    description: 'Original brand greens',
    category: PaletteCategory.cool,
    light: PaletteColors(
      primary: Color(0xFF1B5E20),
      primaryForeground: Colors.white,
      accent: Color(0xFFFFD600),
      accentForeground: Color(0xFF212121),
      secondary: Color(0xFFF0F0F0),
      secondaryForeground: Color(0xFF1B5E20),
      muted: Color(0xFFF0F0F0),
      mutedForeground: Color(0xFF757575),
      ring: Color(0xFF2E7D32),
      chart: [
        Color(0xFF1B5E20),
        Color(0xFFFFD600),
        Color(0xFF1565C0),
        Color(0xFFFFA000),
        Color(0xFF4CAF50),
      ],
    ),
    dark: PaletteColors(
      primary: Color(0xFF4CAF50),
      primaryForeground: Color(0xFF0D3B12),
      accent: Color(0xFFFFD600),
      accentForeground: Color(0xFF212121),
      secondary: Color(0xFF1A1A1A),
      secondaryForeground: Color(0xFFE0E0E0),
      muted: Color(0xFF1A1A1A),
      mutedForeground: Color(0xFF9E9E9E),
      ring: Color(0xFF4CAF50),
      chart: [
        Color(0xFF4CAF50),
        Color(0xFFFFD600),
        Color(0xFF42A5F5),
        Color(0xFFFFB74D),
        Color(0xFF81C784),
      ],
    ),
  ),

  ColorPalette(
    id: 'orange',
    name: 'Orange',
    emoji: '🧡',
    description: 'Warm & energetic',
    category: PaletteCategory.warm,
    light: PaletteColors.fromOklch(
      primary: 'oklch(0.70 0.18 45)',
      primaryForeground: 'oklch(1 0 0)',
      accent: 'oklch(0.95 0.04 45)',
      accentForeground: 'oklch(0.58 0.20 40)',
      secondary: 'oklch(0.96 0.005 90)',
      secondaryForeground: 'oklch(0.30 0.02 260)',
      muted: 'oklch(0.96 0.005 90)',
      mutedForeground: 'oklch(0.50 0.02 260)',
      ring: 'oklch(0.70 0.18 45)',
      chart: [
        'oklch(0.70 0.18 45)',
        'oklch(0.65 0.15 250)',
        'oklch(0.72 0.15 145)',
        'oklch(0.75 0.12 320)',
        'oklch(0.80 0.16 80)',
      ],
    ),
    dark: PaletteColors.fromOklch(
      primary: 'oklch(0.72 0.17 45)',
      primaryForeground: 'oklch(0.15 0.01 260)',
      accent: 'oklch(0.26 0.04 45)',
      accentForeground: 'oklch(0.80 0.14 45)',
      secondary: 'oklch(0.24 0.01 260)',
      secondaryForeground: 'oklch(0.96 0.005 90)',
      muted: 'oklch(0.24 0.01 260)',
      mutedForeground: 'oklch(0.65 0.01 90)',
      ring: 'oklch(0.72 0.17 45)',
      chart: [
        'oklch(0.72 0.17 45)',
        'oklch(0.68 0.16 250)',
        'oklch(0.70 0.14 145)',
        'oklch(0.72 0.13 320)',
        'oklch(0.78 0.15 80)',
      ],
    ),
  ),
  ColorPalette(
    id: 'aurora',
    name: 'Aurora',
    emoji: '✨',
    description: 'Magical & Futuristic',
    category: PaletteCategory.vibrant,
    light: PaletteColors.fromOklch(
      primary: 'oklch(0.541 0.281 293.009)',
      primaryForeground: 'oklch(0.984 0.003 247.858)',
      accent: 'oklch(0.685 0.169 195.769)',
      accentForeground: 'oklch(0.984 0.003 247.858)',
      secondary: 'oklch(0.951 0.026 293.009)',
      secondaryForeground: 'oklch(0.541 0.281 293.009)',
      muted: 'oklch(0.951 0.026 293.009)',
      mutedForeground: 'oklch(0.552 0.016 286.375)',
      ring: 'oklch(0.641 0.281 293.009)',
      chart: [
        'oklch(0.541 0.281 293.009)',
        'oklch(0.685 0.169 195.769)',
        'oklch(0.656 0.241 354.308)',
        'oklch(0.627 0.265 303.9)',
        'oklch(0.723 0.219 149.579)',
      ],
    ),
    dark: PaletteColors.fromOklch(
      primary: 'oklch(0.746 0.183 293.541)',
      primaryForeground: 'oklch(0.208 0.042 265.755)',
      accent: 'oklch(0.777 0.152 194.769)',
      accentForeground: 'oklch(0.208 0.042 265.755)',
      secondary: 'oklch(0.279 0.041 293.009)',
      secondaryForeground: 'oklch(0.984 0.003 247.858)',
      muted: 'oklch(0.279 0.041 293.009)',
      mutedForeground: 'oklch(0.704 0.04 293.009)',
      ring: 'oklch(0.746 0.183 293.541)',
      chart: [
        'oklch(0.746 0.183 293.541)',
        'oklch(0.777 0.152 194.769)',
        'oklch(0.756 0.177 354.308)',
        'oklch(0.727 0.183 303.9)',
        'oklch(0.823 0.159 149.579)',
      ],
    ),
  ),
  ColorPalette(
    id: 'ember',
    name: 'Ember',
    emoji: '🔥',
    description: 'Warm & Bold',
    category: PaletteCategory.warm,
    light: PaletteColors.fromOklch(
      primary: 'oklch(0.577 0.245 27.325)',
      primaryForeground: 'oklch(0.984 0.003 247.858)',
      accent: 'oklch(0.769 0.188 70.08)',
      accentForeground: 'oklch(0.208 0.042 265.755)',
      secondary: 'oklch(0.951 0.026 27.325)',
      secondaryForeground: 'oklch(0.577 0.245 27.325)',
      muted: 'oklch(0.951 0.026 27.325)',
      mutedForeground: 'oklch(0.552 0.016 27.325)',
      ring: 'oklch(0.677 0.245 27.325)',
      chart: [
        'oklch(0.577 0.245 27.325)',
        'oklch(0.769 0.188 70.08)',
        'oklch(0.695 0.217 50.745)',
        'oklch(0.476 0.114 37.568)',
        'oklch(0.627 0.258 27.325)',
      ],
    ),
    dark: PaletteColors.fromOklch(
      primary: 'oklch(0.704 0.191 22.216)',
      primaryForeground: 'oklch(0.208 0.042 265.755)',
      accent: 'oklch(0.828 0.189 84.429)',
      accentForeground: 'oklch(0.208 0.042 265.755)',
      secondary: 'oklch(0.279 0.041 27.325)',
      secondaryForeground: 'oklch(0.984 0.003 247.858)',
      muted: 'oklch(0.279 0.041 27.325)',
      mutedForeground: 'oklch(0.704 0.04 27.325)',
      ring: 'oklch(0.704 0.191 22.216)',
      chart: [
        'oklch(0.704 0.191 22.216)',
        'oklch(0.828 0.189 84.429)',
        'oklch(0.795 0.177 50.745)',
        'oklch(0.676 0.114 37.568)',
        'oklch(0.727 0.198 27.325)',
      ],
    ),
  ),
  ColorPalette(
    id: 'glacier',
    name: 'Glacier',
    emoji: '🧊',
    description: 'Clean & Fresh',
    category: PaletteCategory.cool,
    light: PaletteColors.fromOklch(
      primary: 'oklch(0.606 0.166 254.604)',
      primaryForeground: 'oklch(0.984 0.003 247.858)',
      accent: 'oklch(0.929 0.013 255.508)',
      accentForeground: 'oklch(0.208 0.042 265.755)',
      secondary: 'oklch(0.951 0.026 254.604)',
      secondaryForeground: 'oklch(0.606 0.166 254.604)',
      muted: 'oklch(0.951 0.026 254.604)',
      mutedForeground: 'oklch(0.552 0.016 254.604)',
      ring: 'oklch(0.706 0.166 254.604)',
      chart: [
        'oklch(0.606 0.166 254.604)',
        'oklch(0.685 0.169 195.769)',
        'oklch(0.541 0.158 254.604)',
        'oklch(0.777 0.152 194.769)',
        'oklch(0.648 0.182 244.604)',
      ],
    ),
    dark: PaletteColors.fromOklch(
      primary: 'oklch(0.746 0.160 237.323)',
      primaryForeground: 'oklch(0.208 0.042 265.755)',
      accent: 'oklch(0.809 0.105 230.318)',
      accentForeground: 'oklch(0.208 0.042 265.755)',
      secondary: 'oklch(0.279 0.041 254.604)',
      secondaryForeground: 'oklch(0.984 0.003 247.858)',
      muted: 'oklch(0.279 0.041 254.604)',
      mutedForeground: 'oklch(0.704 0.04 254.604)',
      ring: 'oklch(0.746 0.160 237.323)',
      chart: [
        'oklch(0.746 0.160 237.323)',
        'oklch(0.777 0.152 194.769)',
        'oklch(0.641 0.158 254.604)',
        'oklch(0.877 0.102 194.769)',
        'oklch(0.748 0.142 244.604)',
      ],
    ),
  ),
  ColorPalette(
    id: 'sakura',
    name: 'Sakura',
    emoji: '🌸',
    description: 'Elegant & Soft',
    category: PaletteCategory.warm,
    light: PaletteColors.fromOklch(
      primary: 'oklch(0.597 0.237 354.308)',
      primaryForeground: 'oklch(0.984 0.003 247.858)',
      accent: 'oklch(0.948 0.044 352.308)',
      accentForeground: 'oklch(0.208 0.042 265.755)',
      secondary: 'oklch(0.951 0.026 354.308)',
      secondaryForeground: 'oklch(0.597 0.237 354.308)',
      muted: 'oklch(0.951 0.026 354.308)',
      mutedForeground: 'oklch(0.552 0.016 354.308)',
      ring: 'oklch(0.697 0.237 354.308)',
      chart: [
        'oklch(0.597 0.237 354.308)',
        'oklch(0.648 0.249 349.705)',
        'oklch(0.723 0.219 149.579)',
        'oklch(0.746 0.177 354.308)',
        'oklch(0.541 0.281 293.009)',
      ],
    ),
    dark: PaletteColors.fromOklch(
      primary: 'oklch(0.756 0.177 354.308)',
      primaryForeground: 'oklch(0.208 0.042 265.755)',
      accent: 'oklch(0.898 0.082 352.308)',
      accentForeground: 'oklch(0.208 0.042 265.755)',
      secondary: 'oklch(0.279 0.041 354.308)',
      secondaryForeground: 'oklch(0.984 0.003 247.858)',
      muted: 'oklch(0.279 0.041 354.308)',
      mutedForeground: 'oklch(0.704 0.04 354.308)',
      ring: 'oklch(0.756 0.177 354.308)',
      chart: [
        'oklch(0.756 0.177 354.308)',
        'oklch(0.748 0.189 349.705)',
        'oklch(0.823 0.159 149.579)',
        'oklch(0.846 0.117 354.308)',
        'oklch(0.641 0.221 293.009)',
      ],
    ),
  ),
  ColorPalette(
    id: 'obsidian',
    name: 'Obsidian',
    emoji: '🖤',
    description: 'Luxurious & Premium',
    category: PaletteCategory.neutral,
    light: PaletteColors.fromOklch(
      primary: 'oklch(0.279 0.041 260.031)',
      primaryForeground: 'oklch(0.984 0.003 247.858)',
      accent: 'oklch(0.695 0.165 85.587)',
      accentForeground: 'oklch(0.208 0.042 265.755)',
      secondary: 'oklch(0.928 0.006 264.695)',
      secondaryForeground: 'oklch(0.279 0.041 260.031)',
      muted: 'oklch(0.928 0.006 264.695)',
      mutedForeground: 'oklch(0.554 0.046 257.417)',
      ring: 'oklch(0.695 0.165 85.587)',
      chart: [
        'oklch(0.279 0.041 260.031)',
        'oklch(0.695 0.165 85.587)',
        'oklch(0.446 0.043 257.417)',
        'oklch(0.769 0.188 70.08)',
        'oklch(0.554 0.046 257.417)',
      ],
    ),
    dark: PaletteColors.fromOklch(
      primary: 'oklch(0.554 0.046 257.417)',
      primaryForeground: 'oklch(0.984 0.003 247.858)',
      accent: 'oklch(0.795 0.184 86.047)',
      accentForeground: 'oklch(0.208 0.042 265.755)',
      secondary: 'oklch(0.279 0.041 260.031)',
      secondaryForeground: 'oklch(0.984 0.003 247.858)',
      muted: 'oklch(0.279 0.041 260.031)',
      mutedForeground: 'oklch(0.704 0.04 256.788)',
      ring: 'oklch(0.795 0.184 86.047)',
      chart: [
        'oklch(0.554 0.046 257.417)',
        'oklch(0.795 0.184 86.047)',
        'oklch(0.646 0.043 257.417)',
        'oklch(0.869 0.148 70.08)',
        'oklch(0.754 0.046 257.417)',
      ],
    ),
  ),
  ColorPalette(
    id: 'jade',
    name: 'Jade',
    emoji: '💎',
    description: 'Wise & Balanced',
    category: PaletteCategory.cool,
    light: PaletteColors.fromOklch(
      primary: 'oklch(0.527 0.154 163.225)',
      primaryForeground: 'oklch(0.984 0.003 247.858)',
      accent: 'oklch(0.695 0.217 50.745)',
      accentForeground: 'oklch(0.984 0.003 247.858)',
      secondary: 'oklch(0.951 0.026 163.225)',
      secondaryForeground: 'oklch(0.527 0.154 163.225)',
      muted: 'oklch(0.951 0.026 163.225)',
      mutedForeground: 'oklch(0.552 0.016 163.225)',
      ring: 'oklch(0.627 0.154 163.225)',
      chart: [
        'oklch(0.527 0.154 163.225)',
        'oklch(0.695 0.217 50.745)',
        'oklch(0.663 0.190 162.945)',
        'oklch(0.769 0.188 70.08)',
        'oklch(0.696 0.17 162.48)',
      ],
    ),
    dark: PaletteColors.fromOklch(
      primary: 'oklch(0.696 0.17 162.48)',
      primaryForeground: 'oklch(0.208 0.042 265.755)',
      accent: 'oklch(0.769 0.188 70.08)',
      accentForeground: 'oklch(0.208 0.042 265.755)',
      secondary: 'oklch(0.279 0.041 163.225)',
      secondaryForeground: 'oklch(0.984 0.003 247.858)',
      muted: 'oklch(0.279 0.041 163.225)',
      mutedForeground: 'oklch(0.704 0.04 163.225)',
      ring: 'oklch(0.696 0.17 162.48)',
      chart: [
        'oklch(0.696 0.17 162.48)',
        'oklch(0.869 0.148 70.08)',
        'oklch(0.763 0.150 162.945)',
        'oklch(0.869 0.148 70.08)',
        'oklch(0.796 0.13 162.48)',
      ],
    ),
  ),
  ColorPalette(
    id: 'dusk',
    name: 'Dusk',
    emoji: '🌅',
    description: 'Dreamy & Creative',
    category: PaletteCategory.vibrant,
    light: PaletteColors.fromOklch(
      primary: 'oklch(0.541 0.281 293.009)',
      primaryForeground: 'oklch(0.984 0.003 247.858)',
      accent: 'oklch(0.716 0.209 41.292)',
      accentForeground: 'oklch(0.984 0.003 247.858)',
      secondary: 'oklch(0.951 0.026 293.009)',
      secondaryForeground: 'oklch(0.541 0.281 293.009)',
      muted: 'oklch(0.951 0.026 293.009)',
      mutedForeground: 'oklch(0.552 0.016 293.009)',
      ring: 'oklch(0.641 0.281 293.009)',
      chart: [
        'oklch(0.541 0.281 293.009)',
        'oklch(0.716 0.209 41.292)',
        'oklch(0.550 0.240 280.321)',
        'oklch(0.769 0.188 70.08)',
        'oklch(0.627 0.265 303.9)',
      ],
    ),
    dark: PaletteColors.fromOklch(
      primary: 'oklch(0.746 0.183 293.541)',
      primaryForeground: 'oklch(0.208 0.042 265.755)',
      accent: 'oklch(0.802 0.174 49.746)',
      accentForeground: 'oklch(0.208 0.042 265.755)',
      secondary: 'oklch(0.279 0.041 293.009)',
      secondaryForeground: 'oklch(0.984 0.003 247.858)',
      muted: 'oklch(0.279 0.041 293.009)',
      mutedForeground: 'oklch(0.704 0.04 293.009)',
      ring: 'oklch(0.746 0.183 293.541)',
      chart: [
        'oklch(0.746 0.183 293.541)',
        'oklch(0.802 0.174 49.746)',
        'oklch(0.650 0.200 280.321)',
        'oklch(0.869 0.148 70.08)',
        'oklch(0.727 0.205 303.9)',
      ],
    ),
  ),
  ColorPalette(
    id: 'copper',
    name: 'Copper',
    emoji: '⚙️',
    description: 'Industrial & Authentic',
    category: PaletteCategory.warm,
    light: PaletteColors.fromOklch(
      primary: 'oklch(0.577 0.195 38.404)',
      primaryForeground: 'oklch(0.984 0.003 247.858)',
      accent: 'oklch(0.553 0.013 257.417)',
      accentForeground: 'oklch(0.984 0.003 247.858)',
      secondary: 'oklch(0.951 0.026 38.404)',
      secondaryForeground: 'oklch(0.577 0.195 38.404)',
      muted: 'oklch(0.951 0.026 38.404)',
      mutedForeground: 'oklch(0.552 0.016 38.404)',
      ring: 'oklch(0.677 0.195 38.404)',
      chart: [
        'oklch(0.577 0.195 38.404)',
        'oklch(0.553 0.013 257.417)',
        'oklch(0.695 0.217 50.745)',
        'oklch(0.653 0.013 257.417)',
        'oklch(0.716 0.209 41.292)',
      ],
    ),
    dark: PaletteColors.fromOklch(
      primary: 'oklch(0.802 0.174 49.746)',
      primaryForeground: 'oklch(0.208 0.042 265.755)',
      accent: 'oklch(0.716 0.013 257.417)',
      accentForeground: 'oklch(0.208 0.042 265.755)',
      secondary: 'oklch(0.279 0.041 38.404)',
      secondaryForeground: 'oklch(0.984 0.003 247.858)',
      muted: 'oklch(0.279 0.041 38.404)',
      mutedForeground: 'oklch(0.704 0.04 38.404)',
      ring: 'oklch(0.802 0.174 49.746)',
      chart: [
        'oklch(0.802 0.174 49.746)',
        'oklch(0.716 0.013 257.417)',
        'oklch(0.795 0.177 50.745)',
        'oklch(0.816 0.013 257.417)',
        'oklch(0.876 0.139 49.746)',
      ],
    ),
  ),
  ColorPalette(
    id: 'mint',
    name: 'Mint',
    emoji: '🌿',
    description: 'Fresh & Natural',
    category: PaletteCategory.cool,
    light: PaletteColors.fromOklch(
      primary: 'oklch(0.585 0.166 163.225)',
      primaryForeground: 'oklch(0.984 0.003 247.858)',
      accent: 'oklch(0.676 0.155 192.456)',
      accentForeground: 'oklch(0.984 0.003 247.858)',
      secondary: 'oklch(0.951 0.026 163.225)',
      secondaryForeground: 'oklch(0.585 0.166 163.225)',
      muted: 'oklch(0.951 0.026 163.225)',
      mutedForeground: 'oklch(0.552 0.016 163.225)',
      ring: 'oklch(0.685 0.166 163.225)',
      chart: [
        'oklch(0.585 0.166 163.225)',
        'oklch(0.676 0.155 192.456)',
        'oklch(0.696 0.17 162.48)',
        'oklch(0.777 0.152 194.769)',
        'oklch(0.763 0.150 162.945)',
      ],
    ),
    dark: PaletteColors.fromOklch(
      primary: 'oklch(0.765 0.166 163.225)',
      primaryForeground: 'oklch(0.208 0.042 265.755)',
      accent: 'oklch(0.809 0.128 192.456)',
      accentForeground: 'oklch(0.208 0.042 265.755)',
      secondary: 'oklch(0.279 0.041 163.225)',
      secondaryForeground: 'oklch(0.984 0.003 247.858)',
      muted: 'oklch(0.279 0.041 163.225)',
      mutedForeground: 'oklch(0.704 0.04 163.225)',
      ring: 'oklch(0.765 0.166 163.225)',
      chart: [
        'oklch(0.765 0.166 163.225)',
        'oklch(0.809 0.128 192.456)',
        'oklch(0.796 0.13 162.48)',
        'oklch(0.877 0.102 194.769)',
        'oklch(0.863 0.110 162.945)',
      ],
    ),
  ),
  ColorPalette(
    id: 'cosmos',
    name: 'Cosmos',
    emoji: '🌌',
    description: 'Mysterious & Tech',
    category: PaletteCategory.vibrant,
    light: PaletteColors.fromOklch(
      primary: 'oklch(0.550 0.240 280.321)',
      primaryForeground: 'oklch(0.984 0.003 247.858)',
      accent: 'oklch(0.541 0.281 293.009)',
      accentForeground: 'oklch(0.984 0.003 247.858)',
      secondary: 'oklch(0.951 0.026 280.321)',
      secondaryForeground: 'oklch(0.550 0.240 280.321)',
      muted: 'oklch(0.951 0.026 280.321)',
      mutedForeground: 'oklch(0.552 0.016 280.321)',
      ring: 'oklch(0.650 0.240 280.321)',
      chart: [
        'oklch(0.550 0.240 280.321)',
        'oklch(0.541 0.281 293.009)',
        'oklch(0.608 0.214 259.815)',
        'oklch(0.627 0.265 303.9)',
        'oklch(0.488 0.243 264.376)',
      ],
    ),
    dark: PaletteColors.fromOklch(
      primary: 'oklch(0.707 0.165 278.321)',
      primaryForeground: 'oklch(0.208 0.042 265.755)',
      accent: 'oklch(0.746 0.183 293.541)',
      accentForeground: 'oklch(0.208 0.042 265.755)',
      secondary: 'oklch(0.279 0.041 280.321)',
      secondaryForeground: 'oklch(0.984 0.003 247.858)',
      muted: 'oklch(0.279 0.041 280.321)',
      mutedForeground: 'oklch(0.704 0.04 280.321)',
      ring: 'oklch(0.707 0.165 278.321)',
      chart: [
        'oklch(0.707 0.165 278.321)',
        'oklch(0.746 0.183 293.541)',
        'oklch(0.708 0.174 259.815)',
        'oklch(0.827 0.165 303.9)',
        'oklch(0.688 0.183 264.376)',
      ],
    ),
  ),
  ColorPalette(
    id: 'sand',
    name: 'Sand',
    emoji: '🏜️',
    description: 'Warm & Timeless',
    category: PaletteCategory.warm,
    light: PaletteColors.fromOklch(
      primary: 'oklch(0.629 0.151 78.604)',
      primaryForeground: 'oklch(0.984 0.003 247.858)',
      accent: 'oklch(0.531 0.126 78.604)',
      accentForeground: 'oklch(0.984 0.003 247.858)',
      secondary: 'oklch(0.951 0.026 78.604)',
      secondaryForeground: 'oklch(0.629 0.151 78.604)',
      muted: 'oklch(0.951 0.026 78.604)',
      mutedForeground: 'oklch(0.552 0.016 78.604)',
      ring: 'oklch(0.729 0.151 78.604)',
      chart: [
        'oklch(0.629 0.151 78.604)',
        'oklch(0.531 0.126 78.604)',
        'oklch(0.695 0.165 85.587)',
        'oklch(0.769 0.188 70.08)',
        'oklch(0.695 0.217 50.745)',
      ],
    ),
    dark: PaletteColors.fromOklch(
      primary: 'oklch(0.828 0.189 84.429)',
      primaryForeground: 'oklch(0.208 0.042 265.755)',
      accent: 'oklch(0.731 0.177 55.746)',
      accentForeground: 'oklch(0.208 0.042 265.755)',
      secondary: 'oklch(0.279 0.041 78.604)',
      secondaryForeground: 'oklch(0.984 0.003 247.858)',
      muted: 'oklch(0.279 0.041 78.604)',
      mutedForeground: 'oklch(0.704 0.04 78.604)',
      ring: 'oklch(0.828 0.189 84.429)',
      chart: [
        'oklch(0.828 0.189 84.429)',
        'oklch(0.731 0.177 55.746)',
        'oklch(0.795 0.135 85.587)',
        'oklch(0.869 0.148 70.08)',
        'oklch(0.795 0.177 50.745)',
      ],
    ),
  ),
  ColorPalette(
    id: 'graphite',
    name: 'Graphite',
    emoji: '✏️',
    description: 'Minimal & Focused',
    category: PaletteCategory.neutral,
    light: PaletteColors.fromOklch(
      primary: 'oklch(0.446 0.043 257.417)',
      primaryForeground: 'oklch(0.984 0.003 247.858)',
      accent: 'oklch(0.554 0.046 257.417)',
      accentForeground: 'oklch(0.984 0.003 247.858)',
      secondary: 'oklch(0.928 0.006 264.695)',
      secondaryForeground: 'oklch(0.446 0.043 257.417)',
      muted: 'oklch(0.928 0.006 264.695)',
      mutedForeground: 'oklch(0.554 0.046 257.417)',
      ring: 'oklch(0.554 0.046 257.417)',
      chart: [
        'oklch(0.446 0.043 257.417)',
        'oklch(0.554 0.046 257.417)',
        'oklch(0.279 0.041 260.031)',
        'oklch(0.646 0.043 257.417)',
        'oklch(0.370 0.043 257.417)',
      ],
    ),
    dark: PaletteColors.fromOklch(
      primary: 'oklch(0.704 0.04 256.788)',
      primaryForeground: 'oklch(0.208 0.042 265.755)',
      accent: 'oklch(0.869 0.022 264.695)',
      accentForeground: 'oklch(0.208 0.042 265.755)',
      secondary: 'oklch(0.279 0.041 260.031)',
      secondaryForeground: 'oklch(0.984 0.003 247.858)',
      muted: 'oklch(0.279 0.041 260.031)',
      mutedForeground: 'oklch(0.704 0.04 256.788)',
      ring: 'oklch(0.704 0.04 256.788)',
      chart: [
        'oklch(0.704 0.04 256.788)',
        'oklch(0.869 0.022 264.695)',
        'oklch(0.479 0.041 260.031)',
        'oklch(0.929 0.013 264.695)',
        'oklch(0.570 0.04 256.788)',
      ],
    ),
  ),
];

ColorPalette? paletteById(String id) {
  for (final p in colorPalettes) {
    if (p.id == id) return p;
  }
  return null;
}

ColorPalette get defaultPalette =>
    paletteById(kDefaultPaletteId) ?? colorPalettes.first;

PaletteColors buildCustomPaletteColors(Color primary, Brightness brightness) {
  final ok = colorToOklch(primary);
  final isDark = brightness == Brightness.dark;

  if (isDark) {
    final lighter = (ok.l + 0.25).clamp(0.0, 0.85);
    final accentHue = (ok.h + 30) % 360;
    return PaletteColors(
      primary: oklchToColor(Oklch(lighter, ok.c, ok.h)),
      primaryForeground: oklchStringToColor('oklch(0.208 0.042 265.755)'),
      secondary: oklchToColor(Oklch(0.279, 0.041, ok.h)),
      secondaryForeground: oklchStringToColor('oklch(0.984 0.003 247.858)'),
      accent: oklchToColor(Oklch(0.75, math.min(ok.c, 0.2), accentHue)),
      accentForeground: oklchStringToColor('oklch(0.208 0.042 265.755)'),
      muted: oklchToColor(Oklch(0.279, 0.041, ok.h)),
      mutedForeground: oklchToColor(Oklch(0.704, 0.04, ok.h)),
      ring: oklchToColor(Oklch((lighter + 0.1).clamp(0.0, 1.0), ok.c, ok.h)),
      chart: _generateChartColors(ok.h, isDark: true),
    );
  } else {
    final accentHue = (ok.h + 30) % 360;
    return PaletteColors(
      primary: primary,
      primaryForeground: contrastingForeground(primary),
      secondary: oklchToColor(Oklch(0.951, 0.026, ok.h)),
      secondaryForeground: primary,
      accent: oklchToColor(Oklch(0.65, math.min(ok.c, 0.2), accentHue)),
      accentForeground: oklchStringToColor('oklch(0.984 0.003 247.858)'),
      muted: oklchToColor(Oklch(0.951, 0.026, ok.h)),
      mutedForeground: oklchToColor(Oklch(0.552, 0.016, ok.h)),
      ring: oklchToColor(Oklch((ok.l + 0.15).clamp(0.0, 0.85), ok.c, ok.h)),
      chart: _generateChartColors(ok.h, isDark: false),
    );
  }
}

List<Color> _generateChartColors(double baseHue, {required bool isDark}) {
  final lightness = isDark ? 0.7 : 0.6;
  final chroma = isDark ? 0.18 : 0.22;
  return [
    oklchToColor(Oklch(lightness, chroma, baseHue)),
    oklchToColor(Oklch(lightness, chroma, (baseHue + 72) % 360)),
    oklchToColor(Oklch(lightness, chroma, (baseHue + 144) % 360)),
    oklchToColor(Oklch(lightness, chroma, (baseHue + 216) % 360)),
    oklchToColor(Oklch(lightness, chroma, (baseHue + 288) % 360)),
  ];
}
