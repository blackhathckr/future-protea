import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';

class ProteaHeader extends StatelessWidget {
  final double height;
  final bool showLogo;

  const ProteaHeader({super.key, this.height = 200, this.showLogo = true});

  @override
  Widget build(BuildContext context) {
    final statusBarHeight = MediaQuery.of(context).padding.top;
    // Green area height (not including logo overflow)
    final greenHeight = height * 0.65 + statusBarHeight;
    // Total widget height = green + gold curve + logo overflow into white area
    final totalHeight = height + statusBarHeight;

    return SizedBox(
      height: totalHeight,
      width: double.infinity,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // 1. Green gradient background
          Container(
            height: greenHeight,
            decoration: const BoxDecoration(gradient: AppTheme.headerGradient),
          ),
          // 2. Gold curve - sits at the boundary between green and white
          Positioned(
            top: greenHeight - 20,
            left: 0,
            right: 0,
            child: CustomPaint(
              size: Size(MediaQuery.of(context).size.width, 32),
              painter: _GoldCurvePainter(
                fillColor: Theme.of(context).scaffoldBackgroundColor,
              ),
            ),
          ),
          // 3. Logo - centered, overlapping BOTH green and white areas
          //    Sits ON TOP of the gold curve (higher z-index)
          if (showLogo)
            Positioned(
              top: statusBarHeight,
              left: 0,
              right: 0,
              child: Center(
                child: ProteaLogo(size: height * 0.95),
              ),
            ),
        ],
      ),
    );
  }
}

class _GoldCurvePainter extends CustomPainter {
  final Color fillColor;
  _GoldCurvePainter({required this.fillColor});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFFFFD600), Color(0xFFFFA000), Color(0xFFFFD600)],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    final path = Path();
    path.moveTo(0, size.height * 0.6);
    path.quadraticBezierTo(size.width / 2, 0, size.width, size.height * 0.6);
    path.lineTo(size.width, size.height);
    path.lineTo(0, size.height);
    path.close();

    canvas.drawPath(path, paint);

    // Fill below the curve matches scaffold background
    final bgPaint = Paint()..color = fillColor;
    final bgPath = Path();
    bgPath.moveTo(0, size.height * 0.8);
    bgPath.quadraticBezierTo(size.width / 2, size.height * 0.2, size.width, size.height * 0.8);
    bgPath.lineTo(size.width, size.height);
    bgPath.lineTo(0, size.height);
    bgPath.close();

    canvas.drawPath(bgPath, bgPaint);
  }

  @override
  bool shouldRepaint(covariant _GoldCurvePainter oldDelegate) => oldDelegate.fillColor != fillColor;
}

/// Shared image provider - decoded once, reused across all headers
const _logoImage = AssetImage('assets/images/Future_Protea_Logo.png');

class ProteaLogo extends StatelessWidget {
  final double size;

  const ProteaLogo({super.key, this.size = 120});

  @override
  Widget build(BuildContext context) {
    return Image(
      image: _logoImage,
      height: size,
      fit: BoxFit.contain,
      gaplessPlayback: true,
      errorBuilder: (context, error, stackTrace) => _FallbackLogo(size: size),
    );
  }
}

class _FallbackLogo extends StatelessWidget {
  final double size;
  const _FallbackLogo({required this.size});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size * 0.5,
          height: size * 0.5,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const RadialGradient(
              colors: [Color(0xFF4CAF50), Color(0xFF1B5E20)],
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.3),
                blurRadius: 10,
                spreadRadius: 2,
              ),
            ],
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              Icon(Icons.sports_cricket, size: size * 0.25, color: Colors.white),
              Positioned(
                right: size * 0.06,
                top: size * 0.06,
                child: Container(
                  width: size * 0.1,
                  height: size * 0.1,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Color(0xFFFFD600),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'FUTURE',
          style: GoogleFonts.poppins(
            fontSize: size * 0.12,
            fontWeight: FontWeight.w900,
            color: Colors.white,
            letterSpacing: 2,
            height: 1,
          ),
        ),
        Text(
          'PROTEA',
          style: GoogleFonts.poppins(
            fontSize: size * 0.14,
            fontWeight: FontWeight.w900,
            color: const Color(0xFFFFD600),
            letterSpacing: 3,
            height: 1,
          ),
        ),
        Text(
          'LOG EVERY BALL',
          style: GoogleFonts.poppins(
            fontSize: size * 0.05,
            fontWeight: FontWeight.w600,
            color: const Color(0xFFFFD600),
            letterSpacing: 1.5,
          ),
        ),
      ],
    );
  }
}

/// A scaffold-like wrapper with the protea header
class ProteaScaffold extends StatelessWidget {
  final String? title;
  final Widget body;
  final double headerHeight;
  final bool showBackButton;
  final Widget? floatingActionButton;
  final Widget? bottomNavigationBar;

  const ProteaScaffold({
    super.key,
    this.title,
    required this.body,
    this.headerHeight = 220,
    this.showBackButton = false,
    this.floatingActionButton,
    this.bottomNavigationBar,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: floatingActionButton,
      bottomNavigationBar: bottomNavigationBar,
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            Stack(
              children: [
                ProteaHeader(height: headerHeight),
                if (showBackButton)
                  Positioned(
                    top: MediaQuery.of(context).padding.top + 8,
                    left: 8,
                    child: IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                if (title != null)
                  Positioned(
                    bottom: 8,
                    left: 0,
                    right: 0,
                    child: Text(
                      title!,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.poppins(
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
              ],
            ),
            Expanded(child: body),
          ],
        ),
      ),
    );
  }
}
