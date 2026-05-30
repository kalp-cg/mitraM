import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../main.dart';

class MasterAccountScreen extends StatefulWidget {
  const MasterAccountScreen({super.key});

  @override
  State<MasterAccountScreen> createState() => _MasterAccountScreenState();
}

class _MasterAccountScreenState extends State<MasterAccountScreen> {
  dynamic _report;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchReport();
  }

  Future<void> _fetchReport() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final auth = context.read<AuthService>();
      final api = context.read<ApiService>();
      final report = await api.getMasterSummary(auth.authHeaders);
      if (!mounted) return;
      setState(() {
        _report = report;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'મુખ્ય હિસાબ લોડ કરવામાં ભૂલ આવી. ફરી પ્રયત્ન કરો.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    List<dynamic> years = _report != null && _report['years'] != null
        ? _report['years']
        : ['2023/24', '2024/25'];

    return Scaffold(
      appBar: AppBar(
        title: const Text('📊 મુખ્ય હિસાબ'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              setState(() {
                _loading = true;
              });
              _fetchReport();
            },
          )
        ],
      ),
        body: _loading
          ? const Center(child: CircularProgressIndicator(color: MitraMColors.saffron))
          : _error != null
            ? _buildErrorState()
            : _report == null
              ? const Center(child: Text('અહેવાલ મળ્યો નથી', style: TextStyle(fontSize: 18)))
              : RefreshIndicator(
                  onRefresh: _fetchReport,
                  color: MitraMColors.saffron,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Header Card
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
                              '📋 મુખ્ય સારાંશ પત્રક (Table 1)',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: MitraMColors.dark,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'ગ્રુપનો વાર્ષિક નાણાકીય સારાંશ અને એકંદર કુલ વિગતો.',
                              style: TextStyle(fontSize: 14, color: MitraMColors.warmGrey),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Wide Scrollable Table
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Card(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          clipBehavior: Clip.antiAlias,
                          elevation: 3,
                          child: DataTable(
                            headingRowColor: MaterialStateProperty.all(MitraMColors.saffron),
                            columns: [
                              const DataColumn(
                                label: Text(
                                  'ક્રમ',
                                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                              ),
                              const DataColumn(
                                label: Text(
                                  'વિગત',
                                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                              ),
                              ...years.map((year) => DataColumn(
                                    label: Text(
                                      'વર્ષ $year',
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                                    ),
                                  )),
                              const DataColumn(
                                label: Text(
                                  'કુલ',
                                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                              ),
                            ],
                            rows: [
                              ...(_report['masterSummary'] as List<dynamic>).asMap().entries.map((entry) {
                                final int index = entry.key;
                                final dynamic row = entry.value;
                                final dynamic values = row['values'] ?? {};

                                return DataRow(
                                  cells: [
                                    DataCell(Text('${index + 1}', style: const TextStyle(color: MitraMColors.warmGrey))),
                                    DataCell(Text(row['labelGujarati'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold))),
                                    ...years.map((year) {
                                      final num val = (values is Map ? values[year] : (values[year] ?? 0)) ?? 0;
                                      return DataCell(Text('₹${_fmt(val)}'));
                                    }),
                                    DataCell(
                                      Text(
                                        '₹${_fmt(row['total'] ?? 0)}',
                                        style: const TextStyle(fontWeight: FontWeight.bold, color: MitraMColors.saffronDark),
                                      ),
                                    ),
                                  ],
                                );
                              }).toList(),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Traditional Quote / Info Footer
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
                                '💡 કોઈ પણ બદલાવ વેબ પોર્ટલ પર ઓનલાઇન કરીને ઓટોમેટિક અપડેટ થાય છે.',
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
              onPressed: _fetchReport,
              icon: const Icon(Icons.refresh),
              label: const Text('ફરી પ્રયત્ન કરો'),
            ),
          ],
        ),
      ),
    );
  }
}
