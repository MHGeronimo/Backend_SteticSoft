// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'cita.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Cita _$CitaFromJson(Map<String, dynamic> json) => Cita(
      idCita: json['id_cita'] as int,
      fecha: json['fecha'] as String,
      horaInicio: json['hora_inicio'] as String,
      precioTotal: (json['precio_total'] as num?)?.toDouble(),
      idEstado: json['id_estado'] as int,
      idCliente: json['id_cliente'] as int,
      idUsuario: json['id_usuario'] as int?,
      idNovedad: json['id_novedad'] as int,
      estadoDetalle: json['estadoDetalle'] == null
          ? null
          : Estado.fromJson(json['estadoDetalle'] as Map<String, dynamic>),
      cliente: json['cliente'] == null
          ? null
          : Cliente.fromJson(json['cliente'] as Map<String, dynamic>),
      empleado: json['empleado'] == null
          ? null
          : Usuario.fromJson(json['empleado'] as Map<String, dynamic>),
      servicios: (json['servicios'] as List<dynamic>)
          .map((e) => Servicio.fromJson(e as Map<String, dynamic>))
          .toList(),
      novedad: json['novedad'] == null
          ? null
          : Novedad.fromJson(json['novedad'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$CitaToJson(Cita instance) => <String, dynamic>{
      'id_cita': instance.idCita,
      'fecha': instance.fecha,
      'hora_inicio': instance.horaInicio,
      'precio_total': instance.precioTotal,
      'id_estado': instance.idEstado,
      'id_cliente': instance.idCliente,
      'id_usuario': instance.idUsuario,
      'id_novedad': instance.idNovedad,
      'estadoDetalle': instance.estadoDetalle?.toJson(),
      'cliente': instance.cliente?.toJson(),
      'empleado': instance.empleado?.toJson(),
      'servicios': instance.servicios.map((e) => e.toJson()).toList(),
      'novedad': instance.novedad?.toJson(),
    };
