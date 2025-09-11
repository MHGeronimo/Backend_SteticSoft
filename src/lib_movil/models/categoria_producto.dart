import 'package:json_annotation/json_annotation.dart';

part 'categoria_producto.g.dart';

@JsonSerializable()
class CategoriaProducto {
  @JsonKey(name: 'id_categoria_producto')
  final int idCategoriaProducto;

  final String nombre;
  final String? descripcion;
  final bool estado;

  CategoriaProducto({
    required this.idCategoriaProducto,
    required this.nombre,
    this.descripcion,
    required this.estado,
  });

  factory CategoriaProducto.fromJson(Map<String, dynamic> json) => _$CategoriaProductoFromJson(json);

  Map<String, dynamic> toJson() => _$CategoriaProductoToJson(this);
}
