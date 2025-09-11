import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:proyectomovil/models/empleado.dart';
import 'package:proyectomovil/services/auth_service.dart';

class EmpleadoService {
  static const String baseUrl = 'https://api-steticsoft-web-movil.onrender.com/api/empleados';

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

  static Future<List<Empleado>> fetchEmpleados() async {
    final headers = await _getHeaders();
    final response = await http.get(Uri.parse(baseUrl), headers: headers);

    if (response.statusCode == 200) {
      final responseBody = jsonDecode(utf8.decode(response.bodyBytes));
      final List<dynamic> empleadosJson = responseBody['data'];
      return empleadosJson.map((json) => Empleado.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load empleados');
    }
  }
}
