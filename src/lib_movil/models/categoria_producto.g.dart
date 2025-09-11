// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'categoria_producto.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

CategoriaProducto _$CategoriaProductoFromJson(Map<String, dynamic> json) =>
    CategoriaProducto(
      idCategoriaProducto: json['id_categoria_producto'] as int,
      nombre: json['nombre'] as String,
      descripcion: json['descripcion'] as String?,
      estado: json['estado'] as bool,
    );

Map<String, dynamic> _$CategoriaProductoToJson(
        CategoriaProducto instance) =>
    <String, dynamic>{
      'id_categoria_producto': instance.idCategoriaProducto,
      'nombre': instance.nombre,
      'descripcion': instance.descripcion,
      'estado': instance.estado,
    };
