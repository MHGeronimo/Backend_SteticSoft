import 'package:json_annotation/json_annotation.dart';
import 'package:proyectomovil/models/categoria_servicio.dart';

part 'servicio.g.dart';

@JsonSerializable(explicitToJson: true)
class Servicio {
  @JsonKey(name: 'id_servicio')
  final int idServicio;

  final String nombre;
  final String? descripcion;
  final double precio;
  final String? imagen;

  @JsonKey(name: 'id_categoria_servicio')
  final int idCategoriaServicio;

  final bool estado;

  @JsonKey(name: 'CategoriaServicio')
  final CategoriaServicio? categoriaServicio;

  Servicio({
    required this.idServicio,
    required this.nombre,
    this.descripcion,
    required this.precio,
    this.imagen,
    required this.idCategoriaServicio,
    required this.estado,
    this.categoriaServicio,
  });

  factory Servicio.fromJson(Map<String, dynamic> json) => _$ServicioFromJson(json);

  Map<String, dynamic> toJson() => _$ServicioToJson(this);
}
