import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../main.dart';
import 'member_detail_screen.dart';

class MembersScreen extends StatefulWidget {
  const MembersScreen({super.key});

  @override
  State<MembersScreen> createState() => _MembersScreenState();
}

class _MembersScreenState extends State<MembersScreen> {
  List<dynamic> _members = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchMembers();
  }

  Future<void> _fetchMembers() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final auth = context.read<AuthService>();
      final api = context.read<ApiService>();
      final members = await api.getMembers(auth.authHeaders);
      if (!mounted) return;
      setState(() { _members = members; _loading = false; });
    } catch (e) {
      if (!mounted) return;
      setState(() { _loading = false; _error = 'સભ્યો લોડ કરવામાં ભૂલ આવી. ફરી પ્રયત્ન કરો.'; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('👥 સભ્યો')),
      body: _loading
        ? const Center(child: CircularProgressIndicator(color: MitraMColors.saffron))
        : _error != null
          ? _buildErrorState()
          : ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _members.length,
            itemBuilder: (context, index) {
              final m = _members[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 4,
                child: InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () {
                    Navigator.push(context, MaterialPageRoute(
                      builder: (_) => MemberDetailScreen(memberId: m['_id']),
                    ));
                  },
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(40),
                          child: Image.asset(
                            'assets/images/${m['photo']}',
                            width: 80,
                            height: 80,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) => CircleAvatar(
                              radius: 40,
                              backgroundColor: MitraMColors.saffronLight,
                              child: Text(
                                (m['nameGujarati'] ?? m['name'] ?? '?')[0],
                                style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: MitraMColors.saffron),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(m['nameGujarati'] ?? m['name'] ?? '',
                          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: MitraMColors.dark)),
                        Text(m['name'] ?? '', style: const TextStyle(color: MitraMColors.warmGrey)),
                        const SizedBox(height: 16),
                        _infoRow('કુલ મુડી', '₹${_fmt(m['totalMudi'])}'),
                        _infoRow('વધેલ રકમ', '₹${_fmt(m['totalVadheliRakam'])}'),
                        _infoRow('એકંદર કુલ', '₹${_fmt(m['totalEkandKul'])}', bold: true, color: MitraMColors.saffron),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
    );
  }

  Widget _infoRow(String label, String value, {bool bold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 16, color: MitraMColors.warmGrey)),
          Text(value, style: TextStyle(fontSize: 18, fontWeight: bold ? FontWeight.bold : FontWeight.w600, color: color ?? MitraMColors.dark)),
        ],
      ),
    );
  }

  String _fmt(dynamic n) {
    if (n == null || n == 0) return '0';
    return (n as num).toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d)(?=(\d{2})+(\d)(?!\d))'), (m) => '${m[1]},');
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 56, color: MitraMColors.kumkum),
            const SizedBox(height: 12),
            Text(_error ?? 'ભૂલ આવી', textAlign: TextAlign.center, style: const TextStyle(fontSize: 18, color: MitraMColors.dark)),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _fetchMembers,
              icon: const Icon(Icons.refresh),
              label: const Text('ફરી પ્રયત્ન કરો'),
            ),
          ],
        ),
      ),
    );
  }
}
