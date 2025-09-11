// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'categoria_servicio.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CategoriaServicio _$CategoriaServicioFromJson(Map<String, dynamic> json) =>
    CategoriaServicio(
      idCategoriaServicio: json['id_categoria_servicio'] as int,
      nombre: json['nombre'] as String,
      descripcion: json['descripcion'] as String?,
      estado: json['estado'] as bool,
    );

Map<String, dynamic> _$CategoriaServicioToJson(
        CategoriaServicio instance) =>
    <String, dynamic>{
      'id_categoria_servicio': instance.idCategoriaServicio,
      'nombre': instance.nombre,
      'descripcion': instance.descripcion,
      'estado': instance.estado,
    };
