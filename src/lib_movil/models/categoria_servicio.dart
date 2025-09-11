import 'package:json_annotation/json_annotation.dart';

part 'categoria_servicio.g.dart';

@JsonSerializable()
class CategoriaServicio {
  @JsonKey(name: 'id_categoria_servicio')
  final int idCategoriaServicio;

  final String nombre;
  final String? descripcion;
  final bool estado;

  CategoriaServicio({
    required this.idCategoriaServicio,
    required this.nombre,
    this.descripcion,
    required this.estado,
  });

  factory CategoriaServicio.fromJson(Map<String, dynamic> json) => _$CategoriaServicioFromJson(json);

  Map<String, dynamic> toJson() => _$CategoriaServicioToJson(this);
}
