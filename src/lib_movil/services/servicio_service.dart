import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:proyectomovil/models/servicio.dart';
import 'package:proyectomovil/services/auth_service.dart';

class ServicioService {
  static const String baseUrl = 'https://api-steticsoft-web-movil.onrender.com/api/servicios';

  static Future<Map<String, String>> _getHeaders() async {
    String? token = await AuthService.getToken();
    if (token == null) {
      throw Exception('User not authenticated');
    }
    return {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer $token',
    };
  }

  static Future<List<Servicio>> fetchServicios() async {
    // Note: The default endpoint for services might be protected.
    // The public one is /public. We assume for the app, we need the protected one.
    final headers = await _getHeaders();
    final response = await http.get(Uri.parse(baseUrl), headers: headers);

    if (response.statusCode == 200) {
      final responseBody = jsonDecode(utf8.decode(response.bodyBytes));
      final List<dynamic> serviciosJson = responseBody['data'];
      return serviciosJson.map((json) => Servicio.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load servicios');
    }
  }

  static Future<List<Servicio>> fetchPublicServicios() async {
    final response = await http.get(Uri.parse('$baseUrl/public'));

    if (response.statusCode == 200) {
      final responseBody = jsonDecode(utf8.decode(response.bodyBytes));
      final List<dynamic> serviciosJson = responseBody['data'];
      return serviciosJson.map((json) => Servicio.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load public servicios');
    }
  }
}
