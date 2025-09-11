// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'estado.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Estado _$EstadoFromJson(Map<String, dynamic> json) => Estado(
      idEstado: json['id_estado'] as int,
      nombreEstado: json['nombre_estado'] as String,
    );

Map<String, dynamic> _$EstadoToJson(Estado instance) => <String, dynamic>{
      'id_estado': instance.idEstado,
      'nombre_estado': instance.nombreEstado,
    };
