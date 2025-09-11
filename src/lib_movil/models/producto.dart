import 'package:json_annotation/json_annotation.dart';
import 'package:proyectomovil/models/categoria_producto.dart';

part 'producto.g.dart';

@JsonSerializable(explicitToJson: true)
class Producto {
  @JsonKey(name: 'id_producto')
  final int idProducto;

  final String nombre;
  final String? descripcion;
  final int existencia;
  final double precio;

  @JsonKey(name: 'stock_minimo')
  final int stockMinimo;

  @JsonKey(name: 'stock_maximo')
  final int stockMaximo;

  final String? imagen;
  final bool estado;

  @JsonKey(name: 'vida_util_dias')
  final int? vidaUtilDias;

  @JsonKey(name: 'tipo_uso')
  final String tipoUso;

  @JsonKey(name: 'id_categoria_producto')
  final int idCategoriaProducto;

  @JsonKey(name: 'CategoriaProducto')
  final CategoriaProducto? categoriaProducto;

  Producto({
    required this.idProducto,
    required this.nombre,
    this.descripcion,
    required this.existencia,
    required this.precio,
    required this.stockMinimo,
    required this.stockMaximo,
    this.imagen,
    required this.estado,
    this.vidaUtilDias,
    required this.tipoUso,
    required this.idCategoriaProducto,
    this.categoriaProducto,
  });

  factory Producto.fromJson(Map<String, dynamic> json) => _$ProductoFromJson(json);

  Map<String, dynamic> toJson() => _$ProductoToJson(this);
}
