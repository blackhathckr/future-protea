import 'dart:math' as math;
import 'package:flutter/material.dart';

class Oklch {
  final double l;
  final double c;
  final double h;
  const Oklch(this.l, this.c, this.h);

  static Oklch? parse(String oklchString) {
    final match = RegExp(r'oklch\(\s*([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\s*\)')
        .firstMatch(oklchString);
    if (match == null) return null;
    return Oklch(
      double.parse(match.group(1)!),
      double.parse(match.group(2)!),
      double.parse(match.group(3)!),
    );
  }
}

Color oklchStringToColor(String oklchString) {
  final parsed = Oklch.parse(oklchString);
  if (parsed == null) return const Color(0xFFF47A2E);
  return oklchToColor(parsed);
}

Color oklchToColor(Oklch oklch) {
  final hRad = oklch.h * math.pi / 180.0;
  final a = oklch.c * math.cos(hRad);
  final b = oklch.c * math.sin(hRad);

  final lStar = oklch.l + 0.3963377774 * a + 0.2158037573 * b;
  final mStar = oklch.l - 0.1055613458 * a - 0.0638541728 * b;
  final sStar = oklch.l - 0.0894841775 * a - 1.2914855480 * b;

  final lLms = lStar * lStar * lStar;
  final mLms = mStar * mStar * mStar;
  final sLms = sStar * sStar * sStar;

  final lr = 4.0767416621 * lLms - 3.3077115913 * mLms + 0.2309699292 * sLms;
  final lg = -1.2684380046 * lLms + 2.6097574011 * mLms - 0.3413193965 * sLms;
  final lb = -0.0041960863 * lLms - 0.7034186147 * mLms + 1.7076147010 * sLms;

  double toSrgb(double v) {
    final clamped = v.clamp(0.0, 1.0);
    final encoded = clamped <= 0.0031308
        ? clamped * 12.92
        : 1.055 * math.pow(clamped, 1.0 / 2.4) - 0.055;
    return encoded;
  }

  final r = (toSrgb(lr) * 255).round().clamp(0, 255);
  final g = (toSrgb(lg) * 255).round().clamp(0, 255);
  final bb = (toSrgb(lb) * 255).round().clamp(0, 255);
  return Color.fromARGB(255, r, g, bb);
}

Oklch colorToOklch(Color color) {
  double toLinear(double v) {
    final n = v / 255.0;
    return n <= 0.04045 ? n / 12.92 : math.pow((n + 0.055) / 1.055, 2.4).toDouble();
  }

  final r = toLinear(color.r * 255);
  final g = toLinear(color.g * 255);
  final b = toLinear(color.b * 255);

  final l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  final m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  final s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  final lStar = _cbrt(l);
  final mStar = _cbrt(m);
  final sStar = _cbrt(s);

  final ll = 0.2104542553 * lStar + 0.7936177850 * mStar - 0.0040720468 * sStar;
  final aa = 1.9779984951 * lStar - 2.4285922050 * mStar + 0.4505937099 * sStar;
  final bb = 0.0259040371 * lStar + 0.7827717662 * mStar - 0.8086757660 * sStar;

  final cc = math.sqrt(aa * aa + bb * bb);
  var hh = math.atan2(bb, aa) * 180 / math.pi;
  if (hh < 0) hh += 360;
  return Oklch(ll, cc, hh);
}

double _cbrt(double x) =>
    x < 0 ? -math.pow(-x, 1.0 / 3.0).toDouble() : math.pow(x, 1.0 / 3.0).toDouble();

bool isValidHex(String value) =>
    RegExp(r'^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$').hasMatch(value);

Color? hexToColor(String hex) {
  var v = hex.trim();
  if (v.startsWith('#')) v = v.substring(1);
  if (v.length == 3) {
    v = v.split('').map((c) => '$c$c').join();
  }
  if (v.length != 6) return null;
  final intVal = int.tryParse(v, radix: 16);
  if (intVal == null) return null;
  return Color(0xFF000000 | intVal);
}

String colorToHex(Color color) {
  final r = (color.r * 255).round().toRadixString(16).padLeft(2, '0');
  final g = (color.g * 255).round().toRadixString(16).padLeft(2, '0');
  final b = (color.b * 255).round().toRadixString(16).padLeft(2, '0');
  return '#$r$g$b'.toUpperCase();
}

Color contrastingForeground(Color background) {
  double toLinear(double v) {
    final n = v / 255.0;
    return n <= 0.03928 ? n / 12.92 : math.pow((n + 0.055) / 1.055, 2.4).toDouble();
  }

  final r = toLinear(background.r * 255);
  final g = toLinear(background.g * 255);
  final b = toLinear(background.b * 255);
  final luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.179 ? const Color(0xFF111418) : Colors.white;
}

Color shiftLightness(Color color, double delta) {
  final ok = colorToOklch(color);
  final newL = (ok.l + delta).clamp(0.0, 1.0);
  return oklchToColor(Oklch(newL, ok.c, ok.h));
}

Color rotateHue(Color color, double degrees) {
  final ok = colorToOklch(color);
  final newH = (ok.h + degrees) % 360;
  return oklchToColor(Oklch(ok.l, ok.c, newH));
}

class ColorPreset {
  final String name;
  final Color value;
  const ColorPreset(this.name, this.value);
}

const colorPresets = <ColorPreset>[
  ColorPreset('Orange', Color(0xFFF47A2E)),
  ColorPreset('Violet', Color(0xFF7C3AED)),
  ColorPreset('Blue', Color(0xFF3B82F6)),
  ColorPreset('Cyan', Color(0xFF06B6D4)),
  ColorPreset('Emerald', Color(0xFF10B981)),
  ColorPreset('Rose', Color(0xFFE11D48)),
];
