import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../main.dart';

class MemberDetailScreen extends StatefulWidget {
  final String memberId;
  const MemberDetailScreen({super.key, required this.memberId});

  @override
  State<MemberDetailScreen> createState() => _MemberDetailScreenState();
}

class _MemberDetailScreenState extends State<MemberDetailScreen> {
  dynamic _member;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchMemberDetails();
  }

  Future<void> _fetchMemberDetails() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final auth = context.read<AuthService>();
      final api = context.read<ApiService>();
      final member = await api.getMember(widget.memberId, auth.authHeaders);
      if (!mounted) return;
      setState(() {
        _member = member;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'સભ્યની માહિતી લોડ કરવામાં ભૂલ આવી. ફરી પ્રયત્ન કરો.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_member != null ? (_member['nameGujarati'] ?? _member['name'] ?? 'સભ્ય વિગતો') : 'સભ્ય વિગતો'),
      ),
        body: _loading
          ? const Center(child: CircularProgressIndicator(color: MitraMColors.saffron))
          : _error != null
            ? _buildErrorState()
            : _member == null
              ? const Center(child: Text('સભ્ય મળ્યો નથી', style: TextStyle(fontSize: 18)))
              : RefreshIndicator(
                  onRefresh: _fetchMemberDetails,
                  color: MitraMColors.saffron,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Member Header Profile Card
                      Card(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        elevation: 4,
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [MitraMColors.saffron, MitraMColors.gold],
                            ),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          padding: const EdgeInsets.all(20),
                          child: Row(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(40),
                                child: Image.asset(
                                  'assets/images/${_member['photo']}',
                                  width: 80,
                                  height: 80,
                                  fit: BoxFit.cover,
                                  errorBuilder: (context, error, stackTrace) => Container(
                                    width: 80,
                                    height: 80,
                                    color: Colors.white24,
                                    child: const Icon(Icons.person, size: 50, color: Colors.white),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      _member['nameGujarati'] ?? _member['name'] ?? '',
                                      style: const TextStyle(
                                        fontSize: 24,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      _member['name'] ?? '',
                                      style: const TextStyle(
                                        fontSize: 16,
                                        color: Colors.white70,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Financial Summary Cards
                      const Text(
                        '📊 નાણાકીય સારાંશ',
                        style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: MitraMColors.dark),
                      ),
                      const SizedBox(height: 12),
                      GridView.count(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisCount: 2,
                        childAspectRatio: 1.5,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        children: [
                          _summaryCard('કુલ મુડી', '₹${_fmt(_member['totalMudi'])}', MitraMColors.saffron),
                          _summaryCard('કુલ ખર્ચ', '₹${_fmt(_member['totalKharcha'])}', MitraMColors.kumkum),
                          _summaryCard('વધેલ રકમ', '₹${_fmt(_member['totalVadheliRakam'])}', MitraMColors.saffronDark),
                          _summaryCard('એકંદર કુલ', '₹${_fmt(_member['totalEkandKul'])}', MitraMColors.goldDark, isGrandTotal: true),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // Yearly Details Table Header
                      const Text(
                        '📅 વાર્ષિક વિગતો',
                        style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: MitraMColors.dark),
                      ),
                      const SizedBox(height: 12),

                      // Wide Scrollable Table
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Card(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          clipBehavior: Clip.antiAlias,
                          child: DataTable(
                            headingRowColor: MaterialStateProperty.all(MitraMColors.saffron),
                            columns: const [
                              DataColumn(label: Text('વર્ષ', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16))),
                              DataColumn(label: Text('મુડી', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16))),
                              DataColumn(label: Text('ખર્ચ', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16))),
                              DataColumn(label: Text('વધેલ રકમ', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16))),
                              DataColumn(label: Text('નફો', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16))),
                              DataColumn(label: Text('હોલ્ડિંગ', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16))),
                              DataColumn(label: Text('ગોપી મંડળ', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16))),
                              DataColumn(label: Text('એકંદર કુલ', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16))),
                            ],
                            rows: [
                              ...(_member['yearlyData'] as List<dynamic>).map((yd) {
                                return DataRow(
                                  cells: [
                                    DataCell(Text(yd['year'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold))),
                                    DataCell(Text('₹${_fmt(yd['mudi'])}')),
                                    DataCell(Text('₹${_fmt(yd['kharcha'])}')),
                                    DataCell(Text('₹${_fmt(yd['vadheliRakam'])}', style: const TextStyle(color: MitraMColors.saffronDark, fontWeight: FontWeight.w600))),
                                    DataCell(Text('₹${_fmt(yd['nafoo'])}')),
                                    DataCell(Text('₹${_fmt(yd['holding'])}')),
                                    DataCell(Text('₹${_fmt(yd['gopiMandal'])}')),
                                    DataCell(Text('₹${_fmt(yd['ekandKul'])}', style: const TextStyle(color: MitraMColors.saffronDark, fontWeight: FontWeight.bold))),
                                  ],
                                );
                              }).toList(),
                              // Total Row
                              DataRow(
                                color: MaterialStateProperty.all(MitraMColors.saffronLight),
                                cells: [
                                  const DataCell(Text('કુલ', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16))),
                                  DataCell(Text('₹${_fmt(_member['totalMudi'])}', style: const TextStyle(fontWeight: FontWeight.bold))),
                                  DataCell(Text('₹${_fmt(_member['totalKharcha'])}', style: const TextStyle(fontWeight: FontWeight.bold))),
                                  DataCell(Text('₹${_fmt(_member['totalVadheliRakam'])}', style: const TextStyle(fontWeight: FontWeight.bold, color: MitraMColors.saffronDark))),
                                  DataCell(Text('₹${_fmt(_member['totalNafoo'])}', style: const TextStyle(fontWeight: FontWeight.bold))),
                                  const DataCell(Text('—')),
                                  const DataCell(Text('—')),
                                  DataCell(Text('₹${_fmt(_member['totalEkandKul'])}', style: const TextStyle(fontWeight: FontWeight.bold, color: MitraMColors.saffronDark))),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
    );
  }

  Widget _summaryCard(String label, String value, Color color, {bool isGrandTotal = false}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isGrandTotal ? MitraMColors.saffronLight : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.3), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(label, style: const TextStyle(fontSize: 14, color: MitraMColors.warmGrey, fontWeight: FontWeight.w500)),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
        ],
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
              onPressed: _fetchMemberDetails,
              icon: const Icon(Icons.refresh),
              label: const Text('ફરી પ્રયત્ન કરો'),
            ),
          ],
        ),
      ),
    );
  }
}
