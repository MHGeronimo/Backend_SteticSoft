import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:proyectomovil/models/venta.dart';
import 'package:proyectomovil/services/auth_service.dart';

class VentaService {
  static const String baseUrl = 'https://api-steticsoft-web-movil.onrender.com/api/ventas';

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

  static Future<List<Venta>> fetchMisVentasMovil() async {
    final headers = await _getHeaders();
    final response = await http.get(Uri.parse('$baseUrl/movil/mis-ventas'), headers: headers);

    if (response.statusCode == 200) {
      final responseBody = jsonDecode(utf8.decode(response.bodyBytes));
      final List<dynamic> ventasJson = responseBody['data'];
      return ventasJson.map((json) => Venta.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load ventas');
    }
  }

  static Future<void> cancelarVenta(int idVenta) async {
    final headers = await _getHeaders();
    final response = await http.patch(
      Uri.parse('$baseUrl/$idVenta/anular'),
      headers: headers,
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to cancel venta');
    }
  }

  static Future<Venta> crearVenta(Venta venta) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse(baseUrl),
      headers: headers,
      body: jsonEncode(venta.toJson()),
    );

    if (response.statusCode == 201) {
      final responseBody = jsonDecode(utf8.decode(response.bodyBytes));
      return Venta.fromJson(responseBody['data']);
    } else {
      throw Exception('Failed to create venta');
    }
  }
}
