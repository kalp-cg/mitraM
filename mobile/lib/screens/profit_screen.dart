import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../main.dart';

class ProfitScreen extends StatefulWidget {
  const ProfitScreen({super.key});

  @override
  State<ProfitScreen> createState() => _ProfitScreenState();
}

class _ProfitScreenState extends State<ProfitScreen> {
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
      setState(() {
        _members = members;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'નફા પત્રક લોડ કરવામાં ભૂલ આવી. ફરી પ્રયત્ન કરો.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Calculate totals
    num totalMudi0 = 0;
    num totalMudi1 = 0;
    num totalMudiAll = 0;
    num totalKharcha0 = 0;
    num totalKharcha1 = 0;
    num totalVadheliAll = 0;
    num totalNafoo0 = 0;
    num totalNafoo1 = 0;
    num totalEkandAll = 0;

    for (var m in _members) {
      final yd = m['yearlyData'] as List<dynamic>? ?? [];
      if (yd.isNotEmpty) {
        totalMudi0 += (yd[0]['mudi'] ?? 0) as num;
        totalKharcha0 += (yd[0]['kharcha'] ?? 0) as num;
        totalNafoo0 += (yd[0]['nafoo'] ?? 0) as num;
      }
      if (yd.length > 1) {
        totalMudi1 += (yd[1]['mudi'] ?? 0) as num;
        totalKharcha1 += (yd[1]['kharcha'] ?? 0) as num;
        totalNafoo1 += (yd[1]['nafoo'] ?? 0) as num;
      }
      totalMudiAll += (m['totalMudi'] ?? 0) as num;
      totalVadheliAll += (m['totalVadheliRakam'] ?? 0) as num;
      totalEkandAll += (m['totalEkandKul'] ?? 0) as num;
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('💰 નફો'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              setState(() {
                _loading = true;
              });
              _fetchMembers();
            },
          )
        ],
      ),
        body: _loading
          ? const Center(child: CircularProgressIndicator(color: MitraMColors.saffron))
          : _error != null
            ? _buildErrorState()
            : _members.isEmpty
              ? const Center(child: Text('કોઈ સભ્ય મળ્યા નથી', style: TextStyle(fontSize: 18)))
              : RefreshIndicator(
                  onRefresh: _fetchMembers,
                  color: MitraMColors.saffron,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Table Info Card
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: const Border(left: BorderSide(color: MitraMColors.saffron, width: 4)),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.05),
                              blurRadius: 10,
                            ),
                          ],
                        ),
                        child: const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '👥 સભ્ય વિતરણ પત્રક (Table 2)',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: MitraMColors.dark,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'સભ્ય વાઈઝ મુડી, ખર્ચ, નફો, હોલ્ડિંગ અને એકંદર ચૂકવણી પાત્ર રકમ પત્રક.',
                              style: TextStyle(fontSize: 14, color: MitraMColors.warmGrey),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Horizontal Scrollable Data Table
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Card(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          clipBehavior: Clip.antiAlias,
                          elevation: 3,
                          child: DataTable(
                            headingRowColor: MaterialStateProperty.all(MitraMColors.saffron),
                            columns: const [
                              DataColumn(label: Text('સભ્ય નામ', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                              DataColumn(label: Text('મુડી\n23/24', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold), textAlign: TextAlign.center)),
                              DataColumn(label: Text('મુડી\n24/25', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold), textAlign: TextAlign.center)),
                              DataColumn(label: Text('કુલ મુડી', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                              DataColumn(label: Text('ખર્ચ\n23/24', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold), textAlign: TextAlign.center)),
                              DataColumn(label: Text('ખર્ચ\n24/25', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold), textAlign: TextAlign.center)),
                              DataColumn(label: Text('વધેલ રકમ', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                              DataColumn(label: Text('નફો\n23/24', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold), textAlign: TextAlign.center)),
                              DataColumn(label: Text('નફો\n24/25', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold), textAlign: TextAlign.center)),
                              DataColumn(label: Text('હોલ્ડિંગ', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                              DataColumn(label: Text('ગોપી મંડળ', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                              DataColumn(label: Text('એકંદર કુલ', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                            ],
                            rows: [
                              ..._members.map((m) {
                                final yd = m['yearlyData'] as List<dynamic>? ?? [];
                                final num mudi0 = yd.isNotEmpty ? (yd[0]['mudi'] ?? 0) as num : 0;
                                final num mudi1 = yd.length > 1 ? (yd[1]['mudi'] ?? 0) as num : 0;
                                final num kharcha0 = yd.isNotEmpty ? (yd[0]['kharcha'] ?? 0) as num : 0;
                                final num kharcha1 = yd.length > 1 ? (yd[1]['kharcha'] ?? 0) as num : 0;
                                final num nafoo0 = yd.isNotEmpty ? (yd[0]['nafoo'] ?? 0) as num : 0;
                                final num nafoo1 = yd.length > 1 ? (yd[1]['nafoo'] ?? 0) as num : 0;
                                final num holding = yd.isNotEmpty ? (yd[yd.length - 1]['holding'] ?? 0) as num : 0;
                                final num gopi = yd.isNotEmpty ? (yd[yd.length - 1]['gopiMandal'] ?? 0) as num : 0;

                                return DataRow(
                                  cells: [
                                    DataCell(Row(
                                      children: [
                                        ClipRRect(
                                          borderRadius: BorderRadius.circular(15),
                                          child: Image.asset(
                                            'assets/images/${m['photo']}',
                                            width: 30,
                                            height: 30,
                                            fit: BoxFit.cover,
                                            errorBuilder: (context, error, stackTrace) => const Icon(Icons.person, size: 20),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(m['nameGujarati'] ?? m['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                                      ],
                                    )),
                                    DataCell(Text('₹${_fmt(mudi0)}')),
                                    DataCell(Text('₹${_fmt(mudi1)}')),
                                    DataCell(Text('₹${_fmt(m['totalMudi'])}', style: const TextStyle(fontWeight: FontWeight.w500))),
                                    DataCell(Text('₹${_fmt(kharcha0)}')),
                                    DataCell(Text('₹${_fmt(kharcha1)}')),
                                    DataCell(Text('₹${_fmt(m['totalVadheliRakam'])}', style: const TextStyle(fontWeight: FontWeight.w500, color: MitraMColors.saffronDark))),
                                    DataCell(Text('₹${_fmt(nafoo0)}')),
                                    DataCell(Text('₹${_fmt(nafoo1)}')),
                                    DataCell(Text('₹${_fmt(holding)}')),
                                    DataCell(Text('₹${_fmt(gopi)}')),
                                    DataCell(Text('₹${_fmt(m['totalEkandKul'])}', style: const TextStyle(fontWeight: FontWeight.bold, color: MitraMColors.saffronDark))),
                                  ],
                                );
                              }).toList(),
                              // Total Row
                              DataRow(
                                color: MaterialStateProperty.all(MitraMColors.saffronLight),
                                cells: [
                                  const DataCell(Text('કુલ', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15))),
                                  DataCell(Text('₹${_fmt(totalMudi0)}', style: const TextStyle(fontWeight: FontWeight.bold))),
                                  DataCell(Text('₹${_fmt(totalMudi1)}', style: const TextStyle(fontWeight: FontWeight.bold))),
                                  DataCell(Text('₹${_fmt(totalMudiAll)}', style: const TextStyle(fontWeight: FontWeight.bold))),
                                  DataCell(Text('₹${_fmt(totalKharcha0)}', style: const TextStyle(fontWeight: FontWeight.bold))),
                                  DataCell(Text('₹${_fmt(totalKharcha1)}', style: const TextStyle(fontWeight: FontWeight.bold))),
                                  DataCell(Text('₹${_fmt(totalVadheliAll)}', style: const TextStyle(fontWeight: FontWeight.bold, color: MitraMColors.saffronDark))),
                                  DataCell(Text('₹${_fmt(totalNafoo0)}', style: const TextStyle(fontWeight: FontWeight.bold))),
                                  DataCell(Text('₹${_fmt(totalNafoo1)}', style: const TextStyle(fontWeight: FontWeight.bold))),
                                  const DataCell(Text('—')),
                                  const DataCell(Text('—')),
                                  DataCell(Text('₹${_fmt(totalEkandAll)}', style: const TextStyle(fontWeight: FontWeight.bold, color: MitraMColors.saffronDark))),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Info box
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: MitraMColors.saffronLight,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: MitraMColors.saffron.withOpacity(0.2)),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.lightbulb_outline, color: MitraMColors.saffronDark),
                            SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                '💡 હોલ્ડિંગ અને ગોપી મંડળ આખરી વર્ષ પત્રકમાંથી લેવામાં આવેલ છે.',
                                style: TextStyle(color: MitraMColors.saffronDark, fontSize: 14, fontWeight: FontWeight.w500),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
    );
  }

  String _fmt(dynamic n) {
    if (n == null || n == 0) return '0';
    return (n as num).toStringAsFixed(0).replaceAllMapped(
          RegExp(r'(\d)(?=(\d{2})+(\d)(?!\d))'),
          (match) => '${match[1]},',
        );
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
