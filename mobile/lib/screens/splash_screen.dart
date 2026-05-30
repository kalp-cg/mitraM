import 'package:flutter/material.dart';
import '../main.dart';

class SplashScreenPage extends StatefulWidget {
  const SplashScreenPage({super.key});

  @override
  State<SplashScreenPage> createState() => _SplashScreenPageState();
}

class _SplashScreenPageState extends State<SplashScreenPage>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeIn;
  late Animation<double> _scaleIn;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    );
    _fadeIn = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
    _scaleIn = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );
    _controller.forward();

    // Navigate to login after 3 seconds
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        Navigator.pushReplacementNamed(context, '/login');
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              MitraMColors.saffronLight,
              MitraMColors.cream,
              Color(0xFFFFF0D0),
            ],
          ),
        ),
        child: Center(
          child: FadeTransition(
            opacity: _fadeIn,
            child: ScaleTransition(
              scale: _scaleIn,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Hanuman Dada Image
                  Container(
                    width: 220,
                    height: 220,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: MitraMColors.gold, width: 4),
                      boxShadow: [
                        BoxShadow(
                          color: MitraMColors.saffron.withOpacity(0.3),
                          blurRadius: 30,
                          spreadRadius: 5,
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: Image.asset(
                        'assets/images/hanuman-dada-1.jpeg',
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          color: MitraMColors.saffronLight,
                          child: const Icon(Icons.temple_hindu, size: 80, color: MitraMColors.saffron),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Jay Hanuman
                  const Text(
                    '|| જય હનુમાન ||',
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                      color: MitraMColors.saffron,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // App Name
                  const Text(
                    'મિત્ર મંડળ',
                    style: TextStyle(
                      fontSize: 36,
                      fontWeight: FontWeight.w800,
                      color: MitraMColors.dark,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Subtitle
                  Text(
                    'ગુજરાતી હિસાબ વ્યવસ્થાપન સિસ્ટમ',
                    style: TextStyle(
                      fontSize: 18,
                      color: MitraMColors.warmGrey,
                    ),
                  ),
                  const SizedBox(height: 40),

                  // Diva
                  const Text('🪔', style: TextStyle(fontSize: 40)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
