import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:proyectomovil/services/auth_service.dart';
import '../models/cita.dart';

class CitaService {
  static const String baseUrl = 'https://api-steticsoft-web-movil.onrender.com/api/citas';

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

  static Future<List<Cita>> obtenerCitas({int? idCliente, int? idUsuario}) async {
    var uri = Uri.parse(baseUrl);
    final Map<String, String> queryParams = {};
    if (idCliente != null) {
      queryParams['idCliente'] = idCliente.toString();
    }
    if (idUsuario != null) {
      queryParams['idUsuario'] = idUsuario.toString();
    }
    if (queryParams.isNotEmpty) {
      uri = uri.replace(queryParameters: queryParams);
    }

    final headers = await _getHeaders();
    final response = await http.get(uri, headers: headers);

    if (response.statusCode == 200) {
      final responseBody = jsonDecode(utf8.decode(response.bodyBytes));
      final List<dynamic> citasJson = responseBody['data'];
      return citasJson.map((json) => Cita.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load citas');
    }
  }

  static Future<Cita> obtenerCitaPorId(int idCita) async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/$idCita'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      final responseBody = jsonDecode(utf8.decode(response.bodyBytes));
      return Cita.fromJson(responseBody['data']);
    } else {
      throw Exception('Failed to load cita details');
    }
  }

  static Future<Cita> crearCita(Cita cita) async {
    final headers = await _getHeaders();
    final body = jsonEncode(cita.toJson());

    final response = await http.post(
      Uri.parse(baseUrl),
      headers: headers,
      body: body,
    );

    if (response.statusCode == 201) {
       final responseBody = jsonDecode(utf8.decode(response.bodyBytes));
       return Cita.fromJson(responseBody['data']);
    } else {
      throw Exception('Failed to create cita');
    }
  }

  static Future<Cita> actualizarCita(int idCita, Cita cita) async {
    final headers = await _getHeaders();
    final body = jsonEncode(cita.toJson());

    final response = await http.patch(
      Uri.parse('$baseUrl/$idCita'),
      headers: headers,
      body: body,
    );

    if (response.statusCode == 200) {
      final responseBody = jsonDecode(utf8.decode(response.bodyBytes));
      return Cita.fromJson(responseBody['data']);
    } else {
      throw Exception('Failed to update cita');
    }
  }

  static Future<Cita> cambiarEstadoCita(int idCita, int idNuevoEstado) async {
    final headers = await _getHeaders();
    final body = jsonEncode({'id_estado': idNuevoEstado});

    final response = await http.patch(
      Uri.parse('$baseUrl/$idCita/estado'),
      headers: headers,
      body: body,
    );

    if (response.statusCode == 200) {
      final responseBody = jsonDecode(utf8.decode(response.bodyBytes));
      return Cita.fromJson(responseBody['data']);
    } else {
      throw Exception('Failed to change cita state');
    }
  }

  static Future<void> eliminarCita(int idCita) async {
    final headers = await _getHeaders();
    final response = await http.delete(
      Uri.parse('$baseUrl/$idCita'),
      headers: headers
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to delete cita');
    }
  }
}
