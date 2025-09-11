import 'package:json_annotation/json_annotation.dart';
import 'package:proyectomovil/models/usuario.dart';

part 'empleado.g.dart';

@JsonSerializable(explicitToJson: true)
class Empleado {
  @JsonKey(name: 'id_empleado')
  final int idEmpleado;

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

  final bool estado;

  @JsonKey(name: 'id_usuario')
  final int idUsuario;

  final Usuario? usuario;

  Empleado({
    required this.idEmpleado,
    required this.nombre,
    required this.apellido,
    required this.correo,
    required this.telefono,
    required this.tipoDocumento,
    required this.numeroDocumento,
    required this.fechaNacimiento,
    required this.estado,
    required this.idUsuario,
    this.usuario,
  });

  factory Empleado.fromJson(Map<String, dynamic> json) => _$EmpleadoFromJson(json);

  Map<String, dynamic> toJson() => _$EmpleadoToJson(this);
}
