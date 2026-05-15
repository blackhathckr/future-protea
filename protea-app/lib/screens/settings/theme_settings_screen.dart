import 'package:flutter/material.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart' hide colorToHex;
import 'package:provider/provider.dart';
import '../../providers/color_theme_provider.dart';
import '../../providers/font_provider.dart';
import '../../providers/theme_provider.dart';
import '../../theme/app_theme.dart';
import '../../theme/color_palettes.dart';
import '../../theme/color_utils.dart';
import '../../theme/font_configs.dart';
import '../../theme/theme_depth.dart';

class ThemeSettingsScreen extends StatefulWidget {
  const ThemeSettingsScreen({super.key});

  @override
  State<ThemeSettingsScreen> createState() => _ThemeSettingsScreenState();
}

class _ThemeSettingsScreenState extends State<ThemeSettingsScreen> {
  PaletteCategory? _categoryFilter;

  void _confirmRestoreDefault({
    required BuildContext context,
    required ColorThemeProvider colorTheme,
    required FontProvider fontProvider,
  }) {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Restore default'),
        content: const Text(
          'This will restore the original Future Protea theme '
          '(green + gold, Poppins font, immersive depth).',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              colorTheme.resetToDefault();
              fontProvider.resetFont();
              Navigator.pop(ctx);
            },
            child: const Text('Restore'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorTheme = context.watch<ColorThemeProvider>();
    final fontProvider = context.watch<FontProvider>();
    final themeProvider = context.watch<ThemeProvider>();
    final cs = Theme.of(context).colorScheme;
    final isCustomized = !colorTheme.isDefault || !fontProvider.isDefault;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Appearance'),
        actions: [
          if (isCustomized)
            TextButton.icon(
              onPressed: () => _confirmRestoreDefault(
                context: context,
                colorTheme: colorTheme,
                fontProvider: fontProvider,
              ),
              icon: Icon(Icons.restart_alt_rounded, color: cs.onPrimary),
              label: Text(
                'Default',
                style: TextStyle(color: cs.onPrimary),
              ),
            ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          _ModeSection(themeProvider: themeProvider),
          const SizedBox(height: 24),
          _ColorSection(
            colorTheme: colorTheme,
            categoryFilter: _categoryFilter,
            onCategoryChanged: (c) => setState(() => _categoryFilter = c),
          ),
          const SizedBox(height: 24),
          _DepthSection(colorTheme: colorTheme),
          const SizedBox(height: 24),
          _FontSection(fontProvider: fontProvider),
          const SizedBox(height: 24),
          _RestoreDefaultCard(
            isCustomized: isCustomized,
            onRestore: () => _confirmRestoreDefault(
              context: context,
              colorTheme: colorTheme,
              fontProvider: fontProvider,
            ),
          ),
        ],
      ),
    );
  }
}

class _RestoreDefaultCard extends StatelessWidget {
  final bool isCustomized;
  final VoidCallback onRestore;
  const _RestoreDefaultCard({
    required this.isCustomized,
    required this.onRestore,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.divider(context)),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: cs.primary.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(Icons.restart_alt_rounded, color: cs.primary, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Original Future Protea',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                Text(
                  isCustomized
                      ? 'Restore the green + gold brand theme'
                      : 'You\'re on the original theme',
                  style: TextStyle(
                    fontSize: 12,
                    color: cs.onSurface.withValues(alpha: 0.6),
                  ),
                ),
              ],
            ),
          ),
          if (isCustomized)
            OutlinedButton(
              onPressed: onRestore,
              style: OutlinedButton.styleFrom(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                minimumSize: const Size(0, 32),
              ),
              child: const Text('Restore'),
            )
          else
            Icon(Icons.check_circle_rounded, color: cs.primary),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

class _SectionHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  const _SectionHeader({required this.title, this.subtitle});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: AppTheme.tp(context),
              ),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 4),
          Text(
            subtitle!,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: cs.onSurface.withValues(alpha: 0.6),
                ),
          ),
        ],
        const SizedBox(height: 12),
      ],
    );
  }
}

