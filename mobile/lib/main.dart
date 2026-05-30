import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'services/auth_service.dart';
import 'services/api_service.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/members_screen.dart';
import 'screens/master_account_screen.dart';
import 'screens/profit_screen.dart';
import 'screens/reports_screen.dart';
import 'screens/settings_screen.dart';

// MitraM Color Palette
class MitraMColors {
  static const saffron = Color(0xFFFF9933);
  static const saffronLight = Color(0xFFFFF8E7);
  static const saffronDark = Color(0xFFE67300);
  static const gold = Color(0xFFDAA520);
  static const goldDark = Color(0xFFB8860B);
  static const cream = Color(0xFFFFFCF5);
  static const kumkum = Color(0xFFDC143C);
  static const dark = Color(0xFF2D1B00);
  static const warmGrey = Color(0xFF6B5E50);
}

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        Provider(create: (_) => ApiService()),
      ],
      child: const MitraMApp(),
    ),
  );
}

class MitraMApp extends StatelessWidget {
  const MitraMApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'મિત્ર મંડળ',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: MitraMColors.saffron,
          brightness: Brightness.light,
        ),
        textTheme: GoogleFonts.notoSansGujaratiTextTheme(
          Theme.of(context).textTheme,
        ),
        scaffoldBackgroundColor: MitraMColors.cream,
        appBarTheme: const AppBarTheme(
          backgroundColor: MitraMColors.saffron,
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: MitraMColors.saffron,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: MitraMColors.saffronLight,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFFFFF0D0)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: MitraMColors.saffron, width: 2),
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
          labelStyle: const TextStyle(fontSize: 18, color: MitraMColors.warmGrey),
        ),
        useMaterial3: true,
      ),
      initialRoute: '/splash',
      routes: {
        '/splash': (context) => const SplashScreenPage(),
        '/login': (context) => const LoginScreen(),
        '/dashboard': (context) => const DashboardScreen(),
        '/members': (context) => const MembersScreen(),
        '/master-account': (context) => const MasterAccountScreen(),
        '/profit': (context) => const ProfitScreen(),
        '/reports': (context) => const ReportsScreen(),
        '/settings': (context) => const SettingsScreen(),
      },
    );
  }
}
