// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'venta_x_servicio.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

VentaXServicio _$VentaXServicioFromJson(Map<String, dynamic> json) =>
    VentaXServicio(
      idVentaXServicio: json['id_venta_x_servicio'] as int,
      valorServicio: (json['valor_servicio'] as num).toDouble(),
      idServicio: json['id_servicio'] as int,
      idCita: json['id_cita'] as int?,
      idVenta: json['id_venta'] as int,
      servicio: json['servicio'] == null
          ? null
          : Servicio.fromJson(json['servicio'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$VentaXServicioToJson(VentaXServicio instance) =>
    <String, dynamic>{
      'id_venta_x_servicio': instance.idVentaXServicio,
      'valor_servicio': instance.valorServicio,
      'id_servicio': instance.idServicio,
      'id_cita': instance.idCita,
      'id_venta': instance.idVenta,
      'servicio': instance.servicio?.toJson(),
    };
