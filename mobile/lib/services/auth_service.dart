import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class AuthService extends ChangeNotifier {
  String? _token;
  String? _username;
  bool _isAuthenticated = false;

  // Base API URL. Override at build/run time with --dart-define=API_BASE_URL
  // Default targets localhost so a physical device can work via `adb reverse`.
  static const String baseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://127.0.0.1:5000/api');

  static const List<String> _fallbackBaseUrls = [
    'http://10.16.57.115:5000/api',
    'http://127.0.0.1:5000/api',
    'http://10.0.2.2:5000/api',
    'http://localhost:5000/api',
  ];

  static const Duration _requestTimeout = Duration(seconds: 12);

  bool get isAuthenticated => _isAuthenticated;
  String? get token => _token;
  String? get username => _username;

  AuthService() {
    _loadToken();
  }

  Future<void> _loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('mitram_token');
    _username = prefs.getString('mitram_username');
    if (_token != null) {
      _isAuthenticated = true;
      notifyListeners();
    }
  }

  Future<void> login(String username, String password) async {
    final urlsToTry = <String>{
      if (baseUrl.trim().isNotEmpty) baseUrl.trim(),
      ..._fallbackBaseUrls,
    }.toList();

    String? lastError;

    // Try web-friendly /login first (frontend uses { id, password }) on each base URL,
    // then fall back to backend /auth/login ({ username, password }).
    for (final url in urlsToTry) {
      try {
        final res1 = await http.post(
          Uri.parse('$url/login'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'id': username, 'password': password}),
        ).timeout(_requestTimeout);
        if (res1.statusCode == 200) {
          final data = jsonDecode(res1.body);
          if (data['token'] != null || data['success'] == true) {
            _token = data['token'];
            _username = username;
            _isAuthenticated = true;
            final prefs = await SharedPreferences.getInstance();
            await prefs.setString('mitram_token', _token!);
            await prefs.setString('mitram_username', username);
            notifyListeners();
            return;
          }
        } else if (res1.statusCode == 400 || res1.statusCode == 401) {
          lastError = _extractMessage(res1.body) ?? 'ખોટો યુઝર આઈડી અથવા પાસવર્ડ';
          break;
        }
      } on TimeoutException {
        lastError = 'સર્વર સમયસર જવાબ આપતું નથી. થોડી વાર પછી ફરી પ્રયત્ન કરો.';
      } on SocketException {
        lastError = 'સર્વર સુધી પહોંચવામાં મુશ્કેલી છે. નેટવર્ક તપાસો.';
      } catch (e) {
        lastError = _formatError(e);
      }
    }

    for (final url in urlsToTry) {
      try {
        final response = await http.post(
          Uri.parse('$url/auth/login'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'username': username, 'password': password}),
        ).timeout(_requestTimeout);

        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          _token = data['token'];
          _username = username;
          _isAuthenticated = true;

          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('mitram_token', _token!);
          await prefs.setString('mitram_username', username);

          notifyListeners();
          return;
        } else if (response.statusCode == 400 || response.statusCode == 401) {
          lastError = _extractMessage(response.body) ?? 'ખોટો યુઝર આઈડી અથવા પાસવર્ડ';
          break;
        }
      } on TimeoutException {
        lastError = 'સર્વર સમયસર જવાબ આપતું નથી. થોડી વાર પછી ફરી પ્રયત્ન કરો.';
      } on SocketException {
        lastError = 'સર્વર સુધી પહોંચવામાં મુશ્કેલી છે. નેટવર્ક તપાસો.';
      } catch (e) {
        lastError = _formatError(e);
      }
    }

    throw Exception(lastError ?? 'Login failed');
  }

  Future<void> logout() async {
    _token = null;
    _username = null;
    _isAuthenticated = false;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('mitram_token');
    await prefs.remove('mitram_username');

    notifyListeners();
  }

  Map<String, String> get authHeaders => {
    'Content-Type': 'application/json',
    if (_token != null) 'Authorization': 'Bearer $_token',
  };

  String? _extractMessage(String body) {
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map) {
        return (decoded['messageGu'] ?? decoded['message'] ?? decoded['error'])?.toString();
      }
    } catch (_) {}
    return null;
  }

  String _formatError(Object e) {
    return e.toString().replaceFirst('Exception: ', '').trim();
  }
}
