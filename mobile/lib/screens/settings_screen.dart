import 'package:flutter/material.dart';
import '../main.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('⚙️ સેટિંગ્સ')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Year Management
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: const Padding(
              padding: EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('📅 વર્ષ વ્યવસ્થાપન', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                  SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    children: [
                      Chip(label: Text('2023/24'), backgroundColor: MitraMColors.saffronLight),
                      Chip(label: Text('2024/25'), backgroundColor: MitraMColors.saffronLight),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Connection Status
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('📡 કનેક્શન સ્થિતિ', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  _statusRow('સર્વર', 'કનેક્ટેડ', Colors.green),
                  _statusRow('રિયલ-ટાઇમ સિંક', 'સક્રિય', Colors.green),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // App Info
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: const Padding(
              padding: EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('ℹ️ એપ્લિકેશન', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                  SizedBox(height: 12),
                  Text('મિત્ર મંડળ v1.0.0', style: TextStyle(fontSize: 18)),
                  SizedBox(height: 4),
                  Text('ગુજરાતી હિસાબ વ્યવસ્થાપન સિસ્ટમ', style: TextStyle(color: MitraMColors.warmGrey)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 32),
          const Center(
            child: Text('|| જય હનુમાન || 🪔', style: TextStyle(color: MitraMColors.warmGrey, fontSize: 18)),
          ),
        ],
      ),
    );
  }

  static Widget _statusRow(String label, String value, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 16, color: MitraMColors.warmGrey)),
          Row(
            children: [
              Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
              const SizedBox(width: 8),
              Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: color)),
            ],
          ),
        ],
      ),
    );
  }
}
