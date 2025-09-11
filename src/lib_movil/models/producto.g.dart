// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'producto.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Producto _$ProductoFromJson(Map<String, dynamic> json) => Producto(
      idProducto: json['id_producto'] as int,
      nombre: json['nombre'] as String,
      descripcion: json['descripcion'] as String?,
      existencia: json['existencia'] as int,
      precio: (json['precio'] as num).toDouble(),
      stockMinimo: json['stock_minimo'] as int,
      stockMaximo: json['stock_maximo'] as int,
      imagen: json['imagen'] as String?,
      estado: json['estado'] as bool,
      vidaUtilDias: json['vida_util_dias'] as int?,
      tipoUso: json['tipo_uso'] as String,
      idCategoriaProducto: json['id_categoria_producto'] as int,
      categoriaProducto: json['CategoriaProducto'] == null
          ? null
          : CategoriaProducto.fromJson(
              json['CategoriaProducto'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$ProductoToJson(Producto instance) => <String, dynamic>{
      'id_producto': instance.idProducto,
      'nombre': instance.nombre,
      'descripcion': instance.descripcion,
      'existencia': instance.existencia,
      'precio': instance.precio,
      'stock_minimo': instance.stockMinimo,
      'stock_maximo': instance.stockMaximo,
      'imagen': instance.imagen,
      'estado': instance.estado,
      'vida_util_dias': instance.vidaUtilDias,
      'tipo_uso': instance.tipoUso,
      'id_categoria_producto': instance.idCategoriaProducto,
      'CategoriaProducto': instance.categoriaProducto?.toJson(),
    };
