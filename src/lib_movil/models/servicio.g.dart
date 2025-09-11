// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'servicio.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Servicio _$ServicioFromJson(Map<String, dynamic> json) => Servicio(
      idServicio: json['id_servicio'] as int,
      nombre: json['nombre'] as String,
      descripcion: json['descripcion'] as String?,
      precio: (json['precio'] as num).toDouble(),
      imagen: json['imagen'] as String?,
      idCategoriaServicio: json['id_categoria_servicio'] as int,
      estado: json['estado'] as bool,
      categoriaServicio: json['CategoriaServicio'] == null
          ? null
          : CategoriaServicio.fromJson(
              json['CategoriaServicio'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$ServicioToJson(Servicio instance) => <String, dynamic>{
      'id_servicio': instance.idServicio,
      'nombre': instance.nombre,
      'descripcion': instance.descripcion,
      'precio': instance.precio,
      'imagen': instance.imagen,
      'id_categoria_servicio': instance.idCategoriaServicio,
      'estado': instance.estado,
      'CategoriaServicio': instance.categoriaServicio?.toJson(),
    };
