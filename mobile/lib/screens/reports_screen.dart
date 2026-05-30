import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:pdf/pdf.dart';
import 'package:printing/printing.dart';
import 'package:provider/provider.dart';

import '../main.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../types.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  Map<String, dynamic>? _appData;
  bool _loadingAppData = true;
  bool _savingEntry = false;
  bool _loadingPdf = false;
  String? _errorMessage;
  String? _loadingType;

  @override
  void initState() {
    super.initState();
    _loadAppData();
  }

  Future<void> _loadAppData() async {
    if (!mounted) return;
    setState(() {
      _loadingAppData = true;
      _errorMessage = null;
    });

    try {
      final auth = context.read<AuthService>();
      final api = context.read<ApiService>();
      final data = await api.getAppData(auth.authHeaders);
      if (!mounted) return;
      setState(() {
        _appData = Map<String, dynamic>.from(data as Map);
        _loadingAppData = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loadingAppData = false;
        _errorMessage = 'અહેવાલ લોડ કરવામાં ભૂલ આવી. ફરી પ્રયત્ન કરો.';
      });
    }
  }

  Future<void> _generateAndShowPdf(String type) async {
    setState(() {
      _loadingPdf = true;
      _loadingType = type;
      _errorMessage = null;
    });

    try {
      final auth = context.read<AuthService>();
      final url = Uri.parse('${AuthService.baseUrl}/reports/pdf/$type');
      final response = await http.get(url, headers: auth.authHeaders);

      if (response.statusCode == 200) {
        final Uint8List pdfBytes = response.bodyBytes;
        await Printing.layoutPdf(
          onLayout: (PdfPageFormat format) async => pdfBytes,
          name: 'mitram-report-$type.pdf',
        );
      } else {
        if (mounted) {
          setState(() => _errorMessage = 'PDF બનાવવામાં ભૂલ આવી (${response.statusCode})');
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _errorMessage = 'PDF જનરેટ કરવામાં નેટવર્ક/સર્વર ભૂલ આવી.');
      }
    } finally {
      if (mounted) {
        setState(() {
          _loadingPdf = false;
          _loadingType = null;
        });
      }
    }
  }

  Map<String, dynamic> _cloneAppData(Map<String, dynamic> data) {
    return jsonDecode(jsonEncode(data)) as Map<String, dynamic>;
  }

  Map<String, dynamic> _recalculateMasterRows(List<dynamic> masterRows) {
    final updated = masterRows.map((row) => Map<String, dynamic>.from(row as Map)).toList();

    int incomeIdx = updated.indexWhere((r) => r['id'] == 'mr1');
    int expenseIdx = updated.indexWhere((r) => r['id'] == 'mr2');
    int remainingIdx = updated.indexWhere((r) => r['id'] == 'mr3');
    int profitIdx = updated.indexWhere((r) => r['id'] == 'mr4');
    int holdingIdx = updated.indexWhere((r) => r['id'] == 'mr5');
    int gopiIdx = updated.indexWhere((r) => r['id'] == 'mr6');
    int grandIdx = updated.indexWhere((r) => r['id'] == 'mr7');

    for (final yf in FINANCIAL_YEARS) {
      final col = yf.masterKey;
      if (incomeIdx != -1 && expenseIdx != -1 && remainingIdx != -1) {
        updated[remainingIdx][col] = (updated[incomeIdx][col] ?? 0) - (updated[expenseIdx][col] ?? 0);
      }
      if (grandIdx != -1) {
        updated[grandIdx][col] =
            (updated[incomeIdx][col] ?? 0) +
            (updated[profitIdx][col] ?? 0) +
            (updated[holdingIdx][col] ?? 0) +
            (updated[gopiIdx][col] ?? 0);
      }
    }

    return {
      'rows': updated,
      'grandIdx': grandIdx,
    };
  }

  Future<void> _saveAppData(Map<String, dynamic> updated) async {
    final auth = context.read<AuthService>();
    final api = context.read<ApiService>();
    await api.saveAppData(auth.authHeaders, updated);
  }

  Future<void> _submitIndividualEntry({
    required String memberId,
    required String yearId,
    required String type,
    required String amountText,
    required String notes,
  }) async {
    final amountNum = double.tryParse(amountText.trim()) ?? 0;
    if (amountNum <= 0) {
      throw Exception('રકમ સાચી દાખલ કરો');
    }
    if (_appData == null) {
      throw Exception('ડેટા લોડ થતો નથી');
    }

    final updated = _cloneAppData(_appData!);
    final members = List<Map<String, dynamic>>.from((updated['members'] ?? []) as List);
    final masterRows = List<dynamic>.from((updated['masterRows'] ?? []) as List);

    for (final member in members) {
      final id = (member['id'] ?? member['_id'] ?? '').toString();
      if (id != memberId) continue;

      final yearMap = Map<String, dynamic>.from((member[yearId] ?? {}) as Map);
      yearMap['capital'] = ((yearMap['capital'] ?? 0) as num) + (type == 'capital' ? amountNum : 0);
      yearMap['expense'] = ((yearMap['expense'] ?? 0) as num) + (type == 'expense' ? amountNum : 0);
      yearMap['profit'] = ((yearMap['profit'] ?? 0) as num) + (type == 'profit' ? amountNum : 0);
      member[yearId] = yearMap;
      if (notes.trim().isNotEmpty) {
        member['notes'] = notes.trim();
      }
    }

    final targetCol = yearId.replaceFirst('year20', 'year');
    for (var i = 0; i < masterRows.length; i++) {
      final map = Map<String, dynamic>.from(masterRows[i] as Map);
      if (type == 'capital' && map['id'] == 'mr1') {
        map[targetCol] = (map[targetCol] ?? 0) + amountNum;
      } else if (type == 'expense' && map['id'] == 'mr2') {
        map[targetCol] = (map[targetCol] ?? 0) + amountNum;
      } else if (type == 'profit' && map['id'] == 'mr4') {
        map[targetCol] = (map[targetCol] ?? 0) + amountNum;
      }
      masterRows[i] = map;
    }

    final recalculated = _recalculateMasterRows(masterRows);
    final updatedRows = List<dynamic>.from(recalculated['rows'] as List);

    final memberObj = members.firstWhere(
      (m) => (m['id'] ?? m['_id'] ?? '').toString() == memberId,
      orElse: () => <String, dynamic>{},
    );
    final yearObj = FINANCIAL_YEARS.firstWhere((y) => y.id == yearId);
    final typeLabel = type == 'capital'
        ? 'મુડી જમા'
        : type == 'expense'
            ? 'ખર્ચ બાદબાકી'
            : 'નફો વિતરણ';
    final memberName = (memberObj['nameGu'] ?? memberObj['nameGujarati'] ?? memberId).toString();
    final logMsg = '$memberName ના ખાતામાં વર્ષ ${yearObj.labelEn} માટે ₹${amountNum.toStringAsFixed(0)} નું $typeLabel ઉમેરાયું.';

    final nowLocalDate = DateTime.now();
    final tsStr =
        '${nowLocalDate.toLocal().toString().split(' ').first.replaceAll('-', '/')} ${nowLocalDate.toLocal().toIso8601String().substring(11, 16)}';

    final currentLogs = List<dynamic>.from(updated['recentLogs'] ?? []);
    final updatedLogs = [
      {
        'id': 'log_${DateTime.now().millisecondsSinceEpoch}',
        'timestamp': tsStr,
        'user': 'હિસાબનીશ',
        'actionGu': logMsg,
      },
      ...currentLogs,
    ].take(8).toList();

    updated['members'] = members;
    updated['masterRows'] = updatedRows;
    updated['recentLogs'] = updatedLogs;

    setState(() {
      _savingEntry = true;
    });
    try {
      await _saveAppData(updated);
      if (!mounted) return;
      setState(() {
        _appData = updated;
      });
    } finally {
      if (mounted) {
        setState(() {
          _savingEntry = false;
        });
      }
    }
  }

  Future<void> _submitGroupEntry({
    required String yearId,
    required String title,
    required String amountText,
    required List<String> selectedMemberIds,
  }) async {
    final totalAmountNum = double.tryParse(amountText.trim()) ?? 0;
    if (totalAmountNum <= 0) {
      throw Exception('રકમ સાચી દાખલ કરો');
    }
    if (selectedMemberIds.isEmpty) {
      throw Exception('ઓછામાં ઓછો એક સભ્ય પસંદ કરો');
    }
    if (_appData == null) {
      throw Exception('ડેટા લોડ થતો નથી');
    }

    final updated = _cloneAppData(_appData!);
    final members = List<Map<String, dynamic>>.from((updated['members'] ?? []) as List);
    final masterRows = List<dynamic>.from((updated['masterRows'] ?? []) as List);
    final shareAmount = (totalAmountNum / selectedMemberIds.length).round();

    for (final member in members) {
      final id = (member['id'] ?? member['_id'] ?? '').toString();
      if (!selectedMemberIds.contains(id)) continue;
      final yearMap = Map<String, dynamic>.from((member[yearId] ?? {}) as Map);
      yearMap['expense'] = ((yearMap['expense'] ?? 0) as num) + shareAmount;
      member[yearId] = yearMap;
      final noteStr = title.trim().isEmpty ? 'સમૂહ ખર્ચ વિભાજન' : title.trim();
      member['notes'] = member['notes'] != null && member['notes'].toString().trim().isNotEmpty
          ? '${member['notes']}, $noteStr (₹$shareAmount)'
          : '$noteStr (₹$shareAmount)';
    }

    final targetCol = yearId.replaceFirst('year20', 'year');
    for (var i = 0; i < masterRows.length; i++) {
      final map = Map<String, dynamic>.from(masterRows[i] as Map);
      if (map['id'] == 'mr2') {
        map[targetCol] = (map[targetCol] ?? 0) + totalAmountNum;
      }
      masterRows[i] = map;
    }

    final recalculated = _recalculateMasterRows(masterRows);
    final updatedRows = List<dynamic>.from(recalculated['rows'] as List);
    final yearObj = FINANCIAL_YEARS.firstWhere((y) => y.id == yearId);
    final logMsg = 'સમૂહ ખર્ચ "${title.trim().isEmpty ? 'નવો ખર્ચ' : title.trim()}" વર્ષ ${yearObj.labelEn} હેઠળ ₹${totalAmountNum.toStringAsFixed(0)} સમાન ગણતરીએ વિતરિત થયો.';

    final nowLocalDate = DateTime.now();
    final tsStr =
        '${nowLocalDate.toLocal().toString().split(' ').first.replaceAll('-', '/')} ${nowLocalDate.toLocal().toIso8601String().substring(11, 16)}';

    final currentLogs = List<dynamic>.from(updated['recentLogs'] ?? []);
    final updatedLogs = [
      {
        'id': 'log_${DateTime.now().millisecondsSinceEpoch}',
        'timestamp': tsStr,
        'user': 'હિસાબનીશ',
        'actionGu': logMsg,
      },
      ...currentLogs,
    ].take(8).toList();

    updated['members'] = members;
    updated['masterRows'] = updatedRows;
    updated['recentLogs'] = updatedLogs;

    setState(() {
      _savingEntry = true;
    });
    try {
      await _saveAppData(updated);
      if (!mounted) return;
      setState(() {
        _appData = updated;
      });
    } finally {
      if (mounted) {
        setState(() {
          _savingEntry = false;
        });
      }
    }
  }

  void _openEntrySheet() {
    if (_appData == null) return;

    String modalTab = 'individual';
    String modalMemberId = ((_appData!['members'] as List).isNotEmpty
            ? (_appData!['members'] as List).first['id']
            : '')
        .toString();
    String modalYear = 'year2024_25';
    String modalType = 'capital';
    String modalAmount = '';
    String modalNotes = '';
    String groupExpenseTitle = '';
    List<String> selectedGroupMembers = List<String>.from(
      (_appData!['members'] as List).map((m) => (m['id'] ?? '').toString()),
    );
    String? localError;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (sheetContext, setModalState) {
            Widget buildChip(String label, bool active, VoidCallback onTap) {
              return ChoiceChip(
                label: Text(label),
                selected: active,
                onSelected: (_) => onTap(),
                selectedColor: MitraMColors.saffronLight,
                labelStyle: TextStyle(
                  color: active ? MitraMColors.saffronDark : MitraMColors.dark,
                  fontWeight: FontWeight.bold,
                ),
              );
            }

            return Container(
              constraints: BoxConstraints(maxHeight: MediaQuery.of(sheetContext).size.height * 0.92),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: SingleChildScrollView(
                child: Padding(
                  padding: EdgeInsets.only(
                    left: 16,
                    right: 16,
                    top: 12,
                    bottom: MediaQuery.of(sheetContext).viewInsets.bottom + 16,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.receipt_long, color: MitraMColors.saffronDark),
                          const SizedBox(width: 8),
                          const Expanded(
                            child: Text(
                              'નવો હિસાબ ઉમેરો',
                              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: MitraMColors.dark),
                            ),
                          ),
                          IconButton(
                            onPressed: () => Navigator.pop(sheetContext),
                            icon: const Icon(Icons.close),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      if (localError != null)
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.red.shade50,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.red.shade200),
                          ),
                          child: Text(localError!, style: TextStyle(color: Colors.red.shade700)),
                        ),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          buildChip('વ્યક્તિગત', modalTab == 'individual', () {
                            setModalState(() {
                              modalTab = 'individual';
                            });
                          }),
                          buildChip('સમૂહ ખર્ચ', modalTab == 'group', () {
                            setModalState(() {
                              modalTab = 'group';
                              if (selectedGroupMembers.isEmpty) {
                                selectedGroupMembers = List<String>.from(
                                  (_appData!['members'] as List).map((m) => (m['id'] ?? '').toString()),
                                );
                              }
                            });
                          }),
                        ],
                      ),
                      const SizedBox(height: 16),
                      if (modalTab == 'individual') ...[
                        DropdownButtonFormField<String>(
                          value: modalMemberId.isNotEmpty ? modalMemberId : null,
                          decoration: const InputDecoration(labelText: 'સભ્ય પસંદ કરો'),
                          items: (_appData!['members'] as List)
                              .map<DropdownMenuItem<String>>(
                                (m) => DropdownMenuItem<String>(
                                  value: (m['id'] ?? '').toString(),
                                  child: Text('${m['nameGu'] ?? m['nameGujarati'] ?? ''} (${m['nameEn'] ?? ''})'),
                                ),
                              )
                              .toList(),
                          onChanged: (value) {
                            setModalState(() {
                              modalMemberId = value ?? '';
                            });
                          },
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                value: modalYear,
                                decoration: const InputDecoration(labelText: 'નાણાકીય વર્ષ'),
                                items: FINANCIAL_YEARS
                                    .map(
                                      (y) => DropdownMenuItem<String>(
                                        value: y.id,
                                        child: Text(y.labelGu),
                                      ),
                                    )
                                    .toList(),
                                onChanged: (value) {
                                  setModalState(() {
                                    modalYear = value ?? modalYear;
                                  });
                                },
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                value: modalType,
                                decoration: const InputDecoration(labelText: 'પ્રકાર'),
                                items: const [
                                  DropdownMenuItem(value: 'capital', child: Text('મુડી જમા')),
                                  DropdownMenuItem(value: 'expense', child: Text('ખર્ચ બાદબાકી')),
                                  DropdownMenuItem(value: 'profit', child: Text('નફો વિતરણ')),
                                ],
                                onChanged: (value) {
                                  setModalState(() {
                                    modalType = value ?? modalType;
                                  });
                                },
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'રકમ'),
                          onChanged: (value) {
                            setModalState(() {
                              modalAmount = value;
                            });
                          },
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          decoration: const InputDecoration(labelText: 'નોંધ / ટૂંકી વિગત (optional)'),
                          onChanged: (value) {
                            setModalState(() {
                              modalNotes = value;
                            });
                          },
                        ),
                        const SizedBox(height: 16),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            for (final amount in [5000, 10000, 25000, 50000, 100000])
                              OutlinedButton(
                                onPressed: () {
                                  setModalState(() {
                                    modalAmount = ((double.tryParse(modalAmount) ?? 0) + amount).toStringAsFixed(0);
                                  });
                                },
                                child: Text('+${amount.toString()}'),
                              ),
                            TextButton(
                              onPressed: () {
                                setModalState(() {
                                  modalAmount = '';
                                });
                              },
                              child: const Text('સાફ કરો'),
                            ),
                          ],
                        ),
                      ] else ...[
                        TextField(
                          decoration: const InputDecoration(labelText: 'સમૂહ ખર્ચ / દાનનું શીર્ષક'),
                          onChanged: (value) {
                            setModalState(() {
                              groupExpenseTitle = value;
                            });
                          },
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                value: modalYear,
                                decoration: const InputDecoration(labelText: 'નાણાકીય વર્ષ'),
                                items: FINANCIAL_YEARS
                                    .map(
                                      (y) => DropdownMenuItem<String>(
                                        value: y.id,
                                        child: Text(y.labelGu),
                                      ),
                                    )
                                    .toList(),
                                onChanged: (value) {
                                  setModalState(() {
                                    modalYear = value ?? modalYear;
                                  });
                                },
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: TextField(
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(labelText: 'કુલ રકમ'),
                                onChanged: (value) {
                                  setModalState(() {
                                    modalAmount = value;
                                  });
                                },
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Text('સભ્યો પસંદ કરો'),
                        const SizedBox(height: 8),
                        Container(
                          constraints: const BoxConstraints(maxHeight: 260),
                          decoration: BoxDecoration(
                            border: Border.all(color: Colors.grey.shade300),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: ListView.separated(
                            shrinkWrap: true,
                            itemCount: (_appData!['members'] as List).length,
                            separatorBuilder: (_, __) => Divider(height: 1, color: Colors.grey.shade200),
                            itemBuilder: (_, index) {
                              final member = Map<String, dynamic>.from((_appData!['members'] as List)[index] as Map);
                              final id = (member['id'] ?? '').toString();
                              final checked = selectedGroupMembers.contains(id);
                              return CheckboxListTile(
                                value: checked,
                                dense: true,
                                title: Text('${member['nameGu'] ?? member['nameGujarati'] ?? ''}'),
                                subtitle: Text(member['nameEn']?.toString() ?? ''),
                                onChanged: (value) {
                                  setModalState(() {
                                    if (value == true) {
                                      if (!selectedGroupMembers.contains(id)) selectedGroupMembers.add(id);
                                    } else {
                                      selectedGroupMembers.remove(id);
                                    }
                                  });
                                },
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 12),
                        if (selectedGroupMembers.isNotEmpty && (double.tryParse(modalAmount) ?? 0) > 0)
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: MitraMColors.saffronLight,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              'પ્રતિ સભ્ય ભાગે ₹${((double.tryParse(modalAmount) ?? 0) / selectedGroupMembers.length).round().toString()}',
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                      ],
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: _savingEntry ? null : () => Navigator.pop(sheetContext),
                              child: const Text('રદ કરો'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: _savingEntry
                                  ? null
                                  : () async {
                                      try {
                                        setModalState(() {
                                          localError = null;
                                        });
                                        if (modalTab == 'individual') {
                                          await _submitIndividualEntry(
                                            memberId: modalMemberId,
                                            yearId: modalYear,
                                            type: modalType,
                                            amountText: modalAmount,
                                            notes: modalNotes,
                                          );
                                        } else {
                                          await _submitGroupEntry(
                                            yearId: modalYear,
                                            title: groupExpenseTitle,
                                            amountText: modalAmount,
                                            selectedMemberIds: selectedGroupMembers,
                                          );
                                        }
                                        if (mounted) Navigator.pop(sheetContext);
                                      } catch (e) {
                                        setModalState(() {
                                          localError = e.toString().replaceFirst('Exception: ', '');
                                        });
                                      }
                                    },
                              child: _savingEntry
                                  ? const SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                    )
                                  : const Text('સેવ કરો'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('📋 રિપોર્ટ્સ'),
        actions: [
          IconButton(
            onPressed: _loadingAppData ? null : _loadAppData,
            icon: const Icon(Icons.refresh),
            tooltip: 'રીફ્રેશ',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: (_loadingAppData || _appData == null) ? null : _openEntrySheet,
        icon: const Icon(Icons.add),
        label: const Text('નવો હિસાબ'),
      ),
      body: _loadingAppData
          ? const Center(child: CircularProgressIndicator(color: MitraMColors.saffron))
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.cloud_off, size: 56, color: MitraMColors.kumkum),
                        const SizedBox(height: 12),
                        Text(_errorMessage!, textAlign: TextAlign.center, style: const TextStyle(fontSize: 18)),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _loadAppData,
                          icon: const Icon(Icons.refresh),
                          label: const Text('ફરી પ્રયત્ન કરો'),
                        ),
                      ],
                    ),
                  ),
                )
              : _appData == null
                  ? const Center(child: Text('ડેટા મળ્યો નથી'))
                  : RefreshIndicator(
                      onRefresh: _loadAppData,
                      color: MitraMColors.saffron,
                      child: ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                          if (_errorMessage != null) ...[
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.red.shade50,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.red.shade200),
                              ),
                              child: Text(_errorMessage!, style: TextStyle(color: Colors.red.shade700)),
                            ),
                            const SizedBox(height: 16),
                          ],
                          Card(
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                            elevation: 2,
                            child: Padding(
                              padding: const EdgeInsets.all(18),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('નવો હિસાબ ઉમેરો', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 8),
                                  const Text('વ્યક્તિગત નોંધ કે સમૂહ ખર્ચ બંને અહીંથી ઉમેરો અને કેન્દ્રિય MongoDB માં સેવ કરો.'),
                                  const SizedBox(height: 12),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: ElevatedButton.icon(
                                          onPressed: _savingEntry ? null : _openEntrySheet,
                                          icon: const Icon(Icons.add),
                                          label: const Text('ફોર્મ ખોલો'),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          _reportCard(
                            context,
                            icon: '📊',
                            title: 'મુખ્ય સારાંશ',
                            desc: 'વાર્ષિક આવક-ખર્ચ-નફોનો પત્રક',
                            type: 'master-summary',
                          ),
                          const SizedBox(height: 16),
                          _reportCard(
                            context,
                            icon: '👥',
                            title: 'સભ્ય વિતરણ',
                            desc: 'સભ્ય વાઈઝ હિસાબ અને ચૂકવણી વિગતો',
                            type: 'member-distribution',
                          ),
                          const SizedBox(height: 16),
                          _reportCard(
                            context,
                            icon: '📑',
                            title: 'સંપૂર્ણ રિપોર્ટ',
                            desc: 'બંને પત્રકો એક સાથે સુંદર નકશામાં',
                            type: 'complete',
                          ),
                          const SizedBox(height: 90),
                        ],
                      ),
                    ),
    );
  }

  Widget _reportCard(
    BuildContext context, {
    required String icon,
    required String title,
    required String desc,
    required String type,
  }) {
    final isThisLoading = _loadingPdf && _loadingType == type;

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 3,
      child: ListTile(
        contentPadding: const EdgeInsets.all(20),
        leading: Text(icon, style: const TextStyle(fontSize: 36)),
        title: Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        subtitle: Text(desc, style: const TextStyle(color: MitraMColors.warmGrey)),
        trailing: ElevatedButton(
          onPressed: _loadingPdf ? null : () => _generateAndShowPdf(type),
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: isThisLoading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : const Text('📥 PDF'),
        ),
      ),
    );
  }
}
