import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../main.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;
  String _error = '';

  Future<void> _handleLogin() async {
    setState(() { _loading = true; _error = ''; });

    try {
      final auth = context.read<AuthService>();
      await auth.login(_usernameController.text, _passwordController.text);
      if (mounted) {
        Navigator.pushReplacementNamed(context, '/dashboard');
      }
    } catch (e) {
      final msg = e.toString().replaceFirst('Exception: ', '').trim();
      setState(() {
        _error = msg.isEmpty ? 'ખોટો યુઝર આઈડી અથવા પાસવર્ડ' : msg;
      });
    } finally {
      if (mounted) setState(() { _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [MitraMColors.saffronLight, MitraMColors.cream],
          ),
        ),
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Card(
              elevation: 8,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Hanuman image
                    ClipRRect(
                      borderRadius: BorderRadius.circular(50),
                      child: Image.asset(
                        'assets/images/hanuman-dada-1.jpeg',
                        width: 100, height: 100, fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          width: 100, height: 100,
                          decoration: BoxDecoration(
                            color: MitraMColors.saffronLight,
                            borderRadius: BorderRadius.circular(50),
                          ),
                          child: const Icon(Icons.temple_hindu, size: 50, color: MitraMColors.saffron),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text('મિત્ર મંડળ',
                      style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: MitraMColors.dark)),
                    const Text('|| જય હનુમાન ||',
                      style: TextStyle(fontSize: 16, color: MitraMColors.saffron, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 32),

                    if (_error.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.red.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.red.shade200),
                        ),
                        child: Text(_error, style: TextStyle(color: Colors.red.shade700, fontSize: 16)),
                      ),

                    // User ID
                    TextField(
                      controller: _usernameController,
                      style: const TextStyle(fontSize: 20),
                      decoration: const InputDecoration(labelText: 'યુઝર આઈડી', prefixIcon: Icon(Icons.person)),
                    ),
                    const SizedBox(height: 16),

                    // Password
                    TextField(
                      controller: _passwordController,
                      obscureText: true,
                      style: const TextStyle(fontSize: 20),
                      decoration: const InputDecoration(labelText: 'પાસવર્ડ', prefixIcon: Icon(Icons.lock)),
                    ),
                    const SizedBox(height: 24),

                    // Login Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _loading ? null : _handleLogin,
                        child: _loading
                          ? const SizedBox(width: 24, height: 24,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('🙏 પ્રવેશ કરો', style: TextStyle(fontSize: 20)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
