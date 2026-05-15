import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../theme/app_theme.dart';

class NewsDetailScreen extends StatelessWidget {
  final Map<String, dynamic> article;

  const NewsDetailScreen({super.key, required this.article});

  Future<void> _openExternal(BuildContext context) async {
    final urlString = article['url'] as String?;
    if (urlString == null || urlString.isEmpty) return;
    final uri = Uri.parse(urlString);
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open article in browser')),
      );
    }
  }

  String _formatDate(String? raw) {
    if (raw == null || raw.isEmpty) return '';
    try {
      final dt = DateTime.parse(raw).toLocal();
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      return '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
    } catch (_) {
      return raw.split('T').first;
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = (article['title'] ?? '') as String;
    final description = (article['description'] ?? '') as String;
    final content = (article['content'] ?? '') as String;
    final source = (article['source'] ?? 'News') as String;
    final author = (article['author'] ?? '') as String;
    final publishedAt = (article['published_at'] ?? article['publishedAt']) as String?;
    final image = article['url_to_image'] ?? article['urlToImage'];
    final hasUrl = (article['url'] ?? '').toString().isNotEmpty;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: image != null ? 260 : 120,
            pinned: true,
            backgroundColor: AppTheme.darkGreen,
            foregroundColor: Colors.white,
            iconTheme: const IconThemeData(color: Colors.white),
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  if (image != null)
                    Image.network(
                      image,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        decoration: BoxDecoration(gradient: AppTheme.headerGradient),
                      ),
                    )
                  else
                    Container(decoration: BoxDecoration(gradient: AppTheme.headerGradient)),
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Colors.black87],
                        stops: [0.5, 1.0],
                      ),
                    ),
                  ),
                  Positioned(
                    left: 16,
                    bottom: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.accentGold,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        source.toUpperCase(),
                        style: GoogleFonts.poppins(
                          color: AppTheme.textPrimary,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.poppins(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      height: 1.3,
                      color: AppTheme.tp(context),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Icon(Icons.access_time, size: 14, color: AppTheme.textSecondary),
                      const SizedBox(width: 4),
                      Text(
                        _formatDate(publishedAt),
                        style: TextStyle(fontSize: 12, color: AppTheme.ts(context)),
                      ),
                      if (author.isNotEmpty) ...[
                        const SizedBox(width: 12),
                        Icon(Icons.person_outline, size: 14, color: AppTheme.textSecondary),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            author,
                            style: TextStyle(fontSize: 12, color: AppTheme.ts(context)),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 20),
                  if (description.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryGreen.withOpacity(0.07),
                        borderRadius: BorderRadius.circular(10),
                        border: Border(
                          left: BorderSide(color: AppTheme.primaryGreen, width: 3),
                        ),
                      ),
                      child: Text(
                        description,
                        style: GoogleFonts.poppins(
                          fontSize: 15,
                          fontWeight: FontWeight.w500,
                          height: 1.5,
                          color: AppTheme.tp(context),
                        ),
                      ),
                    ),
                  const SizedBox(height: 18),
                  if (content.isNotEmpty)
                    Text(
                      content.replaceAll(RegExp(r'\[\+\d+ chars\]$'), '').trim(),
                      style: GoogleFonts.poppins(
                        fontSize: 15,
                        height: 1.65,
                        color: AppTheme.tp(context),
                      ),
                    ),
                  if (hasUrl) ...[
                    const SizedBox(height: 24),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceLight(context),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.language, color: AppTheme.primaryGreen),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Read the full article on $source',
                              style: GoogleFonts.poppins(
                                fontSize: 13,
                                color: AppTheme.tp(context),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: hasUrl
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
                child: SizedBox(
                  height: 52,
                  child: ElevatedButton.icon(
                    onPressed: () => _openExternal(context),
                    icon: const Icon(Icons.open_in_new),
                    label: const Text('Open Full Article'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryGreen,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ),
            )
          : null,
    );
  }
}
