import 'package:json_annotation/json_annotation.dart';

part 'rol.g.dart';

@JsonSerializable()
class Rol {
  @JsonKey(name: 'id_rol')
  final int idRol;

  final String nombre;

  @JsonKey(name: 'tipo_perfil')
  final String tipoPerfil;

  final String? descripcion;

  final bool estado;

  Rol({
    required this.idRol,
    required this.nombre,
    required this.tipoPerfil,
    this.descripcion,
    required this.estado,
  });

  factory Rol.fromJson(Map<String, dynamic> json) => _$RolFromJson(json);

  Map<String, dynamic> toJson() => _$RolToJson(this);
}