class _ModeSection extends StatelessWidget {
  final ThemeProvider themeProvider;
  const _ModeSection({required this.themeProvider});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const _SectionHeader(title: 'Mode', subtitle: 'Light or dark surfaces'),
        Container(
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.divider(context)),
          ),
          padding: const EdgeInsets.all(4),
          child: Row(
            children: [
              _ModeChip(
                icon: Icons.light_mode_rounded,
                label: 'Light',
                selected: !themeProvider.isDark,
                onTap: () {
                  if (themeProvider.isDark) themeProvider.toggle();
                },
              ),
              _ModeChip(
                icon: Icons.dark_mode_rounded,
                label: 'Dark',
                selected: themeProvider.isDark,
                onTap: () {
                  if (!themeProvider.isDark) themeProvider.toggle();
                },
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ModeChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _ModeChip({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: selected ? cs.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          alignment: Alignment.center,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 18,
                color: selected ? cs.onPrimary : cs.onSurface,
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: selected ? cs.onPrimary : cs.onSurface,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ColorSection extends StatelessWidget {
  final ColorThemeProvider colorTheme;
  final PaletteCategory? categoryFilter;
  final ValueChanged<PaletteCategory?> onCategoryChanged;
  const _ColorSection({
    required this.colorTheme,
    required this.categoryFilter,
    required this.onCategoryChanged,
  });

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    final filtered = categoryFilter == null
        ? colorPalettes
        : colorPalettes.where((p) => p.category == categoryFilter).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const _SectionHeader(
          title: 'Color',
          subtitle: 'Pick a preset palette or a custom color',
        ),

        // Category filter
        SizedBox(
          height: 36,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              _CategoryChip(
                label: 'All',
                selected: categoryFilter == null,
                onTap: () => onCategoryChanged(null),
              ),
              for (final c in PaletteCategory.values)
                _CategoryChip(
                  label: c.label,
                  selected: categoryFilter == c,
                  onTap: () => onCategoryChanged(c),
                ),
            ],
          ),
        ),

        const SizedBox(height: 12),

        // Palette grid
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            childAspectRatio: 1.05,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
          ),
          itemCount: filtered.length,
          itemBuilder: (context, i) {
            final p = filtered[i];
            final selected = colorTheme.mode == ColorThemeMode.palette &&
                colorTheme.paletteId == p.id;
            return _PaletteTile(
              palette: p,
              brightness: brightness,
              selected: selected,
              onTap: () => colorTheme.setPalette(p.id),
            );
          },
        ),

        const SizedBox(height: 16),

        // Custom color row
        _CustomColorTile(colorTheme: colorTheme),
      ],
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _CategoryChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: selected ? cs.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: selected ? cs.primary : AppTheme.divider(context),
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 13,
              color: selected ? cs.onPrimary : cs.onSurface,
            ),
          ),
        ),
      ),
    );
  }
}

