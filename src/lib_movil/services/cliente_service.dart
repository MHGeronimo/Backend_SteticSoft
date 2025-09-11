import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:proyectomovil/models/cliente.dart';
import 'package:proyectomovil/services/auth_service.dart';

class ClienteService {
  static const String baseUrl = 'https://api-steticsoft-web-movil.onrender.com/api/clientes';

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

  static Future<Cliente> fetchClienteById(String idCliente) async {
    final headers = await _getHeaders();
    final response = await http.get(Uri.parse('$baseUrl/$idCliente'), headers: headers);

    if (response.statusCode == 200) {
      final responseBody = jsonDecode(utf8.decode(response.bodyBytes));
      return Cliente.fromJson(responseBody['data']);
    } else {
      throw Exception('Failed to load cliente');
    }
  }
}
