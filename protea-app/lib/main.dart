import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/theme_provider.dart';
import 'providers/color_theme_provider.dart';
import 'providers/font_provider.dart';
import 'theme/app_theme.dart';
import 'screens/core/home_screen.dart';
import 'screens/landing/landing_screen.dart';
import 'screens/core/splash_screen.dart';
import 'screens/guest/guest_live_screen.dart';

const _logoAsset = AssetImage('assets/images/Future_Protea_Logo.png');

void main() {
  GoogleFonts.config.allowRuntimeFetching = true;
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..init()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => ColorThemeProvider()),
        ChangeNotifierProvider(create: (_) => FontProvider()),
      ],
      child: const FutureProteaApp(),
    ),
  );
}

class FutureProteaApp extends StatefulWidget {
  const FutureProteaApp({super.key});

  @override
  State<FutureProteaApp> createState() => _FutureProteaAppState();
}

class _FutureProteaAppState extends State<FutureProteaApp> {
  bool _imagePrecached = false;
  bool _showSplash = true;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_imagePrecached) {
      _imagePrecached = true;
      precacheImage(_logoAsset, context);
    }
  }

  void _completeSplash() {
    setState(() {
      _showSplash = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final colorTheme = context.watch<ColorThemeProvider>();
    final fontProvider = context.watch<FontProvider>();

    // Resolve palette + depth and push brand colors into AppTheme statics so
    // every screen that reads them directly reflects the chosen palette.
    final lightColors = colorTheme.resolvedColors(Brightness.light);
    final darkColors = colorTheme.resolvedColors(Brightness.dark);
    AppTheme.applyPalette(
      light: lightColors,
      dark: darkColors,
      depth: colorTheme.depth,
    );

    final lightTheme = AppTheme.buildTheme(
      colors: lightColors,
      font: fontProvider.font,
      depth: colorTheme.depth,
      brightness: Brightness.light,
    );
    final darkTheme = AppTheme.buildTheme(
      colors: darkColors,
      font: fontProvider.font,
      depth: colorTheme.depth,
      brightness: Brightness.dark,
    );

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle(
        statusBarColor: AppTheme.darkGreen,
        statusBarIconBrightness: Brightness.light,
        statusBarBrightness: Brightness.dark,
      ),
      child: MaterialApp(
        title: 'Future Protea',
        debugShowCheckedModeBanner: false,
        theme: lightTheme,
        darkTheme: darkTheme,
        themeMode: themeProvider.mode,
        home: _showSplash
            ? SplashScreen(onComplete: _completeSplash)
            : Consumer<AuthProvider>(
                builder: (context, auth, _) {
                  if (!auth.isLoggedIn) {
                    return const LandingScreen();
                  }
                  if (auth.isGuest) {
                    return const GuestLiveScreen();
                  }
                  return const HomeScreen();
                },
              ),
      ),
    );
  }
}
