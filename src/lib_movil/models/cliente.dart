import 'package:json_annotation/json_annotation.dart';
import 'package:proyectomovil/models/usuario.dart';

part 'cliente.g.dart';

@JsonSerializable(explicitToJson: true)
class Cliente {
  @JsonKey(name: 'id_cliente')
  final int? idCliente;

  final String nombre;
  final String apellido;
  final String correo;
  final String telefono;

  @JsonKey(name: 'tipo_documento')
  final String tipoDocumento;

  @JsonKey(name: 'numero_documento')
  final String numeroDocumento;

  @JsonKey(name: 'fecha_nacimiento')
  final String fechaNacimiento;

  final String direccion;
  final bool? estado;

  @JsonKey(name: 'id_usuario')
  final int? idUsuario;

  final Usuario? usuario;

  Cliente({
    this.idCliente,
    required this.nombre,
    required this.apellido,
    required this.correo,
    required this.telefono,
    required this.tipoDocumento,
    required this.numeroDocumento,
    required this.fechaNacimiento,
    required this.direccion,
    this.estado,
    this.idUsuario,
    this.usuario,
  });

  factory Cliente.fromJson(Map<String, dynamic> json) => _$ClienteFromJson(json);

  Map<String, dynamic> toJson() => _$ClienteToJson(this);
}
