import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:proyectomovil/models/novedad.dart';
import 'package:proyectomovil/services/auth_service.dart';

class NovedadService {
  static const String baseUrl = 'https://api-steticsoft-web-movil.onrender.com/api/novedades';

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

  static Future<List<Novedad>> fetchAgendableNovedades() async {
    final headers = await _getHeaders();
    final response = await http.get(Uri.parse('$baseUrl/agendables'), headers: headers);

    if (response.statusCode == 200) {
      final responseBody = jsonDecode(utf8.decode(response.bodyBytes));
      final List<dynamic> novedadesJson = responseBody['data'];
      return novedadesJson.map((json) => Novedad.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load agendable novedades');
    }
  }
}
