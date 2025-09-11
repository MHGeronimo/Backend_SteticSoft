// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'venta.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Venta _$VentaFromJson(Map<String, dynamic> json) => Venta(
      idVenta: json['id_venta'] as int,
      fecha: json['fecha'] as String,
      total: (json['total'] as num).toDouble(),
      iva: (json['iva'] as num).toDouble(),
      idCliente: json['id_cliente'] as int,
      idEstado: json['id_estado'] as int,
      cliente: json['cliente'] == null
          ? null
          : Cliente.fromJson(json['cliente'] as Map<String, dynamic>),
      estadoDetalle: json['estadoDetalle'] == null
          ? null
          : Estado.fromJson(json['estadoDetalle'] as Map<String, dynamic>),
      productos: (json['productos'] as List<dynamic>?)
          ?.map((e) => ProductoXVenta.fromJson(e as Map<String, dynamic>))
          .toList(),
      servicios: (json['servicios'] as List<dynamic>?)
          ?.map((e) => VentaXServicio.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$VentaToJson(Venta instance) => <String, dynamic>{
      'id_venta': instance.idVenta,
      'fecha': instance.fecha,
      'total': instance.total,
      'iva': instance.iva,
      'id_cliente': instance.idCliente,
      'id_estado': instance.idEstado,
      'cliente': instance.cliente?.toJson(),
      'estadoDetalle': instance.estadoDetalle?.toJson(),
      'productos': instance.productos?.map((e) => e.toJson()).toList(),
      'servicios': instance.servicios?.map((e) => e.toJson()).toList(),
    };
