import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:proyectomovil/models/producto.dart';
import 'package:proyectomovil/services/auth_service.dart';

class ProductoService {
  static const String baseUrl = 'https://api-steticsoft-web-movil.onrender.com/api/productos';

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

  static Future<List<Producto>> fetchProductos({int? categoryId}) async {
    final headers = await _getHeaders();

    String url = baseUrl;
    if (categoryId != null) {
      url += '?idCategoria=$categoryId';
    }

    final response = await http.get(Uri.parse(url), headers: headers);

    if (response.statusCode == 200) {
      final responseBody = jsonDecode(utf8.decode(response.bodyBytes));
      final List<dynamic> productosJson = responseBody['data']['productos'];
      return productosJson.map((json) => Producto.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load productos');
    }
  }

  static Future<List<Producto>> fetchPublicProducts({int? categoryId}) async {
    final url = categoryId == null
        ? '$baseUrl/public'
        : '$baseUrl/public/$categoryId';
    final response = await http.get(Uri.parse(url));

    if (response.statusCode == 200) {
      final responseBody = jsonDecode(utf8.decode(response.bodyBytes));
      // La API devuelve un objeto paginado, extraemos la lista de productos.
      final List<dynamic> productosJson = responseBody['data']['productos'];
      return productosJson.map((json) => Producto.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load public productos');
    }
  }
}
