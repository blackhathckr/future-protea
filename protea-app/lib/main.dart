import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/theme_provider.dart';
import 'theme/app_theme.dart';
import 'screens/auth/login_screen.dart';
import 'screens/core/home_screen.dart';
import 'screens/guest/guest_live_screen.dart';
import 'screens/core/splash_screen.dart';

/// Cached logo image provider - decoded once, used everywhere
const _logoAsset = AssetImage('assets/images/Future_Protea_Logo.png');

void main() {
  // Allow GoogleFonts to fetch fonts at runtime if not in assets
  GoogleFonts.config.allowRuntimeFetching = true;
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..init()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
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

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: AppTheme.darkGreen,
        statusBarIconBrightness: Brightness.light,
        statusBarBrightness: Brightness.dark,
      ),
      child: MaterialApp(
        title: 'Future Protea',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: themeProvider.mode,
        home: _showSplash
            ? SplashScreen(onComplete: _completeSplash)
            : Consumer<AuthProvider>(
                builder: (context, auth, _) {
                  // Skip the logo loading screen - auth loads during splash
                  if (!auth.isLoggedIn) {
                    return const LoginScreen();
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
