// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'novedad.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Novedad _$NovedadFromJson(Map<String, dynamic> json) => Novedad(
      idNovedad: json['id_novedad'] as int,
      fechaInicio: json['fecha_inicio'] as String,
      fechaFin: json['fecha_fin'] as String,
      horaInicio: json['hora_inicio'] as String,
      horaFin: json['hora_fin'] as String,
      dias: json['dias'],
      estado: json['estado'] as bool,
    );

Map<String, dynamic> _$NovedadToJson(Novedad instance) => <String, dynamic>{
      'id_novedad': instance.idNovedad,
      'fecha_inicio': instance.fechaInicio,
      'fecha_fin': instance.fechaFin,
      'hora_inicio': instance.horaInicio,
      'hora_fin': instance.horaFin,
      'dias': instance.dias,
      'estado': instance.estado,
    };
