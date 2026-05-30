import 'dart:convert';
import 'package:http/http.dart' as http;
import 'auth_service.dart';

class ApiService {
  static const String baseUrl = AuthService.baseUrl;

  Future<dynamic> get(String path, Map<String, String> headers) async {
    final response = await http.get(
      Uri.parse('$baseUrl$path'),
      headers: headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('API Error: ${response.statusCode}');
  }

  // Fetch full app data payload used by the web frontend
  Future<dynamic> getAppData(Map<String, String> headers) async {
    final response = await http.get(Uri.parse('$baseUrl/data'), headers: headers);
    if (response.statusCode == 200) return jsonDecode(response.body);
    throw Exception('API Error: ${response.statusCode}');
  }

  Future<dynamic> saveAppData(Map<String, String> headers, Map<String, dynamic> body) async {
    final response = await http.post(
      Uri.parse('$baseUrl/data'),
      headers: headers,
      body: jsonEncode(body),
    );
    if (response.statusCode == 200) return jsonDecode(response.body);
    throw Exception('API Error: ${response.statusCode}');
  }

  Future<dynamic> put(String path, Map<String, String> headers, Map<String, dynamic> body) async {
    final response = await http.put(
      Uri.parse('$baseUrl$path'),
      headers: headers,
      body: jsonEncode(body),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('API Error: ${response.statusCode}');
  }

  Future<dynamic> post(String path, Map<String, String> headers, Map<String, dynamic> body) async {
    final response = await http.post(
      Uri.parse('$baseUrl$path'),
      headers: headers,
      body: jsonEncode(body),
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    }
    throw Exception('API Error: ${response.statusCode}');
  }

  // Members
  Future<List<dynamic>> getMembers(Map<String, String> headers) async {
    try {
      final res = await get('/members', headers);
      if (res is List && res.isNotEmpty) return res;
    } catch (_) {}

    // Fallback: compose list from /data (AppData) used by web frontend
    final app = await getAppData(headers);
    final List<dynamic> raw = app['members'] ?? [];
    return raw.map((m) => _normalizeMember(m, app)).toList();
  }

  Future<dynamic> getMember(String id, Map<String, String> headers) async {
    try {
      final res = await get('/members/$id', headers);
      if (res != null) return res;
    } catch (_) {}

    final app = await getAppData(headers);
    final List<dynamic> raw = app['members'] ?? [];
    final found = raw.firstWhere((m) => (m['id'] ?? m['_id'] ?? '') == id, orElse: () => null);
    if (found == null) throw Exception('Member not found');
    return _normalizeMember(found, app);
  }

  Future<dynamic> updateMember(String id, Map<String, String> headers, Map<String, dynamic> data) async {
    return await put('/members/$id', headers, data);
  }

  // Reports
  Future<dynamic> getMasterSummary(Map<String, String> headers) async {
    return await get('/reports/master-summary', headers);
  }

  Future<dynamic> updateMasterSummary(Map<String, String> headers, Map<String, dynamic> data) async {
    return await put('/reports/master-summary', headers, data);
  }

  Map<String, dynamic> _normalizeMember(dynamic m, dynamic app) {
    // input m may have { id, nameEn, nameGu, imageUrl, year2023_24 }
    final out = <String, dynamic>{};
    out['_id'] = m['id'] ?? m['_id'] ?? '';
    out['nameGujarati'] = m['nameGu'] ?? m['nameGujarati'] ?? m['name'] ?? '';
    out['name'] = m['nameEn'] ?? m['name'] ?? '';
    // pick photo from imageUrl if it's a filename
    final imageUrl = m['imageUrl'] ?? m['photo'] ?? '';
    out['photo'] = imageUrl.split('/').isNotEmpty ? imageUrl.split('/').last : imageUrl;

    // Fallback list of years
    final yearKeys = ['year2023_24', 'year2024_25'];
    final yearlyData = <Map<String, dynamic>>[];
    for (var yKey in yearKeys) {
      final label = yKey == 'year2023_24' ? '2023/24' : '2024/25';
      final yobj = m[yKey] ?? {};
      final mudi = (yobj is Map && yobj['capital'] != null) ? yobj['capital'] : (yobj is Map && yobj['mudi'] != null ? yobj['mudi'] : 0);
      final kharcha = (yobj is Map && yobj['expense'] != null) ? yobj['expense'] : (yobj is Map && yobj['kharcha'] != null ? yobj['kharcha'] : 0);
      final nafoo = (yobj is Map && yobj['profit'] != null) ? yobj['profit'] : (yobj is Map && yobj['nafoo'] != null ? yobj['nafoo'] : 0);
      final vadheli = (mudi ?? 0) - (kharcha ?? 0);
      yearlyData.add({
        'year': label,
        'mudi': mudi ?? 0,
        'kharcha': kharcha ?? 0,
        'vadheliRakam': vadheli,
        'nafoo': nafoo ?? 0,
        'holding': m['holding'] ?? 0,
        'gopiMandal': m['gopiMandal'] ?? 0,
        'ekandKul': (mudi ?? 0) + (nafoo ?? 0) // best-effort
      });
    }
    out['yearlyData'] = yearlyData;

    // totals
    num totalMudi = 0, totalKharcha = 0, totalVadheli = 0, totalNafoo = 0, totalEk = 0;
    for (var yd in yearlyData) {
      totalMudi += (yd['mudi'] ?? 0) as num;
      totalKharcha += (yd['kharcha'] ?? 0) as num;
      totalVadheli += (yd['vadheliRakam'] ?? 0) as num;
      totalNafoo += (yd['nafoo'] ?? 0) as num;
      totalEk += (yd['ekandKul'] ?? 0) as num;
    }
    out['totalMudi'] = totalMudi;
    out['totalKharcha'] = totalKharcha;
    out['totalVadheliRakam'] = totalVadheli;
    out['totalNafoo'] = totalNafoo;
    out['totalEkandKul'] = totalEk;

    return out;
  }
}
