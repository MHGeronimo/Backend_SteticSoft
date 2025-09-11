import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:proyectomovil/models/cliente.dart';
import 'package:proyectomovil/models/usuario.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  final String baseUrl = 'https://api-steticsoft-web-movil.onrender.com/api/auth';
  static const String _tokenKey = 'auth_token';

  Future<Usuario?> login(String correo, String contrasena) async {
    final url = Uri.parse('$baseUrl/login');

    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'correo': correo,
          'contrasena': contrasena,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['usuario'] != null && data['token'] != null) {
          await _saveToken(data['token']);
          return Usuario.fromJson(data['usuario']);
        } else {
          return null;
        }
      } else {
        return null;
      }
    } catch (e) {
      return null;
    }
  }

  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  Future<bool> register({
    required Cliente cliente,
    required String contrasena,
  }) async {
    final url = Uri.parse('$baseUrl/registrar');

    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          ...cliente.toJson(),
          'contrasena': contrasena,
          'id_rol': 3,
        }),
      );

      if (response.statusCode == 201) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  Future<bool> recoverPassword(String correo) async {
    final url = Uri.parse('$baseUrl/solicitar-recuperacion');

    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'correo': correo}),
      );

      if (response.statusCode == 200) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  }
}
