// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'producto_x_venta.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ProductoXVenta _$ProductoXVentaFromJson(Map<String, dynamic> json) =>
    ProductoXVenta(
      idProductoXVenta: json['id_producto_x_venta'] as int,
      cantidad: json['cantidad'] as int,
      valorUnitario: (json['valor_unitario'] as num).toDouble(),
      idProducto: json['id_producto'] as int,
      idVenta: json['id_venta'] as int,
      producto: json['producto'] == null
          ? null
          : Producto.fromJson(json['producto'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$ProductoXVentaToJson(ProductoXVenta instance) =>
    <String, dynamic>{
      'id_producto_x_venta': instance.idProductoXVenta,
      'cantidad': instance.cantidad,
      'valor_unitario': instance.valorUnitario,
      'id_producto': instance.idProducto,
      'id_venta': instance.idVenta,
      'producto': instance.producto?.toJson(),
    };
