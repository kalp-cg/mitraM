import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../main.dart';
import 'member_detail_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<dynamic> _members = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
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
      setState(() { _loading = false; _error = 'ડેટા લોડ કરવામાં ભૂલ આવી. ફરી પ્રયત્ન કરો.'; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('🙏 ડેશબોર્ડ'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await context.read<AuthService>().logout();
              if (mounted) Navigator.pushReplacementNamed(context, '/login');
            },
            tooltip: 'બહાર નીકળો',
          ),
        ],
      ),
      drawer: _buildDrawer(context),
      body: _loading
        ? const Center(child: CircularProgressIndicator(color: MitraMColors.saffron))
        : _error != null
            ? _buildErrorState(context, _error!)
            : RefreshIndicator(
            onRefresh: _fetchData,
            color: MitraMColors.saffron,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Welcome Card
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [MitraMColors.saffron, MitraMColors.saffronDark],
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(color: MitraMColors.saffron.withOpacity(0.3), blurRadius: 15, offset: const Offset(0, 5)),
                    ],
                  ),
                  child: const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('🙏 સ્વાગત છે', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
                      SizedBox(height: 4),
                      Text('મિત્ર મંડળ — ગુજરાતી હિસાબ વ્યવસ્થાપન', style: TextStyle(fontSize: 16, color: Colors.white70)),
                      SizedBox(height: 4),
                      Text('|| જય હનુમાન ||', style: TextStyle(fontSize: 14, color: Colors.white60)),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Summary Cards
                Row(
                  children: [
                    _buildSummaryCard('💰', 'કુલ આવક', _calcTotal('totalMudi'), MitraMColors.saffron),
                    const SizedBox(width: 12),
                    _buildSummaryCard('👥', 'સભ્યો', '${_members.length}', MitraMColors.gold),
                  ],
                ),
                const SizedBox(height: 20),

                // Members
                const Text('👥 સભ્યો', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: MitraMColors.dark)),
                const SizedBox(height: 12),
                ..._members.map((m) => _buildMemberTile(m)),
              ],
            ),
          ),
    );
  }

  Widget _buildSummaryCard(String icon, String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border(left: BorderSide(color: color, width: 4)),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(icon, style: const TextStyle(fontSize: 28)),
            const SizedBox(height: 8),
            Text(label, style: const TextStyle(fontSize: 14, color: MitraMColors.warmGrey)),
            Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }

  Widget _buildMemberTile(dynamic member) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: ClipRRect(
          borderRadius: BorderRadius.circular(30),
          child: Image.asset(
            'assets/images/${member['photo']}',
            width: 60,
            height: 60,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) => Container(
              width: 60,
              height: 60,
              color: MitraMColors.saffronLight,
              child: Center(
                child: Text(
                  (member['nameGujarati'] ?? member['name'] ?? '?')[0],
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: MitraMColors.saffron),
                ),
              ),
            ),
          ),
        ),
        title: Text(
          member['nameGujarati'] ?? member['name'] ?? '',
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        subtitle: Text(member['name'] ?? '', style: const TextStyle(color: MitraMColors.warmGrey)),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            const Text('એકંદર કુલ', style: TextStyle(fontSize: 12, color: MitraMColors.warmGrey)),
            Text('₹${_formatNum(member['totalEkandKul'] ?? 0)}',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: MitraMColors.saffron)),
          ],
        ),
        onTap: () {
          Navigator.push(context, MaterialPageRoute(
            builder: (_) => MemberDetailScreen(memberId: member['_id']),
          ));
        },
      ),
    );
  }

  Drawer _buildDrawer(BuildContext context) {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(
              gradient: LinearGradient(colors: [MitraMColors.saffron, MitraMColors.saffronDark]),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: const [
                Text('મિત્ર મંડળ', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
                SizedBox(height: 4),
                Text('|| જય હનુમાન ||', style: TextStyle(color: Colors.white70, fontSize: 14)),
              ],
            ),
          ),
          _drawerItem(Icons.dashboard, 'ડેશબોર્ડ', '/dashboard'),
          _drawerItem(Icons.people, 'સભ્યો', '/members'),
          _drawerItem(Icons.bar_chart, 'મુખ્ય હિસાબ', '/master-account'),
          _drawerItem(Icons.monetization_on, 'નફો', '/profit'),
          _drawerItem(Icons.description, 'રિપોર્ટ્સ', '/reports'),
          _drawerItem(Icons.settings, 'સેટિંગ્સ', '/settings'),
        ],
      ),
    );
  }

  Widget _drawerItem(IconData icon, String label, String route) {
    return ListTile(
      leading: Icon(icon, color: MitraMColors.saffron),
      title: Text(label, style: const TextStyle(fontSize: 18)),
      onTap: () {
        Navigator.pop(context);
        final currentRoute = ModalRoute.of(context)?.settings.name;
        if (currentRoute != route) {
          Navigator.pushNamed(context, route);
        }
      },
    );
  }

  Widget _buildErrorState(BuildContext context, String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off, size: 56, color: MitraMColors.kumkum),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(fontSize: 18, color: MitraMColors.dark)),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _fetchData,
              icon: const Icon(Icons.refresh),
              label: const Text('ફરી પ્રયત્ન કરો'),
            ),
          ],
        ),
      ),
    );
  }

  String _calcTotal(String field) {
    num total = 0;
    for (var m in _members) {
      total += (m[field] ?? 0) as num;
    }
    return _formatNum(total);
  }

  String _formatNum(num n) {
    if (n == 0) return '0';
    return n.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d)(?=(\d{2})+(\d)(?!\d))'),
      (match) => '${match[1]},',
    );
  }
}
