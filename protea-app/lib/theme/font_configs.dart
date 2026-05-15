import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

enum FontCategory { sans, mono, system }

class FontConfig {
  final String id;
  final String name;
  final FontCategory category;
  final String description;
  final TextTheme Function(TextTheme base) textThemeBuilder;

  const FontConfig({
    required this.id,
    required this.name,
    required this.category,
    required this.description,
    required this.textThemeBuilder,
  });
}

final List<FontConfig> fontConfigs = [
  FontConfig(
    id: 'inter',
    name: 'Inter',
    category: FontCategory.sans,
    description: 'Clean, modern UI font',
    textThemeBuilder: GoogleFonts.interTextTheme,
  ),
  FontConfig(
    id: 'manrope',
    name: 'Manrope',
    category: FontCategory.sans,
    description: 'Geometric, contemporary',
    textThemeBuilder: GoogleFonts.manropeTextTheme,
  ),
  FontConfig(
    id: 'ibm-plex-sans',
    name: 'IBM Plex Sans',
    category: FontCategory.sans,
    description: 'Scholarly, documentation',
    textThemeBuilder: GoogleFonts.ibmPlexSansTextTheme,
  ),
  FontConfig(
    id: 'source-sans',
    name: 'Source Sans 3',
    category: FontCategory.sans,
    description: 'Adobe, research-ready',
    textThemeBuilder: GoogleFonts.sourceSans3TextTheme,
  ),
  FontConfig(
    id: 'plus-jakarta',
    name: 'Plus Jakarta Sans',
    category: FontCategory.sans,
    description: 'Trendy, geometric',
    textThemeBuilder: GoogleFonts.plusJakartaSansTextTheme,
  ),
  FontConfig(
    id: 'dm-sans',
    name: 'DM Sans',
    category: FontCategory.sans,
    description: 'Minimal, elegant',
    textThemeBuilder: GoogleFonts.dmSansTextTheme,
  ),
  FontConfig(
    id: 'outfit',
    name: 'Outfit',
    category: FontCategory.sans,
    description: 'Fresh, modern',
    textThemeBuilder: GoogleFonts.outfitTextTheme,
  ),
  FontConfig(
    id: 'lato',
    name: 'Lato',
    category: FontCategory.sans,
    description: 'Warm, professional',
    textThemeBuilder: GoogleFonts.latoTextTheme,
  ),
  FontConfig(
    id: 'montserrat',
    name: 'Montserrat',
    category: FontCategory.sans,
    description: 'Classic, versatile',
    textThemeBuilder: GoogleFonts.montserratTextTheme,
  ),
  FontConfig(
    id: 'space-grotesk',
    name: 'Space Grotesk',
    category: FontCategory.sans,
    description: 'Techy, data-friendly',
    textThemeBuilder: GoogleFonts.spaceGroteskTextTheme,
  ),
  FontConfig(
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    category: FontCategory.mono,
    description: 'Code, citations, DOIs',
    textThemeBuilder: GoogleFonts.jetBrainsMonoTextTheme,
  ),
  FontConfig(
    id: 'poppins',
    name: 'Poppins',
    category: FontCategory.sans,
    description: 'Future Protea default',
    textThemeBuilder: GoogleFonts.poppinsTextTheme,
  ),
  FontConfig(
    id: 'system',
    name: 'System',
    category: FontCategory.system,
    description: 'Native OS font',
    textThemeBuilder: _systemTextTheme,
  ),
];

TextTheme _systemTextTheme(TextTheme base) => base;

const String kDefaultFontId = 'poppins';

FontConfig? fontById(String id) {
  for (final f in fontConfigs) {
    if (f.id == id) return f;
  }
  return null;
}

FontConfig get defaultFont => fontById(kDefaultFontId) ?? fontConfigs.first;
