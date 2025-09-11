import 'package:json_annotation/json_annotation.dart';
import 'package:proyectomovil/models/producto.dart';

part 'producto_x_venta.g.dart';

@JsonSerializable(explicitToJson: true)
class ProductoXVenta {
  @JsonKey(name: 'id_producto_x_venta')
  final int idProductoXVenta;

  final int cantidad;

  @JsonKey(name: 'valor_unitario')
  final double valorUnitario;

  @JsonKey(name: 'id_producto')
  final int idProducto;

  @JsonKey(name: 'id_venta')
  final int idVenta;

  final Producto? producto;

  ProductoXVenta({
    required this.idProductoXVenta,
    required this.cantidad,
    required this.valorUnitario,
    required this.idProducto,
    required this.idVenta,
    this.producto,
  });

  factory ProductoXVenta.fromJson(Map<String, dynamic> json) => _$ProductoXVentaFromJson(json);

  Map<String, dynamic> toJson() => _$ProductoXVentaToJson(this);
}