class _PaletteTile extends StatelessWidget {
  final ColorPalette palette;
  final Brightness brightness;
  final bool selected;
  final VoidCallback onTap;
  const _PaletteTile({
    required this.palette,
    required this.brightness,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final colors = palette.colorsFor(brightness);
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? cs.primary : AppTheme.divider(context),
            width: selected ? 2 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _swatch(colors.primary),
                const SizedBox(width: 4),
                _swatch(colors.accent),
                const SizedBox(width: 4),
                _swatch(colors.secondary),
                const Spacer(),
                if (selected)
                  Icon(Icons.check_circle_rounded, size: 18, color: cs.primary),
              ],
            ),
            const Spacer(),
            Row(
              children: [
                Text(palette.emoji, style: const TextStyle(fontSize: 14)),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    palette.name,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            Text(
              palette.description,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 10,
                color: cs.onSurface.withValues(alpha: 0.6),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _swatch(Color c) => Container(
        width: 14,
        height: 14,
        decoration: BoxDecoration(
          color: c,
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: Colors.black12),
        ),
      );
}

class _CustomColorTile extends StatelessWidget {
  final ColorThemeProvider colorTheme;
  const _CustomColorTile({required this.colorTheme});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final selected = colorTheme.mode == ColorThemeMode.custom;
    final color = colorTheme.customColor ?? cs.primary;

    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: selected ? cs.primary : AppTheme.divider(context),
          width: selected ? 2 : 1,
        ),
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: Colors.black12),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Custom color',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                    Text(
                      selected
                          ? colorToHex(color)
                          : 'Pick any color from a wheel or hex',
                      style: TextStyle(
                        fontSize: 12,
                        color: cs.onSurface.withValues(alpha: 0.6),
                      ),
                    ),
                  ],
                ),
              ),
              if (selected)
                Icon(Icons.check_circle_rounded, color: cs.primary),
            ],
          ),
          const SizedBox(height: 12),
          // Presets row
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (final preset in colorPresets) ...[
                  GestureDetector(
                    onTap: () => colorTheme.setCustomColor(preset.value),
                    child: Container(
                      width: 32,
                      height: 32,
                      margin: const EdgeInsets.only(right: 8),
                      decoration: BoxDecoration(
                        color: preset.value,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.black12),
                      ),
                    ),
                  ),
                ],
                OutlinedButton.icon(
                  onPressed: () => _showPicker(context),
                  icon: const Icon(Icons.colorize_rounded, size: 16),
                  label: const Text('Pick'),
                  style: OutlinedButton.styleFrom(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    minimumSize: const Size(0, 32),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showPicker(BuildContext context) {
    Color picked = colorTheme.customColor ?? Theme.of(context).colorScheme.primary;
    showDialog<void>(
      context: context,
      builder: (dialogCtx) {
        return AlertDialog(
          title: const Text('Pick a color'),
          content: SingleChildScrollView(
            child: ColorPicker(
              pickerColor: picked,
              onColorChanged: (c) => picked = c,
              enableAlpha: false,
              labelTypes: const [],
              pickerAreaHeightPercent: 0.6,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogCtx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                colorTheme.setCustomColor(picked);
                Navigator.pop(dialogCtx);
              },
              child: const Text('Apply'),
            ),
          ],
        );
      },
    );
  }
}

class _DepthSection extends StatelessWidget {
  final ColorThemeProvider colorTheme;
  const _DepthSection({required this.colorTheme});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const _SectionHeader(
          title: 'Depth',
          subtitle: 'How much of the UI is tinted by the palette',
        ),
        for (final d in ThemeDepth.values)
          GestureDetector(
            onTap: () => colorTheme.setDepth(d),
            child: Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: cs.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: colorTheme.depth == d
                      ? cs.primary
                      : AppTheme.divider(context),
                  width: colorTheme.depth == d ? 2 : 1,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    colorTheme.depth == d
                        ? Icons.radio_button_checked_rounded
                        : Icons.radio_button_unchecked_rounded,
                    color: colorTheme.depth == d ? cs.primary : cs.onSurface,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          d.label,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                        Text(
                          d.description,
                          style: TextStyle(
                            fontSize: 12,
                            color: cs.onSurface.withValues(alpha: 0.6),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _FontSection extends StatelessWidget {
  final FontProvider fontProvider;
  const _FontSection({required this.fontProvider});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const _SectionHeader(
          title: 'Font',
          subtitle: 'Typeface used across the app',
        ),
        for (final f in fontConfigs)
          GestureDetector(
            onTap: () => fontProvider.setFont(f.id),
            child: Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: cs.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: fontProvider.fontId == f.id
                      ? cs.primary
                      : AppTheme.divider(context),
                  width: fontProvider.fontId == f.id ? 2 : 1,
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          f.name,
                          style: _previewStyle(f).copyWith(
                            fontWeight: FontWeight.w700,
                            fontSize: 15,
                          ),
                        ),
                        Text(
                          f.description,
                          style: TextStyle(
                            fontSize: 11,
                            color: cs.onSurface.withValues(alpha: 0.6),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (fontProvider.fontId == f.id)
                    Icon(Icons.check_circle_rounded,
                        color: cs.primary, size: 20),
                ],
              ),
            ),
          ),
      ],
    );
  }

  TextStyle _previewStyle(FontConfig f) {
    // Build a small preview using the font's text theme so the name itself
    // renders in the font.
    final base = const TextTheme(
      bodyLarge: TextStyle(fontSize: 15),
    );
    return f.textThemeBuilder(base).bodyLarge ?? const TextStyle();
  }
}
