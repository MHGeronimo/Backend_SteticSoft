import 'package:json_annotation/json_annotation.dart';
import 'package:proyectomovil/models/rol.dart';
import 'package:proyectomovil/models/cliente.dart';
import 'package:proyectomovil/models/empleado.dart';

part 'usuario.g.dart';

@JsonSerializable(explicitToJson: true)
class Usuario {
  @JsonKey(name: 'id_usuario')
  final int idUsuario;

  final String correo;

  @JsonKey(includeToJson: false)
  final String? contrasena;

  @JsonKey(name: 'id_rol')
  final int idRol;

  final bool estado;

  final Rol? rol;

  @JsonKey(name: 'clienteInfo')
  final Cliente? clienteInfo;

  @JsonKey(name: 'empleadoInfo')
  final Empleado? empleadoInfo;

  Usuario({
    required this.idUsuario,
    required this.correo,
    this.contrasena,
    required this.idRol,
    required this.estado,
    this.rol,
    this.clienteInfo,
    this.empleadoInfo,
  });

  factory Usuario.fromJson(Map<String, dynamic> json) => _$UsuarioFromJson(json);

  Map<String, dynamic> toJson() => _$UsuarioToJson(this);
}
